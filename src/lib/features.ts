export type Plan = 'free' | 'pro' | 'max'

export const PLAN_LIMITS = {
  free: {
    ocrPerMonth: 20,
    historyDays: 90,
    categories:  5,    // custom categories (userId = self)
    accounts:    2,
    transfers:   false,
    debts:       false,
    export:      false,
    multiUser:   false,
  },
  pro: {
    ocrPerMonth: 100,
    historyDays: null, // unlimited
    categories:  null,
    accounts:    null,
    transfers:   true,
    debts:       true,
    export:      true,
    multiUser:   false,
  },
  max: {
    ocrPerMonth: 500, // soft cap — ใช้เกินได้ด้วย ocrCredits
    historyDays: null,
    categories:  null,
    accounts:    null,
    transfers:   true,
    debts:       true,
    export:      true,
    multiUser:   true,
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro:  'Pro',
  max:  'Max',
}

export const PLAN_COLORS: Record<Plan, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200' },
  pro:  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  max:  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
}

export const PLAN_PRICES: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 0,   yearly: 0    },
  pro:  { monthly: 99,  yearly: 990  },
  max:  { monthly: 249, yearly: 2490 },
}

export const CREDIT_PACKS = [
  { credits: 100, price: 29 },
  { credits: 300, price: 79,  popular: true },
  { credits: 500, price: 119 },
] as const
export type CreditPack = typeof CREDIT_PACKS[number]

// ─── Authoritative pricing (server + client ใช้ร่วมกัน — ห้ามเชื่อ amount จาก client) ──
// ส่วนลดตามระยะเวลา — ต้องตรงกับ PERIOD_OPTIONS ในหน้า /pricing
export const PERIOD_DISCOUNTS: Record<number, number> = { 1: 0, 3: 0, 6: 0.1, 12: 0.17 }
export const VALID_PLAN_MONTHS: number[] = [1, 3, 6, 12]

// คำนวณยอดที่ต้องชำระจาก plan + จำนวนเดือน (source of truth)
export function computePlanAmount(plan: 'pro' | 'max', months: number): number {
  const base = PLAN_PRICES[plan].monthly
  const discount = PERIOD_DISCOUNTS[months] ?? 0
  return Math.round(base * months * (1 - discount))
}

// หา credit pack จากจำนวนเครดิต (คืน undefined ถ้าไม่ตรง pack ที่มีขาย)
export function findCreditPack(credits: number): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.credits === credits)
}

// แผนที่มีผลจริง ณ ตอนนี้ (read-time) — กัน plan ค้างหลังหมดอายุ
// - subscription active/past_due → คงแผนไว้เสมอ (renewal อาจมาช้า ไม่ลดก่อน)
// - one-time / subscription ที่จบแล้ว → ลดเป็น free เมื่อเลย planExpiresAt
export function effectivePlan(
  plan: Plan,
  planExpiresAt: Date | null,
  stripeSubscriptionId: string | null,
  subscriptionStatus: string | null,
): Plan {
  if (plan === 'free') return 'free'
  const hasActiveSub =
    Boolean(stripeSubscriptionId) &&
    (subscriptionStatus === 'active' || subscriptionStatus === 'past_due')
  if (hasActiveSub) return plan
  if (planExpiresAt && planExpiresAt.getTime() < Date.now()) return 'free'
  return plan
}

// Thai timezone month string (UTC+7) — used for OCR quota keying
export function getThaiMonth(): string {
  const TH_OFFSET_MS = 7 * 60 * 60 * 1000
  const nowTh = new Date(Date.now() + TH_OFFSET_MS)
  const y = nowTh.getUTCFullYear()
  const m = String(nowTh.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
