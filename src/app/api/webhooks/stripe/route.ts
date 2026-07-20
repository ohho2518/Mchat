import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { createCommissionAfterPayment } from '@/lib/commission'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── helpers ────────────────────────────────────────────────────────────────
function addOneMonth(from: Date): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 1)
  return d
}

// ดึง subscription id จาก invoice แบบทนต่อความต่างของ API version
// (Stripe ย้าย invoice.subscription ไปหลายที่ตามเวอร์ชัน)
function invoiceSubId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as Record<string, any>
  const s = inv.subscription
  return (typeof s === 'string' ? s : s?.id)
    ?? inv.parent?.subscription_details?.subscription
    ?? inv.lines?.data?.[0]?.subscription
    ?? inv.lines?.data?.[0]?.parent?.subscription_item_details?.subscription
    ?? null
}

// period end ของ invoice → วันหมดอายุ plan รอบใหม่ (fallback = +1 เดือน)
function invoicePeriodEnd(invoice: Stripe.Invoice): Date {
  const inv = invoice as unknown as Record<string, any>
  const raw = inv.lines?.data?.[0]?.period?.end ?? inv.period_end
  return typeof raw === 'number' ? new Date(raw * 1000) : addOneMonth(new Date())
}

// ── ONE-TIME fulfill (จ่ายครั้งเดียว) — idempotent ด้วย atomic claim ──────────
async function fulfillOneTime(sessionObj: Stripe.Checkout.Session) {
  const paymentId = sessionObj.metadata?.paymentId ?? sessionObj.client_reference_id ?? undefined
  if (!paymentId) return

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'paid') return

  const claimed = await prisma.$transaction(async (tx) => {
    const claim = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: 'paid' } },
      data:  { status: 'paid', paidAt: new Date() },
    })
    if (claim.count === 0) return false

    if (payment.plan) {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + payment.months)
      await tx.user.update({
        where: { id: payment.userId },
        data:  { plan: payment.plan, planExpiresAt: expiresAt },
      })
    } else if (payment.credits) {
      await tx.user.update({
        where: { id: payment.userId },
        data:  { ocrCredits: { increment: payment.credits } },
      })
    }
    return true
  })

  if (claimed && payment.plan) {
    createCommissionAfterPayment(
      { id: payment.id, userId: payment.userId, plan: payment.plan, months: payment.months },
      sessionObj.metadata?.refCode ?? null,
    ).catch((err) => console.error('Commission error:', err))
  }
}

// ── SUBSCRIPTION activate (รอบแรกจาก Checkout) — idempotent ด้วย atomic claim ──
async function activateSubscription(sessionObj: Stripe.Checkout.Session) {
  const paymentId = sessionObj.metadata?.paymentId ?? sessionObj.client_reference_id ?? undefined
  const subId = typeof sessionObj.subscription === 'string'
    ? sessionObj.subscription
    : sessionObj.subscription?.id
  if (!paymentId || !subId) return

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'paid' || !payment.plan) return

  // รายเดือน → หมดอายุ +1 เดือนจากตอนนี้ (renewal จะเลื่อนให้เองทุกรอบ)
  const expiresAt = addOneMonth(new Date())

  const claimed = await prisma.$transaction(async (tx) => {
    const claim = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: 'paid' } },
      data:  { status: 'paid', paidAt: new Date(), stripeSubscriptionId: subId },
    })
    if (claim.count === 0) return false

    await tx.user.update({
      where: { id: payment.userId },
      data:  {
        plan:                 payment.plan!,
        planExpiresAt:        expiresAt,
        stripeSubscriptionId: subId,
        subscriptionStatus:   'active',
      },
    })
    return true
  })

  if (claimed) {
    createCommissionAfterPayment(
      { id: payment.id, userId: payment.userId, plan: payment.plan, months: payment.months },
      sessionObj.metadata?.refCode ?? null,
    ).catch((err) => console.error('Commission error:', err))
  }
}

