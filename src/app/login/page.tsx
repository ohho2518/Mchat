'use client'
import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'login' | 'register'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode,     setMode]     = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [refCode,  setRefCode]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

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
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg">
            💬
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MChat</h1>
          <p className="mt-1 text-sm text-gray-500">บันทึกรายรับรายจ่ายด้วยแชท</p>
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
