import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import type { DashboardSummary } from '@/types/dashboard'

function toNumber(val: unknown): number {
  return Number(val) || 0
}

function sumByType(rows: { type: string; _sum: { amount: unknown } }[], type: string): number {
  return toNumber(rows.find((r) => r.type === type)?._sum?.amount)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now    = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86400000 - 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const baseWhere = {
      userId,
      status: { not: 'deleted' as const },
      type:   { in: ['income', 'expense'] }, // ไม่รวม transfer ในรายงาน
    }

    const [todayRows, monthRows] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: { ...baseWhere, transactionDate: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { ...baseWhere, transactionDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
    ])

    const incomeToday   = sumByType(todayRows,  'income')
    const expenseToday  = sumByType(todayRows,  'expense')
    const incomeMonth   = sumByType(monthRows,  'income')
    const expenseMonth  = sumByType(monthRows,  'expense')

    const summary: DashboardSummary = {
      incomeToday,
      expenseToday,
      balanceToday:  incomeToday  - expenseToday,
      incomeMonth,
      expenseMonth,
      balanceMonth:  incomeMonth  - expenseMonth,
    }

    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