// ── SUBSCRIPTION renewal (รอบต่อ ๆ ไป จาก invoice.paid) — idempotent ด้วย invoice id ──
async function handleRenewal(invoice: Stripe.Invoice) {
  // รอบแรก (subscription_create) จัดการที่ activateSubscription แล้ว → ข้าม
  const reason = (invoice as unknown as Record<string, any>).billing_reason
  if (reason === 'subscription_create') return

  const subId = invoiceSubId(invoice)
  const invoiceId = invoice.id
  if (!subId || !invoiceId) return

  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subId } })
  if (!user) return // ยังไม่ได้ผูก subscription (activate ยังไม่มา) → รอ retry

  const periodEnd = invoicePeriodEnd(invoice)
  const amountPaid = (invoice.amount_paid ?? 0) / 100
  const renewPlan = user.plan === 'free' ? null : user.plan

  try {
    await prisma.$transaction(async (tx) => {
      // unique(stripeInvoiceId) → ถ้า event ส่งซ้ำจะ P2002 = ประมวลผลไปแล้ว
      await tx.payment.create({
        data: {
          userId:               user.id,
          plan:                 renewPlan,
          months:               1,
          amount:               amountPaid,
          method:               'stripe',
          status:               'paid',
          paidAt:               new Date(),
          stripeSubscriptionId: subId,
          stripeInvoiceId:      invoiceId,
        },
      })
      await tx.user.update({
        where: { id: user.id },
        data:  { planExpiresAt: periodEnd, subscriptionStatus: 'active' },
      })
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return // duplicate invoice → idempotent no-op
    }
    throw err
  }
}

// ── subscription status changes ──────────────────────────────────────────────
async function markSubscriptionStatus(sub: Stripe.Subscription) {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } })
  if (!user) return
  await prisma.user.update({
    where: { id: user.id },
    data:  { subscriptionStatus: sub.status },
  })
}

async function cancelSubscription(sub: Stripe.Subscription) {
  // ยกเลิกจริง (จบรอบแล้ว) → ปลดแผนกลับ free — จับคู่ด้วย sub.id กัน stale event ล้าง subscription ใหม่
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } })
  if (!user) return
  await prisma.user.update({
    where: { id: user.id },
    data:  {
      plan:                 'free',
      planExpiresAt:        null,
      stripeSubscriptionId: null,
      subscriptionStatus:   'canceled',
    },
  })
}

async function markPastDue(invoice: Stripe.Invoice) {
  const subId = invoiceSubId(invoice)
  if (!subId) return
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subId } })
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'past_due' } })
  }
}

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) return NextResponse.json({ ok: true })

  // .trim() สำคัญ — whsec ที่ copy มาใส่ Vercel มักมีช่องว่าง/newline ติดท้าย
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set — rejecting')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    switch (event.type) {
      // ── Checkout สำเร็จ — แยก one-time vs subscription ──────────────────────
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.mode === 'subscription') {
          await activateSubscription(s)
        } else if (s.payment_status === 'paid') {
          await fulfillOneTime(s)
        }
        break
      }
      // one-time แบบ async (PromptPay) สำเร็จภายหลัง
      case 'checkout.session.async_payment_succeeded': {
        await fulfillOneTime(event.data.object as Stripe.Checkout.Session)
        break
      }
      // one-time async ล้มเหลว / session หมดอายุ → mark failed
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const s = event.data.object as Stripe.Checkout.Session
        const paymentId = s.metadata?.paymentId ?? s.client_reference_id ?? undefined
        if (paymentId) {
          await prisma.payment.updateMany({
            where: { id: paymentId, status: 'pending' },
            data:  { status: 'failed' },
          })
        }
        break
      }
      // ── Subscription lifecycle ─────────────────────────────────────────────
      case 'invoice.paid': {
        await handleRenewal(event.data.object as Stripe.Invoice)
        break
      }
      case 'invoice.payment_failed': {
        await markPastDue(event.data.object as Stripe.Invoice)
        break
      }
      case 'customer.subscription.updated': {
        await markSubscriptionStatus(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await cancelSubscription(event.data.object as Stripe.Subscription)
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[stripe webhook] handler error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
