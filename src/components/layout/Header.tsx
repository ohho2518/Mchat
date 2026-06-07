import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  title: string
  userName?: string
}

export function Header({ title, userName }: HeaderProps) {
  const initial = userName?.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {userName ? (
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="MChat" width={80} height={26} />
            <div>
              <p className="text-xs text-gray-400">สวัสดี</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
            </div>
          </div>
        ) : (
          <Image src="/logo.png" alt="MChat" width={80} height={26} />
        )}
        {initial && (
          <div className="flex items-center gap-2">
            <Link
              href="/referral"
              className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              💰 แนะนำเพื่อน
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initial}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
