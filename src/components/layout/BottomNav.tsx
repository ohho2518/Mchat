'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, BarChart2, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/chat', label: 'บันทึก', icon: MessageCircle },
  { href: '/dashboard', label: 'รายงาน', icon: BarChart2 },
  { href: '/transactions', label: 'รายการ', icon: List },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
                active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className={cn('font-medium', active && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
