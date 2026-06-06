'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/track'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname === '/login') return
    trackEvent('page_view', { page: pathname })
  }, [pathname])

  return null
}
