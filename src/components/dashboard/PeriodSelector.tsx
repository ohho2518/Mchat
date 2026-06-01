'use client'
import { cn } from '@/lib/utils/cn'
import type { DashboardPeriod } from '@/types/dashboard'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'วันนี้'   },
  { value: 'week',  label: 'สัปดาห์'  },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'year',  label: 'ปีนี้'    },
]

interface PeriodSelectorProps {
  value: DashboardPeriod
  onChange: (p: DashboardPeriod) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
            value === p.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
