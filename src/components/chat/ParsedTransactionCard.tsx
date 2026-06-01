'use client'
import { AlertTriangle, CheckCircle2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ParsedTransaction } from '@/types/transaction'

interface ParsedTransactionCardProps {
  parsed: ParsedTransaction
  onConfirm: () => void
  onReject: () => void
  loading?: boolean
  status?: 'pending' | 'confirmed' | 'rejected'
}

const TYPE_LABELS: Record<string, string> = {
  income: 'รายรับ', expense: 'รายจ่าย',
  transfer: 'โอนเงิน', debt: 'หนี้สิน', unknown: 'ไม่ระบุ',
}
const TYPE_AMOUNT_COLOR: Record<string, string> = {
  income: 'text-green-600', expense: 'text-red-600',
  transfer: 'text-blue-600', debt: 'text-orange-500', unknown: 'text-gray-500',
}
const METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด', bank_transfer: 'โอน', card: 'บัตร', unknown: '',
}
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function formatTHB(amount: number | null) {
  if (amount === null) return '?'
  return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'วันนี้'
  const d = new Date(dateStr)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function ParsedTransactionCard({
  parsed, onConfirm, onReject, loading, status = 'pending',
}: ParsedTransactionCardProps) {
  const { type, amount, transactionDate, categoryName, paymentMethod, confidence, description } = parsed
  const lowConfidence = confidence < 0.6
  const canConfirm = amount !== null && type !== 'unknown'

  if (status === 'confirmed') {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          บันทึกรายการแล้ว
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-bl-sm bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-400">
          ยกเลิกรายการ
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start w-full">
      <div className="w-full max-w-[90%] rounded-2xl rounded-bl-sm bg-white border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100">
          <Badge variant={type as Parameters<typeof Badge>[0]['variant']}>{TYPE_LABELS[type]}</Badge>
          {categoryName && (
            <span className="text-sm text-gray-600 font-medium">{categoryName}</span>
          )}
          {description && !categoryName && (
            <span className="text-xs text-gray-500 truncate">{description}</span>
          )}
        </div>

        {/* Amount */}
        <div className="px-4 py-3">
          <p className={cn('text-3xl font-bold tracking-tight', TYPE_AMOUNT_COLOR[type])}>
            {formatTHB(amount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatDate(transactionDate)}
            {METHOD_LABELS[paymentMethod] && (
              <> · {METHOD_LABELS[paymentMethod]}</>
            )}
          </p>
        </div>

        {/* Low confidence warning */}
        {lowConfidence && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            กรุณาตรวจสอบก่อนบันทึก (ความมั่นใจต่ำ)
          </div>
        )}

        {/* Amount missing warning */}
        {amount === null && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ไม่พบยอดเงิน — กรุณาระบุจำนวนเงิน
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onReject}
            disabled={loading}
          >
            <X className="h-3.5 w-3.5" />
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            loading={loading}
          >
            <Check className="h-3.5 w-3.5" />
            ยืนยัน
          </Button>
        </div>
      </div>
    </div>
  )
}
