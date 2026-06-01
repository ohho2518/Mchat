import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns'
import type { DailyCashflow } from '@/types/dashboard'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = Math.min(Number(searchParams.get('days') ?? 30), 90)

    const today = startOfDay(new Date())
    const from  = subDays(today, days - 1)

    const rows = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        status: { not: 'deleted' },
        type:   { in: ['income', 'expense'] },
        transactionDate: { gte: from, lte: today },
      },
      select: { transactionDate: true, type: true, amount: true },
      orderBy: { transactionDate: 'asc' },
    })

    // สร้าง map วันที่ → { income, expense }
    const map = new Map<string, { income: number; expense: number }>()
    for (const row of rows) {
      const key = format(row.transactionDate, 'yyyy-MM-dd')
      const cur = map.get(key) ?? { income: 0, expense: 0 }
      if (row.type === 'income')  cur.income  += Number(row.amount)
      if (row.type === 'expense') cur.expense += Number(row.amount)
      map.set(key, cur)
    }

    // สร้างอาร์เรย์ครบทุกวัน (เติม 0 ถ้าไม่มีข้อมูล)
    const allDays = eachDayOfInterval({ start: from, end: today })
    const result: DailyCashflow[] = allDays.map((d) => {
      const key  = format(d, 'yyyy-MM-dd')
      const data = map.get(key) ?? { income: 0, expense: 0 }
      return { date: key, income: data.income, expense: data.expense, balance: data.income - data.expense }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
