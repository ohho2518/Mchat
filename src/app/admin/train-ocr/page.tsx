'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, ImageIcon, Loader2, FlaskConical, ClipboardList, BookOpen, Trash2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobalCategory { id: string; name: string; type: string; keywords: { id: string; keyword: string }[] }
interface OcrCorrectionRow {
  id: string; originalText: string; correctedText: string
  holderName: string | null; status: string; createdAt: string
  user: { name: string; email: string }
}
interface Counts { pending: number; applied: number; reviewed: number; rejected: number }
interface MerchantRow {
  id: string; name: string; type: string; sourceCount: number
  category: { id: string; name: string; type: string } | null
}

const TYPE_OPTIONS = ['expense', 'income', 'transfer', 'debt'] as const
const TYPE_LABEL: Record<string, string> = { expense: 'รายจ่าย', income: 'รายรับ', transfer: 'โอน', debt: 'หนี้' }
const TYPE_COLOR: Record<string, string> = {
  expense:  'bg-red-100 text-red-700 border-red-300',
  income:   'bg-green-100 text-green-700 border-green-300',
  transfer: 'bg-blue-100 text-blue-700 border-blue-300',
  debt:     'bg-orange-100 text-orange-700 border-orange-300',
}

// ─── Image resize helper ───────────────────────────────────────────────────────
function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
      URL.revokeObjectURL(url)
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Correction Card ──────────────────────────────────────────────────────────
function CorrectionCard({
  c, categories, actioning,
  onAction,
}: {
  c: OcrCorrectionRow
  categories: GlobalCategory[]
  actioning: string | null
  onAction: (id: string, action: 'apply'|'skip'|'reject', opts: { categoryId?: string; keyword?: string; reviewedType?: string }) => void
}) {
  const suggested = c.holderName ?? c.correctedText.split(' ')[0] ?? ''
  const [selType, setSelType] = useState('expense')
  const [selCat,  setSelCat]  = useState('')
  const [keyword, setKeyword] = useState(suggested)
  const filteredCats = categories.filter(cat => cat.type === selType)
  const isBusy = actioning === c.id

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700">{c.user.name}</span>
        <span className="text-xs text-gray-400">
          {new Date(c.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
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
      <div className="px-4 pb-4 space-y-2.5 border-t border-gray-100 pt-3">
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map(t => (
            <button key={t} onClick={() => { setSelType(t); setSelCat('') }}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${selType === t ? TYPE_COLOR[t] : 'border-gray-200 text-gray-500'}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <select value={selCat} onChange={e => setSelCat(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white">
          <option value="">— เลือกหมวดหมู่ ({filteredCats.length}) —</option>
          {filteredCats.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name} ({cat.keywords.length} kw)</option>
          ))}
        </select>
        <div className="flex gap-2 items-center">
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="Keyword ที่จะเพิ่ม"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs" />
          {selCat && <span className="text-xs text-gray-400 shrink-0">→ {categories.find(x => x.id === selCat)?.name}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAction(c.id, 'apply', { categoryId: selCat || undefined, keyword: keyword.trim() || undefined, reviewedType: selType })}
            disabled={isBusy || !selCat}
            className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            {isBusy ? '...' : '✓ Apply'}
          </button>
          <button onClick={() => onAction(c.id, 'skip', {})} disabled={isBusy}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40">Skip</button>
          <button onClick={() => onAction(c.id, 'reject', {})} disabled={isBusy}
            className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 disabled:opacity-40">Reject</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTrainOcrPage() {
  const [tab, setTab] = useState<'test' | 'review' | 'library'>('test')

  // ── Auth check ──────────────────────────────────────────────────────────────
  const [authErr, setAuthErr] = useState<string | null>(null)
  const [categories,  setCategories]  = useState<GlobalCategory[]>([])
  const [counts,      setCounts]      = useState<Counts>({ pending: 0, applied: 0, reviewed: 0, rejected: 0 })
  const [corrections, setCorrections] = useState<OcrCorrectionRow[]>([])
  const [reviewStatus,setReviewStatus]= useState('pending')
  const [reviewPage,  setReviewPage]  = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError,   setReviewError]   = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  // ── Merchant Library state ──────────────────────────────────────────────────
  const [merchants,      setMerchants]      = useState<MerchantRow[]>([])
  const [merchantTotal,  setMerchantTotal]  = useState(0)
  const [merchantPage,   setMerchantPage]   = useState(1)
  const [merchantPages,  setMerchantPages]  = useState(1)
  const [merchantQ,      setMerchantQ]      = useState('')
  const [merchantLoading,setMerchantLoading]= useState(false)
  const [deleting,       setDeleting]       = useState<string | null>(null)

  // ── OCR Test state ───────────────────────────────────────────────────────────
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [ocrLoading,    setOcrLoading]    = useState(false)
  const [ocrOriginal,   setOcrOriginal]   = useState('')
  const [ocrCorrected,  setOcrCorrected]  = useState('')
  const [ocrHolder,     setOcrHolder]     = useState('')
  const [ocrError,      setOcrError]      = useState<string | null>(null)
  const [saveLoading,   setSaveLoading]   = useState(false)
  const [saveSuccess,   setSaveSuccess]   = useState(false)
  const [testType,      setTestType]      = useState('expense')
  const [testCatId,     setTestCatId]     = useState('')
  const [testKeyword,   setTestKeyword]   = useState('')

  // ── Load initial data ────────────────────────────────────────────────────────
  useEffect(() => {
    loadReview('pending', 1)
  }, [])

  const loadMerchants = async (q: string, p: number) => {
    setMerchantLoading(true)
    try {
      const res  = await fetch(`/api/admin/merchant-profiles?q=${encodeURIComponent(q)}&page=${p}`)
      if (res.status === 403) { setAuthErr('ไม่มีสิทธิ์เข้าถึงหน้านี้'); return }
      if (!res.ok) return
      const data = await res.json()
      setMerchants(data.data)
      setMerchantTotal(data.pagination.total)
      setMerchantPage(data.pagination.page)
      setMerchantPages(data.pagination.totalPages)
    } finally { setMerchantLoading(false) }
  }

  useEffect(() => { if (tab === 'library') loadMerchants(merchantQ, 1) }, [tab])

  const handleDeleteMerchant = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/merchant-profiles/${id}`, { method: 'DELETE' })
      if (res.ok) setMerchants(prev => prev.filter(m => m.id !== id))
    } finally { setDeleting(null) }
  }

  const loadReview = async (s: string, p: number) => {
    setReviewLoading(true)
    setReviewError(null)
    try {
      const res = await fetch(`/api/admin/ocr-corrections?status=${s}&page=${p}`)
      if (res.status === 403) { setAuthErr('ไม่มีสิทธิ์เข้าถึงหน้านี้'); return }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setReviewError(`โหลดไม่สำเร็จ HTTP ${res.status}: ${(err as any).error ?? ''}`)
        return
      }
      const data = await res.json()
      setCorrections(data.data)
      setCategories(data.globalCategories)
      setCounts(data.counts)
      setReviewPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
    } catch (e) {
      setReviewError(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setReviewLoading(false)
    }
  }

  // ── OCR upload ───────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { setOcrError('ไฟล์ใหญ่เกิน 20MB'); return }
    setOcrLoading(true); setOcrError(null); setOcrOriginal(''); setOcrCorrected(''); setOcrHolder(''); setSaveSuccess(false)
    try {
      const { base64, mimeType } = await resizeImage(file)
      const res  = await fetch('/api/parser/ocr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) { setOcrError(data.error ?? 'OCR ล้มเหลว'); return }
      setOcrOriginal(data.text ?? '')
      setOcrCorrected(data.text ?? '')
      setOcrHolder(data.holderName ?? '')
      setTestKeyword(data.holderName ?? '')
    } catch {
      setOcrError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setOcrLoading(false)
      if (fileRef.current)   fileRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const handleSaveCorrection = async () => {
    if (!ocrOriginal || !ocrCorrected) return
    setSaveLoading(true)
    try {
      const res = await fetch('/api/admin/ocr-corrections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ originalText: ocrOriginal, correctedText: ocrCorrected, holderName: ocrHolder || undefined }),
      })
      if (!res.ok) { setOcrError('บันทึกไม่สำเร็จ'); return }

      // If admin also wants to immediately apply a keyword, call PATCH
      const saved = await res.json()
      if (testCatId && testKeyword.trim()) {
        await fetch(`/api/admin/ocr-corrections/${saved.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'apply', categoryId: testCatId, keyword: testKeyword.trim(), reviewedType: testType }),
        })
        setCounts(prev => ({ ...prev, applied: prev.applied + 1 }))
      } else {
        setCounts(prev => ({ ...prev, pending: prev.pending + 1 }))
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaveLoading(false)
    }
  }

  // ── Review actions ───────────────────────────────────────────────────────────
  const handleAction = async (
    id: string,
    action: 'apply'|'skip'|'reject',
    opts: { categoryId?: string; keyword?: string; reviewedType?: string }
  ) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/admin/ocr-corrections/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, ...opts }),
      })
      if (res.ok) {
        setCorrections(prev => prev.filter(c => c.id !== id))
        setCounts(prev => {
          const next = { ...prev }
          next[reviewStatus as keyof Counts] = Math.max(0, next[reviewStatus as keyof Counts] - 1)
          const dest = action === 'apply' ? 'applied' : action === 'skip' ? 'reviewed' : 'rejected'
          next[dest as keyof Counts] += 1
          return next
        })
      }
    } finally { setActioning(null) }
  }

  const handleStatusChange = (s: string) => { setReviewStatus(s); setReviewPage(1); loadReview(s, 1) }

  // ── Auth error ───────────────────────────────────────────────────────────────
  if (authErr) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-red-600">{authErr}</p>
        <Link href="/admin" className="text-xs text-blue-600 hover:underline">← กลับ Admin</Link>
      </div>
    )
  }

  const testFilteredCats = categories.filter(c => c.type === testType)

  const TABS: Array<{ key: 'test'|'review'|'library'; icon: React.ReactNode; label: string; badge?: number }> = [
    { key: 'test',    icon: <FlaskConical className="h-4 w-4" />,  label: 'ทดสอบ OCR' },
    { key: 'review',  icon: <ClipboardList className="h-4 w-4" />, label: 'Review', badge: counts.pending },
    { key: 'library', icon: <BookOpen className="h-4 w-4" />,      label: 'คลัง', badge: merchantTotal > 0 ? merchantTotal : undefined },
  ]

  return (
    <div className="max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-gray-800 text-sm">Train OCR</h1>
          <span className="text-xs text-gray-400 ml-auto">Admin only</span>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 px-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.icon}
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-xs">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Tab: ทดสอบ OCR ──────────────────────────────────────────────────── */}
        {tab === 'test' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              อัปโหลดรูปสลิป/ใบเสร็จ → ดูผล OCR → แก้ไขและ Label → บันทึกเป็น Training Data
            </p>

            {/* Upload area */}
            <input ref={fileRef}   type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} disabled={ocrLoading}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-6 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-colors">
                {ocrLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                <span className="text-xs font-medium">ถ่ายรูป</span>
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={ocrLoading}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-6 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-colors">
                {ocrLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                <span className="text-xs font-medium">เลือกจากคลัง</span>
              </button>
            </div>

            {ocrError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {ocrError}
              </div>
            )}

            {/* OCR result */}
            {ocrOriginal && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">OCR อ่านได้ (ต้นฉบับ)</label>
                  <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-sm font-mono text-red-800 break-all">
                    {ocrOriginal}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">แก้ไขเป็น (Corrected)</label>
                  <textarea
                    value={ocrCorrected}
                    onChange={e => setOcrCorrected(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อคู่ค้า (holderName)</label>
                  <input
                    value={ocrHolder}
                    onChange={e => setOcrHolder(e.target.value)}
                    placeholder="เช่น ร้านนาเดียร์แอ็ค, สมชาย ใจดี"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 outline-none"
                  />
                </div>

                {/* Label & apply keyword */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-700">Label + เพิ่ม Keyword (ไม่บังคับ)</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TYPE_OPTIONS.map(t => (
                      <button key={t} onClick={() => { setTestType(t); setTestCatId('') }}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${testType === t ? TYPE_COLOR[t] : 'border-gray-200 text-gray-500'}`}>
                        {TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                  <select value={testCatId} onChange={e => setTestCatId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white">
                    <option value="">— เลือกหมวดหมู่ (ไม่บังคับ) —</option>
                    {testFilteredCats.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.keywords.length} kw)</option>
                    ))}
                  </select>
                  {testCatId && (
                    <input value={testKeyword} onChange={e => setTestKeyword(e.target.value)}
                      placeholder="Keyword ที่จะเพิ่มในหมวดหมู่"
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs" />
                  )}
                </div>

                <button
                  onClick={handleSaveCorrection}
                  disabled={saveLoading || !ocrCorrected.trim()}
                  className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    saveSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> :
                   saveSuccess ? '✓ บันทึกแล้ว' :
                   testCatId && testKeyword ? 'บันทึก + Apply Keyword' : 'บันทึกเป็น Training Data'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Review ─────────────────────────────────────────────────────── */}
        {tab === 'review' && (
          <div className="space-y-3">
            {/* Status tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'pending',  label: 'รอ Review', color: 'bg-amber-500' },
                { key: 'applied',  label: 'Applied',   color: 'bg-green-600' },
                { key: 'reviewed', label: 'Reviewed',  color: 'bg-blue-500' },
                { key: 'rejected', label: 'Rejected',  color: 'bg-gray-400' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => handleStatusChange(t.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    reviewStatus === t.key ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {t.label}
                  <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-white text-xs ${t.color}`}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>

            {reviewError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {reviewError}
                <button onClick={() => loadReview(reviewStatus, reviewPage)} className="ml-2 text-xs underline">ลองใหม่</button>
              </div>
            )}

            {reviewLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : corrections.length === 0 && !reviewError ? (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center space-y-2">
                <p className="text-sm text-gray-500">ไม่มีรายการ {reviewStatus === 'pending' ? 'รอ review' : reviewStatus}</p>
                {reviewStatus === 'pending' && (
                  <p className="text-xs text-gray-400">
                    ข้อมูลจะปรากฏเมื่อผู้ใช้เปิด consent ใน Settings แล้วแก้ไขผล OCR
                    หรืออัปโหลดรูปจากแท็บ "ทดสอบ OCR" แล้วบันทึก
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {corrections.map(c => (
                  <CorrectionCard key={c.id} c={c} categories={categories} actioning={actioning} onAction={handleAction} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button disabled={reviewPage <= 1 || reviewLoading}
                  onClick={() => { setReviewPage(p => p - 1); loadReview(reviewStatus, reviewPage - 1) }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40">← ก่อนหน้า</button>
                <span className="text-xs text-gray-500">{reviewPage} / {totalPages}</span>
                <button disabled={reviewPage >= totalPages || reviewLoading}
                  onClick={() => { setReviewPage(p => p + 1); loadReview(reviewStatus, reviewPage + 1) }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40">ถัดไป →</button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Merchant Library ──────────────────────────────────────────── */}
        {tab === 'library' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              ร้านค้า/บุคคลที่ระบบเรียนรู้แล้ว — OCR จะใช้ข้อมูลนี้ตัดสินใจ type ให้ถูกต้องอัตโนมัติ
            </p>

            {/* Search */}
            <div className="flex gap-2">
              <input
                value={merchantQ}
                onChange={e => setMerchantQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setMerchantPage(1); loadMerchants(merchantQ, 1) } }}
                placeholder="ค้นหาชื่อร้านค้า..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
              <button onClick={() => { setMerchantPage(1); loadMerchants(merchantQ, 1) }}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                ค้นหา
              </button>
            </div>

            {merchantLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : merchants.length === 0 ? (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center space-y-2">
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูลในคลัง</p>
                <p className="text-xs text-gray-400">กด Apply ใน Review เพื่อเพิ่มร้านค้าเข้าคลัง</p>
              </div>
            ) : (
              <div className="space-y-2">
                {merchants.map(m => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOR[m.type]}`}>
                          {TYPE_LABEL[m.type]}
                        </span>
                        {m.category && (
                          <span className="text-xs text-gray-400">{m.category.name}</span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{m.sourceCount}x</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMerchant(m.id)}
                      disabled={deleting === m.id}
                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 p-1"
                    >
                      {deleting === m.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}

            {merchantPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button disabled={merchantPage <= 1 || merchantLoading}
                  onClick={() => { setMerchantPage(p => p - 1); loadMerchants(merchantQ, merchantPage - 1) }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40">← ก่อนหน้า</button>
                <span className="text-xs text-gray-500">{merchantPage} / {merchantPages}</span>
                <button disabled={merchantPage >= merchantPages || merchantLoading}
                  onClick={() => { setMerchantPage(p => p + 1); loadMerchants(merchantQ, merchantPage + 1) }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40">ถัดไป →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
