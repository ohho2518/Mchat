import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { PLAN_LIMITS, getThaiMonth } from '@/lib/features'
import type { Plan } from '@/lib/features'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan     = (session.user.plan ?? 'free') as Plan
    const month    = getThaiMonth()
    const ocrLimit = PLAN_LIMITS[plan].ocrPerMonth

    const [quota, user] = await Promise.all([
      prisma.usageQuota.findUnique({
        where:  { userId_month: { userId: session.user.id, month } },
        select: { ocrCount: true },
      }),
      prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { ocrCredits: true, emailVerified: true },
      }),
    ])

    return NextResponse.json({
      plan,
      month,
      ocrCount:      quota?.ocrCount  ?? 0,
      ocrLimit,
      ocrCredits:    user?.ocrCredits ?? 0,
      emailVerified: !!user?.emailVerified,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
