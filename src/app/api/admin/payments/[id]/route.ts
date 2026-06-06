import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

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
      select: { id: true, userId: true, plan: true, months: true, status: true },
    })
    if (!payment) {
      return NextResponse.json({ error: 'ไม่พบรายการชำระ' }, { status: 404 })
    }
    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'รายการนี้ไม่ได้อยู่ในสถานะ pending' }, { status: 409 })
    }

    // Calculate new planExpiresAt
    const planExpiresAt = new Date()
    planExpiresAt.setMonth(planExpiresAt.getMonth() + payment.months)

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data:  { status: 'paid', paidAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data:  { plan: payment.plan, planExpiresAt },
      }),
    ])

    return NextResponse.json(updatedPayment)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
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

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
