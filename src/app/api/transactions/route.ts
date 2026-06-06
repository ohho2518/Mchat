import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateTransactionSchema, TransactionFilterSchema } from '@/lib/validators/transaction'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = TransactionFilterSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { startDate, endDate, type, categoryId, keyword, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      status: { not: 'deleted' as const },
      ...(type        && { type }),
      ...(categoryId  && { categoryId }),
      ...((startDate || endDate) && {
        transactionDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate) }),
        },
      }),
      ...(keyword     && {
        OR: [
          { description: { contains: keyword, mode: 'insensitive' as const } },
          { rawText:     { contains: keyword, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
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
    const parsed = CreateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { transactionDate, ...rest } = parsed.data

    const transaction = await prisma.transaction.create({
      data: {
        ...rest,
        userId: session.user.id,
        transactionDate: new Date(transactionDate),
        status: 'confirmed',
      },
      include: { category: true },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
