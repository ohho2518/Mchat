import { cn } from '@/lib/utils/cn'
import type { TransactionType } from '@/types/transaction'
import { HTMLAttributes } from 'react'

type BadgeVariant = TransactionType | 'default' | 'success' | 'warning' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const VARIANTS: Record<BadgeVariant, string> = {
  income:  'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
  transfer:'bg-blue-100 text-blue-700',
  debt:    'bg-orange-100 text-orange-700',
  unknown: 'bg-gray-100 text-gray-600',
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info:    'bg-blue-100 text-blue-700',
}

const DEFAULT_LABELS: Partial<Record<BadgeVariant, string>> = {
  income:   'รายรับ',
  expense:  'รายจ่าย',
  transfer: 'โอนเงิน',
  debt:     'หนี้สิน',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children ?? DEFAULT_LABELS[variant]}
    </span>
  )
}
