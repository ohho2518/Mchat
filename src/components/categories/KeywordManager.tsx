'use client'
import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface KeywordManagerProps {
  keywords: string[]
  onChange: (kws: string[]) => void
  disabled?: boolean
}

export function KeywordManager({ keywords, onChange, disabled }: KeywordManagerProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const kw = input.trim()
    if (!kw || keywords.includes(kw)) return
    onChange([...keywords, kw])
    setInput('')
  }

  const remove = (kw: string) => onChange(keywords.filter((k) => k !== kw))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && keywords.length) {
      remove(keywords[keywords.length - 1])
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Keywords (สำหรับ parser)</label>

      {/* Chips */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 border border-blue-200"
            >
              {kw}
              {!disabled && (
                <button type="button" onClick={() => remove(kw)} className="text-blue-400 hover:text-blue-700">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="พิมพ์ keyword แล้วกด Enter"
            className={cn(
              'h-9 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            )}
          />
          <button
            type="button"
            onClick={add}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
