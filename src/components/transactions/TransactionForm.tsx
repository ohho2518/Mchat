'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Transaction, TransactionType, PaymentMethod, Category } from '@/types/transaction'
import { format } from 'date-fns'

interface TransactionFormProps {
  transaction: Transaction | null   // null = closed
  onClose: () => void
  onSave:  (id: string, data: Partial<Transaction>) => Promise<void>
}

const TYPE_OPTS: { value: TransactionType; label: string }[] = [
  { value: 'income',   label: 'รายรับ'  },
  { value: 'expense',  label: 'รายจ่าย' },
  { value: 'transfer', label: 'โอนเงิน' },
  { value: 'debt',     label: 'หนี้สิน' },
]
const METHOD_OPTS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',          label: 'เงินสด'    },
  { value: 'bank_transfer', label: 'โอนเงิน'   },
  { value: 'card',          label: 'บัตร'      },
  { value: 'unknown',       label: 'ไม่ระบุ'   },
]

function toDateInput(dateStr: string): string {
  try { return format(new Date(dateStr), 'yyyy-MM-dd') }
  catch { return format(new Date(), 'yyyy-MM-dd') }
}

export function TransactionForm({ transaction, onClose, onSave }: TransactionFormProps) {
  const [type,     setType]     = useState<TransactionType>('expense')
  const [amount,   setAmount]   = useState('')
  const [date,     setDate]     = useState('')
  const [catId,    setCatId]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [method,   setMethod]   = useState<PaymentMethod>('unknown')
  const [cats,     setCats]     = useState<Category[]>([])
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState<string | null>(null)

  // Populate form when transaction changes
  useEffect(() => {
    if (!transaction) return
    setType(transaction.type as TransactionType)
    setAmount(String(Number(transaction.amount)))
    setDate(toDateInput(String(transaction.transactionDate)))
    setCatId(transaction.categoryId ?? '')
    setDesc(transaction.description ?? '')
    setMethod((transaction.paymentMethod as PaymentMethod) ?? 'unknown')
    setErr(null)
  }, [transaction])

  // Fetch categories for dropdown
  useEffect(() => {
    if (!transaction) return
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data: Category[]) => setCats(data))
      .catch(() => {})
  }, [transaction])

  const filteredCats = cats.filter((c) => c.type === type)

  const handleSave = async () => {
    if (!transaction) return
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) { setErr('กรุณาระบุจำนวนเงินที่ถูกต้อง'); return }
    if (!date) { setErr('กรุณาเลือกวันที่'); return }
    setErr(null)
    setSaving(true)
    try {
      await onSave(transaction.id, {
        type,
        amount:          n,
        transactionDate: date,
        categoryId:      catId || undefined,
        description:     desc || undefined,
        paymentMethod:   method,
      })
      onClose()
    } catch {
      setErr('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!transaction} onClose={onClose} title="แก้ไขรายการ">
      <div className="space-y-3">
        {/* Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">ประเภท</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TYPE_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setType(opt.value); setCatId('') }}
                className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                  type === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <Input
          label="จำนวนเงิน (บาท)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min="0"
        />

        {/* Date */}
        <Input
          label="วันที่"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Category */}
        {filteredCats.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">หมวดหมู่</label>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">— ไม่ระบุหมวดหมู่ —</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <Input
          label="รายละเอียด (ไม่บังคับ)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="หมายเหตุ..."
        />

        {/* Payment method */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">วิธีชำระ</label>
          <div className="grid grid-cols-4 gap-1.5">
            {METHOD_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                  method === opt.value
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {err && <p className="text-xs text-red-600">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            บันทึก
          </Button>
        </div>
      </div>
    </Modal>
  )
}
