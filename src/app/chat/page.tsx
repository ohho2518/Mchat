'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInput, ChatMessage, DateContextBar, ParsedTransactionCard } from '@/components/chat'
import { TransactionForm } from '@/components/transactions'
import { Spinner } from '@/components/ui'
import type { ParsedTransaction, Transaction } from '@/types/transaction'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
type MsgUser   = { id: string; role: 'user';   text: string }
type MsgSystem = { id: string; role: 'system'; text: string; variant?: 'default' | 'success' | 'error' }
type MsgParsed = {
  id: string; role: 'parsed'
  parsed: ParsedTransaction
  status: 'pending' | 'confirmed' | 'rejected'
  holderName?: string | null
  savedTransaction?: Transaction   // set after confirmed — used for edit
}
type MessageItem = MsgUser | MsgSystem | MsgParsed

let seq = 0
const uid     = () => String(++seq)
const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: uid(),
      role: 'system',
      text: 'สวัสดีครับ 👋 พิมพ์รายรับรายจ่ายได้เลย เช่น\n"จ่ายค่าน้ำมัน 500 วันนี้" หรือ "ขายของ 850 เงินสด"',
    },
  ])
  const [parsing,     setParsing]     = useState(false)
  const [saving,      setSaving]      = useState<string | null>(null)
  const [contextDate, setContextDate] = useState(todayStr)
  const [editTarget,  setEditTarget]  = useState<Transaction | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Parse ────────────────────────────────────────────────────────────────
  const handleSubmit = async (text: string, holderName?: string | null) => {
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
      const parsedMsg: MsgParsed = { id: uid(), role: 'parsed', parsed, status: 'pending', holderName: holderName ?? null }
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
  const handleConfirm = async (msgId: string, parsed: ParsedTransaction, holderName?: string | null) => {
    setSaving(msgId)
    try {
      // Use contextDate when it's not today, OR when parser found no date
      const useContext = contextDate !== todayStr() || !parsed.transactionDate
      const transactionDate = useContext ? contextDate : (parsed.transactionDate ?? todayStr())

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            parsed.type,
          amount:          parsed.amount,
          transactionDate,
          description:     parsed.description || parsed.rawText,
          rawText:         parsed.rawText,
          paymentMethod:   parsed.paymentMethod !== 'unknown' ? parsed.paymentMethod : undefined,
          holderName:      holderName ?? undefined,
        }),
      })

      if (!res.ok) throw new Error('save error')

      const saved: Transaction = await res.json()

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, status: 'confirmed', savedTransaction: saved } as MsgParsed
            : m
        )
      )
      setMessages((prev) => [...prev, {
        id: uid(), role: 'system',
        text: `บันทึก${parsed.type === 'income' ? 'รายรับ' : parsed.type === 'expense' ? 'รายจ่าย' : 'รายการ'} ฿${parsed.amount?.toLocaleString('th-TH')} แล้ว ✓`,
        variant: 'success',
      }])
      // Invalidate Next.js router cache so Transactions/Dashboard pages re-fetch on next visit
      router.refresh()
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

  // ─── Edit saved transaction ───────────────────────────────────────────────
  const handleEditSave = useCallback(async (id: string, data: Partial<Transaction>) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('update error')
    const updated: Transaction = await res.json()
    // Reflect update in chat history
    setMessages((prev) =>
      prev.map((m) =>
        m.role === 'parsed' && m.savedTransaction?.id === id
          ? { ...m, savedTransaction: updated } as MsgParsed
          : m
      )
    )
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 7.5rem)' }}>
      {/* Date context bar */}
      <DateContextBar
        date={contextDate}
        onChange={setContextDate}
        onReset={() => setContextDate(todayStr())}
      />

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
          const overrideDate = contextDate !== todayStr() ? contextDate : undefined
          return (
            <ParsedTransactionCard
              key={msg.id}
              parsed={msg.parsed}
              status={msg.status}
              loading={saving === msg.id}
              overrideDate={overrideDate}
              onConfirm={() => handleConfirm(msg.id, msg.parsed, msg.holderName)}
              onReject={() => handleReject(msg.id)}
              onEdit={msg.savedTransaction ? () => setEditTarget(msg.savedTransaction!) : undefined}
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
      <ChatInput
        onSubmit={handleSubmit}
        disabled={parsing || !!saving}
        onError={(msg) => setMessages((prev) => [...prev, {
          id: uid(), role: 'system', text: msg, variant: 'error',
        }])}
      />

      {/* Edit modal */}
      <TransactionForm
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
      />
    </div>
  )
}
