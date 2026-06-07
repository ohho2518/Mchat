import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Called by Vercel Cron daily at 02:00 ICT
// Retention policy (from Privacy Policy):
//   AppEvent      → 90 days
//   OcrCorrection → 1 year
//   AuditLog      → 2 years
//   RateLimit     → expired records only
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const [events, corrections, auditLogs, rateLimits] = await Promise.all([
    prisma.appEvent.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
    prisma.ocrCorrection.deleteMany({ where: { createdAt: { lt: oneYearAgo } } }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: twoYearsAgo } } }),
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
  ])

  console.log('[cron] data-retention', {
    appEvents: events.count,
    ocrCorrections: corrections.count,
    auditLogs: auditLogs.count,
    expiredRateLimits: rateLimits.count,
    ranAt: now.toISOString(),
  })

  return NextResponse.json({
    ok: true,
    deleted: {
      appEvents:         events.count,
      ocrCorrections:    corrections.count,
      auditLogs:         auditLogs.count,
      expiredRateLimits: rateLimits.count,
    },
  })
}
