import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getStripe, getBaseUrl, STRIPE_ENABLED } from '@/lib/stripe'
import { PLAN_LABELS, PLAN_PRICES, computePlanAmount, findCreditPack, VALID_PLAN_MONTHS } from '@/lib/features'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// รับได้ 2 แบบ: อัปเกรดแผน (plan+months) หรือ ซื้อเครดิต OCR (credits)
// plan รองรับ autoRenew=true → subscription รายเดือน (ต่ออายุอัตโนมัติ)
// ⚠️ ไม่รับ `amount` จาก client — server คำนวณเองเสมอ (กันจ่ายต่ำกว่าราคาจริง)
const schema = z.union([
  z.object({
    kind:      z.literal('plan'),
    plan:      z.enum(['pro', 'max']),
    months:    z.number().int(),
    autoRenew: z.boolean().optional(),   // true = subscription (รายเดือน)
    refCode:   z.string().max(20).optional(),
  }),
  z.object({
    kind:    z.literal('credits'),
    credits: z.number().int(),
    refCode: z.string().max(20).optional(),
  }),
])

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const data = parsed.data
  const userId = session.user.id

  // subscription รองรับเฉพาะ plan + รายเดือน (auto-renew = รายเดือนอย่างเดียว)
  const isSubscription = data.kind === 'plan' && data.autoRenew === true

  // ── คำนวณราคาฝั่ง server (source of truth) — ไม่เชื่อ client ──────────────────
  let amount: number
  let productName: string
  let months = 1
  if (data.kind === 'plan') {
    if (isSubscription) {
      months = 1 // subscription = รายเดือนเสมอ
      amount = PLAN_PRICES[data.plan].monthly
      productName = `MChat ${PLAN_LABELS[data.plan]} — รายเดือน (ต่ออายุอัตโนมัติ)`
    } else {
      if (!VALID_PLAN_MONTHS.includes(data.months)) {
        return NextResponse.json({ error: 'Invalid plan period' }, { status: 400 })
      }
      months = data.months
      amount = computePlanAmount(data.plan, data.months)
      productName = `MChat ${PLAN_LABELS[data.plan]} — ${data.months} เดือน`
    }
  } else {
    const pack = findCreditPack(data.credits)
    if (!pack) {
      return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
    }
    amount = pack.price
    productName = `MChat เครดิต OCR — ${data.credits} ครั้ง`
  }
  const amountSatang = Math.round(amount * 100)

  try {
    const stripe = getStripe()

    // ── สร้าง pending Payment ก่อน (ได้ id ไว้ผูกกับ metadata) ──────────────────
    // ยกเลิก pending stripe เดิมที่ยังค้าง (checkout ที่ผู้ใช้ทิ้งไว้) — กัน pending ค้าง
    await prisma.payment.updateMany({
      where:  { userId, status: 'pending', method: 'stripe' },
      data:   { status: 'failed' },
    })

    const payment = await prisma.payment.create({
      data: {
        userId,
        plan:    data.kind === 'plan' ? data.plan : null,
        months,
        credits: data.kind === 'plan' ? null : data.credits,
        amount,
        method:  'stripe',
        status:  'pending',
      },
    })

    // ── metadata ผูกกับทั้ง session, subscription, invoice ─────────────────────
    const metadata: Record<string, string> = {
      paymentId: payment.id,
      userId,
      kind:      data.kind,
    }
    if (data.kind === 'plan') {
      metadata.plan      = data.plan
      metadata.months    = String(months)
      metadata.autoRenew = String(isSubscription)
    } else {
      metadata.credits = String(data.credits)
    }
    if (data.refCode?.trim()) metadata.refCode = data.refCode.trim()

    const baseUrl = getBaseUrl(req)
    const successUrl = `${baseUrl}/pricing?stripe=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl  = `${baseUrl}/pricing?stripe=cancel`

    let checkoutUrl: string | null

    if (isSubscription) {
      // ── SUBSCRIPTION (auto-renew รายเดือน) ────────────────────────────────
      // PromptPay ไม่รองรับ recurring → card อย่างเดียว
      // ผูก/สร้าง Stripe customer เพื่อให้ subscription เกาะกับ user เดิม
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { stripeCustomerId: true, email: true, name: true },
      })
      let customerId = user?.stripeCustomerId ?? null
      if (!customerId) {
        const customer = await stripe.customers.create({
          email:    user?.email ?? undefined,
          name:     user?.name ?? undefined,
          metadata: { userId },
        })
        customerId = customer.id
        await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
      }

      const checkout = await stripe.checkout.sessions.create({
        mode:                 'subscription',
        payment_method_types: ['card'],
        customer:             customerId,
        line_items: [
          {
            price_data: {
              currency:     'thb',
              product_data: { name: productName },
              unit_amount:  amountSatang,
              recurring:    { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        client_reference_id: payment.id,
        metadata,
        // ให้ subscription (และ invoice ของรอบต่อ ๆ ไป) พก metadata ไปด้วย → webhook หา user ได้
        subscription_data: { metadata },
        success_url: successUrl,
        cancel_url:  cancelUrl,
      })
      checkoutUrl = checkout.url
      await prisma.payment.update({ where: { id: payment.id }, data: { stripeSessionId: checkout.id } })
    } else {
      // ── ONE-TIME (จ่ายครั้งเดียว) — card + promptpay ──────────────────────
      const checkout = await stripe.checkout.sessions.create({
        mode:                 'payment',
        payment_method_types: ['card', 'promptpay'],
        line_items: [
          {
            price_data: {
              currency:     'thb',
              product_data: { name: productName },
              unit_amount:  amountSatang,
            },
            quantity: 1,
          },
        ],
        client_reference_id: payment.id,
        metadata,
        success_url: successUrl,
        cancel_url:  cancelUrl,
        // หมดอายุใน 60 นาที — เผื่อ margin จากขั้นต่ำ 30 นาทีของ Stripe
        expires_at:  Math.floor(Date.now() / 1000) + 60 * 60,
      })
      checkoutUrl = checkout.url
      await prisma.payment.update({ where: { id: payment.id }, data: { stripeSessionId: checkout.id } })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe checkout error'
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
