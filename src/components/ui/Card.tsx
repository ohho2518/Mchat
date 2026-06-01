import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  noPadding?: boolean
}

export function Card({ className, title, noPadding, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-gray-100', className)}
      {...props}
    >
      {title && (
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-4')}>{children}</div>
    </div>
  )
}
