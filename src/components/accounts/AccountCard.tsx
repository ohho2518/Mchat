'use client'
import { Pencil, Trash2 } from 'lucide-react'
import type { Account } from '@/types/account'

const TYPE_LABEL: Record<string, string> = {
  cash:     'เงินสด',
  bank:     'ธนาคาร',
  wallet:   'กระเป๋าเงิน',
  business: 'บัญชีร้าน',
  farm:     'บัญชีสวน/ไร่',
  other:    'อื่นๆ',
}

const TYPE_COLOR: Record<string, string> = {
  cash:     'bg-green-100 text-green-700',
  bank:     'bg-blue-100 text-blue-700',
  wallet:   'bg-purple-100 text-purple-700',
  business: 'bg-orange-100 text-orange-700',
  farm:     'bg-lime-100 text-lime-700',
  other:    'bg-gray-100 text-gray-600',
}

interface AccountCardProps {
  account:  Account
  onEdit:   (a: Account) => void
  onDelete: (a: Account) => void
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const colorClass = TYPE_COLOR[account.type] ?? TYPE_COLOR.other

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-gray-900">{account.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {TYPE_LABEL[account.type] ?? 'อื่นๆ'}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          ยอดเปิด:{' '}
          <span className={account.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            {account.openingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </span>
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(account)}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="แก้ไข"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(account)}
          className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label="ลบ"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
