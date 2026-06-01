'use client'
import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onResult, disabled }: VoiceInputButtonProps) {
  const [supported, setSupported]   = useState(false)
  const [listening, setListening]   = useState(false)
  const recRef     = useRef<any>(null)
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultRef  = useRef<string>('')

  useEffect(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    setSupported(!!SR)
    return () => clearSilence()
  }, [])

  const clearSilence = () => {
    if (silenceRef.current) clearTimeout(silenceRef.current)
  }

  const resetSilenceTimer = () => {
    clearSilence()
    // auto-stop หลังเงียบ 3 วิ
    silenceRef.current = setTimeout(() => stopRec(), 3000)
  }

  const stopRec = () => {
    clearSilence()
    recRef.current?.stop()
  }

  const toggle = () => {
    if (listening) { stopRec(); return }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.lang           = 'th-TH'
    rec.continuous     = true    // ไม่หยุดเองหลังเงียบ
    rec.interimResults = true    // รับผลระหว่างพูด
    recRef.current  = rec
    resultRef.current = ''

    rec.onresult = (e: any) => {
      // รวม final results ทั้งหมด
      let finals = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finals += e.results[i][0].transcript
      }
      if (finals) resultRef.current = finals
      resetSilenceTimer()
    }

    rec.onspeechstart = () => resetSilenceTimer()

    rec.onend = () => {
      clearSilence()
      setListening(false)
      if (resultRef.current.trim()) onResult(resultRef.current.trim())
      resultRef.current = ''
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') { stopRec(); return }
      clearSilence()
      setListening(false)
      resultRef.current = ''
    }

    rec.start()
    setListening(true)
    resetSilenceTimer()
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
