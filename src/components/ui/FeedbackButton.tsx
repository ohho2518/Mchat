'use client'
import { useState } from 'react'
import { MessageSquarePlus, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const CATEGORIES = [
  { value: 'bug',     label: 'แจ้งบัค' },
  { value: 'feature', label: 'แนะนำฟีเจอร์' },
  { value: 'general', label: 'ทั่วไป' },
] as const

type Category = typeof CATEGORIES[number]['value']

export function FeedbackButton() {
  const [open,     setOpen]     = useState(false)
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [category, setCategory] = useState<Category>('general')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)

  const reset = () => {
    setRating(0); setHovered(0)
    setCategory('general'); setMessage('')
    setSent(false)
  }

  const close = () => { setOpen(false); setTimeout(reset, 300) }

  const submit = async () => {
    if (!message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          rating:   rating || undefined,
          category,
          message:  message.trim(),
        }),
      })
      setSent(true)
    } catch { /* swallow */ } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        title="ส่งความคิดเห็น"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {/* Backdrop + Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">ความคิดเห็น</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">🙏</p>
                <p className="font-medium text-gray-800">ขอบคุณสำหรับความคิดเห็น</p>
                <p className="text-sm text-gray-500 mt-1">เราจะนำไปปรับปรุงแอปให้ดีขึ้น</p>
                <button
                  onClick={close}
                  className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700"
                >
                  ปิด
                </button>
              </div>
            ) : (
              <>
                {/* Stars */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          (hovered || rating) >= n
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 mb-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        'flex-1 rounded-xl py-1.5 text-xs font-medium border transition-colors',
                        category === c.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-600 border-gray-200 hover:border-blue-300'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="บอกเราว่าคุณพบปัญหาอะไร หรืออยากให้เพิ่มอะไร..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-400 resize-none"
                />

                <button
                  onClick={submit}
                  disabled={loading || !message.trim()}
                  className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
