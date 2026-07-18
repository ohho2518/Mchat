import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { createCommissionAfterPayment } from '@/lib/commission'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// เปิดใช้แผน / เติมเครดิต จาก Checkout Session ที่ชำระสำเร็จ — idempotent
async function fulfill(sessionObj: Stripe.Checkout.Session) {
  const paymentId = sessionObj.metadata?.paymentId ?? sessionObj.client_reference_id ?? undefined
  if (!paymentId) return

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  // ไม่พบ, ประมวลผลไปแล้ว → ข้าม (idempotent)
  if (!payment || payment.status === 'paid') return

  // ── กรณีอัปเกรดแผน ──────────────────────────────────────────────────────────
  if (payment.plan) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + payment.months)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'paid', paidAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data:  { plan: payment.plan, planExpiresAt: expiresAt },
      }),
    ])

    createCommissionAfterPayment(
      { id: payment.id, userId: payment.userId, plan: payment.plan, months: payment.months },
      sessionObj.metadata?.refCode ?? null,
    ).catch((err) => console.error('Commission error:', err))
    return
  }

  // ── กรณีซื้อเครดิต OCR ────────────────────────────────────────────────────────
  if (payment.credits) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'paid', paidAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data:  { ocrCredits: { increment: payment.credits } },
      }),
    ])
  }
}

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) return NextResponse.json({ ok: true })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set — rejecting')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    // constructEventAsync — ปลอดภัยทุก runtime (ใช้ async crypto)
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    switch (event.type) {
      // ชำระเร็จ (บัตร) หรือ session สำเร็จ
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.payment_status === 'paid') await fulfill(s)
        break
      }
      // ชำระแบบ async (เช่น PromptPay) สำเร็จภายหลัง
      case 'checkout.session.async_payment_succeeded': {
        await fulfill(event.data.object as Stripe.Checkout.Session)
        break
      }
      // ชำระ async ล้มเหลว / session หมดอายุ → mark failed
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
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[stripe webhook] handler error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
