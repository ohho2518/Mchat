'use client'
import { Send } from 'lucide-react'
import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils/cn'
import { VoiceInputButton } from './VoiceInputButton'

interface ChatInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex items-end gap-2 bg-white border-t border-gray-200 px-3 py-2">
      <div className={cn(
        'flex flex-1 items-end gap-1 rounded-2xl border bg-gray-50 px-3 py-2 transition-colors',
        'focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm',
        disabled && 'opacity-60'
      )}>
        <textarea
          ref={taRef}
          value={text}
          onChange={onInput}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder='เช่น "จ่ายค่าน้ำมัน 500 วันนี้"'
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-gray-400 min-h-[1.5rem]"
        />
        <VoiceInputButton
          onResult={(t) => { setText(t); taRef.current?.focus() }}
          disabled={disabled}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim() || disabled}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
