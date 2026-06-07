'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/features'
import type { Plan } from '@/lib/features'

// ─── Train OCR types ──────────────────────────────────────────────────────────
interface OcrCorrectionRow {
  id: string; originalText: string; correctedText: string
  holderName: string | null; status: string
  reviewedType: string | null; reviewedCategoryId: string | null
  adminNote: string | null; createdAt: string
  user: { name: string; email: string }
}
interface GlobalCategory {
  id: string; name: string; type: string
  keywords: { id: string; keyword: string }[]
}
interface CorrectionCounts { pending: number; applied: number; reviewed: number; rejected: number }

const TYPE_OPTIONS = ['expense', 'income', 'transfer', 'debt'] as const
const TYPE_LABEL: Record<string, string> = { expense: 'รายจ่าย', income: 'รายรับ', transfer: 'โอน', debt: 'หนี้' }
const TYPE_COLOR: Record<string, string> = {
  expense: 'bg-red-100 text-red-700 border-red-300',
  income:  'bg-green-100 text-green-700 border-green-300',
  transfer:'bg-blue-100 text-blue-700 border-blue-300',
  debt:    'bg-orange-100 text-orange-700 border-orange-300',
}

function CorrectionCard({
  c, categories, actioning,
  onAction,
}: {
  c: OcrCorrectionRow
  categories: GlobalCategory[]
  actioning: string | null
  onAction: (id: string, action: 'apply'|'skip'|'reject', opts: { categoryId?: string; keyword?: string; reviewedType?: string }) => void
}) {
  const suggestedKeyword = c.holderName ?? c.correctedText.split(' ')[0] ?? ''
  const [selType, setSelType] = useState<string>('expense')
  const [selCat,  setSelCat]  = useState<string>('')
  const [keyword, setKeyword] = useState<string>(suggestedKeyword)

  const filteredCats = categories.filter(cat => cat.type === selType)
  const isBusy = actioning === c.id

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700">{c.user.name}</span>
        <span className="text-xs text-gray-400">
          {new Date(c.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' })}
        </span>
      </div>

      {/* Texts */}
      <div className="px-4 py-3 space-y-2">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">OCR อ่านได้</p>
          <p className="text-xs bg-red-50 text-red-800 rounded-lg px-3 py-2 font-mono break-all">{c.originalText}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">User แก้เป็น</p>
          <p className="text-xs bg-green-50 text-green-800 rounded-lg px-3 py-2 font-mono break-all">{c.correctedText}</p>
        </div>
        {c.holderName && (
          <p className="text-xs text-gray-500">คู่ค้า: <span className="font-medium text-gray-700">{c.holderName}</span></p>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
        {/* Type */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => { setSelType(t); setSelCat('') }}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selType === t ? TYPE_COLOR[t] : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex gap-2">
          <select
            value={selCat}
            onChange={e => setSelCat(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white"
          >
            <option value="">— เลือกหมวดหมู่ ({filteredCats.length} หมวด) —</option>
            {filteredCats.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.keywords.length} keywords)
              </option>
            ))}
          </select>
        </div>

        {/* Keyword */}
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Keyword ที่จะเพิ่มในหมวดหมู่"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
          />
          {selCat && (
            <span className="text-xs text-gray-400 self-center shrink-0">
              → {categories.find(c2 => c2.id === selCat)?.name}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onAction(c.id, 'apply', { categoryId: selCat || undefined, keyword: keyword.trim() || undefined, reviewedType: selType })}
            disabled={isBusy || !selCat}
            className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isBusy ? '...' : '✓ Apply'}
          </button>
          <button
            onClick={() => onAction(c.id, 'skip', {})}
            disabled={isBusy}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Skip
          </button>
          <button
            onClick={() => onAction(c.id, 'reject', {})}
            disabled={isBusy}
            className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function TrainOcrSection() {
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [status,      setStatus]      = useState('pending')
  const [corrections, setCorrections] = useState<OcrCorrectionRow[]>([])
  const [categories,  setCategories]  = useState<GlobalCategory[]>([])
  const [counts,      setCounts]      = useState<CorrectionCounts>({ pending: 0, applied: 0, reviewed: 0, rejected: 0 })
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [actioning,   setActioning]   = useState<string | null>(null)

  const load = async (s: string, p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ocr-corrections?status=${s}&page=${p}`)
      if (!res.ok) return
      const data = await res.json()
      setCorrections(data.data)
      setCategories(data.globalCategories)
      setCounts(data.counts)
      setPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => { setOpen(true); load('pending', 1) }

  const handleStatus = (s: string) => { setStatus(s); setPage(1); load(s, 1) }

  const handleAction = async (
    id: string,
    action: 'apply'|'skip'|'reject',
    opts: { categoryId?: string; keyword?: string; reviewedType?: string }
  ) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/admin/ocr-corrections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...opts }),
      })
      if (res.ok) {
        setCorrections(prev => prev.filter(c => c.id !== id))
        setCounts(prev => {
          const next = { ...prev }
          next[status as keyof CorrectionCounts] = Math.max(0, next[status as keyof CorrectionCounts] - 1)
          const dest = action === 'apply' ? 'applied' : action === 'skip' ? 'reviewed' : 'rejected'
          next[dest as keyof CorrectionCounts] += 1
          return next
        })
      }
    } finally {
      setActioning(null) }
  }

  const TABS: Array<{ key: string; label: string; color: string }> = [
    { key: 'pending',  label: 'รอ Review', color: 'bg-amber-500' },
    { key: 'applied',  label: 'Applied',   color: 'bg-green-600' },
    { key: 'reviewed', label: 'Reviewed',  color: 'bg-blue-500' },
    { key: 'rejected', label: 'Rejected',  color: 'bg-gray-400' },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-600">Train OCR</h2>
          {counts.pending > 0 && (
            <span className="inline-flex items-center justify-center h-5 px-1.5 min-w-5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {counts.pending}
            </span>
          )}
        </div>
        {!open && (
          <button
            onClick={handleOpen}
            className="text-xs text-blue-600 hover:underline"
          >
            เปิด
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3">
          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleStatus(tab.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  status === tab.key
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-white text-xs ${tab.color}`}>
                  {counts[tab.key as keyof CorrectionCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">กำลังโหลด...</p>
          ) : corrections.length === 0 ? (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
              <p className="text-sm text-gray-400">ไม่มีรายการ {status === 'pending' ? 'รอ review' : status}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {corrections.map(c => (
                <CorrectionCard
                  key={c.id}
                  c={c}
                  categories={categories}
                  actioning={actioning}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={page <= 1 || loading}
                onClick={() => { setPage(p => p - 1); load(status, page - 1) }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => { setPage(p => p + 1); load(status, page + 1) }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

interface EventCount  { event: string; count: number }
interface DailyEvent  { day: string;   count: number }
interface TopUser     { user: string;  count: number }
interface FeedbackRow {
  id: string; rating: number | null; category: string; message: string; createdAt: string
  user: { name: string; email: string }
}
interface Analytics {
  eventCounts:        EventCount[]
  dailyEvents:        DailyEvent[]
  topUsers:           TopUser[]
  recentFeedback:     FeedbackRow[]
  ocrCorrectionCount: number
}
interface AdminUser {
  id: string; name: string; email: string
  plan: Plan; planExpiresAt: string | null; createdAt: string
  _count: { transactions: number }
}
interface PendingPayment {
  id: string; plan: Plan | null; months: number; credits: number | null; amount: number; method: string; createdAt: string
  user: { id: string; name: string; email: string; plan: Plan }
}
interface AdminCommission {
  id: string; planCode: string; amount: number; status: string
  holdUntil: string; createdAt: string
  referrer: { name: string; email: string }
  referral: { referred: { name: string; email: string } }
}
interface AdminPayout {
  id: string; amount: number; paymentMethod: string
  accountName: string; promptpayNumber: string | null; accountNumber: string | null
  status: string; adminNote: string | null; createdAt: string
  user: { name: string; email: string }
}

const EVENT_LABELS: Record<string, string> = {
  transaction_saved:    'บันทึกรายการ',
  transaction_rejected: 'ปฏิเสธรายการ',
  voice_used:           'ใช้ Voice',
  ocr_used:             'ใช้ OCR',
  export_done:          'Export',
  page_view:            'Page View',
}

const CATEGORY_LABEL: Record<string, string> = {
  bug: 'บัค', feature: 'ฟีเจอร์', general: 'ทั่วไป',
}

function CreditGranter({ userId }: { userId: string }) {
  const [open,    setOpen]    = useState(false)
  const [amount,  setAmount]  = useState(100)
  const [loading, setLoading] = useState(false)

  const grant = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credits: amount }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      alert(`เติมเครดิตสำเร็จ — คงเหลือ ${data.ocrCredits} ครั้ง`)
      setOpen(false)
    } catch {
      alert('เติมเครดิตไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-purple-600 hover:underline">
        เติมเครดิต OCR
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 shrink-0">จำนวน</label>
            <select
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              {[50, 100, 200, 300, 500].map(n => (
                <option key={n} value={n}>{n} ครั้ง</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={grant}
              disabled={loading}
              className="flex-1 rounded-lg bg-purple-600 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '...' : 'เติมเครดิต'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-600"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserPlanEditor({ user, onUpdated }: { user: AdminUser; onUpdated: (u: AdminUser) => void }) {
  const [open,    setOpen]    = useState(false)
  const [plan,    setPlan]    = useState<Plan>(user.plan)
  const [months,  setMonths]  = useState(1)
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/plan`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, months, amount: 0, method: 'manual', note }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json() as AdminUser
      onUpdated(updated)
      setOpen(false)
    } catch {
      alert('อัปเดต plan ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-blue-600 hover:underline"
      >
        เปลี่ยน Plan
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
          <div className="flex gap-2">
            {(['free', 'pro', 'max'] as Plan[]).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`flex-1 rounded-lg py-1 text-xs font-semibold border transition-colors ${
                  plan === p
                    ? `${PLAN_COLORS[p].bg} ${PLAN_COLORS[p].text} ${PLAN_COLORS[p].border}`
                    : 'text-gray-500 border-gray-200'
                }`}
              >
                {PLAN_LABELS[p]}
              </button>
            ))}
          </div>
          {plan !== 'free' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 shrink-0">ระยะเวลา</label>
              <select
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
              >
                {[1,2,3,6,12].map(m => (
                  <option key={m} value={m}>{m} เดือน</option>
                ))}
              </select>
            </div>
          )}
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="หมายเหตุ (เช่น โอน PromptPay)"
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'บันทึก'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-600"
            >
              ยกเลิก
            </button>
          </div>
          <p className="text-xs text-amber-600">* ผู้ใช้ต้อง sign-out/sign-in ใหม่เพื่อให้ plan มีผล</p>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [users,           setUsers]           = useState<AdminUser[]>([])
  const [usersLoading,    setUsersLoading]    = useState(true)
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [confirmingId,    setConfirmingId]    = useState<string | null>(null)
  const [commissions,     setCommissions]     = useState<AdminCommission[]>([])
  const [payoutRequests,  setPayoutRequests]  = useState<AdminPayout[]>([])
  const [actioningId,     setActioningId]     = useState<string | null>(null)
  const [terms,           setTerms]           = useState<any>(null)
  const [termsLoading,    setTermsLoading]    = useState(false)
  const [termsSaved,      setTermsSaved]      = useState(false)

  const loadPending = () => {
    fetch('/api/admin/payments')
      .then(r => r.ok ? r.json() : [])
      .then(setPendingPayments)
      .catch(() => {})
  }

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async (r) => {
        if (r.status === 403) throw new Error('ไม่มีสิทธิ์เข้าถึงหน้านี้')
        if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        return r.json() as Promise<Analytics>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

    fetch('/api/admin/users')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setUsersLoading(false))

    loadPending()

    fetch('/api/admin/referral/commissions').then(r => r.ok ? r.json() : []).then(setCommissions).catch(() => {})
    fetch('/api/admin/referral/payouts').then(r => r.ok ? r.json() : []).then(setPayoutRequests).catch(() => {})
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : null).then(setTerms).catch(() => {})
  }, [])

  const confirmPayment = async (payment: PendingPayment) => {
    setConfirmingId(payment.id)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, { method: 'PATCH' })
      if (res.ok) {
        loadPending()
        if (!payment.credits && payment.plan) {
          setUsers(prev => prev.map(u =>
            u.id === payment.user.id ? { ...u, plan: payment.plan! } : u
          ))
        }
      }
    } finally {
      setConfirmingId(null)
    }
  }

  const rejectPayment = async (id: string) => {
    await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' })
    loadPending()
  }

  const approveCommission = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/referral/commissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
      } else {
        const d = await res.json()
        alert(d.error ?? 'ไม่สำเร็จ')
      }
    } finally { setActioningId(null) }
  }

  const cancelCommission = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/referral/commissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'canceled' } : c))
    } finally { setActioningId(null) }
  }

  const payPayout = async (id: string) => {
    const note = prompt('หมายเหตุ (เช่น โอน PromptPay แล้ว)')
    if (note === null) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/referral/payouts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', adminNote: note }),
      })
      if (res.ok) setPayoutRequests(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', adminNote: note } : p))
    } finally { setActioningId(null) }
  }

  const rejectPayout = async (id: string) => {
    const note = prompt('เหตุผลที่ปฏิเสธ')
    if (note === null) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/referral/payouts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminNote: note }),
      })
      if (res.ok) setPayoutRequests(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', adminNote: note } : p))
    } finally { setActioningId(null) }
  }

  const saveTerms = async () => {
    if (!terms) return
    setTermsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(terms),
      })
      if (res.ok) { setTermsSaved(true); setTimeout(() => setTermsSaved(false), 2000) }
    } finally { setTermsLoading(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500 text-sm">กำลังโหลด...</div>
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>
  if (!data)   return null

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-8">
      <h1 className="text-lg font-bold text-gray-800">Analytics (30 วันล่าสุด)</h1>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-600">แจ้งชำระที่รอยืนยัน</h2>
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingPayments.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingPayments.map((p) => (
              <div key={p.id} className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.user.name}</p>
                    <p className="text-xs text-gray-500">{p.user.email}</p>
                  </div>
                  <div className="text-right">
                    {p.credits ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200">
                        เครดิต {p.credits} ครั้ง
                      </span>
                    ) : p.plan ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border
                        ${PLAN_COLORS[p.plan].bg} ${PLAN_COLORS[p.plan].text} ${PLAN_COLORS[p.plan].border}`}>
                        {PLAN_LABELS[p.plan]}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>฿{Number(p.amount).toLocaleString()}</span>
                  <span>·</span>
                  {p.credits ? <span>เครดิต OCR</span> : <span>{p.months} เดือน</span>}
                  <span>·</span>
                  <span>{p.method === 'promptpay' ? 'PromptPay' : 'Manual'}</span>
                  <span className="ml-auto text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmPayment(p)}
                    disabled={confirmingId === p.id}
                    className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {confirmingId === p.id ? '...' : '✓ ยืนยัน'}
                  </button>
                  <button
                    onClick={() => rejectPayment(p.id)}
                    className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    ✗ ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Event counts */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">การใช้งานตามประเภท</h2>
        <div className="grid grid-cols-2 gap-3">
          {data.eventCounts.map((e) => (
            <div key={e.event} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500">{EVENT_LABELS[e.event] ?? e.event}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{e.count.toLocaleString()}</p>
            </div>
          ))}
          <div className="rounded-xl bg-amber-50 border border-amber-100 shadow-sm p-4">
            <p className="text-xs text-amber-600">OCR แก้ไขแล้ว</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{data.ocrCorrectionCount.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Daily chart */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Events รายวัน (7 วัน)</h2>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data.dailyEvents].reverse()}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v} events`]} labelFormatter={(l) => l} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top users */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">ผู้ใช้งานบ่อยที่สุด</h2>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
          {data.topUsers.map((u, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700 truncate max-w-[70%]">{u.user}</span>
              <span className="text-sm font-semibold text-blue-600">{u.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* User Plan Management */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">จัดการ Plan ผู้ใช้</h2>
        {usersLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">กำลังโหลด...</p>
        ) : (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border
                    ${PLAN_COLORS[u.plan].bg} ${PLAN_COLORS[u.plan].text} ${PLAN_COLORS[u.plan].border}`}>
                    {PLAN_LABELS[u.plan]}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{u._count.transactions} รายการ</span>
                </div>
                {u.planExpiresAt && (
                  <p className="text-xs text-gray-400">
                    หมดอายุ: {new Date(u.planExpiresAt).toLocaleDateString('th-TH')}
                  </p>
                )}
                <div className="flex gap-4">
                  <UserPlanEditor
                    user={u}
                    onUpdated={(updated) =>
                      setUsers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
                    }
                  />
                  <CreditGranter userId={u.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Train OCR */}
      <TrainOcrSection />

      {/* Recent feedback */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Feedback ล่าสุด</h2>
        <div className="space-y-3">
          {data.recentFeedback.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มี Feedback</p>
          )}
          {(data.recentFeedback ?? []).map((fb) => (
            <div key={fb.id} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  fb.category === 'bug'     ? 'bg-red-100 text-red-600' :
                  fb.category === 'feature' ? 'bg-blue-100 text-blue-600' :
                                              'bg-gray-100 text-gray-600'
                }`}>
                  {CATEGORY_LABEL[fb.category]}
                </span>
                {fb.rating && (
                  <span className="text-xs text-yellow-500">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(fb.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{fb.message}</p>
              <p className="text-xs text-gray-400 mt-1">{fb.user.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Commissions ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          คอมมิชชัน
          {commissions.filter(c => c.status === 'pending').length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {commissions.filter(c => c.status === 'pending').length} รอ
            </span>
          )}
        </h2>
        {commissions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีคอมมิชชัน</p>
        ) : (
          <div className="space-y-2">
            {commissions.map(c => {
              const holdPassed = new Date() >= new Date(c.holdUntil)
              const statusColor = c.status === 'pending' ? 'text-amber-600' : c.status === 'approved' ? 'text-green-600' : 'text-gray-400'
              return (
                <div key={c.id} className="rounded-xl bg-white border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">฿{Number(c.amount).toLocaleString()} <span className="font-normal text-gray-400 text-xs">· {c.planCode}</span></p>
                      <p className="text-xs text-gray-500 truncate">{c.referrer.name} → {c.referral.referred.name}</p>
                      <p className={`text-xs mt-0.5 ${statusColor}`}>
                        {c.status === 'pending' ? `Hold ถึง ${new Date(c.holdUntil).toLocaleDateString('th-TH')}${holdPassed ? ' ✓ พร้อม' : ''}` : c.status}
                      </p>
                    </div>
                    {c.status === 'pending' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => approveCommission(c.id)}
                          disabled={actioningId === c.id || !holdPassed}
                          title={!holdPassed ? 'Hold period ยังไม่ครบ' : ''}
                          className="rounded-lg bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-40"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => cancelCommission(c.id)}
                          disabled={actioningId === c.id}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Referral Terms Editor ───────────────────────── */}
      {terms && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">เงื่อนไข Referral (แสดงบน Landing Page)</h2>
          <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-4">
            {/* Commission rows */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">อัตราค่าแนะนำ (฿)</p>
              <div className="space-y-2">
                {(terms.commissions as any[]).map((c: any, i: number) => (
                  <div key={c.code} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-32 shrink-0">{c.plan}</span>
                    <input
                      type="number" min={0} value={c.amount}
                      onChange={e => {
                        const next = [...terms.commissions]
                        next[i] = { ...c, amount: Number(e.target.value) }
                        setTerms({ ...terms, commissions: next })
                      }}
                      className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500">Hold (วัน)</label>
                <input type="number" min={1} value={terms.holdDays}
                  onChange={e => setTerms({ ...terms, holdDays: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">ถอนขั้นต่ำ (฿)</label>
                <input type="number" min={1} value={terms.minPayout}
                  onChange={e => setTerms({ ...terms, minPayout: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">วันจ่าย (วันที่)</label>
                <input type="number" min={1} max={28} value={terms.payoutDay}
                  onChange={e => setTerms({ ...terms, payoutDay: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                />
              </div>
            </div>

            {/* Extra note */}
            <div>
              <label className="text-xs text-gray-500">หมายเหตุเพิ่มเติม (แสดงท้าย)</label>
              <textarea
                rows={2} value={terms.extraNote ?? ''}
                onChange={e => setTerms({ ...terms, extraNote: e.target.value })}
                placeholder="เช่น บริษัทขอสงวนสิทธิ์..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>

            <button
              onClick={saveTerms} disabled={termsLoading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
                termsSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {termsSaved ? '✓ บันทึกแล้ว' : termsLoading ? 'กำลังบันทึก...' : 'บันทึกเงื่อนไข'}
            </button>
          </div>
        </section>
      )}

      {/* ── Payout Requests ─────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          คำขอถอนเงิน
          {payoutRequests.filter(p => p.status === 'requested').length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
              {payoutRequests.filter(p => p.status === 'requested').length} ใหม่
            </span>
          )}
        </h2>
        {payoutRequests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีคำขอถอน</p>
        ) : (
          <div className="space-y-2">
            {payoutRequests.map(p => (
              <div key={p.id} className={`rounded-xl border p-3 ${p.status === 'requested' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">฿{Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{p.user.name} · {p.user.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.accountName} · {p.paymentMethod === 'promptpay' ? `PromptPay ${p.promptpayNumber ?? ''}` : `บัญชี ${p.accountNumber ?? ''}`}
                    </p>
                    {p.adminNote && <p className="text-xs text-gray-400 mt-0.5">หมายเหตุ: {p.adminNote}</p>}
                  </div>
                  {['requested', 'processing'].includes(p.status) && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => payPayout(p.id)}
                        disabled={actioningId === p.id}
                        className="rounded-lg bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-40"
                      >
                        โอนแล้ว
                      </button>
                      <button
                        onClick={() => rejectPayout(p.id)}
                        disabled={actioningId === p.id}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  )}
                  {!['requested', 'processing'].includes(p.status) && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${p.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status === 'paid' ? 'โอนแล้ว' : 'ปฏิเสธ'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
