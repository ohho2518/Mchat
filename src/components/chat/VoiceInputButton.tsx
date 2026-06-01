'use client'
import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onResult, disabled }: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening]  = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  useEffect(() => {
    // Firefox ไม่รองรับ SpeechRecognition → ซ่อนปุ่มอัตโนมัติ
    const SR = (window as Window & typeof globalThis & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      ?? (window as Window & typeof globalThis & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    setSupported(!!SR)
  }, [])

  const toggle = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SR()
    rec.lang = 'th-TH'
    rec.continuous = false
    rec.interimResults = false
    recRef.current = rec

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript as string)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)

    rec.start()
    setListening(true)
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
        listening
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      title={listening ? 'หยุดฟัง' : 'พูดได้เลย'}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  )
}
