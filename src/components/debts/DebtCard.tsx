'use client'
import { Pencil, Trash2, CheckCircle, Calendar } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Debt } from '@/types/debt'

const DEBT_TYPE_LABEL: Record<string, string> = {
  borrowed_from_other: 'ยืมเงินมา',
  lent_to_other:       'ให้ยืม',
  receivable:          'ลูกค้าค้างจ่าย',
  payable:             'เราค้างจ่าย',
}

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-yellow-100 text-yellow-700',
  partial:   'bg-blue-100  text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100  text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  open:      'ยังค้างอยู่',
  partial:   'จ่ายบางส่วน',
  paid:      'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

interface DebtCardProps {
  debt:       Debt
  onPay:      (d: Debt) => void
  onEdit:     (d: Debt) => void
  onDelete:   (d: Debt) => void
}

export function DebtCard({ debt, onPay, onEdit, onDelete }: DebtCardProps) {
  const isPaid     = debt.status === 'paid'
  const isOverdue  = !isPaid && debt.dueDate && isPast(parseISO(debt.dueDate))
  const statusCls  = STATUS_STYLE[debt.status] ?? STATUS_STYLE.open
  const paidPct    = debt.amount > 0
    ? Math.round(((debt.amount - debt.remainingAmount) / debt.amount) * 100)
    : 0

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm space-y-3 ${isPaid ? 'opacity-60' : ''}`}>
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {debt.personName ?? '(ไม่ระบุชื่อ)'}
          </p>
          <p className="text-xs text-gray-500">{DEBT_TYPE_LABEL[debt.debtType] ?? debt.debtType}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}`}>
          {STATUS_LABEL[debt.status] ?? debt.status}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {debt.remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
        <span className="text-sm text-gray-400">
          / {debt.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
        </span>
      </div>

      {/* Progress bar */}
      {!isPaid && debt.amount > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      )}

      {/* Due date + description */}
      {(debt.dueDate || debt.description) && (
        <div className="space-y-0.5">
          {debt.dueDate && (
            <p className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              <Calendar className="h-3 w-3" />
              {isOverdue ? 'เลยกำหนด ' : 'ครบ '}
              {format(parseISO(debt.dueDate), 'd MMM yyyy', { locale: th })}
            </p>
          )}
          {debt.description && (
            <p className="text-xs text-gray-400 truncate">{debt.description}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isPaid && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <button
            onClick={() => onPay(debt)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-50 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            บันทึกชำระ
          </button>
          <button
            onClick={() => onEdit(debt)}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(debt)}
            className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
