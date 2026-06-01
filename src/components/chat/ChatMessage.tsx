import { cn } from '@/lib/utils/cn'

interface ChatMessageProps {
  role: 'user' | 'system'
  text: string
  variant?: 'default' | 'success' | 'error'
}

export function ChatMessage({ role, text, variant = 'default' }: ChatMessageProps) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-blue-600 text-white rounded-br-sm'
          : cn(
              'rounded-bl-sm shadow-sm',
              variant === 'success' && 'bg-green-50 text-green-800 border border-green-200',
              variant === 'error'   && 'bg-red-50 text-red-800 border border-red-200',
              variant === 'default' && 'bg-white text-gray-800 border border-gray-100',
            )
      )}>
        {text}
      </div>
    </div>
  )
}
