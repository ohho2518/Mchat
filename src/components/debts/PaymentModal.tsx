'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Debt } from '@/types/debt'

interface PaymentModalProps {
  open:    boolean
  debt:    Debt | null
  onClose: () => void
  onPay:   (id: string, amount: number) => Promise<void>
}

export function PaymentModal({ open, debt, onClose, onPay }: PaymentModalProps) {
  const [amount,  setAmount]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  useEffect(() => {
    if (open && debt) {
      setAmount(String(debt.remainingAmount))
      setErr(null)
    }
  }, [open, debt])

  if (!debt) return null

  const handlePay = async () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) { setErr('กรุณาระบุจำนวนเงินที่ถูกต้อง'); return }
    if (val > debt.remainingAmount) { setErr(`ไม่สามารถชำระเกินยอดคงค้าง (${debt.remainingAmount.toLocaleString('th-TH')} บาท)`); return }
    setSaving(true)
    setErr(null)
    try {
      await onPay(debt.id, val)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const isFullPay = parseFloat(amount) >= debt.remainingAmount

  return (
    <Modal open={open} onClose={onClose} title="บันทึกการชำระ">
      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <p className="text-gray-500">รายการ: <span className="font-medium text-gray-900">{debt.personName ?? '(ไม่ระบุชื่อ)'}</span></p>
          <p className="text-gray-500 mt-0.5">
            ยอดคงค้าง:{' '}
            <span className="font-semibold text-red-600">
              {debt.remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
            </span>
          </p>
        </div>

        <Input
          label="จำนวนที่ชำระ (บาท)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(String(debt.remainingAmount))}
            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            ชำระทั้งหมด
          </button>
          {debt.remainingAmount > 0 && (
            <button
              type="button"
              onClick={() => setAmount(String(Math.round(debt.remainingAmount / 2)))}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              ครึ่งหนึ่ง
            </button>
          )}
        </div>

        {err && <p className="text-xs text-red-600">{err}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button
            variant="primary"
            className={`flex-1 ${isFullPay ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={handlePay}
            loading={saving}
          >
            {isFullPay ? 'ชำระครบแล้ว' : 'บันทึกชำระ'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
