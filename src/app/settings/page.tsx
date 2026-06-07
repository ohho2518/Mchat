'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogOut, Pencil, X, Check, Info, Download, Wallet, Tag, ChevronRight, HandCoins, BarChart2, ArrowLeftRight, Zap, MailCheck, ShieldCheck, Shield } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { PLAN_LABELS, PLAN_COLORS, PLAN_PRICES } from '@/lib/features'
import type { Plan } from '@/lib/features'

const ProfileSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อ').max(50),
})

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'รหัสผ่านใหม่ไม่ตรงกัน',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof ProfileSchema>
type PasswordForm = z.infer<typeof PasswordSchema>

function EmailVerificationBanners({ emailVerified }: { emailVerified: boolean | undefined }) {
  const searchParams = useSearchParams()
  const verifiedParam = searchParams.get('verified')
  return (
    <>
      {verifiedParam === '1' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <MailCheck className="h-4 w-4 shrink-0" />
          <span>ยืนยันอีเมลเรียบร้อยแล้ว</span>
        </div>
      )}
      {verifiedParam === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <X className="h-4 w-4 shrink-0" />
          <span>ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว</span>
        </div>
      )}
      {emailVerified === false && verifiedParam !== '1' && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          <MailCheck className="h-4 w-4 shrink-0 text-amber-500" />
          <span>อีเมลของคุณยังไม่ได้รับการยืนยัน กรุณาตรวจสอบกล่องจดหมาย</span>
        </div>
      )}
    </>
  )
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [editName, setEditName] = useState(false)
  const [editPass, setEditPass] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [quota, setQuota] = useState<{
    plan: Plan; ocrCount: number; ocrLimit: number | null; month: string; ocrCredits: number; emailVerified: boolean
  } | null>(null)
  const [ocrConsent, setOcrConsent] = useState<boolean | null>(null)
  const [consentLoading, setConsentLoading] = useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    fetch('/api/user/quota')
      .then(r => r.json())
      .then(data => setQuota(data))
      .catch(() => {})
    fetch('/api/user/consent?type=ocr_improvement')
      .then(r => r.json())
      .then((data: { type: string }[]) => setOcrConsent(data.length > 0))
      .catch(() => {})
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
    } finally {
      setConsentLoading(false)
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  const nameForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: session?.user?.name ?? '' },
  })

  const passForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
  })

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const submitName = async (data: ProfileForm) => {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    })
    if (!res.ok) {
      const err = await res.json()
      nameForm.setError('name', { message: err.error ?? 'เกิดข้อผิดพลาด' })
      return
    }
    await update({ name: data.name })
    setEditName(false)
    setNameSuccess(true)
    setTimeout(() => setNameSuccess(false), 3000)
  }

  const submitPassword = async (data: PasswordForm) => {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      passForm.setError('currentPassword', { message: err.error ?? 'เกิดข้อผิดพลาด' })
      return
    }
    passForm.reset()
    setEditPass(false)
    setPassSuccess(true)
    setTimeout(() => setPassSuccess(false), 3000)
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (!session) {
    return (
      <div className="p-4 text-center space-y-4">
        <p className="text-sm text-gray-600">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        <Button onClick={() => router.push('/login')}>เข้าสู่ระบบ</Button>
      </div>
    )
  }

  const initial = session.user.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Email verification banners */}
      <Suspense fallback={null}>
        <EmailVerificationBanners emailVerified={quota?.emailVerified} />
      </Suspense>

      {/* Avatar + info */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>
      </Card>

      {/* Plan & Usage */}
      <Card id="plan">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">แผนของฉัน</p>
            {quota && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border
                ${PLAN_COLORS[quota.plan].bg} ${PLAN_COLORS[quota.plan].text} ${PLAN_COLORS[quota.plan].border}`}>
                <Zap className="h-3 w-3" />
                {PLAN_LABELS[quota.plan]}
              </span>
            )}
          </div>

          {quota && (
            <div className="space-y-2">
              {/* OCR usage */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>OCR อ่านสลิป (เดือนนี้)</span>
                  <span className="font-medium">
                    {quota.ocrCount} / {quota.ocrLimit ?? '∞'} ครั้ง
                  </span>
                </div>
                {quota.ocrLimit !== null && (
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quota.ocrCount / quota.ocrLimit >= 0.9 ? 'bg-red-500' :
                        quota.ocrCount / quota.ocrLimit >= 0.7 ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (quota.ocrCount / quota.ocrLimit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Extra credits balance */}
              {quota.ocrCredits > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
                  <span className="text-xs text-purple-700">เครดิต OCR เสริม</span>
                  <span className="text-sm font-semibold text-purple-700">{quota.ocrCredits} ครั้ง</span>
                </div>
              )}

              {/* Upgrade nudge for free/pro plan */}
              {quota.plan !== 'max' && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-2">
                  {quota.plan === 'free' ? (
                    <>
                      <p className="font-medium">อัปเกรดเป็น Pro เพื่อรับสิทธิ์เพิ่ม</p>
                      <ul className="space-y-0.5 text-blue-600">
                        <li>• OCR 100 ครั้ง/เดือน</li>
                        <li>• ดูประวัติไม่จำกัด</li>
                        <li>• Export Excel/CSV, บัญชีไม่จำกัด</li>
                      </ul>
                      <p className="font-semibold">฿{PLAN_PRICES.pro.monthly}/เดือน</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">อัปเกรดเป็น Max</p>
                      <ul className="space-y-0.5 text-blue-600">
                        <li>• OCR 500 ครั้ง/เดือน + ซื้อเครดิตเพิ่มได้</li>
                        <li>• รองรับหลายผู้ใช้ (5 คน)</li>
                      </ul>
                      <p className="font-semibold">฿{PLAN_PRICES.max.monthly}/เดือน</p>
                    </>
                  )}
                  <a
                    href="/pricing"
                    className="block w-full text-center rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    ดูแผนราคาทั้งหมด
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit name */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</p>
            {!editName && (
              <button onClick={() => { setEditName(true); nameForm.setValue('name', session.user.name ?? '') }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Pencil className="h-3 w-3" /> แก้ไข
              </button>
            )}
          </div>

          {editName ? (
            <form onSubmit={nameForm.handleSubmit(submitName)} className="space-y-3">
              <Input
                {...nameForm.register('name')}
                error={nameForm.formState.errors.name?.message}
                placeholder="ชื่อของคุณ"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={nameForm.formState.isSubmitting}>
                  <Check className="h-3 w-3" /> บันทึก
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditName(false)}>
                  <X className="h-3 w-3" /> ยกเลิก
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">{session.user.name}</p>
          )}
          {nameSuccess && <p className="text-xs text-green-600">✓ อัปเดตชื่อเรียบร้อย</p>}
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">รหัสผ่าน</p>
            {!editPass && (
              <button onClick={() => setEditPass(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Pencil className="h-3 w-3" /> เปลี่ยน
              </button>
            )}
          </div>

          {editPass ? (
            <form onSubmit={passForm.handleSubmit(submitPassword)} className="space-y-3">
              <Input
                {...passForm.register('currentPassword')}
                type="password"
                label="รหัสผ่านปัจจุบัน"
                error={passForm.formState.errors.currentPassword?.message}
                placeholder="••••••"
              />
              <Input
                {...passForm.register('newPassword')}
                type="password"
                label="รหัสผ่านใหม่"
                error={passForm.formState.errors.newPassword?.message}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
              <Input
                {...passForm.register('confirmPassword')}
                type="password"
                label="ยืนยันรหัสผ่านใหม่"
                error={passForm.formState.errors.confirmPassword?.message}
                placeholder="••••••"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={passForm.formState.isSubmitting}>
                  <Check className="h-3 w-3" /> บันทึก
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditPass(false); passForm.reset() }}>
                  <X className="h-3 w-3" /> ยกเลิก
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">••••••••</p>
          )}
          {passSuccess && <p className="text-xs text-green-600">✓ เปลี่ยนรหัสผ่านเรียบร้อย</p>}
        </div>
      </Card>

      {/* จัดการข้อมูล */}
      <Card>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">จัดการข้อมูล</p>
        <div className="divide-y divide-gray-100">
          <Link href="/accounts" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <Wallet className="h-4 w-4 text-gray-400" />
            <span className="flex-1">บัญชีของฉัน</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
          <Link href="/categories" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="flex-1">หมวดหมู่</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
          <Link href="/debts" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <HandCoins className="h-4 w-4 text-gray-400" />
            <span className="flex-1">หนี้สิน</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
          <Link href="/transfers" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
            <span className="flex-1">โอนเงินระหว่างบัญชี</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
          <Link href="/settings/privacy" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="flex-1">ความเป็นส่วนตัวและข้อมูล</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
        </div>
      </Card>

      {/* Admin — เฉพาะ admin email */}
      {session.user.email === 'vndn2518@gmail.com' && (
        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Admin</p>
          <Link href="/admin" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
            <BarChart2 className="h-4 w-4 text-gray-400" />
            <span className="flex-1">Analytics Dashboard</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
        </Card>
      )}

      {/* Privacy & Consent */}
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">ความเป็นส่วนตัว</p>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">ช่วยพัฒนาระบบ OCR</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ยินยอมให้แชร์ข้อมูลการแก้ไขสลิปเพื่อปรับปรุงความแม่นยำ
                  (<Link href="/privacy-policy" className="underline">นโยบายความเป็นส่วนตัว</Link>)
                </p>
              </div>
            </div>
            <button
              disabled={consentLoading || ocrConsent === null}
              onClick={() => toggleOcrConsent(!ocrConsent)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                ${ocrConsent ? 'bg-blue-600' : 'bg-gray-300'}
                disabled:opacity-50`}
              role="switch"
              aria-checked={ocrConsent ?? false}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
                ${ocrConsent ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="pt-1 flex flex-wrap gap-2 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600 underline">นโยบายความเป็นส่วนตัว</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-600 underline">เงื่อนไขการใช้งาน</Link>
          </div>
        </div>
      </Card>

      {/* App info */}
      <Card>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Info className="h-4 w-4 text-gray-400" />
          <span>MChat v1.0.0 — บันทึกรายรับรายจ่ายด้วยแชท</span>
        </div>
      </Card>

      {/* Install PWA */}
      {isInstalled ? (
        <p className="text-center text-sm text-green-600">✓ ติดตั้งแอปแล้ว</p>
      ) : installPrompt ? (
        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={handleInstall}>
          <Download className="h-4 w-4" />
          ติดตั้งแอปบนมือถือ
        </Button>
      ) : (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">ติดตั้งเป็นแอป</p>
            </div>
            <p className="text-xs text-gray-500">
              Android: กด ⋮ เมนู → <strong>เพิ่มลงในหน้าจอหลัก</strong>
            </p>
            <p className="text-xs text-gray-500">
              iOS: กด Share → <strong>Add to Home Screen</strong>
            </p>
          </div>
        </Card>
      )}

      {/* Logout */}
      <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        ออกจากระบบ
      </Button>
    </div>
  )
}
