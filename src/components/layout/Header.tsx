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
          <div>
            <p className="text-xs text-gray-400">สวัสดี</p>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">{userName}</h1>
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
        {initial && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {initial}
          </div>
        )}
      </div>
    </header>
  )
}
