import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { CRON_LAST_RUN_KEY, type CronRunRecord } from '@/lib/cron'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Called by Vercel Cron daily at 19:00 UTC = 02:00 ICT
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

  try {
    const [events, corrections, auditLogs, rateLimits, downgraded] = await Promise.all([
      prisma.appEvent.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
      prisma.ocrCorrection.deleteMany({ where: { createdAt: { lt: oneYearAgo } } }),
      prisma.auditLog.deleteMany({ where: { createdAt: { lt: twoYearsAgo } } }),
      prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
      // ลดแผนที่หมดอายุกลับ free — เฉพาะ one-time (ไม่มี subscription active)
      // subscription จะถูก downgrade ตอน customer.subscription.deleted แทน
      prisma.user.updateMany({
        where: {
          plan:                 { not: 'free' },
          planExpiresAt:        { lt: now },
          stripeSubscriptionId: null,
        },
        data: { plan: 'free', planExpiresAt: null },
      }),
    ])

    const record: CronRunRecord = {
      ranAt: now.toISOString(),
      deleted: {
        appEvents:         events.count,
        ocrCorrections:    corrections.count,
        auditLogs:         auditLogs.count,
        expiredRateLimits: rateLimits.count,
      },
      downgradedPlans: downgraded.count,
    }

    // เขียนทุกครั้งแม้ไม่มีอะไรถูกลบ — เป็นหลักฐานว่า cron รันจริง (ดูผ่าน /api/health)
    const value = JSON.stringify(record)
    await prisma.siteSetting.upsert({
      where:  { key: CRON_LAST_RUN_KEY },
      create: { key: CRON_LAST_RUN_KEY, value },
      update: { value },
    })

    console.log('[cron] data-retention', record)

    return NextResponse.json({ ok: true, deleted: record.deleted })
  } catch (err) {
    console.error('[cron] data-retention failed', err)
    return NextResponse.json({ error: 'Data retention job failed' }, { status: 500 })
  }
}
