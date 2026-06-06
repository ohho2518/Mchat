'use client'
import { useEffect, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { Input }    from '@/components/ui/Input'
import { Button }   from '@/components/ui/Button'
import { Spinner }  from '@/components/ui/Spinner'
import type { Account } from '@/types/account'

interface TransferFormProps {
  open:     boolean
  onClose:  () => void
  onSave:   (data: {
    fromAccountId: string
    toAccountId:   string
    amount:        number
    transferDate:  string
    description?:  string | null
  }) => Promise<void>
}

const ACCOUNT_TYPE_ICON: Record<string, string> = {
  cash: '💵', bank: '🏦', wallet: '👛', business: '🏪', farm: '🌾', other: '💳',
}

export function TransferForm({ open, onClose, onSave }: TransferFormProps) {
  const [accounts,       setAccounts]       = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [fromAccountId,  setFromAccountId]  = useState('')
  const [toAccountId,    setToAccountId]    = useState('')
  const [amount,         setAmount]         = useState('')
  const [transferDate,   setTransferDate]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [description,    setDescription]    = useState('')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoadingAccounts(true)
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data: Account[]) => setAccounts(data))
      .catch(() => {})
      .finally(() => setLoadingAccounts(false))
  }, [open])

  const reset = () => {
    setFromAccountId(''); setToAccountId(''); setAmount('')
    setTransferDate(format(new Date(), 'yyyy-MM-dd'))
    setDescription(''); setError(null)
  }

  const close = () => { reset(); onClose() }

  const handleSubmit = async () => {
    setError(null)
    if (!fromAccountId)     return setError('กรุณาเลือกบัญชีต้นทาง')
    if (!toAccountId)       return setError('กรุณาเลือกบัญชีปลายทาง')
    if (fromAccountId === toAccountId) return setError('บัญชีต้นทางและปลายทางต้องไม่เหมือนกัน')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)   return setError('กรุณาระบุจำนวนเงินที่ถูกต้อง')
    if (!transferDate)      return setError('กรุณาระบุวันที่')

    setSaving(true)
    try {
      await onSave({ fromAccountId, toAccountId, amount: amt, transferDate, description: description || null })
      close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const toOptions = accounts.filter((a) => a.id !== fromAccountId)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">โอนเงินระหว่างบัญชี</h3>
          <button onClick={close} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingAccounts ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : accounts.length < 2 ? (
          <div className="py-6 text-center">
            <p className="text-2xl mb-2">🏦</p>
            <p className="text-sm font-medium text-gray-700">ต้องมีบัญชีอย่างน้อย 2 บัญชี</p>
            <p className="text-xs text-gray-500 mt-1">ไปสร้างบัญชีที่หน้า บัญชีของฉัน ก่อน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* From / To */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">จากบัญชี</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => { setFromAccountId(e.target.value); if (toAccountId === e.target.value) setToAccountId('') }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">เลือกบัญชี</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{ACCOUNT_TYPE_ICON[a.type]} {a.name}</option>
                  ))}
                </select>
              </div>

              <ArrowRight className="h-4 w-4 text-blue-400 mt-5 shrink-0" />

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">ไปบัญชี</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">เลือกบัญชี</option>
                  {toOptions.map((a) => (
                    <option key={a.id} value={a.id}>{ACCOUNT_TYPE_ICON[a.type]} {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <Input
              label="จำนวนเงิน (บาท)"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />

            {/* Date */}
            <Input
              label="วันที่โอน"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />

            {/* Description */}
            <Input
              label="หมายเหตุ (ไม่บังคับ)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น ย้ายเงินไปออมทรัพย์"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={close}>ยกเลิก</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกการโอน'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
