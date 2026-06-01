'use client'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

const PAGE_TITLES: Record<string, string> = {
  '/chat': 'MChat',
  '/dashboard': 'รายงาน',
  '/transactions': 'รายการ',
  '/categories': 'หมวดหมู่',
  '/settings': 'ตั้งค่า',
}

const NO_SHELL = ['/login']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'MChat'

  if (NO_SHELL.includes(pathname)) return <>{children}</>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title={title} />
      <main className="flex-1 pb-16 overflow-y-auto max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
