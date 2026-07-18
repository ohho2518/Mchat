import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getStripe, getBaseUrl, STRIPE_ENABLED } from '@/lib/stripe'
import { PLAN_LABELS, computePlanAmount, findCreditPack, VALID_PLAN_MONTHS } from '@/lib/features'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// รับได้ 2 แบบ: อัปเกรดแผน (plan+months) หรือ ซื้อเครดิต OCR (credits)
// ⚠️ ไม่รับ `amount` จาก client — server คำนวณเองเสมอ (กันจ่ายต่ำกว่าราคาจริง)
const schema = z.union([
  z.object({
    kind:    z.literal('plan'),
    plan:    z.enum(['pro', 'max']),
    months:  z.number().int(),
    refCode: z.string().max(20).optional(),
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

  // ── คำนวณราคาฝั่ง server (source of truth) — ไม่เชื่อ client ──────────────────
  const isPlan = data.kind === 'plan'
  let amount: number
  let productName: string
  if (data.kind === 'plan') {
    if (!VALID_PLAN_MONTHS.includes(data.months)) {
      return NextResponse.json({ error: 'Invalid plan period' }, { status: 400 })
    }
    amount = computePlanAmount(data.plan, data.months)
    productName = `MChat ${PLAN_LABELS[data.plan]} — ${data.months} เดือน`
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
        months:  data.kind === 'plan' ? data.months : 1,
        credits: data.kind === 'plan' ? null : data.credits,
        amount,
        method:  'stripe',
        status:  'pending',
      },
    })

    // ── สร้าง Checkout Session ────────────────────────────────────────────────
    const baseUrl = getBaseUrl(req)
    const metadata: Record<string, string> = {
      paymentId: payment.id,
      userId,
      kind:      data.kind,
    }
    if (isPlan) {
      metadata.plan   = data.plan
      metadata.months = String(data.months)
    } else {
      metadata.credits = String(data.credits)
    }
    if (data.refCode?.trim()) metadata.refCode = data.refCode.trim()

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
      success_url: `${baseUrl}/pricing?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/pricing?stripe=cancel`,
      // หมดอายุใน 60 นาที — เผื่อ margin จากขั้นต่ำ 30 นาทีของ Stripe (กัน clock skew/latency ทำให้ create ล้มเหลว)
      expires_at:  Math.floor(Date.now() / 1000) + 60 * 60,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data:  { stripeSessionId: checkout.id },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe checkout error'
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
