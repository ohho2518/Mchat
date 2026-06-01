'use client'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { List } from 'lucide-react'
import type { Transaction } from '@/types/transaction'

const TYPE_LABELS: Record<string, string> = {
  income: 'รายรับ', expense: 'รายจ่าย',
  transfer: 'โอน', debt: 'หนี้', unknown: '?',
}
const AMOUNT_COLOR: Record<string, string> = {
  income: 'text-green-600', expense: 'text-red-600',
  transfer: 'text-blue-600', debt: 'text-orange-500', unknown: 'text-gray-500',
}
const AMOUNT_PREFIX: Record<string, string> = {
  income: '+', expense: '-', transfer: '', debt: '', unknown: '',
}
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด', bank_transfer: 'โอน', card: 'บัตร', unknown: '',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatAmount(tx: Transaction): string {
  const n = Number(tx.amount)
  return `${AMOUNT_PREFIX[tx.type]}฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`
}

interface Pagination {
  page: number
  totalPages: number
  total: number
}

interface TransactionTableProps {
  transactions: Transaction[]
  pagination:   Pagination
  loading:      boolean
  onEdit:       (tx: Transaction) => void
  onDelete:     (tx: Transaction) => void
  onPageChange: (p: number) => void
}

export function TransactionTable({
  transactions, pagination, loading, onEdit, onDelete, onPageChange,
}: TransactionTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <EmptyState
        icon={List}
        title="ไม่พบรายการ"
        description="ลองเปลี่ยนเงื่อนไขการค้นหา"
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Rows */}
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm"
          >
            {/* Left: category + date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={tx.type as Parameters<typeof Badge>[0]['variant']} className="shrink-0">
                  {TYPE_LABELS[tx.type]}
                </Badge>
                <span className="truncate text-sm font-medium text-gray-800">
                  {tx.category?.name ?? tx.description ?? '—'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {formatDate(
                  typeof tx.transactionDate === 'string'
                    ? tx.transactionDate
                    : new Date(tx.transactionDate).toISOString()
                )}
                {METHOD_LABELS[tx.paymentMethod ?? 'unknown'] && (
                  <> · {METHOD_LABELS[tx.paymentMethod ?? 'unknown']}</>
                )}
              </p>
            </div>

            {/* Right: amount + actions */}
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn('text-sm font-semibold', AMOUNT_COLOR[tx.type])}>
                {formatAmount(tx)}
              </span>
              <button
                onClick={() => onEdit(tx)}
                className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                title="แก้ไข"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(tx)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="ลบ"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-xs text-gray-500">
            {pagination.page} / {pagination.totalPages}
            <span className="ml-1 text-gray-400">({pagination.total} รายการ)</span>
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  )
}
