'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Check, X, Zap, QrCode, Loader2, Download, CreditCard, Smartphone, ArrowRight } from 'lucide-react'
import { PLAN_LABELS, PLAN_PRICES, PLAN_COLORS, CREDIT_PACKS } from '@/lib/features'
import type { CreditPack } from '@/lib/features'
import { generatePromptPayPayload, formatThaiPhone } from '@/lib/promptpay'
import type { Plan } from '@/lib/features'
import { cn } from '@/lib/utils/cn'

// Dynamic import — ป้องกัน SSR error บน Next.js App Router
const QRCodeCanvas = dynamic(
  () => import('qrcode.react').then((m) => m.QRCodeCanvas),
  { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> }
)

declare global {
  interface Window {
    OmiseCard: {
      configure: (cfg: Record<string, unknown>) => void
      open: (cfg: {
        frameLabel?: string
        amount?: number
        currency?: string
        onCreateTokenSuccess: (token: string) => void
        onFormClosed?: () => void
      }) => void
    }
  }
}

// ─── Feature comparison ───────────────────────────────────────────────────────
const FEATURES: { label: string; free: string | boolean; pro: string | boolean; max: string | boolean }[] = [
  { label: 'บันทึกรายรับ-รายจ่าย', free: true,        pro: true,          max: true },
  { label: 'OCR อ่านสลิป',         free: '20/เดือน',  pro: '100/เดือน',   max: '500/เดือน' },
  { label: 'ดูประวัติย้อนหลัง',    free: '90 วัน',    pro: 'ไม่จำกัด',    max: 'ไม่จำกัด' },
  { label: 'หมวดหมู่',              free: '5 หมวด',    pro: 'ไม่จำกัด',    max: 'ไม่จำกัด' },
  { label: 'บัญชี',                 free: '2 บัญชี',   pro: 'ไม่จำกัด',    max: 'ไม่จำกัด' },
  { label: 'Export Excel/CSV',       free: false,        pro: true,          max: true },
  { label: 'โอนเงินระหว่างบัญชี',   free: false,        pro: true,          max: true },
  { label: 'ติดตามหนี้สิน',          free: false,        pro: true,          max: true },
  { label: 'หลายผู้ใช้',             free: false,        pro: false,         max: '5 คน' },
]

const PERIOD_OPTIONS = [
  { months: 1,  label: '1 เดือน',   discount: 0   },
  { months: 3,  label: '3 เดือน',   discount: 0   },
  { months: 6,  label: '6 เดือน',   discount: 0.1 },  // 10% off
  { months: 12, label: '1 ปี',      discount: 0.17 }, // ~yearly rate
]

