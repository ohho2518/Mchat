import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateDebtSchema } from '@/lib/validators/debt'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // open|partial|paid|all

    const where: Record<string, unknown> = { userId: session.user.id }
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter === 'active'
        ? { in: ['open', 'partial'] }
        : statusFilter
    } else if (!statusFilter) {
      // default: ยกเว้น cancelled
      where.status = { not: 'cancelled' }
    }

    const debts = await prisma.debt.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(debts)
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

    const body = await req.json()
    const parsed = CreateDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { amount, dueDate, ...rest } = parsed.data

    const debt = await prisma.debt.create({
      data: {
        ...rest,
        userId:          session.user.id,
        amount,
        remainingAmount: amount,
        dueDate:         dueDate ? new Date(dueDate) : null,
        status:          'open',
      },
    })

    return NextResponse.json(debt, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
