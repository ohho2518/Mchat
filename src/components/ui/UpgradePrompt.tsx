'use client'
import { Zap } from 'lucide-react'
import { PLAN_LABELS, PLAN_PRICES } from '@/lib/features'
import type { Plan } from '@/lib/features'

interface Props {
  feature: string          // e.g. "ดูประวัติเกิน 90 วัน"
  requiredPlan?: Plan      // minimum plan needed
  compact?: boolean        // inline vs card layout
}

export function UpgradePrompt({ feature, requiredPlan = 'pro', compact = false }: Props) {
  const label = PLAN_LABELS[requiredPlan]
  const price = PLAN_PRICES[requiredPlan].monthly

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
        <Zap className="h-3 w-3" />
        {feature} — ต้องการแผน {label} (฿{price}/เดือน)
      </span>
    )
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
      <Zap className="mx-auto mb-2 h-6 w-6 text-blue-500" />
      <p className="text-sm font-medium text-blue-800 mb-1">{feature}</p>
      <p className="text-xs text-blue-600 mb-3">
        ฟีเจอร์นี้ต้องการแผน {label} เริ่มต้น ฿{price}/เดือน
      </p>
      <a
        href="/settings#plan"
        className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
      >
        ดูรายละเอียดแผน
      </a>
    </div>
  )
}
