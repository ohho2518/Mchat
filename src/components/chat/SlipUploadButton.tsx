'use client'
import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface SlipUploadButtonProps {
  onResult:  (text: string, holderName: string | null) => void
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
  const [loading, setLoading]   = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

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

      onResult(data.text, data.holderName ?? null)
    } catch {
      onError?.('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
      if (fileRef.current)   fileRef.current.value   = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <>
      {/* เลือกจาก Gallery / Files */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {/* ถ่ายภาพจากกล้อง (mobile) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onContextMenu={(e) => { e.preventDefault(); cameraRef.current?.click() }}
        disabled={disabled || loading}
        title="แตะเพื่อเลือกรูป | กดค้างเพื่อถ่ายรูป"
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
    </>
  )
}
