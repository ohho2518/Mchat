'use client'
import { Camera, ImageIcon, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { trackEvent } from '@/lib/analytics/track'
import { OcrReviewModal } from './OcrReviewModal'

interface SlipUploadButtonProps {
  onResult:  (text: string, holderName: string | null) => void
  onError?:  (msg: string) => void
  disabled?: boolean
}

const MAX_SOURCE_MB = 20

interface OcrResult {
  originalText: string
  holderName:   string | null
}

function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
      URL.revokeObjectURL(url)
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

function saveCorrection(originalText: string, correctedText: string, holderName: string | null) {
  fetch('/api/ocr-corrections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ originalText, correctedText, holderName: holderName ?? undefined }),
  }).catch(() => { /* swallow */ })
}

export function SlipUploadButton({ onResult, onError, disabled }: SlipUploadButtonProps) {
  const [loading,    setLoading]    = useState(false)
  const [showMenu,   setShowMenu]   = useState(false)
  const [reviewing,  setReviewing]  = useState<OcrResult | null>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleFile = async (file: File) => {
    if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
      onError?.(`ไฟล์ใหญ่เกิน ${MAX_SOURCE_MB}MB`)
      return
    }

    setLoading(true)
    try {
      const { base64, mimeType } = await resizeImage(file)

      const res  = await fetch('/api/parser/ocr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.error ?? 'OCR ล้มเหลว')
        return
      }

      trackEvent('ocr_used', { hasHolder: !!data.holderName })
      // แสดง modal ให้ผู้ใช้ตรวจสอบและแก้ไขก่อน
      setReviewing({ originalText: data.text, holderName: data.holderName ?? null })
    } catch {
      onError?.('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
      if (fileRef.current)   fileRef.current.value   = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const handleConfirm = (finalText: string) => {
    if (!reviewing) return
    // บันทึก correction เฉพาะเมื่อ user แก้ไขข้อความ
    if (finalText !== reviewing.originalText.trim()) {
      saveCorrection(reviewing.originalText, finalText, reviewing.holderName)
      trackEvent('ocr_corrected')
    }
    setReviewing(null)
    onResult(finalText, reviewing.holderName)
  }

  const handleCancel = () => setReviewing(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* เลือกจาก Gallery / Files */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
        {/* ถ่ายภาพจากกล้อง (mobile) */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />

        {/* Mini menu */}
        {showMenu && (
          <div className="absolute bottom-10 left-0 z-50 min-w-[148px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setShowMenu(false); cameraRef.current?.click() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Camera className="h-4 w-4 text-gray-500" />
              ถ่ายรูป
            </button>
            <button
              type="button"
              onClick={() => { setShowMenu(false); fileRef.current?.click() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ImageIcon className="h-4 w-4 text-gray-500" />
              เลือกจากคลัง
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => { if (!loading) setShowMenu(v => !v) }}
          disabled={disabled || loading}
          title="อัปโหลดสลิป/บิล"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
            loading
              ? 'text-blue-500'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Camera className="h-4 w-4" />
          }
        </button>
      </div>

      {/* OCR Review Modal */}
      {reviewing && (
        <OcrReviewModal
          originalText={reviewing.originalText}
          holderName={reviewing.holderName}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
