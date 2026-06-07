'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Download, Trash2, ChevronLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface ConsentRecord {
  type:     string
  version:  string
  agreedAt: string
}

const CONSENT_LABELS: Record<string, string> = {
  privacy_policy: 'นโยบายความเป็นส่วนตัว',
  terms:          'เงื่อนไขการใช้งาน',
  ocr_improvement: 'ช่วยพัฒนาระบบ OCR',
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [ocrConsent, setOcrConsent] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/consent')
      .then(r => r.json())
      .then((data: ConsentRecord[]) => {
        setConsents(data)
        setOcrConsent(data.some(c => c.type === 'ocr_improvement'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleOcrConsent = async (agreed: boolean) => {
    setConsentLoading(true)
    try {
      await fetch('/api/user/consent', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'ocr_improvement', agreed }),
      })
      setOcrConsent(agreed)
      if (agreed) {
        setConsents(prev => [
          ...prev.filter(c => c.type !== 'ocr_improvement'),
          { type: 'ocr_improvement', version: '2026-06', agreedAt: new Date().toISOString() },
        ])
      } else {
        setConsents(prev => prev.filter(c => c.type !== 'ocr_improvement'))
      }
    } finally {
      setConsentLoading(false)
    }
  }

  const handleExport = (format: 'json' | 'csv') => {
    window.location.href = `/api/user/export?format=${format}`
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">ความเป็นส่วนตัว</h1>
      </div>

      {/* Consent toggle */}
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">การยินยอม</p>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">ช่วยพัฒนาระบบ OCR</p>
              <p className="text-xs text-gray-500 mt-0.5">
                ยินยอมให้แชร์ข้อมูลการแก้ไขสลิปเพื่อปรับปรุงความแม่นยำ
              </p>
            </div>
          </div>
          <button
            disabled={consentLoading || loading}
            onClick={() => toggleOcrConsent(!ocrConsent)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
              ${ocrConsent ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-50`}
            role="switch"
            aria-checked={ocrConsent}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
              ${ocrConsent ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </Card>

      {/* Consent history */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ประวัติการยินยอม</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        ) : consents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">ไม่มีข้อมูล</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {consents.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-gray-700">{CONSENT_LABELS[c.type] ?? c.type}</p>
                  <p className="text-xs text-gray-400">Version {c.version}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  {new Date(c.agreedAt).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Data export */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ดาวน์โหลดข้อมูลของฉัน</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          ส่งออกรายการทั้งหมดของคุณ — สิทธิ์ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleExport('csv')} className="flex-1">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleExport('json')} className="flex-1">
            <Download className="h-3.5 w-3.5" />
            JSON
          </Button>
        </div>
      </Card>

      {/* Delete account request */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="h-4 w-4 text-red-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ลบบัญชี</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          ต้องการลบบัญชีและข้อมูลทั้งหมด กรุณาติดต่อ{' '}
          <a href="mailto:support@mchat.app" className="text-blue-600 underline">support@mchat.app</a>
          {' '}พร้อมระบุอีเมลของคุณ — ทีมงานจะดำเนินการภายใน 7 วันทำการ
        </p>
        <p className="text-xs text-gray-400">
          * หลังลบแล้วจะไม่สามารถกู้คืนข้อมูลได้
        </p>
      </Card>

      {/* Links */}
      <div className="flex gap-4 justify-center text-xs text-gray-400">
        <Link href="/privacy-policy" className="underline hover:text-gray-600">นโยบายความเป็นส่วนตัว</Link>
        <Link href="/terms" className="underline hover:text-gray-600">เงื่อนไขการใช้งาน</Link>
      </div>
    </div>
  )
}
