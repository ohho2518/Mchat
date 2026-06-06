'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Copy, Check, Users, TrendingUp, Clock, Wallet, Share2, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { PARTNER_LEVEL_LABELS } from '@/lib/referral'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false })

interface Stats {
  code:               string | null
  partnerLevel:       string
  clicks:             number
  signups:            number
  paid:               number
  pendingAmount:      number
  approvedAmount:     number
  paidOutAmount:      number
  availableForPayout: number
}

interface Commission {
  id:        string
  planCode:  string
  amount:    number
  status:    string
  holdUntil: string
  createdAt: string
  referral:  { referred: { name: string; email: string } }
}

interface PayoutReq {
  id:            string
  amount:        number
  paymentMethod: string
  accountName:   string
  status:        string
  createdAt:     string
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'รอ 14 วัน',
  approved:   'อนุมัติแล้ว',
  paid:       'จ่ายแล้ว',
  canceled:   'ยกเลิก',
}
const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  paid:     'bg-blue-50 text-blue-700',
  canceled: 'bg-gray-100 text-gray-500',
}
const PAYOUT_STATUS_LABEL: Record<string, string> = {
  requested:  'รอดำเนินการ',
  processing: 'กำลังโอน',
  paid:       'โอนแล้ว',
  rejected:   'ปฏิเสธ',
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-1">
      <div className="flex items-center gap-2 text-gray-400">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function ReferralPage() {
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [payouts,     setPayouts]     = useState<PayoutReq[]>([])
  const [loading,     setLoading]     = useState(true)
  const [copied,      setCopied]      = useState(false)
  const qrWrapRef = useRef<HTMLDivElement>(null)

  // Payout form
  const [showPayout,   setShowPayout]   = useState(false)
  const [payMethod,    setPayMethod]    = useState<'promptpay' | 'bank_transfer'>('promptpay')
  const [payAmount,    setPayAmount]    = useState('')
  const [payName,      setPayName]      = useState('')
  const [payNumber,    setPayNumber]    = useState('')
  const [payLoading,   setPayLoading]   = useState(false)
  const [payError,     setPayError]     = useState<string | null>(null)
  const [paySuccess,   setPaySuccess]   = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/referral/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/referral/commissions').then(r => r.ok ? r.json() : []),
      fetch('/api/referral/payout').then(r => r.ok ? r.json() : []),
    ]).then(([s, c, p]) => {
      setStats(s)
      setCommissions(c ?? [])
      setPayouts(p ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const link = stats?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${stats.code}`
    : ''

  const copyLink = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLINE = () => {
    const msg = `สมัครใช้ MChat ฟรี! แอปบันทึกรายรับรายจ่ายด้วยแชทภาษาไทย 🇹🇭\n${link}`
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank')
  }

  const downloadQR = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `mchat-referral-${stats?.code ?? 'qr'}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayLoading(true); setPayError(null)
    try {
      const body = {
        amount:          Number(payAmount),
        paymentMethod:   payMethod,
        accountName:     payName,
        ...(payMethod === 'promptpay' ? { promptpayNumber: payNumber } : { accountNumber: payNumber }),
      }
      const res = await fetch('/api/referral/payout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setPayError(data.error ?? 'เกิดข้อผิดพลาด'); return }
      setPaySuccess(true)
      setPayouts(prev => [data, ...prev])
      setStats(prev => prev ? { ...prev, availableForPayout: prev.availableForPayout - Number(payAmount) } : prev)
      setTimeout(() => { setShowPayout(false); setPaySuccess(false) }, 2000)
    } catch { setPayError('เกิดข้อผิดพลาด กรุณาลองใหม่') }
    finally { setPayLoading(false) }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 pb-24 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">แนะนำเพื่อน</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {stats?.partnerLevel ? PARTNER_LEVEL_LABELS[stats.partnerLevel] ?? stats.partnerLevel : ''}
        </p>
      </div>

      {/* Referral Code Card */}
      {stats?.code ? (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white space-y-4">
          <p className="text-xs opacity-80">รหัสแนะนำของคุณ</p>
          <p className="text-3xl font-bold tracking-widest">{stats.code}</p>
          <div className="text-xs opacity-70 break-all">{link}</div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <div ref={qrWrapRef} className="rounded-xl bg-white p-3">
              <QRCodeCanvas value={link} size={180} />
            </div>
            <button
              onClick={downloadQR}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium hover:bg-white/30"
            >
              <Download className="h-3.5 w-3.5" /> บันทึก QR
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium hover:bg-white/30"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
            </button>
            <button
              onClick={shareLINE}
              className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-medium hover:bg-green-600"
            >
              <Share2 className="h-3.5 w-3.5" /> LINE
            </button>
            <button
              onClick={shareFacebook}
              className="flex items-center gap-1.5 rounded-xl bg-[#1877F2] px-3 py-2 text-xs font-medium hover:bg-[#1665d8]"
            >
              <Share2 className="h-3.5 w-3.5" /> Facebook
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-100 p-5 text-center text-sm text-gray-400">
          กำลังสร้างรหัส...
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />}    label="คลิก"       value={String(stats?.clicks ?? 0)} />
        <StatCard icon={<Users className="h-4 w-4" />}    label="สมัคร"      value={String(stats?.signups ?? 0)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="ชำระแล้ว" value={String(stats?.paid ?? 0)} />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="รอ 14 วัน"
          value={`฿${(stats?.pendingAmount ?? 0).toLocaleString()}`}
        />
      </div>

      {/* Available for payout */}
      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-green-600">ถอนได้</p>
          <p className="text-2xl font-bold text-green-700">
            ฿{(stats?.availableForPayout ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-green-500 mt-0.5">
            อนุมัติแล้ว ฿{(stats?.approvedAmount ?? 0).toLocaleString()} · จ่ายแล้ว ฿{(stats?.paidOutAmount ?? 0).toLocaleString()}
          </p>
        </div>
        {(stats?.availableForPayout ?? 0) >= 300 && !showPayout && (
          <button
            onClick={() => setShowPayout(true)}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <Wallet className="h-4 w-4" /> ถอนเงิน
          </button>
        )}
      </div>

      {/* Payout Form */}
      {showPayout && (
        <div className="rounded-2xl border border-green-200 bg-white p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">ขอถอนเงิน</h3>
          {paySuccess ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-3xl">✅</div>
              <p className="text-sm text-gray-700">ส่งคำขอแล้ว Admin จะโอนให้ภายใน 3 วันทำการ</p>
            </div>
          ) : (
            <form onSubmit={submitPayout} className="space-y-3">
              <div className="flex gap-2">
                {(['promptpay', 'bank_transfer'] as const).map(m => (
                  <button
                    key={m} type="button"
                    onClick={() => setPayMethod(m)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-medium border transition-colors',
                      payMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200'
                    )}
                  >
                    {m === 'promptpay' ? 'PromptPay' : 'โอนธนาคาร'}
                  </button>
                ))}
              </div>
              <input
                required value={String(payAmount)} type="number" min={300}
                max={stats?.availableForPayout ?? 0} step={1}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={`จำนวนเงิน (min 300, max ${stats?.availableForPayout ?? 0})`}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                required value={payName} onChange={e => setPayName(e.target.value)}
                placeholder="ชื่อบัญชี"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                required value={payNumber} onChange={e => setPayNumber(e.target.value)}
                placeholder={payMethod === 'promptpay' ? 'เบอร์ PromptPay' : 'เลขบัญชีธนาคาร'}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              {payError && <p className="text-xs text-red-600">{payError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit" disabled={payLoading}
                  className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {payLoading ? 'กำลังส่ง...' : 'ยืนยันขอถอน'}
                </button>
                <button
                  type="button" onClick={() => setShowPayout(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600"
                >
                  ยกเลิก
                </button>
              </div>
              <p className="text-xs text-gray-400">ถอนขั้นต่ำ ฿300 · จ่ายทุกวันที่ 15 ของเดือน</p>
            </form>
          )}
        </div>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">ประวัติคำขอถอน</h2>
          <div className="space-y-2">
            {payouts.map(p => (
              <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">฿{Number(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{p.accountName} · {p.paymentMethod === 'promptpay' ? 'PromptPay' : 'โอนธนาคาร'}</p>
                </div>
                <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-500')}>
                  {PAYOUT_STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">ประวัติคอมมิชชัน</h2>
        {commissions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">ยังไม่มีคอมมิชชัน</p>
            <p className="text-xs text-gray-300 mt-1">แชร์ลิงก์ให้เพื่อนสมัครและอัปเกรด</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commissions.map(c => (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-800">+฿{Number(c.amount).toLocaleString()}</p>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', STATUS_COLOR[c.status] ?? '')}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {c.referral.referred.name} · {c.planCode.replace('_', ' ')}
                </p>
                {c.status === 'pending' && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    อนุมัติหลัง {new Date(c.holdUntil).toLocaleDateString('th-TH')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
