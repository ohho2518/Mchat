import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'json'

    const [user, transactions, accounts] = await Promise.all([
      prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { name: true, email: true, plan: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        where:   { userId: session.user.id, status: { not: 'deleted' } },
        include: { category: { select: { name: true } } },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.account.findMany({
        where:  { userId: session.user.id, isActive: true },
        select: { name: true, type: true, openingBalance: true },
      }),
    ])

    if (format === 'csv') {
      const BOM = '﻿'
      const header = 'วันที่,ประเภท,จำนวนเงิน,หมวดหมู่,รายละเอียด,วิธีชำระ,ชื่อคู่ค้า\n'
      const rows = transactions.map(t =>
        [
          new Date(t.transactionDate).toLocaleDateString('th-TH'),
          t.type,
          t.amount,
          t.category?.name ?? '',
          `"${(t.description ?? '').replace(/"/g, '""')}"`,
          t.paymentMethod ?? '',
          t.holderName ?? '',
        ].join(',')
      ).join('\n')

      return new Response(BOM + header + rows, {
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="mchat-export-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      user,
      accounts,
      transactions: transactions.map(t => ({
        date:          t.transactionDate,
        type:          t.type,
        amount:        t.amount,
        category:      t.category?.name ?? null,
        description:   t.description,
        paymentMethod: t.paymentMethod,
        holderName:    t.holderName,
        createdAt:     t.createdAt,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
