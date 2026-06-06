import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createPromptPayCharge, createCardCharge, OMISE_ENABLED } from '@/lib/omise'
import { createCommissionAfterPayment } from '@/lib/commission'
import { z } from 'zod'

const schema = z.object({
  plan:    z.enum(['pro', 'max']),
  months:  z.number().int().min(1).max(12),
  amount:  z.number().positive(),
  method:  z.enum(['promptpay', 'card']),
  token:   z.string().optional(),
  refCode: z.string().max(20).optional(),
})

export async function POST(req: Request) {
  if (!OMISE_ENABLED) {
    return NextResponse.json({ error: 'Omise not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { plan, months, amount, method, token, refCode } = parsed.data
  const amountSatang = Math.round(amount * 100)
  const metadata = { userId: session.user.id, plan, months: String(months) }

  try {
    let chargeId: string
    let qrImageUrl: string | null = null
    let immediate = false

    if (method === 'promptpay') {
      const charge = await createPromptPayCharge(amountSatang, metadata)
      chargeId = charge.id
      qrImageUrl = charge.source?.scannable_code?.image?.download_uri ?? null

    } else {
      if (!token) return NextResponse.json({ error: 'Card token required' }, { status: 400 })
      const charge = await createCardCharge(amountSatang, token, metadata)
      chargeId = charge.id
      immediate = charge.status === 'successful'
    }

    // Check for existing pending payment (prevent duplicates)
    const existing = await prisma.payment.findFirst({
      where: { userId: session.user.id, status: 'pending', method: { startsWith: 'omise' } },
    })
    if (existing) {
      return NextResponse.json({ error: 'มีรายการชำระที่รอดำเนินการอยู่แล้ว' }, { status: 409 })
    }

    const payment = await prisma.payment.create({
      data: {
        userId:        session.user.id,
        plan,
        months,
        amount,
        method:        `omise_${method}`,
        status:        'pending',
        omiseChargeId: chargeId,
      },
    })

    // Card approved immediately — activate plan right now
    if (immediate) {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + months)
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'paid', paidAt: new Date() },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { plan, planExpiresAt: expiresAt },
        }),
      ])

      createCommissionAfterPayment(
        { id: payment.id, userId: session.user.id, plan, months },
        refCode,
      ).catch((err) => console.error('Commission error:', err))
    }

    return NextResponse.json({ paymentId: payment.id, qrImageUrl, immediate })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment error'
    console.error('Omise charge error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
