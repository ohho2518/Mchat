'use client'
import { Calendar, X } from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'

interface DateContextBarProps {
  date:     string          // YYYY-MM-DD
  onChange: (d: string) => void
  onReset:  () => void
}

export function DateContextBar({ date, onChange, onReset }: DateContextBarProps) {
  let isDefault = false
  try { isDefault = isToday(parseISO(date)) } catch { isDefault = true }

  const label = isDefault
    ? 'บันทึกสำหรับวันนี้'
    : `บันทึกสำหรับ ${format(parseISO(date), 'd MMM yyyy', { locale: th })}`

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-xs border-b transition-colors ${
      isDefault ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200'
    }`}>
      <Calendar className={`h-3.5 w-3.5 shrink-0 ${isDefault ? 'text-gray-400' : 'text-blue-500'}`} />
      <span className={isDefault ? 'text-gray-400' : 'text-blue-700 font-medium'}>
        {label}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-7 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
        />
        {!isDefault && (
          <button
            onClick={onReset}
            title="กลับเป็นวันนี้"
            className="rounded-lg p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
