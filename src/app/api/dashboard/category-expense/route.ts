import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import type { CategoryExpense } from '@/types/dashboard'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'month'

    const now = new Date()
    let from: Date
    let to:   Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      to   = new Date(from.getTime() + 86400000 - 1)
    } else if (period === 'week') {
      from = new Date(now.getTime() - 6 * 86400000)
      from.setHours(0, 0, 0, 0)
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1)
      to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    } else {
      // month (default)
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const rows = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: session.user.id,
        status: { not: 'deleted' },
        type:   'expense',
        transactionDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    })

    if (rows.length === 0) return NextResponse.json([])

    // ดึงชื่อ category
    const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[]
    const categories  = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    })
    const catMap = new Map(categories.map((c) => [c.id, c]))

    const total = rows.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0)

    const result: CategoryExpense[] = rows.map((r) => {
      const amount = Number(r._sum.amount ?? 0)
      const cat    = r.categoryId ? catMap.get(r.categoryId) : null
      return {
        categoryId: r.categoryId ?? 'uncategorized',
        category:   cat?.name ?? 'ไม่ระบุ',
        amount,
        percent:    total > 0 ? Math.round((amount / total) * 100) : 0,
        color:      cat?.color ?? undefined,
      }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
