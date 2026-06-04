'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Debt, DebtType } from '@/types/debt'

const PERSPECTIVE_OPTS = [
  { value: 'borrowed_from_other', label: 'เราเป็นหนี้', emoji: '💸', desc: 'ยืมเงินมาจากคนอื่น' },
  { value: 'lent_to_other',       label: 'เขาเป็นหนี้', emoji: '🤝', desc: 'เราให้คนอื่นยืมเงิน' },
]

interface FormData {
  personName:  string
  debtType:    DebtType
  amount:      string
  dueDate:     string
  description: string
}

interface DebtFormProps {
  open:    boolean
  initial: Debt | null
  onClose: () => void
  onSave:  (data: {
    personName?:  string
    debtType:     DebtType
    amount:       number
    dueDate?:     string | null
    description?: string | null
  }, id?: string) => Promise<void>
}

const EMPTY: FormData = {
  personName:  '',
  debtType:    'borrowed_from_other',
  amount:      '',
  dueDate:     '',
  description: '',
}

export function DebtForm({ open, initial, onClose, onSave }: DebtFormProps) {
  const [form,   setForm]   = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        personName:  initial.personName ?? '',
        debtType:    initial.debtType,
        amount:      String(initial.amount),
        dueDate:     initial.dueDate ?? '',
        description: initial.description ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setErr(null)
  }, [open, initial])

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setErr('กรุณาระบุจำนวนเงินที่ถูกต้อง')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await onSave({
        personName:  form.personName.trim() || undefined,
        debtType:    form.debtType,
        amount,
        dueDate:     form.dueDate || null,
        description: form.description.trim() || null,
      }, initial?.id)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'แก้ไขรายการหนี้' : 'บันทึกหนี้ใหม่'}>
      <div className="space-y-4">
        {/* Perspective */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">ประเภท</label>
          <div className="grid grid-cols-2 gap-2">
            {PERSPECTIVE_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set({ debtType: o.value as DebtType })}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-3 text-xs font-medium transition-colors ${
                  form.debtType === o.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{o.emoji}</span>
                <span className="font-semibold">{o.label}</span>
                <span className={`text-xs ${form.debtType === o.value ? 'text-blue-100' : 'text-gray-400'}`}>
                  {o.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Person name */}
        <Input
          label="ชื่อ (ลูกหนี้ / เจ้าหนี้)"
          value={form.personName}
          onChange={(e) => set({ personName: e.target.value })}
          placeholder="เช่น แม่, ลุงสมชาย, ลูกค้า ABC"
        />

        {/* Amount */}
        <Input
          label="จำนวนเงิน (บาท)"
          type="number"
          value={form.amount}
          onChange={(e) => set({ amount: e.target.value })}
          placeholder="0"
        />

        {/* Due date */}
        <Input
          label="วันครบกำหนด (ไม่บังคับ)"
          type="date"
          value={form.dueDate}
          onChange={(e) => set({ dueDate: e.target.value })}
        />

        {/* Description */}
        <Input
          label="หมายเหตุ (ไม่บังคับ)"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="เช่น ยืมค่ารถ, ค่าสินค้าล็อต 3"
        />

        {err && <p className="text-xs text-red-600">{err}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button variant="primary"   className="flex-1" onClick={handleSave} loading={saving}>บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}
