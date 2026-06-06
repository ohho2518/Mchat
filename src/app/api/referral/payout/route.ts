import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  amount:         z.number().min(300),
  paymentMethod:  z.enum(['promptpay', 'bank_transfer']),
  accountName:    z.string().min(1).max(100),
  promptpayNumber: z.string().max(20).optional(),
  accountNumber:  z.string().max(30).optional(),
})

function maskEnd(s: string, keep = 4): string {
  if (s.length <= keep) return s
  return '*'.repeat(s.length - keep) + s.slice(-keep)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })

  const { amount, paymentMethod, accountName, promptpayNumber, accountNumber } = parsed.data
  const userId = session.user.id

  try {
    // Check available balance
    const [approvedAgg, pendingPayoutAgg] = await Promise.all([
      prisma.commission.aggregate({
        where: { referrerUserId: userId, status: 'approved' },
        _sum: { amount: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { userId, status: { in: ['requested', 'processing'] } },
        _sum: { amount: true },
      }),
    ])

    const approved  = Number(approvedAgg._sum.amount ?? 0)
    const inQueue   = Number(pendingPayoutAgg._sum.amount ?? 0)
    const available = approved - inQueue

    if (available < amount) {
      return NextResponse.json(
        { error: `ยอดที่ถอนได้ ${available.toFixed(2)} บาท (ต่ำกว่าที่ขอ ${amount} บาท)` },
        { status: 400 }
      )
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        amount,
        paymentMethod,
        accountName,
        promptpayNumber: promptpayNumber ? maskEnd(promptpayNumber) : null,
        accountNumber:   accountNumber   ? maskEnd(accountNumber)   : null,
      },
    })

    return NextResponse.json(payout, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const payouts = await prisma.payoutRequest.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    })
    return NextResponse.json(payouts)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
