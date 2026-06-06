'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Lock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import {
  TransactionFilter, TransactionTable, TransactionForm,
  type FilterState,
} from '@/components/transactions'
import { exportExcel } from '@/lib/export/exportExcel'
import { exportCsv }   from '@/lib/export/exportCsv'
import type { Transaction } from '@/types/transaction'
import { format } from 'date-fns'
import { trackEvent } from '@/lib/analytics/track'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

interface Pagination {
  page: number; limit: number; total: number; totalPages: number
}

const DEFAULT_FILTER: FilterState = { keyword: '', type: '', startDate: '', endDate: '' }
const LIMIT = 20

// Normalize transactions from API (amount is Decimal string, date is ISO string)
function normalize(data: Transaction[]): Transaction[] {
  return data.map((t) => ({
    ...t,
    amount: Number(t.amount),
    transactionDate: String(t.transactionDate).split('T')[0],
  }))
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const [transactions,  setTransactions] = useState<Transaction[]>([])
  const [pagination,    setPagination]   = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 })
  const [filter,        setFilter]       = useState<FilterState>(DEFAULT_FILTER)
  const [loading,       setLoading]      = useState(true)
  const [error,         setError]        = useState<string | null>(null)
  const [editTarget,    setEditTarget]   = useState<Transaction | null>(null)
  const [deleteTarget,  setDeleteTarget] = useState<Transaction | null>(null)
  const [deleting,      setDeleting]     = useState(false)
  const [showExport,    setShowExport]   = useState(false)
  const [showUpgrade,   setShowUpgrade]  = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const plan      = (session?.user?.plan ?? 'free') as Plan
  const canExport = PLAN_LIMITS[plan].export

  const fetchTransactions = useCallback(async (f: FilterState, page: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (f.keyword)   params.set('keyword',   f.keyword)
      if (f.type)      params.set('type',       f.type)
      if (f.startDate) params.set('startDate',  f.startDate)
      if (f.endDate)   params.set('endDate',    f.endDate)

      const res = await fetch(`/api/transactions?${params}`)
      if (res.status === 401) { setError('กรุณาเข้าสู่ระบบ'); return }
      if (!res.ok) throw new Error()

      const body = await res.json() as { data: Transaction[]; pagination: Pagination }
      setTransactions(normalize(body.data))
      setPagination(body.pagination)
    } catch {
      setError('โหลดรายการไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTransactions(filter, 1) }, [filter, fetchTransactions])

  // Re-fetch เมื่อ tab กลับมา focus (กลับจากหน้า chat หลังบันทึก)
  useEffect(() => {
    const onFocus = () => fetchTransactions(filter, 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [filter, fetchTransactions])

  // ─── Edit ────────────────────────────────────────────────────────────────
  const handleSave = async (id: string, data: Partial<Transaction>) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) throw new Error('save failed')
    await fetchTransactions(filter, pagination.page)
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/transactions/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await fetchTransactions(filter, pagination.page)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  const doExport = async (fmt: 'excel' | 'csv') => {
    setShowExport(false)
    // ดึงข้อมูลทั้งหมดของ filter ปัจจุบัน (limit=9999)
    const params = new URLSearchParams({ page: '1', limit: '9999' })
    if (filter.keyword)   params.set('keyword',   filter.keyword)
    if (filter.type)      params.set('type',       filter.type)
    if (filter.startDate) params.set('startDate',  filter.startDate)
    if (filter.endDate)   params.set('endDate',    filter.endDate)
    const res  = await fetch(`/api/transactions?${params}`)
    const body = await res.json() as { data: Transaction[] }
    const data = normalize(body.data)
    const filename = `transactions_${format(new Date(), 'yyyyMMdd')}`

    trackEvent('export_done', { format: fmt, count: data.length })
    if (fmt === 'excel') {
      exportExcel(
        data.map((t) => ({
          วันที่:     String(t.transactionDate),
          ประเภท:     t.type,
          จำนวนเงิน:  Number(t.amount),
          หมวดหมู่:   t.category?.name ?? '',
          รายละเอียด: t.description ?? '',
          วิธีชำระ:   t.paymentMethod ?? '',
        })),
        `${filename}.xlsx`
      )
    } else {
      exportCsv(
        data.map((t) => ({
          date:          String(t.transactionDate),
          type:          t.type,
          amount:        Number(t.amount),
          category:      t.category?.name ?? '',
          description:   t.description ?? '',
          paymentMethod: t.paymentMethod ?? '',
        })),
        `${filename}.csv`
      )
    }
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600 text-center">{error}</div>
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header + export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {pagination.total > 0 ? `${pagination.total} รายการ` : 'รายการทั้งหมด'}
        </h2>
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => canExport ? setShowExport((s) => !s) : setShowUpgrade(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            {canExport ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
            Export
          </button>
          {showExport && canExport && (
            <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-xl bg-white border border-gray-100 shadow-lg overflow-hidden">
              <button onClick={() => doExport('excel')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50">
                Excel (.xlsx)
              </button>
              <button onClick={() => doExport('csv')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50">
                CSV (.csv)
              </button>
            </div>
          )}
        </div>

        {/* Upgrade modal */}
        {showUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpgrade(false)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <UpgradePrompt feature="Export ข้อมูล Excel / CSV" />
              <button
                onClick={() => setShowUpgrade(false)}
                className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <TransactionFilter
        value={filter}
        onChange={(f) => { setFilter(f) }}
      />

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        pagination={pagination}
        loading={loading}
        onEdit={(tx) => setEditTarget(tx)}
        onDelete={(tx) => setDeleteTarget(tx)}
        onPageChange={(p) => fetchTransactions(filter, p)}
      />

      {/* Edit modal */}
      <TransactionForm
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="ยืนยันการลบ"
        message={`ต้องการลบรายการ "${deleteTarget?.category?.name ?? deleteTarget?.description ?? 'นี้'}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  )
}
