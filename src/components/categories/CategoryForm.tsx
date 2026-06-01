'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { KeywordManager } from './KeywordManager'
import type { Category } from '@/types/transaction'

type CategoryType = 'income' | 'expense' | 'transfer' | 'debt'

interface FormData {
  name: string; type: CategoryType
  color: string; icon: string; keywords: string[]
}

interface CategoryFormProps {
  open:    boolean
  initial: Category | null      // null = create mode
  onClose: () => void
  onSave:  (data: FormData, id?: string) => Promise<void>
}

const TYPE_OPTS: { value: CategoryType; label: string }[] = [
  { value: 'income', label: 'รายรับ' }, { value: 'expense', label: 'รายจ่าย' },
  { value: 'transfer', label: 'โอน' }, { value: 'debt', label: 'หนี้สิน' },
]

const PRESET_COLORS = [
  '#16A34A','#DC2626','#2563EB','#EA580C',
  '#7C3AED','#DB2777','#0891B2','#CA8A04',
]

const PRESET_ICONS = ['🛒','💸','🔧','🌳','💰','🛍️','⛽','🍽️','💡','💧','👷','🔨','🚗','📋','🏠','✈️']

const EMPTY: FormData = { name: '', type: 'expense', color: '#DC2626', icon: '📋', keywords: [] }

export function CategoryForm({ open, initial, onClose, onSave }: CategoryFormProps) {
  const [form,   setForm]   = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name:     initial.name,
        type:     initial.type as CategoryType,
        color:    initial.color ?? '#DC2626',
        icon:     initial.icon ?? '📋',
        keywords: initial.keywords?.map((k) => k.keyword) ?? [],
      })
    } else {
      setForm(EMPTY)
    }
    setErr(null)
  }, [open, initial])

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('กรุณาระบุชื่อหมวดหมู่'); return }
    setSaving(true)
    setErr(null)
    try {
      await onSave(form, initial?.id)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const title = initial ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">ประเภท</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TYPE_OPTS.map((o) => (
              <button key={o.value} type="button" onClick={() => set({ type: o.value })}
                className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                  form.type === o.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >{o.label}</button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input label="ชื่อหมวดหมู่" value={form.name}
          onChange={(e) => set({ name: e.target.value })} placeholder="เช่น ค่าน้ำมัน" />

        {/* Icon */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">ไอคอน</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => set({ icon: ic })}
                className={`h-9 w-9 rounded-xl text-lg transition-colors ${
                  form.icon === ic ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >{ic}</button>
            ))}
            <input value={form.icon} onChange={(e) => set({ icon: e.target.value })}
              placeholder="🎯" maxLength={2}
              className="h-9 w-16 rounded-xl border border-gray-300 px-2 text-center text-lg outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">สี</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set({ color: c })}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                  form.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Keywords */}
        <KeywordManager keywords={form.keywords} onChange={(kws) => set({ keywords: kws })} />

        {err && <p className="text-xs text-red-600">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button variant="primary"   className="flex-1" onClick={handleSave} loading={saving}>บันทึก</Button>
        </div>
      </div>
    </Modal>
  )
}
