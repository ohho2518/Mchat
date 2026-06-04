'use client'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

const PAGE_TITLES: Record<string, string> = {
  '/chat': 'MChat',
  '/dashboard': 'รายงาน',
  '/transactions': 'รายการ',
  '/categories': 'หมวดหมู่',
  '/accounts': 'บัญชีของฉัน',
  '/debts':    'หนี้สิน',
  '/settings': 'ตั้งค่า',
}

const NO_SHELL = ['/login']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const title = PAGE_TITLES[pathname] ?? 'MChat'
  const isChat = pathname === '/chat'

  if (NO_SHELL.includes(pathname)) return <>{children}</>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        title={title}
        userName={isChat ? (session?.user?.name ?? undefined) : undefined}
      />
      <main className="flex-1 pb-16 overflow-y-auto max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
