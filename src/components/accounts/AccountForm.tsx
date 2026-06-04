'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Account, AccountType } from '@/types/account'

const TYPE_OPTS: { value: AccountType; label: string; emoji: string }[] = [
  { value: 'cash',     label: 'เงินสด',      emoji: '💵' },
  { value: 'bank',     label: 'ธนาคาร',      emoji: '🏦' },
  { value: 'wallet',   label: 'กระเป๋าเงิน', emoji: '👛' },
  { value: 'business', label: 'บัญชีร้าน',   emoji: '🏪' },
  { value: 'farm',     label: 'สวน/ไร่',      emoji: '🌳' },
  { value: 'other',    label: 'อื่นๆ',        emoji: '📋' },
]

interface FormData {
  name:           string
  type:           AccountType
  openingBalance: string
}

interface AccountFormProps {
  open:    boolean
  initial: Account | null
  onClose: () => void
  onSave:  (data: { name: string; type: AccountType; openingBalance: number }, id?: string) => Promise<void>
}

const EMPTY: FormData = { name: '', type: 'cash', openingBalance: '0' }

export function AccountForm({ open, initial, onClose, onSave }: AccountFormProps) {
  const [form,   setForm]   = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name:           initial.name,
        type:           initial.type,
        openingBalance: String(initial.openingBalance),
      })
    } else {
      setForm(EMPTY)
    }
    setErr(null)
  }, [open, initial])

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('กรุณาระบุชื่อบัญชี'); return }
    const balance = parseFloat(form.openingBalance)
    if (isNaN(balance)) { setErr('ยอดเปิดบัญชีต้องเป็นตัวเลข'); return }
    setSaving(true)
    setErr(null)
    try {
      await onSave({ name: form.name.trim(), type: form.type, openingBalance: balance }, initial?.id)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'แก้ไขบัญชี' : 'สร้างบัญชีใหม่'}>
      <div className="space-y-4">
        {/* ประเภทบัญชี */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">ประเภทบัญชี</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set({ type: o.value })}
                className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                  form.type === o.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ชื่อบัญชี */}
        <Input
          label="ชื่อบัญชี"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="เช่น กระเป๋าสตางค์, ธ.กสิกร, บัญชีร้านค้า"
        />

        {/* ยอดเปิดบัญชี */}
        <Input
          label="ยอดเปิดบัญชี (บาท)"
          type="number"
          value={form.openingBalance}
          onChange={(e) => set({ openingBalance: e.target.value })}
          placeholder="0"
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
