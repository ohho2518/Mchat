import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { CRON_LAST_RUN_KEY, type CronRunRecord } from '@/lib/cron'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public health check — ให้ uptime monitor ภายนอก (UptimeRobot / cron-job.org) ping ทุก 5-15 นาที
// ผลพลอยได้ที่สำคัญ: DB ถูกแตะตลอด → กัน Supabase free-tier auto-pause (pause เมื่อ idle 7 วัน)
// คืน 503 เมื่อ DB ล่ม เพื่อให้ monitor แจ้งเตือนทันที
export async function GET() {
  const startedAt = Date.now()

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: CRON_LAST_RUN_KEY },
    })

    let lastCronRun: CronRunRecord | null = null
    if (setting) {
      try {
        lastCronRun = JSON.parse(setting.value) as CronRunRecord
      } catch {
        lastCronRun = null
      }
    }

    return NextResponse.json({
      ok: true,
      db: 'up',
      latencyMs: Date.now() - startedAt,
      lastCronRun,
      time: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[health] db check failed', err)
    return NextResponse.json(
      {
        ok: false,
        db: 'down',
        latencyMs: Date.now() - startedAt,
        time: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
