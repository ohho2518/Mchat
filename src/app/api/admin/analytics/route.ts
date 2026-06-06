import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'vndn2518@gmail.com'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [eventCounts, recentFeedback, dailyEvents, topUsers, ocrStats] = await Promise.all([
      // Event breakdown (last 30 days)
      prisma.appEvent.groupBy({
        by: ['event'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Latest 20 feedbacks
      prisma.feedback.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),

      // Daily event counts (last 7 days)
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT DATE("createdAt") as day, COUNT(*) as count
        FROM "AppEvent"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("createdAt")
        ORDER BY day DESC
      `,

      // Top 10 active users
      prisma.appEvent.groupBy({
        by: ['userId'],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // OCR correction stats (last 30 days)
      prisma.ocrCorrection.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    const topUserIds = topUsers.map((u) => u.userId)
    const topUserNames = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, email: true },
    })
    const nameMap = Object.fromEntries(topUserNames.map((u) => [u.id, `${u.name} (${u.email})`]))

    return NextResponse.json({
      eventCounts: eventCounts.map((e) => ({ event: e.event, count: e._count.id })),
      recentFeedback,
      dailyEvents: dailyEvents.map((d) => ({ day: d.day, count: Number(d.count) })),
      topUsers: topUsers.map((u) => ({
        user:  nameMap[u.userId] ?? u.userId,
        count: u._count.id,
      })),
      ocrCorrectionCount: ocrStats,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
