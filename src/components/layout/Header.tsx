interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}
