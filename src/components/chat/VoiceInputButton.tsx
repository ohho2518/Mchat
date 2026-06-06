'use client'
import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { trackEvent } from '@/lib/analytics/track'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onResult, disabled }: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef      = useRef<any>(null)
  const activeRef   = useRef(false)   // user กำลัง record อยู่จริง
  const resultRef   = useRef('')
  const silenceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    setSupported(!!SR)
    return () => { activeRef.current = false; clearSilence() }
  }, [])

  const clearSilence = () => {
    if (silenceRef.current) clearTimeout(silenceRef.current)
  }

  const resetSilenceTimer = () => {
    clearSilence()
    silenceRef.current = setTimeout(() => {
      activeRef.current = false
      recRef.current?.stop()
    }, 4000)   // 4 วิ ไม่มีเสียง → หยุด
  }

  const startRec = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR || !activeRef.current) return

    const rec = new SR()
    rec.lang           = 'th-TH'
    rec.continuous     = true
    rec.interimResults = false
    recRef.current = rec

    rec.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript
      }
      if (text) resultRef.current += (resultRef.current ? ' ' : '') + text
      resetSilenceTimer()
    }

    rec.onend = () => {
      // ถ้า user ยังไม่กดหยุด → restart อัตโนมัติ
      if (activeRef.current) {
        setTimeout(() => startRec(), 200)
      } else {
        clearSilence()
        setListening(false)
        if (resultRef.current.trim()) {
          onResult(resultRef.current.trim())
        }
        resultRef.current = ''
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return
      if (activeRef.current) {
        setTimeout(() => startRec(), 300)
      } else {
        clearSilence()
        setListening(false)
        resultRef.current = ''
      }
    }

    try {
      rec.start()
      resetSilenceTimer()
    } catch { /* already started */ }
  }

  const toggle = () => {
    if (listening) {
      activeRef.current = false
      clearSilence()
      recRef.current?.stop()
    } else {
      activeRef.current  = true
      resultRef.current  = ''
      setListening(true)
      trackEvent('voice_used')
      startRec()
    }
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
      title={listening ? 'กดเพื่อหยุด' : 'กดแล้วพูด'}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  )
}
