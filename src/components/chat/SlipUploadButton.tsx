'use client'
import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface SlipUploadButtonProps {
  onResult:  (text: string) => void
  onError?:  (msg: string) => void
  disabled?: boolean
}

const MAX_SIZE_MB = 4

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

export function SlipUploadButton({ onResult, onError, disabled }: SlipUploadButtonProps) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onError?.(`ไฟล์ใหญ่เกิน ${MAX_SIZE_MB}MB`)
      return
    }

    setLoading(true)
    try {
      const { base64, mimeType } = await resizeImage(file)

      const res = await fetch('/api/parser/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await res.json()

      if (!res.ok) {
        onError?.(data.error ?? 'OCR ล้มเหลว')
        return
      }

      onResult(data.text)
    } catch {
      onError?.('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
          loading
            ? 'text-blue-500'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="ถ่ายรูปสลิป / บิล / ใบเสร็จ"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Camera className="h-4 w-4" />
        }
      </button>
    </>
  )
}
