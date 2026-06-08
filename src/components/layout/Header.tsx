import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  title: string
  userName?: string
}

const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function formatBuildTime(iso: string | undefined): string {
  if (!iso) return ''
  // Shift UTC → Thailand Standard Time (UTC+7)
  const thai = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000)
  const day   = thai.getUTCDate()
  const month = MONTHS_SHORT[thai.getUTCMonth()]
  const year  = (thai.getUTCFullYear() + 543).toString().slice(2)
  const hh    = String(thai.getUTCHours()).padStart(2, '0')
  const mm    = String(thai.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm}`
}

export function Header({ title, userName }: HeaderProps) {
  const initial     = userName?.charAt(0).toUpperCase()
  const version     = process.env.NEXT_PUBLIC_APP_VERSION
  const buildTime   = formatBuildTime(process.env.NEXT_PUBLIC_BUILD_TIME)

  const LogoBlock = (
    <div className="flex flex-col">
      <Image src="/logo.png" alt="MChat" width={90} height={45} />
      {version && (
        <span className="text-[9px] text-gray-400 leading-none pl-0.5 -mt-1">
          v{version} · {buildTime}
        </span>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {userName ? (
          <div className="flex items-center gap-2">
            {LogoBlock}
            <div>
              <p className="text-xs text-gray-400">สวัสดี</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
            </div>
          </div>
        ) : (
          LogoBlock
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
