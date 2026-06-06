'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, HandCoins } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner }        from '@/components/ui/Spinner'
import { EmptyState }     from '@/components/ui/EmptyState'
import { UpgradePrompt }  from '@/components/ui/UpgradePrompt'
import { DebtCard, DebtForm, PaymentModal } from '@/components/debts'
import { cn } from '@/lib/utils/cn'
import type { Debt, DebtType } from '@/types/debt'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

type TabValue = 'owe' | 'owed' | 'paid'

const TABS: { value: TabValue; label: string }[] = [
  { value: 'owe',  label: 'เราเป็นหนี้'   },
  { value: 'owed', label: 'เขาเป็นหนี้เรา' },
  { value: 'paid', label: 'ชำระแล้ว'       },
]

const OWE_TYPES:  DebtType[] = ['borrowed_from_other', 'payable']
const OWED_TYPES: DebtType[] = ['lent_to_other', 'receivable']

function sumRemaining(debts: Debt[]) {
  return debts.reduce((s, d) => s + d.remainingAmount, 0)
}

interface SaveData {
  personName?:  string
  debtType:     DebtType
  amount:       number
  dueDate?:     string | null
  description?: string | null
}

export default function DebtsPage() {
  const { data: session } = useSession()
  const [debts,        setDebts]        = useState<Debt[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<TabValue>('owe')
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState<Debt | null>(null)
  const [payTarget,    setPayTarget]    = useState<Debt | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const plan     = (session?.user?.plan ?? 'free') as Plan
  const canDebts = PLAN_LIMITS[plan].debts

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/debts?status=all')
      if (res.ok) setDebts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = debts.filter((d) => {
    if (tab === 'paid') return d.status === 'paid'
    const types = tab === 'owe' ? OWE_TYPES : OWED_TYPES
    return types.includes(d.debtType) && d.status !== 'paid' && d.status !== 'cancelled'
  })

  const totalOwe  = sumRemaining(debts.filter((d) => OWE_TYPES.includes(d.debtType)  && d.status !== 'paid' && d.status !== 'cancelled'))
  const totalOwed = sumRemaining(debts.filter((d) => OWED_TYPES.includes(d.debtType) && d.status !== 'paid' && d.status !== 'cancelled'))

  const handleSave = async (data: SaveData, id?: string) => {
    const url    = id ? `/api/debts/${id}` : '/api/debts'
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(typeof body.error === 'string' ? body.error : 'บันทึกไม่สำเร็จ')
    }
    await load()
  }

  const handlePay = async (id: string, payAmount: number) => {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    const remaining = Math.max(0, debt.remainingAmount - payAmount)
    const res = await fetch(`/api/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remainingAmount: remaining }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(typeof body.error === 'string' ? body.error : 'บันทึกไม่สำเร็จ')
    }
    await load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/debts/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 })

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Plan gate banner for free users */}
      {!canDebts && (
        <UpgradePrompt feature="ติดตามลูกหนี้ / เจ้าหนี้" />
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-red-50 p-3 text-center">
          <p className="text-xs text-red-500 mb-0.5">เราเป็นหนี้</p>
          <p className="text-base font-bold text-red-600">{fmt(totalOwe)}</p>
          <p className="text-xs text-red-400">บาท</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-3 text-center">
          <p className="text-xs text-green-600 mb-0.5">เขาเป็นหนี้เรา</p>
          <p className="text-base font-bold text-green-600">{fmt(totalOwed)}</p>
          <p className="text-xs text-green-400">บาท</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
              tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={tab === 'paid' ? 'ยังไม่มีรายการชำระแล้ว' : 'ไม่มีรายการค้างอยู่'}
          description={tab !== 'paid' && canDebts ? 'กด + เพื่อบันทึกรายการหนี้' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              onPay={setPayTarget}
              onEdit={(debt) => { setEditTarget(debt); setFormOpen(true) }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* FAB — only for paid plans */}
      {canDebts && (
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-30"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <DebtForm
        open={formOpen}
        initial={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSave={handleSave}
      />

      <PaymentModal
        open={!!payTarget}
        debt={payTarget}
        onClose={() => setPayTarget(null)}
        onPay={handlePay}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="ลบรายการหนี้"
        message={`ต้องการลบรายการของ "${deleteTarget?.personName ?? 'ไม่ระบุชื่อ'}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  )
}
