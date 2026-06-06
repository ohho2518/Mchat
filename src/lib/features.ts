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
    ocrPerMonth: null, // unlimited
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

// Thai timezone month string (UTC+7) — used for OCR quota keying
export function getThaiMonth(): string {
  const TH_OFFSET_MS = 7 * 60 * 60 * 1000
  const nowTh = new Date(Date.now() + TH_OFFSET_MS)
  const y = nowTh.getUTCFullYear()
  const m = String(nowTh.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
