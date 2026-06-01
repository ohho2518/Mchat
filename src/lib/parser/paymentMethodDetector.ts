import type { PaymentMethod } from '@/types/transaction'

// Phase 3: detect payment method from text

const CASH_KWS  = ['เงินสด', 'จ่ายสด', 'ชำระสด', 'สด']
const BANK_KWS  = ['โอน', 'พร้อมเพย์', 'promptpay', 'qr', 'เงินโอน']
const CARD_KWS  = ['บัตรเครดิต', 'บัตรเดบิต', 'บัตร', 'เครดิต', 'แตะ']

export function detectPaymentMethod(text: string): PaymentMethod {
  const lower = text.toLowerCase()
  if (CASH_KWS.some((kw) => lower.includes(kw))) return 'cash'
  if (BANK_KWS.some((kw) => lower.includes(kw))) return 'bank_transfer'
  if (CARD_KWS.some((kw) => lower.includes(kw))) return 'card'
  return 'unknown'
}
