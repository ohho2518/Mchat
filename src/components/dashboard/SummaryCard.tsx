import { cn } from '@/lib/utils/cn'
import { Spinner } from '@/components/ui'

interface SummaryCardProps {
  label: string
  amount: number
  type: 'income' | 'expense' | 'balance'
  loading?: boolean
}

const STYLES = {
  income:  { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  expense: { text: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-100'   },
  balance: { text: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-100'  },
}

function formatTHB(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}฿${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000)    return `${n < 0 ? '-' : ''}฿${(abs / 1_000).toFixed(1)}K`
  return `${n < 0 ? '-฿' : '฿'}${abs.toLocaleString('th-TH')}`
}

export function SummaryCard({ label, amount, type, loading }: SummaryCardProps) {
  const s = STYLES[type]
  return (
    <div className={cn('flex flex-col gap-1 rounded-2xl border p-3', s.bg, s.border)}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {loading ? (
        <Spinner size="sm" className="mt-1" />
      ) : (
        <p className={cn('text-lg font-bold leading-tight', s.text)}>{formatTHB(amount)}</p>
      )}
    </div>
  )
}
