'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/features'
import type { Plan } from '@/lib/features'

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
  id: string; plan: Plan; months: number; amount: number; method: string; createdAt: string
  user: { id: string; name: string; email: string; plan: Plan }
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
  }, [])

  const confirmPayment = async (payment: PendingPayment) => {
    setConfirmingId(payment.id)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, { method: 'PATCH' })
      if (res.ok) {
        loadPending()
        setUsers(prev => prev.map(u =>
          u.id === payment.user.id ? { ...u, plan: payment.plan } : u
        ))
      }
    } finally {
      setConfirmingId(null)
    }
  }

  const rejectPayment = async (id: string) => {
    await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' })
    loadPending()
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
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border
                      ${PLAN_COLORS[p.plan].bg} ${PLAN_COLORS[p.plan].text} ${PLAN_COLORS[p.plan].border}`}>
                      {PLAN_LABELS[p.plan]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>฿{Number(p.amount).toLocaleString()}</span>
                  <span>·</span>
                  <span>{p.months} เดือน</span>
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
                <UserPlanEditor
                  user={u}
                  onUpdated={(updated) =>
                    setUsers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OCR Learning Data */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600">OCR Learning Data</h2>
          <a
            href="/api/ocr-corrections"
            target="_blank"
            className="text-xs text-blue-600 hover:underline"
          >
            ดูทั้งหมด (JSON)
          </a>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">
            มี <span className="font-semibold text-gray-800">{data.ocrCorrectionCount}</span> รายการที่ผู้ใช้แก้ไขข้อความ OCR
            — ใช้เป็น training data สำหรับปรับปรุง prompt ได้
          </p>
        </div>
      </section>

      {/* Recent feedback */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Feedback ล่าสุด</h2>
        <div className="space-y-3">
          {data.recentFeedback.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มี Feedback</p>
          )}
          {data.recentFeedback.map((fb) => (
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
    </div>
  )
}
