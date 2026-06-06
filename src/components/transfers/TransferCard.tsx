'use client'
import { ArrowRight, Trash2 } from 'lucide-react'
import type { Transfer } from '@/types/transfer'

const ACCOUNT_TYPE_ICON: Record<string, string> = {
  cash:     '💵',
  bank:     '🏦',
  wallet:   '👛',
  business: '🏪',
  farm:     '🌾',
  other:    '💳',
}

interface TransferCardProps {
  transfer:  Transfer
  onDelete:  (t: Transfer) => void
}

export function TransferCard({ transfer, onDelete }: TransferCardProps) {
  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 })

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      {/* Accounts row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 min-w-0">
          <span className="text-sm">{ACCOUNT_TYPE_ICON[transfer.fromAccount.type] ?? '💳'}</span>
          <span className="text-xs font-medium text-gray-700 truncate">{transfer.fromAccount.name}</span>
        </div>

        <ArrowRight className="h-4 w-4 text-blue-400 shrink-0" />

        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 min-w-0">
          <span className="text-sm">{ACCOUNT_TYPE_ICON[transfer.toAccount.type] ?? '💳'}</span>
          <span className="text-xs font-medium text-gray-700 truncate">{transfer.toAccount.name}</span>
        </div>
      </div>

      {/* Amount + date + delete */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-blue-600">฿{fmt(transfer.amount)}</p>
          {transfer.description && (
            <p className="text-xs text-gray-400 mt-0.5">{transfer.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400">{transfer.transferDate}</p>
          <button
            onClick={() => onDelete(transfer)}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
