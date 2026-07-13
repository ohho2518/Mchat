// Key ใน SiteSetting ที่ cron เขียนทุกครั้งที่รันสำเร็จ
// ใช้ 2 อย่าง: (1) พิสูจน์ว่า Vercel Cron รันจริง (2) เป็น DB write รายวัน กัน Supabase free-tier auto-pause
export const CRON_LAST_RUN_KEY = 'cron:data-retention:lastRun'

export type CronRunRecord = {
  ranAt: string
  deleted: Record<string, number>
}