function featureCell(val: string | boolean) {
  if (val === true)  return <Check className="mx-auto h-4 w-4 text-green-500" />
  if (val === false) return <X    className="mx-auto h-4 w-4 text-gray-300" />
  return <span className="text-xs text-gray-700">{val}</span>
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
type PaymentTab = 'stripe' | 'omise_promptpay' | 'omise_card' | 'manual'

interface PaymentModalProps {
  plan: 'pro' | 'max'
  promptpayPhone: string | null
  omisePublicKey: string | null
  stripeEnabled: boolean
  phoneLoading: boolean
  onClose: () => void
  onSuccess: () => void
}

function PaymentModal({ plan, promptpayPhone, omisePublicKey, stripeEnabled, phoneLoading, onClose, onSuccess }: PaymentModalProps) {
  const omiseEnabled = Boolean(omisePublicKey)
  const [tab,      setTab]     = useState<PaymentTab>(stripeEnabled ? 'stripe' : omiseEnabled ? 'omise_promptpay' : 'manual')
  const [period,   setPeriod]  = useState(PERIOD_OPTIONS[0])
  const [refCode,  setRefCode] = useState('')
  const [loading,  setLoading] = useState(false)
  const [sent,     setSent]    = useState(false)
  const [error,    setError]   = useState<string | null>(null)

  // Omise PromptPay state
  const [omiseQrUrl,   setOmiseQrUrl]   = useState<string | null>(null)
  const [omisePayId,   setOmisePayId]   = useState<string | null>(null)
  const [polling,      setPolling]      = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Manual tab QR ref
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  const base    = PLAN_PRICES[plan].monthly
  const amount  = Math.round(base * period.months * (1 - period.discount))
  const manualPayload = promptpayPhone ? generatePromptPayPayload(promptpayPhone, amount) : null

  // Clear Omise QR + stop polling when period or tab changes
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setPolling(false)
    setOmiseQrUrl(null)
    setOmisePayId(null)
    setError(null)
  }, [period, tab])

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Load Omise.js for card tab
  useEffect(() => {
    if (tab !== 'omise_card' || !omisePublicKey) return
    if (window.OmiseCard) {
      window.OmiseCard.configure({ publicKey: omisePublicKey })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.omise.co/omise.js'
    script.onload = () => window.OmiseCard?.configure({ publicKey: omisePublicKey })
    document.head.appendChild(script)
  }, [tab, omisePublicKey])

  const startPolling = (paymentId: string) => {
    setPolling(true)
    let ticks = 0
    pollRef.current = setInterval(async () => {
      ticks++
      if (ticks > 36) {          // stop after 3 min
        clearInterval(pollRef.current!); pollRef.current = null; setPolling(false)
        return
      }
      try {
        const r = await fetch(`/api/omise/status?paymentId=${paymentId}`)
        if (r.ok) {
          const { paid } = await r.json()
          if (paid) {
            clearInterval(pollRef.current!); pollRef.current = null; setPolling(false)
            setSent(true); setTimeout(onSuccess, 2000)
          }
        }
      } catch { /* network blip — continue polling */ }
    }, 5000)
  }

  const createOmisePromptPay = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/omise/charge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months: period.months, amount, method: 'promptpay', refCode: refCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
      setOmiseQrUrl(data.qrImageUrl)
      setOmisePayId(data.paymentId)
      startPolling(data.paymentId)
    } catch { setError('ไม่สามารถสร้าง QR ได้') }
    finally { setLoading(false) }
  }

  const openOmiseCard = () => {
    if (!window.OmiseCard) { setError('กำลังโหลด Omise.js...'); return }
    window.OmiseCard.open({
      frameLabel: 'MChat',
      amount:     amount * 100,
      currency:   'THB',
      onCreateTokenSuccess: async (token: string) => {
        setLoading(true); setError(null)
        try {
          const res = await fetch('/api/omise/charge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, months: period.months, amount, method: 'card', token, refCode: refCode.trim() || undefined }),
          })
          const data = await res.json()
          if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
          if (data.immediate) { setSent(true); setTimeout(onSuccess, 2000) }
          else { setOmisePayId(data.paymentId); startPolling(data.paymentId) }
        } catch { setError('ไม่สามารถชำระได้ กรุณาลองใหม่') }
        finally { setLoading(false) }
      },
      onFormClosed: () => {},
    })
  }

  const createStripeCheckout = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'plan', plan, months: period.months, amount, refCode: refCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error ?? 'ไม่สามารถเริ่มการชำระได้'); return }
      window.location.assign(data.url)   // redirect ไป Stripe Checkout
    } catch { setError('ไม่สามารถเชื่อมต่อ Stripe ได้'); setLoading(false) }
    // ไม่ต้อง setLoading(false) เมื่อสำเร็จ — กำลัง redirect ออกจากหน้า
  }

  const submitManual = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months: period.months, amount, method: 'promptpay' }),
      })
      const body = await res.json()
      if (!res.ok) { setError(typeof body.error === 'string' ? body.error : 'เกิดข้อผิดพลาด'); return }
      setSent(true); setTimeout(onSuccess, 2000)
    } finally { setLoading(false) }
  }

  const downloadCanvasQR = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `promptpay-${plan}-${amount}thb.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const downloadOmiseQR = () => {
    if (!omisePayId) return
    // Use server-side proxy to avoid CORS when downloading from Omise CDN
    const a = document.createElement('a')
    a.href = `/api/omise/qr?paymentId=${omisePayId}`
    a.download = `promptpay-${plan}-${amount}thb.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const TABS: { key: PaymentTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: 'stripe',          label: 'บัตร/PromptPay', icon: <CreditCard className="h-3.5 w-3.5" />, show: stripeEnabled },
    { key: 'omise_promptpay', label: 'PromptPay',  icon: <Smartphone className="h-3.5 w-3.5" />, show: omiseEnabled },
    { key: 'omise_card',      label: 'บัตร',        icon: <CreditCard className="h-3.5 w-3.5" />,  show: omiseEnabled },
    { key: 'manual',          label: 'โอนเอง',      icon: <QrCode className="h-3.5 w-3.5" />,      show: true },
  ]
  const showTabBar = stripeEnabled || omiseEnabled

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        {sent ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-5xl">✅</div>
            <p className="font-semibold text-gray-800">ชำระเงินสำเร็จ!</p>
            <p className="text-sm text-gray-500">
              {tab === 'manual'
                ? 'Admin จะอัปเดต plan ภายใน 24 ชั่วโมง'
                : 'Plan ของคุณอัปเดตแล้ว กรุณา sign-out แล้ว sign-in ใหม่เพื่อให้มีผล'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">ชำระเงิน — {PLAN_LABELS[plan]}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Period selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => setPeriod(opt)}
                  className={cn(
                    'rounded-xl py-2 text-xs font-medium border transition-colors',
                    period.months === opt.months
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-600 border-gray-200 hover:border-blue-300'
                  )}
                >
                  {opt.label}
                  {opt.discount > 0 && (
                    <span className="block text-[10px] opacity-80">ลด {Math.round(opt.discount * 100)}%</span>
                  )}
                </button>
              ))}
            </div>

            {/* Price summary */}
            <div className="rounded-xl bg-blue-50 p-3 mb-4 text-center">
              <p className="text-xs text-blue-600 mb-0.5">ยอดชำระ</p>
              <p className="text-3xl font-bold text-blue-700">฿{amount.toLocaleString()}</p>
              <p className="text-xs text-blue-500">
                {PLAN_LABELS[plan]} · {period.label}
                {period.discount > 0 && (
                  <span className="ml-1 line-through text-gray-400">฿{(base * period.months).toLocaleString()}</span>
                )}
              </p>
            </div>

            {/* Referral code */}
            <div className="mb-3">
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                placeholder="รหัสแนะนำ (ถ้ามี)"
                maxLength={20}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Payment method tabs */}
            {showTabBar && (
              <div className="flex gap-1.5 mb-4 p-1 bg-gray-100 rounded-xl">
                {TABS.filter(t => t.show).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors',
                      tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Tab: Stripe Checkout (redirect) ── */}
            {tab === 'stripe' && (
              <div className="flex flex-col items-center py-4 space-y-3 mb-4">
                <CreditCard className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 text-center">
                  ชำระด้วยบัตรเครดิต/เดบิต หรือ PromptPay<br/>
                  ผ่านหน้าชำระเงินที่ปลอดภัยของ Stripe
                </p>
                <button
                  onClick={createStripeCheckout}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? 'กำลังเชื่อมต่อ...' : `ชำระ ฿${amount.toLocaleString()}`}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Plan จะอัปเดตอัตโนมัติหลังชำระสำเร็จ · ข้อมูลบัตรจัดการโดย Stripe
                </p>
              </div>
            )}

            {/* ── Tab: Omise PromptPay ── */}
            {tab === 'omise_promptpay' && (
              <div className="space-y-3 mb-4">
                {!omiseQrUrl ? (
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <QrCode className="h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-500 text-center">กด "สร้าง QR" เพื่อรับ QR PromptPay<br/>ระบบจะยืนยันการชำระอัตโนมัติ</p>
                    <button
                      onClick={createOmisePromptPay}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {loading ? 'กำลังสร้าง...' : 'สร้าง QR'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    {/* QR image from Omise */}
                    <div className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={omiseQrUrl} alt="PromptPay QR" width={180} height={180} className="rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                      {polling && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" /> รอการชำระ...
                        </span>
                      )}
                      <button
                        onClick={downloadOmiseQR}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" /> บันทึก QR
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      สแกน QR → จ่าย → plan จะอัปเดตอัตโนมัติ (ไม่ต้องรอ admin)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Omise Card ── */}
            {tab === 'omise_card' && (
              <div className="flex flex-col items-center py-4 space-y-3 mb-4">
                <CreditCard className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 text-center">ชำระด้วยบัตรเครดิต/เดบิต<br/>Visa, Mastercard, JCB</p>
                {polling ? (
                  <span className="inline-flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> กำลังยืนยัน...
                  </span>
                ) : (
                  <button
                    onClick={openOmiseCard}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {loading ? 'กำลังดำเนินการ...' : 'ชำระด้วยบัตร'}
                  </button>
                )}
                <p className="text-xs text-gray-400">ข้อมูลบัตรถูกเข้ารหัสโดย Omise — ไม่ผ่านเซิร์ฟเวอร์ของเรา</p>
              </div>
            )}

            {/* ── Tab: Manual PromptPay ── */}
            {tab === 'manual' && (
              <>
                <div className="flex flex-col items-center mb-4">
                  <div ref={canvasWrapRef} className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-center min-h-[206px] min-w-[206px]">
                    {phoneLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    ) : manualPayload && promptpayPhone ? (
                      <QRCodeCanvas value={manualPayload} size={180} includeMargin />
                    ) : (
                      <div className="text-center space-y-2">
                        <QrCode className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400">ไม่สามารถโหลด QR ได้</p>
                      </div>
                    )}
                  </div>
                  {promptpayPhone && (
                    <p className="text-xs text-gray-500 mt-2 font-medium">PromptPay: {formatThaiPhone(promptpayPhone)}</p>
                  )}
                  {manualPayload && promptpayPhone && !phoneLoading && (
                    <button
                      onClick={downloadCanvasQR}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      <Download className="h-3.5 w-3.5" /> บันทึก QR
                    </button>
                  )}
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 mb-4 text-xs text-amber-800 space-y-1">
                  <p className="font-medium">วิธีชำระเงิน</p>
                  <p>1. สแกน QR ด้วยแอปธนาคาร หรือ PromptPay</p>
                  <p>2. ตรวจสอบจำนวนเงิน ฿{amount.toLocaleString()}</p>
                  <p>3. กด "แจ้งชำระเงินแล้ว" หลังโอนสำเร็จ</p>
                  <p className="text-amber-600">⏳ Admin จะอัปเดต plan ภายใน 24 ชั่วโมง</p>
                </div>

                {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}

                <button
                  onClick={submitManual}
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'กำลังส่ง...' : 'แจ้งชำระเงินแล้ว'}
                </button>
              </>
            )}

            {/* Shared error */}
            {tab !== 'manual' && error && (
              <p className="text-xs text-red-600 text-center mb-3">{error}</p>
            )}

            {tab === 'omise_promptpay' && omisePayId && !polling && !sent && (
              <p className="text-xs text-gray-400 text-center mt-2">
                หากชำระแล้วแต่ยังไม่อัปเดต ลอง{' '}
                <button className="underline" onClick={() => startPolling(omisePayId)}>ตรวจสอบอีกครั้ง</button>
              </p>
            )}

            <p className="mt-3 text-center text-xs text-gray-400">
              หากมีปัญหาการชำระ ติดต่อ admin ได้เลย
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Credit Modal ────────────────────────────────────────────────────────────
function CreditModal({ pack, promptpayPhone, stripeEnabled, onClose, onSuccess }: {
  pack:           CreditPack
  promptpayPhone: string | null
  stripeEnabled:  boolean
  onClose:        () => void
  onSuccess:      () => void
}) {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const payload = promptpayPhone
    ? generatePromptPayPayload(promptpayPhone, pack.price)
    : null

  const payWithStripe = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kind: 'credits', credits: pack.credits, amount: pack.price }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error ?? 'ไม่สามารถเริ่มการชำระได้'); return }
      window.location.assign(data.url)
    } catch { setError('ไม่สามารถเชื่อมต่อ Stripe ได้'); setLoading(false) }
  }

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credits: pack.credits, amount: pack.price, method: 'manual' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
      setSent(true)
      setTimeout(onSuccess, 2000)
    } catch { setError('ไม่สามารถส่งคำขอได้') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">ซื้อเครดิต OCR</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{pack.credits}</p>
          <p className="text-sm text-purple-500">เครดิต OCR</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">฿{pack.price}</p>
          <p className="text-xs text-gray-400">ไม่มีวันหมดอายุ · ใช้ได้ทุกเดือน</p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center text-sm text-green-700">
            ✓ แจ้งชำระเรียบร้อย — Admin จะเติมเครดิตภายใน 24 ชั่วโมง
          </div>
        ) : (
          <>
            {/* Stripe — ช่องทางหลัก (บัตร/PromptPay อัตโนมัติ) */}
            {stripeEnabled && (
              <>
                <button
                  onClick={payWithStripe}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {loading ? 'กำลังเชื่อมต่อ...' : `ชำระ ฿${pack.price} (บัตร/PromptPay)`}
                </button>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <div className="h-px flex-1 bg-gray-200" /> หรือโอนเอง <div className="h-px flex-1 bg-gray-200" />
                </div>
              </>
            )}
            {payload && promptpayPhone && (
              <div className="flex flex-col items-center gap-2">
                <div ref={canvasRef} className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <QRCodeCanvas value={payload} size={180} level="M" />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  PromptPay: {formatThaiPhone(promptpayPhone)}
                </p>
                <button
                  onClick={() => {
                    const canvas = canvasRef.current?.querySelector('canvas')
                    if (!canvas) return
                    const a = document.createElement('a')
                    a.href = canvas.toDataURL('image/png')
                    a.download = `promptpay-ocr-${pack.credits}credits-${pack.price}thb.png`
                    document.body.appendChild(a); a.click(); document.body.removeChild(a)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" /> บันทึก QR
                </button>
              </div>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <p>1. สแกน QR หรือโอนผ่าน PromptPay</p>
              <p>2. ตรวจสอบจำนวน ฿{pack.price}</p>
              <p>3. กด "แจ้งชำระเงินแล้ว"</p>
              <p className="text-amber-600">⏳ Admin จะเติมเครดิตภายใน 24 ชั่วโมง</p>
            </div>
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'แจ้งชำระเงินแล้ว'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: Plan
  current: Plan
  onUpgrade: (plan: 'pro' | 'max') => void
}

function PlanCard({ plan, current, onUpgrade }: PlanCardProps) {
  const price    = PLAN_PRICES[plan]
  const colors   = PLAN_COLORS[plan]
  const isCurrent = plan === current
  const isPro    = plan === 'pro'

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5 transition-all',
      isCurrent ? `${colors.border} ${colors.bg}` : 'border-gray-100 bg-white',
      isPro && !isCurrent && 'border-blue-400 shadow-md shadow-blue-100'
    )}>
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {plan !== 'free' && <Zap className="h-4 w-4 text-blue-500" />}
          <span className={cn('font-bold text-lg', colors.text)}>{PLAN_LABELS[plan]}</span>
        </div>
        {isCurrent && (
          <span className={cn('text-xs font-medium rounded-full px-2.5 py-0.5 border',
            colors.bg, colors.text, colors.border)}>
            แผนปัจจุบัน
          </span>
        )}
        {isPro && !isCurrent && (
          <span className="text-xs font-medium rounded-full px-2.5 py-0.5 bg-blue-600 text-white">
            แนะนำ
          </span>
        )}
      </div>

      {/* Price */}
      {price.monthly > 0 ? (
        <div className="mb-4">
          <span className="text-2xl font-bold text-gray-900">฿{price.monthly}</span>
          <span className="text-sm text-gray-500">/เดือน</span>
          <p className="text-xs text-gray-400 mt-0.5">หรือ ฿{price.yearly}/ปี (ลด {Math.round((1 - price.yearly / (price.monthly * 12)) * 100)}%)</p>
        </div>
      ) : (
        <div className="mb-4">
          <span className="text-2xl font-bold text-gray-900">ฟรี</span>
          <p className="text-xs text-gray-400 mt-0.5">ไม่มีค่าใช้จ่าย</p>
        </div>
      )}

      {/* CTA */}
      {plan !== 'free' && !isCurrent && (
        <button
          onClick={() => onUpgrade(plan as 'pro' | 'max')}
          className={cn(
            'w-full rounded-xl py-2.5 text-sm font-semibold mb-4 transition-colors',
            isPro
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          )}
        >
          อัปเกรดเป็น {PLAN_LABELS[plan]}
        </button>
      )}
      {plan === 'free' && isCurrent && (
        <div className="h-10 mb-4" />
      )}
      {plan !== 'free' && isCurrent && (
        <div className="rounded-xl bg-white/60 py-2.5 text-sm text-center text-gray-500 mb-4">
          ใช้งานอยู่
        </div>
      )}
    </div>
  )
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedPlan,    setSelectedPlan]    = useState<'pro' | 'max' | null>(null)
  const [selectedCredits, setSelectedCredits] = useState<CreditPack | null>(null)
  const [promptpayPhone,  setPromptpayPhone]  = useState<string | null>(null)
  const [omisePublicKey,  setOmisePublicKey]  = useState<string | null>(null)
  const [stripeEnabled,   setStripeEnabled]   = useState(false)
  const [phoneLoading,    setPhoneLoading]    = useState(true)
  const [pendingPayment,  setPendingPayment]  = useState(false)
  const [stripeResult,    setStripeResult]    = useState<'success' | 'cancel' | null>(null)
  const [stripeStatus,    setStripeStatus]    = useState<'checking' | 'paid' | 'failed' | 'timeout' | null>(null)

  const currentPlan = (session?.user?.plan ?? 'free') as Plan

  useEffect(() => {
    fetch('/api/payments/info')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setPromptpayPhone(data?.promptpayPhone ?? null)
        setOmisePublicKey(data?.omisePublicKey ?? null)
        setStripeEnabled(Boolean(data?.stripeEnabled))
      })
      .catch(() => {})
      .finally(() => setPhoneLoading(false))

    fetch('/api/payments')
      .then(r => r.ok ? r.json() : [])
      .then((payments: { status: string; method: string }[]) => {
        // Stripe pending = checkout ที่ยังไม่จ่าย/ทิ้งไว้ (auto) — ไม่นับเป็น "รอ admin" และไม่ block modal
        setPendingPayment(payments.some(p => p.status === 'pending' && p.method !== 'stripe'))
      })
      .catch(() => {})
  }, [])

  // จัดการ redirect กลับจาก Stripe Checkout (?stripe=success&session_id=... | ?stripe=cancel)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const outcome = params.get('stripe')
    if (!outcome) return

    // ล้าง query param ออกจาก URL (กัน refresh แล้วเด้งซ้ำ)
    window.history.replaceState(null, '', '/pricing')

    if (outcome === 'cancel') { setStripeResult('cancel'); return }
    if (outcome !== 'success') return

    const sessionId = params.get('session_id')
    setStripeResult('success')
    // ยังไม่ยืนยันว่าสำเร็จ — PromptPay อาจ redirect กลับก่อนเงินเข้าจริง → ตรวจสถานะจริงก่อน
    setStripeStatus('checking')
    if (!sessionId) { setStripeStatus('timeout'); return }

    // Poll สถานะจริงจาก DB (webhook เป็นคนอัปเดต) สูงสุด ~20 วิ
    let ticks = 0
    const iv = setInterval(async () => {
      ticks++
      try {
        const r = await fetch(`/api/stripe/status?session_id=${sessionId}`)
        if (r.ok) {
          const { status } = await r.json()
          if (status === 'paid')   { clearInterval(iv); setStripeStatus('paid'); setPendingPayment(false); return }
          if (status === 'failed') { clearInterval(iv); setStripeStatus('failed'); return }
        }
      } catch { /* network blip — continue polling */ }
      if (ticks >= 10) { clearInterval(iv); setStripeStatus((s) => (s === 'checking' ? 'timeout' : s)) }
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="p-4 space-y-6 pb-10 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">แผนราคา</h1>
        <p className="text-sm text-gray-500 mt-1">เลือกแผนที่เหมาะกับการใช้งานของคุณ</p>
      </div>

      {/* Stripe redirect result — แสดงตามสถานะจริงจาก webhook (ไม่ assume สำเร็จ) */}
      {stripeResult === 'success' && stripeStatus === 'checking' && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <p>กำลังตรวจสอบการชำระเงิน...</p>
        </div>
      )}
      {stripeResult === 'success' && stripeStatus === 'paid' && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <p className="font-medium mb-1">✅ ชำระเงินสำเร็จ!</p>
          <p className="text-xs text-green-600">แผนของคุณอัปเดตแล้ว — หากยังไม่เปลี่ยน กรุณา sign-out แล้ว sign-in ใหม่เพื่อให้มีผล</p>
        </div>
      )}
      {stripeResult === 'success' && stripeStatus === 'failed' && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          <p className="font-medium mb-1">❌ การชำระเงินไม่สำเร็จ</p>
          <p className="text-xs text-red-600">ยังไม่มีการตัดเงิน — คุณสามารถเลือกแผนและลองชำระใหม่ได้</p>
        </div>
      )}
      {stripeResult === 'success' && stripeStatus === 'timeout' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">⏳ กำลังยืนยันการชำระเงิน</p>
          <p className="text-xs text-amber-600">อาจใช้เวลาสักครู่ — ลองรีเฟรชหน้านี้อีกครั้ง หากตัดเงินแล้วแผนจะอัปเดตอัตโนมัติ</p>
        </div>
      )}
      {stripeResult === 'cancel' && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
          <p className="text-xs">ยกเลิกการชำระเงินแล้ว — คุณสามารถเลือกแผนและลองใหม่ได้ทุกเมื่อ</p>
        </div>
      )}

      {/* Pending payment notice */}
      {pendingPayment && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">⏳ รอการยืนยันจาก Admin</p>
          <p className="text-xs text-amber-600">คุณแจ้งชำระเงินแล้ว Admin กำลังตรวจสอบ — จะอัปเดต plan ภายใน 24 ชั่วโมง</p>
        </div>
      )}

      {/* Plan cards */}
      <div className="space-y-4">
        {(['free', 'pro', 'max'] as Plan[]).map(plan => (
          <PlanCard
            key={plan}
            plan={plan}
            current={currentPlan}
            onUpgrade={setSelectedPlan}
          />
        ))}
      </div>

      {/* Feature comparison */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">เปรียบเทียบฟีเจอร์</h2>
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          {/* Header */}
          <div className="grid grid-cols-4 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
            <div className="col-span-1 py-2.5 px-3">ฟีเจอร์</div>
            {(['free', 'pro', 'max'] as Plan[]).map(p => (
              <div key={p} className={cn('py-2.5 px-2 text-center', PLAN_COLORS[p].text)}>
                {PLAN_LABELS[p]}
              </div>
            ))}
          </div>
          {/* Rows */}
          {FEATURES.map((f, i) => (
            <div key={i} className={cn(
              'grid grid-cols-4 text-xs border-b border-gray-50 last:border-0',
              i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
            )}>
              <div className="col-span-1 py-3 px-3 text-gray-600 font-medium flex items-center">
                {f.label}
              </div>
              <div className="py-3 px-2 text-center flex items-center justify-center">{featureCell(f.free)}</div>
              <div className="py-3 px-2 text-center flex items-center justify-center">{featureCell(f.pro)}</div>
              <div className="py-3 px-2 text-center flex items-center justify-center">{featureCell(f.max)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OCR Credit Packs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">เติมเครดิต OCR เสริม</h2>
        <p className="text-xs text-gray-400 mb-3">สำหรับผู้ใช้ Max ที่ต้องการสแกนสลิปเกิน 500 ครั้ง/เดือน · เครดิตไม่มีวันหมดอายุ</p>
        <div className="grid grid-cols-3 gap-3">
          {CREDIT_PACKS.map(pack => (
            <button
              key={pack.credits}
              onClick={() => setSelectedCredits(pack)}
              disabled={pendingPayment}
              className={cn(
                'relative rounded-2xl border-2 p-3 text-center transition-all hover:border-purple-400 hover:bg-purple-50 disabled:opacity-40',
                'popular' in pack && pack.popular
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-100 bg-white'
              )}
            >
              {'popular' in pack && pack.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  นิยม
                </span>
              )}
              <p className="text-lg font-bold text-gray-900">{pack.credits}</p>
              <p className="text-xs text-gray-400 mb-1">ครั้ง</p>
              <p className="text-sm font-semibold text-purple-700">฿{pack.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 space-y-2">
        <p className="font-semibold">คำถามที่พบบ่อย</p>
        <p><strong>ชำระได้อย่างไร?</strong> โอนผ่าน PromptPay แล้วแจ้งในแอป</p>
        <p><strong>Plan เริ่มทำงานเมื่อไร?</strong> ภายใน 24 ชั่วโมงหลัง Admin ยืนยัน</p>
        <p><strong>ยกเลิกได้ไหม?</strong> ยังไม่รองรับ auto-renew — ชำระรายเดือน/ปีตามต้องการ</p>
      </div>

      <button
        onClick={() => router.back()}
        className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        กลับ
      </button>

      {/* Payment Modal */}
      {selectedPlan && !pendingPayment && (
        <PaymentModal
          plan={selectedPlan}
          promptpayPhone={promptpayPhone}
          omisePublicKey={omisePublicKey}
          stripeEnabled={stripeEnabled}
          phoneLoading={phoneLoading}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setSelectedPlan(null)
            setPendingPayment(true)
          }}
        />
      )}

      {/* Credit Modal */}
      {selectedCredits && !pendingPayment && (
        <CreditModal
          pack={selectedCredits}
          promptpayPhone={promptpayPhone}
          stripeEnabled={stripeEnabled}
          onClose={() => setSelectedCredits(null)}
          onSuccess={() => {
            setSelectedCredits(null)
            setPendingPayment(true)
          }}
        />
      )}
    </div>
  )
}
