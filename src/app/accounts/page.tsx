'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner }       from '@/components/ui/Spinner'
import { EmptyState }    from '@/components/ui/EmptyState'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { AccountCard, AccountForm } from '@/components/accounts'
import type { Account } from '@/types/account'
import type { AccountType } from '@/types/account'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

interface SaveData {
  name: string; type: AccountType; openingBalance: number
}

export default function AccountsPage() {
  const { data: session } = useSession()
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [loading,      setLoading]      = useState(true)
  const [formOpen,     setFormOpen]     = useState(false)
  const [showUpgrade,  setShowUpgrade]  = useState(false)
  const [editTarget,   setEditTarget]   = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const plan     = (session?.user?.plan ?? 'free') as Plan
  const accLimit = PLAN_LIMITS[plan].accounts
  const atLimit  = accLimit !== null && accounts.length >= accLimit

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) setAccounts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: SaveData, id?: string) => {
    const url    = id ? `/api/accounts/${id}` : '/api/accounts'
    const method = id ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
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
      await fetch(`/api/accounts/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="ยังไม่มีบัญชี"
          description="กด + เพื่อสร้างบัญชีใหม่ เช่น เงินสด, ธนาคาร, บัญชีร้าน"
        />
      ) : (
        accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            onEdit={(acc) => { setEditTarget(acc); setFormOpen(true) }}
            onDelete={setDeleteTarget}
          />
        ))
      )}

      {/* FAB */}
      <button
        onClick={() => {
          if (atLimit) { setShowUpgrade(true); return }
          setEditTarget(null); setFormOpen(true)
        }}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Upgrade prompt modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpgrade(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <UpgradePrompt
              feature={`สร้างบัญชีได้สูงสุด ${accLimit} บัญชี (แผน Free)`}
            />
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      <AccountForm
        open={formOpen}
        initial={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="ลบบัญชี"
        message={`ต้องการลบบัญชี "${deleteTarget?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  )
}
