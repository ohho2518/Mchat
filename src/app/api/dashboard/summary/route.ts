import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { unstable_cache } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import type { DashboardSummary } from '@/types/dashboard'

const TH_OFFSET_MS = 7 * 60 * 60 * 1000  // UTC+7, Thai Standard Time (no DST)

function toNumber(val: unknown): number {
  return Number(val) || 0
}

function sumByType(rows: { type: string; _sum: { amount: unknown } }[], type: string): number {
  return toNumber(rows.find((r) => r.type === type)?._sum?.amount)
}

const getCachedSummary = unstable_cache(
  async (userId: string): Promise<DashboardSummary> => {
    // Shift current UTC time to Thai local time, then read date components in UTC
    // to get the correct Thai calendar date without DST ambiguity
    const nowTh = new Date(Date.now() + TH_OFFSET_MS)
    const y = nowTh.getUTCFullYear()
    const m = nowTh.getUTCMonth()
    const d = nowTh.getUTCDate()

    const todayStart = new Date(Date.UTC(y, m, d))
    const todayEnd   = new Date(Date.UTC(y, m, d + 1) - 1)
    const monthStart = new Date(Date.UTC(y, m, 1))
    const monthEnd   = new Date(Date.UTC(y, m + 1, 1) - 1)

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

    const incomeToday  = sumByType(todayRows, 'income')
    const expenseToday = sumByType(todayRows, 'expense')
    const incomeMonth  = sumByType(monthRows, 'income')
    const expenseMonth = sumByType(monthRows, 'expense')

    return {
      incomeToday,
      expenseToday,
      balanceToday:  incomeToday  - expenseToday,
      incomeMonth,
      expenseMonth,
      balanceMonth:  incomeMonth  - expenseMonth,
    }
  },
  ['dashboard-summary'],
  { revalidate: 60 }
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await getCachedSummary(session.user.id)
    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
