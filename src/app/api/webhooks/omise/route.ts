import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { retrieveEvent, OMISE_ENABLED } from '@/lib/omise'
import { createCommissionAfterPayment } from '@/lib/commission'

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha1', secret).update(rawBody).digest('base64')
    // timingSafeEqual requires same length buffers
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  if (!OMISE_ENABLED) return NextResponse.json({ ok: true })

  try {
    const rawBody = await req.text()

    // ── Signature verification ────────────────────────────────────────────────
    const webhookSecret = process.env.OMISE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers.get('x-omise-webhook-signature') ?? ''
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      // Signature verified — trust the body directly (no need to re-fetch)
    }

    const body = JSON.parse(rawBody)

    // ── Fallback: re-fetch from Omise API if no webhook secret configured ─────
    let event: { key: string; data: { object: { id: string; status: string } } }
    if (webhookSecret) {
      event = body
    } else {
      const eventId: string = body?.id
      if (!eventId) return NextResponse.json({ error: 'No event id' }, { status: 400 })
      event = await retrieveEvent(eventId)
    }

    // Only process charge completion events
    if (!['charge.complete', 'charge.update'].includes(event.key)) {
      return NextResponse.json({ ok: true })
    }

    const charge = event.data?.object
    if (!charge || charge.status !== 'successful') {
      return NextResponse.json({ ok: true })
    }

    const payment = await prisma.payment.findFirst({
      where: { omiseChargeId: charge.id },
    })

    // Not found or already processed (idempotent)
    if (!payment || payment.status === 'paid') {
      return NextResponse.json({ ok: true })
    }

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + payment.months)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', paidAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan, planExpiresAt: expiresAt },
      }),
    ])

    createCommissionAfterPayment({
      id:     payment.id,
      userId: payment.userId,
      plan:   payment.plan,
      months: payment.months,
    }).catch((err) => console.error('Commission error:', err))

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Omise webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
