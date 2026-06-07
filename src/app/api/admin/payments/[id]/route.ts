import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createCommissionAfterPayment } from '@/lib/commission'
import { logAudit } from '@/lib/audit'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { id: true, userId: true, plan: true, months: true, credits: true, status: true },
    })
    if (!payment) {
      return NextResponse.json({ error: 'ไม่พบรายการชำระ' }, { status: 404 })
    }
    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'รายการนี้ไม่ได้อยู่ในสถานะ pending' }, { status: 409 })
    }

    let updatedPayment

    if (payment.credits) {
      // Credit purchase — เติม ocrCredits ให้ user
      ;[updatedPayment] = await prisma.$transaction([
        prisma.payment.update({
          where: { id },
          data:  { status: 'paid', paidAt: new Date() },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data:  { ocrCredits: { increment: payment.credits } },
        }),
      ])
    } else {
      // Plan purchase — อัปเกรด plan
      const planExpiresAt = new Date()
      planExpiresAt.setMonth(planExpiresAt.getMonth() + payment.months)

      ;[updatedPayment] = await prisma.$transaction([
        prisma.payment.update({
          where: { id },
          data:  { status: 'paid', paidAt: new Date() },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data:  { plan: payment.plan!, planExpiresAt },
        }),
      ])

      // Create commission (plan purchase เท่านั้น)
      createCommissionAfterPayment({
        id:     payment.id,
        userId: payment.userId,
        plan:   payment.plan!,
        months: payment.months,
      }).catch((err) => console.error('Commission error:', err))
    }

    logAudit({
      actorId:    session.user.id,
      actorEmail: session.user.email!,
      action:     'admin.payment.confirm',
      targetType: 'payment',
      targetId:   id,
      metadata:   payment.credits
        ? { credits: payment.credits }
        : { plan: payment.plan, months: payment.months },
      ip: _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    })

    return NextResponse.json(updatedPayment)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.payment.update({
      where: { id },
      data:  { status: 'failed' },
    })

    logAudit({
      actorId:    session.user.id,
      actorEmail: session.user.email!,
      action:     'admin.payment.reject',
      targetType: 'payment',
      targetId:   id,
      ip:         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
