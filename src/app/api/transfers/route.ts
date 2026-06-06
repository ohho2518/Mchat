import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateTransferSchema } from '@/lib/validators/transfer'
import { format } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfers = await prisma.transfer.findMany({
      where: {
        userId: session.user.id,
        transaction: { status: { not: 'deleted' } },
      },
      include: {
        fromAccount: { select: { id: true, name: true, type: true } },
        toAccount:   { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ transferDate: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(transfers)
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
    const parsed = CreateTransferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { fromAccountId, toAccountId, amount, transferDate, description } = parsed.data

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: 'บัญชีต้นทางและปลายทางต้องไม่เหมือนกัน' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // ตรวจว่าบัญชีทั้งสองเป็นของ user ภายใน transaction เพื่อป้องกัน race condition
      const [fromAcc, toAcc] = await Promise.all([
        tx.account.findFirst({ where: { id: fromAccountId, userId: session.user.id, isActive: true } }),
        tx.account.findFirst({ where: { id: toAccountId,   userId: session.user.id, isActive: true } }),
      ])
      if (!fromAcc || !toAcc) throw new Error('INVALID_ACCOUNT')

      const desc = description || `โอนจาก${fromAcc.name}ไป${toAcc.name}`
      const txn = await tx.transaction.create({
        data: {
          userId:          session.user.id,
          type:            'transfer',
          amount,
          transactionDate: new Date(transferDate),
          description:     desc,
          rawText:         desc,
          status:          'confirmed',
        },
      })

      const transfer = await tx.transfer.create({
        data: {
          userId:        session.user.id,
          fromAccountId,
          toAccountId,
          transactionId: txn.id,
          amount,
          transferDate:  new Date(transferDate),
          description:   description ?? null,
        },
        include: {
          fromAccount: { select: { id: true, name: true, type: true } },
          toAccount:   { select: { id: true, name: true, type: true } },
        },
      })

      return transfer
    })

    return NextResponse.json({
      ...result,
      amount:       Number(result.amount),
      transferDate: format(result.transferDate, 'yyyy-MM-dd'),
    }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_ACCOUNT') {
      return NextResponse.json({ error: 'บัญชีไม่ถูกต้อง' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
