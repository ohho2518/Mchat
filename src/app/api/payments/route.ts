import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const CreatePaymentSchema = z.object({
  plan:   z.enum(['pro', 'max']),
  months: z.number().int().min(1).max(12),
  amount: z.number().min(1),
  method: z.enum(['promptpay', 'manual']).default('promptpay'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await prisma.payment.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take:    10,
    })

    return NextResponse.json(payments)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = CreatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { plan, months, amount, method } = parsed.data

    // Check for existing pending payment — don't allow duplicate submissions
    const existing = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        status: 'pending',
      },
    })
    if (existing) {
      return NextResponse.json({
        error: 'คุณมีการแจ้งชำระที่รอการยืนยันอยู่แล้ว กรุณารอ Admin ยืนยันก่อน',
        code:  'PAYMENT_PENDING_EXISTS',
      }, { status: 409 })
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        plan,
        months,
        amount,
        method,
        status: 'pending',
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
