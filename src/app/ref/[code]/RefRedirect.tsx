'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RefRedirect({ code }: { code: string }) {
  const router = useRouter()

  useEffect(() => {
    // Store referral code in localStorage — 30 day expiry
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000
    localStorage.setItem('ref_code', code)
    localStorage.setItem('ref_code_expires', String(expires))

    // Record click (fire-and-forget)
    fetch(`/api/ref/click?code=${code}`, { method: 'POST' }).catch(() => {})

    router.push('/download')
  }, [code, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-400">กำลังนำทาง...</p>
    </div>
  )
}
