import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { createCommissionAfterPayment } from '@/lib/commission'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// เปิดใช้แผน / เติมเครดิต จาก Checkout Session ที่ชำระสำเร็จ — idempotent
// ใช้ conditional updateMany (status != paid → paid) เป็น atomic lock:
// ถ้า event ถูกส่งซ้ำ/ซ้อนกัน จะมีแค่ครั้งเดียวที่ claim.count === 1 → กันเติมเครดิต/commission ซ้ำ
async function fulfill(sessionObj: Stripe.Checkout.Session) {
  const paymentId = sessionObj.metadata?.paymentId ?? sessionObj.client_reference_id ?? undefined
  if (!paymentId) return

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'paid') return // fast-path (guard จริงคือ atomic claim ด้านล่าง)

  const claimed = await prisma.$transaction(async (tx) => {
    // Atomic claim — เฉพาะ transaction แรกที่พลิก pending/failed → paid เท่านั้นที่ได้ count 1
    const claim = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: 'paid' } },
      data:  { status: 'paid', paidAt: new Date() },
    })
    if (claim.count === 0) return false // มีคน fulfill ไปแล้ว (duplicate delivery)

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

  // Commission เฉพาะกรณี claim สำเร็จ + เป็นการอัปเกรดแผน (createCommissionAfterPayment idempotent ในตัวด้วย)
  if (claimed && payment.plan) {
    createCommissionAfterPayment(
      { id: payment.id, userId: payment.userId, plan: payment.plan, months: payment.months },
      sessionObj.metadata?.refCode ?? null,
    ).catch((err) => console.error('Commission error:', err))
  }
}

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) return NextResponse.json({ ok: true })

  // .trim() สำคัญ — whsec ที่ copy มาใส่ Vercel มักมีช่องว่าง/newline ติดท้าย
  // ถ้าไม่ trim จะ verify signature ไม่ผ่าน → 401 ทุก event (fulfill ไม่เกิด)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
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
