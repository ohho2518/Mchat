'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryCard, CategoryForm } from '@/components/categories'
import type { Category } from '@/types/transaction'
import { cn } from '@/lib/utils/cn'
import { Tag } from 'lucide-react'

type TabType = 'income' | 'expense' | 'transfer' | 'debt'
const TABS: { value: TabType; label: string }[] = [
  { value: 'income',   label: 'รายรับ'   },
  { value: 'expense',  label: 'รายจ่าย'  },
  { value: 'transfer', label: 'โอนเงิน'  },
  { value: 'debt',     label: 'หนี้สิน'  },
]

interface SaveData {
  name: string; type: string
  color: string; icon: string; keywords: string[]
}

export default function CategoriesPage() {
  const [categories,   setCategories]   = useState<Category[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState<TabType>('expense')
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const visible = categories.filter((c) => c.type === tab)

  // ─── Save (create or update) ──────────────────────────────────────────────
  const handleSave = async (data: SaveData, id?: string) => {
    const url    = id ? `/api/categories/${id}` : '/api/categories'
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
    await fetch_()
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await fetch_()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Type tabs */}
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
        <EmptyState icon={Tag} title="ยังไม่มีหมวดหมู่" description="กด + เพื่อสร้างหมวดหมู่ใหม่" />
      ) : (
        <div className="space-y-2">
          {visible.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={(c) => { setEditTarget(c); setFormOpen(true) }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* FAB — สร้างใหม่ */}
      <button
        onClick={() => { setEditTarget(null); setFormOpen(true) }}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form modal */}
      <CategoryForm
        open={formOpen}
        initial={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="ลบหมวดหมู่"
        message={`ต้องการลบหมวดหมู่ "${deleteTarget?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  )
}
