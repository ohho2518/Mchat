'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, ArrowLeftRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConfirmDialog }              from '@/components/ui/ConfirmDialog'
import { Spinner }                    from '@/components/ui/Spinner'
import { EmptyState }                 from '@/components/ui/EmptyState'
import { UpgradePrompt }              from '@/components/ui/UpgradePrompt'
import { TransferCard, TransferForm } from '@/components/transfers'
import type { Transfer } from '@/types/transfer'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

function normalize(data: Transfer[]): Transfer[] {
  return data.map((t) => ({
    ...t,
    amount:       Number(t.amount),
    transferDate: String(t.transferDate).split('T')[0],
  }))
}

function groupByMonth(transfers: Transfer[]): { label: string; items: Transfer[] }[] {
  const map = new Map<string, Transfer[]>()
  for (const t of transfers) {
    const key = t.transferDate.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    label: format(new Date(key + '-01'), 'MMMM yyyy', { locale: th }),
    items,
  }))
}

export default function TransfersPage() {
  const { data: session } = useSession()
  const [transfers,    setTransfers]    = useState<Transfer[]>([])
  const [loading,      setLoading]      = useState(true)
  const [formOpen,     setFormOpen]     = useState(false)
  const [showUpgrade,  setShowUpgrade]  = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transfer | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const plan        = (session?.user?.plan ?? 'free') as Plan
  const canTransfer = PLAN_LIMITS[plan].transfers

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/transfers')
      if (res.ok) setTransfers(normalize(await res.json()))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: {
    fromAccountId: string; toAccountId: string
    amount: number; transferDate: string; description?: string | null
  }) => {
    const res = await fetch('/api/transfers', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
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
      await fetch(`/api/transfers/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  const totalThisMonth = transfers.filter((t) => {
    return t.transferDate.startsWith(format(new Date(), 'yyyy-MM'))
  }).reduce((s, t) => s + t.amount, 0)

  const grouped = groupByMonth(transfers)

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Plan gate banner for free users */}
      {!canTransfer && (
        <UpgradePrompt feature="บันทึกการโอนเงินระหว่างบัญชี" />
      )}

      {/* Summary */}
      {transfers.length > 0 && (
        <div className="rounded-2xl bg-blue-50 p-4 text-center">
          <p className="text-xs text-blue-500 mb-0.5">โอนเดือนนี้</p>
          <p className="text-xl font-bold text-blue-600">
            ฿{totalThisMonth.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="ยังไม่มีรายการโอน"
          description={canTransfer ? 'กด + เพื่อบันทึกการโอนเงินระหว่างบัญชี' : 'อัปเกรดเพื่อใช้งานฟีเจอร์นี้'}
        />
      ) : (
        grouped.map(({ label, items }) => (
          <section key={label}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</h2>
            <div className="space-y-3">
              {items.map((t) => (
                <TransferCard key={t.id} transfer={t} onDelete={setDeleteTarget} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* FAB — only for paid plans */}
      {canTransfer && (
        <button
          onClick={() => setFormOpen(true)}
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-30"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Upgrade prompt modal (fallback if user finds another entry point) */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpgrade(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <UpgradePrompt feature="บันทึกการโอนเงินระหว่างบัญชี" />
            <button onClick={() => setShowUpgrade(false)}
              className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600">
              ปิด
            </button>
          </div>
        </div>
      )}

      <TransferForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="ลบรายการโอน"
        message={`ต้องการลบการโอนเงิน ฿${deleteTarget?.amount.toLocaleString('th-TH') ?? ''} นี้ใช่หรือไม่?`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  )
}
