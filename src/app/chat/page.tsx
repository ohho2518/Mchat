'use client'
import { useEffect, useRef, useState } from 'react'
import { ChatInput, ChatMessage, ParsedTransactionCard } from '@/components/chat'
import { Spinner } from '@/components/ui'
import type { ParsedTransaction } from '@/types/transaction'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
type MsgUser   = { id: string; role: 'user';   text: string }
type MsgSystem = { id: string; role: 'system'; text: string; variant?: 'default' | 'success' | 'error' }
type MsgParsed = { id: string; role: 'parsed'; parsed: ParsedTransaction; status: 'pending' | 'confirmed' | 'rejected' }
type MessageItem = MsgUser | MsgSystem | MsgParsed

let seq = 0
const uid = () => String(++seq)

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: uid(),
      role: 'system',
      text: 'สวัสดีครับ 👋 พิมพ์รายรับรายจ่ายได้เลย เช่น\n"จ่ายค่าน้ำมัน 500 วันนี้" หรือ "ขายของ 850 เงินสด"',
    },
  ])
  const [parsing,  setParsing]  = useState(false)
  const [saving,   setSaving]   = useState<string | null>(null) // id ของ parsed msg ที่กำลัง save
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Parse ────────────────────────────────────────────────────────────────
  const handleSubmit = async (text: string) => {
    const userMsg: MsgUser = { id: uid(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setParsing(true)

    try {
      const res = await fetch('/api/parser/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (res.status === 401) {
        setMessages((prev) => [...prev, {
          id: uid(), role: 'system', text: 'กรุณาเข้าสู่ระบบก่อนบันทึกรายการ', variant: 'error',
        }])
        return
      }

      if (!res.ok) throw new Error('parse error')

      const parsed: ParsedTransaction = await res.json()
      const parsedMsg: MsgParsed = { id: uid(), role: 'parsed', parsed, status: 'pending' }
      setMessages((prev) => [...prev, parsedMsg])
    } catch {
      setMessages((prev) => [...prev, {
        id: uid(), role: 'system', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', variant: 'error',
      }])
    } finally {
      setParsing(false)
    }
  }

  // ─── Confirm ──────────────────────────────────────────────────────────────
  const handleConfirm = async (msgId: string, parsed: ParsedTransaction) => {
    setSaving(msgId)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            parsed.type,
          amount:          parsed.amount,
          transactionDate: parsed.transactionDate ?? todayStr(),
          categoryId:      undefined,
          description:     parsed.description || parsed.rawText,
          rawText:         parsed.rawText,
          paymentMethod:   parsed.paymentMethod !== 'unknown' ? parsed.paymentMethod : undefined,
        }),
      })

      if (!res.ok) throw new Error('save error')

      // อัปเดต card status → confirmed
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, status: 'confirmed' } as MsgParsed : m)
      )
      setMessages((prev) => [...prev, {
        id: uid(), role: 'system',
        text: `บันทึก${parsed.type === 'income' ? 'รายรับ' : parsed.type === 'expense' ? 'รายจ่าย' : 'รายการ'} ฿${parsed.amount?.toLocaleString('th-TH')} แล้ว ✓`,
        variant: 'success',
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: uid(), role: 'system', text: 'บันทึกไม่สำเร็จ กรุณาลองใหม่', variant: 'error',
      }])
    } finally {
      setSaving(null)
    }
  }

  // ─── Reject ───────────────────────────────────────────────────────────────
  const handleReject = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, status: 'rejected' } as MsgParsed : m)
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 7.5rem)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return <ChatMessage key={msg.id} role="user" text={msg.text} />
          }
          if (msg.role === 'system') {
            return <ChatMessage key={msg.id} role="system" text={msg.text} variant={msg.variant} />
          }
          // parsed card
          return (
            <ParsedTransactionCard
              key={msg.id}
              parsed={msg.parsed}
              status={msg.status}
              loading={saving === msg.id}
              onConfirm={() => handleConfirm(msg.id, msg.parsed)}
              onReject={() => handleReject(msg.id)}
            />
          )
        })}

        {/* Parsing spinner */}
        {parsing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm px-4 py-3">
              <Spinner size="sm" />
              <span className="text-sm text-gray-500">กำลังวิเคราะห์...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSubmit={handleSubmit} disabled={parsing || !!saving} />
    </div>
  )
}
