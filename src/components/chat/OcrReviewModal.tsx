'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface OcrReviewModalProps {
  originalText: string
  holderName:   string | null
  onConfirm:    (text: string) => void
  onCancel:     () => void
}

export function OcrReviewModal({ originalText, holderName, onConfirm, onCancel }: OcrReviewModalProps) {
  const [text, setText] = useState(originalText)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // auto-focus textarea on open
  useEffect(() => { taRef.current?.focus() }, [])

  const isEdited = text.trim() !== originalText.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">ตรวจสอบผล OCR</h3>
            <p className="text-xs text-gray-500 mt-0.5">แก้ไขข้อความได้ก่อนบันทึก</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* holderName badge */}
        {holderName && (
          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-xs text-gray-500">ผู้โอน/ผู้รับ:</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {holderName}
            </span>
          </div>
        )}

        {/* Editable OCR text */}
        <div className="relative">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className={cn(
              'w-full rounded-xl border p-3 text-sm outline-none resize-none transition-colors',
              isEdited
                ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                : 'border-gray-200 focus:border-blue-400'
            )}
          />
          {isEdited && (
            <span className="absolute bottom-2 right-2 text-xs text-amber-600 font-medium">แก้ไขแล้ว</span>
          )}
        </div>

        {/* Original text (collapsed if edited) */}
        {isEdited && (
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
            ต้นฉบับ: {originalText}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(text.trim())}
            disabled={!text.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isEdited ? 'ใช้ข้อความที่แก้ไข' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  )
}
