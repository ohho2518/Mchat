'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, BarChart2, Mic, Camera, Download, Star, ChevronDown, ChevronUp } from 'lucide-react'

const FEATURES = [
  { icon: <MessageSquare className="h-5 w-5" />, text: 'พิมพ์ภาษาไทยธรรมดา → บันทึกรายรับรายจ่ายอัตโนมัติ' },
  { icon: <BarChart2 className="h-5 w-5" />,     text: 'Dashboard สรุปยอด กราฟ วิเคราะห์รายจ่าย' },
  { icon: <Mic className="h-5 w-5" />,           text: 'บันทึกด้วยเสียง พูดแล้วจบ' },
  { icon: <Camera className="h-5 w-5" />,        text: 'สแกนสลิปธนาคาร OCR อัตโนมัติ' },
]

interface ReferralTerms {
  commissions: { plan: string; code: string; amount: number }[]
  holdDays:    number
  minPayout:   number
  payoutDay:   number
  extraNote:   string
}

export default function DownloadPage() {
  const router = useRouter()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [hasRef,        setHasRef]        = useState(false)
  const [terms,         setTerms]         = useState<ReferralTerms | null>(null)
  const [showTerms,     setShowTerms]     = useState(false)

  useEffect(() => {
    const stored  = localStorage.getItem('ref_code')
    const expires = Number(localStorage.getItem('ref_code_expires') ?? 0)
    setHasRef(Boolean(stored && Date.now() < expires))

    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true)

    fetch('/api/referral/terms').then(r => r.ok ? r.json() : null).then(setTerms).catch(() => {})

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-4xl shadow-lg">
            💬
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MChat</h1>
          <p className="text-gray-500 leading-relaxed">
            แอปบันทึกรายรับรายจ่าย<br />ด้วยแชทภาษาไทย ง่ายที่สุดในไทย
          </p>
          {hasRef && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-xs text-green-700 font-medium">
              <Star className="h-3.5 w-3.5 fill-green-500 text-green-500" />
              เพื่อนแนะนำมา — สมัครฟรีได้เลย!
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="mt-0.5 shrink-0 text-blue-600">{f.icon}</div>
              <p className="text-sm text-gray-700">{f.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {isInstalled ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-center text-sm text-green-700 font-medium">
              ✓ ติดตั้งแอปแล้ว
            </div>
          ) : installPrompt ? (
            <button
              onClick={handleInstall}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
            >
              <Download className="h-5 w-5" />
              ติดตั้งแอปบนมือถือ
            </button>
          ) : (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 text-center text-xs text-blue-600">
              เปิดใน Chrome / Safari แล้วกด "เพิ่มลงหน้าจอหลัก"
            </div>
          )}

          <button
            onClick={() => router.push('/login?mode=register')}
            className="flex w-full items-center justify-center rounded-2xl bg-gray-900 py-4 text-base font-semibold text-white hover:bg-gray-800 active:scale-95 transition-transform"
          >
            สมัครใช้งานฟรี →
          </button>

          <p className="text-center text-xs text-gray-400">
            มีบัญชีแล้ว?{' '}
            <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline">
              เข้าสู่ระบบ
            </button>
          </p>
        </div>

        {/* Referral Terms */}
        {terms && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
            <button
              onClick={() => setShowTerms(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-amber-800"
            >
              <span>💰 โปรแกรมแนะนำเพื่อน รับค่า Com!</span>
              {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showTerms && (
              <div className="border-t border-amber-200 bg-white px-4 py-4 space-y-4">
                {/* Commission table */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">อัตราค่าแนะนำ</p>
                  <div className="space-y-1.5">
                    {terms.commissions.map(c => (
                      <div key={c.code} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{c.plan}</span>
                        <span className="font-semibold text-green-700">฿{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">เงื่อนไข</p>
                  <ul className="space-y-1.5 text-xs text-gray-500">
                    <li>• ถือเงิน {terms.holdDays} วันก่อนอนุมัติ (ป้องกันการคืนเงิน)</li>
                    <li>• ถอนขั้นต่ำ ฿{terms.minPayout.toLocaleString()}</li>
                    <li>• จ่ายทุกวันที่ {terms.payoutDay} ของเดือน (โอน PromptPay หรือธนาคาร)</li>
                    <li>• ไม่จำกัดจำนวนคนที่แนะนำ</li>
                  </ul>
                </div>

                {terms.extraNote && (
                  <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">{terms.extraNote}</p>
                )}

                <button
                  onClick={() => router.push('/login?mode=register')}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  สมัครแล้วรับลิงก์แนะนำเลย →
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
