'use client'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TransactionType } from '@/types/transaction'

export interface FilterState {
  keyword:   string
  type:      TransactionType | ''
  startDate: string
  endDate:   string
}

const TYPE_OPTS: { value: TransactionType | ''; label: string }[] = [
  { value: '',         label: 'ทั้งหมด' },
  { value: 'income',   label: 'รายรับ'  },
  { value: 'expense',  label: 'รายจ่าย' },
  { value: 'transfer', label: 'โอน'     },
  { value: 'debt',     label: 'หนี้สิน' },
]

interface TransactionFilterProps {
  value:    FilterState
  onChange: (f: FilterState) => void
}

export function TransactionFilter({ value, onChange }: TransactionFilterProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })
  const hasFilter = value.keyword || value.type || value.startDate || value.endDate

  return (
    <div className="space-y-2">
      {/* Keyword search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={value.keyword}
          onChange={(e) => set({ keyword: e.target.value })}
          placeholder="ค้นหารายการ..."
          className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {value.keyword && (
          <button
            onClick={() => set({ keyword: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {TYPE_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => set({ type: opt.value })}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              value.type === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => set({ startDate: e.target.value })}
          className="h-9 flex-1 rounded-xl border border-gray-300 px-3 text-xs outline-none focus:border-blue-500"
        />
        <span className="self-center text-gray-400 text-xs">—</span>
        <input
          type="date"
          value={value.endDate}
          onChange={(e) => set({ endDate: e.target.value })}
          className="h-9 flex-1 rounded-xl border border-gray-300 px-3 text-xs outline-none focus:border-blue-500"
        />
        {hasFilter && (
          <button
            onClick={() => onChange({ keyword: '', type: '', startDate: '', endDate: '' })}
            className="shrink-0 rounded-xl border border-gray-200 px-3 text-xs text-gray-500 hover:bg-gray-50"
          >
            ล้าง
          </button>
        )}
      </div>
    </div>
  )
}
