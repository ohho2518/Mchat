'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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

export default function AdminPage() {
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

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
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500 text-sm">กำลังโหลด...</div>
  if (error)   return <div className="p-8 text-center text-red-500 text-sm">{error}</div>
  if (!data)   return null

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-8">
      <h1 className="text-lg font-bold text-gray-800">Analytics (30 วันล่าสุด)</h1>

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
