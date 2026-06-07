'use client'
import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'login' | 'register'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode,     setMode]     = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [name,          setName]          = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [refCode,       setRefCode]       = useState('')
  const [acceptTerms,   setAcceptTerms]   = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Auto-fill referral code from localStorage (set by /ref/:code)
  useEffect(() => {
    if (mode !== 'register') return
    const stored  = localStorage.getItem('ref_code')
    const expires = Number(localStorage.getItem('ref_code_expires') ?? 0)
    if (stored && Date.now() < expires) setRefCode(stored)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!acceptTerms) {
          setError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวก่อน')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name, email, password, refCode: refCode.trim() || undefined }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(typeof body.error === 'string' ? body.error : 'สมัครไม่สำเร็จ')
        }
        // Clear referral code from storage after successful registration
        localStorage.removeItem('ref_code')
        localStorage.removeItem('ref_code_expires')
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.ok) {
        router.push('/chat')
        router.refresh()
      } else {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Image src="/logo.png" alt="MChat" width={220} height={70} className="mx-auto" priority />
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครใช้งาน'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <Input label="ชื่อ" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อของคุณ" required />
          )}
          <Input label="อีเมล" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="รหัสผ่าน" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
            required />

          {mode === 'register' && (
            <Input
              label="รหัสแนะนำ (ถ้ามี)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              placeholder="เช่น WINIT001"
            />
          )}

          {mode === 'register' && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                ฉันได้อ่านและยอมรับ{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">เงื่อนไขการใช้งาน</a>
                {' '}และ{' '}
                <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
                {' '}รวมถึงยินยอมให้ MChat เก็บข้อมูลตามที่ระบุไว้ใน PDPA
              </span>
            </label>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครและเข้าสู่ระบบ'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
