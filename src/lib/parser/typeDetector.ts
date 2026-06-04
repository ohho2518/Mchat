import type { TransactionType } from '@/types/transaction'

// Phase 3: detect transaction type — order: transfer > debt > expense > income

// ฝาก/ถอน = bank operations → always transfer (checked first, no exclusion)
const BANK_OPS_KWS = ['ถอนเงิน', 'ถอน', 'ฝากเงิน', 'ฝากเข้า', 'ฝากธนาคาร', 'ฝาก']

const TRANSFER_KWS = ['โอนจาก', 'โอนไป', 'ย้ายเงิน', 'โอนระหว่าง', 'โอนเงินออก', 'โอนเงิน', 'เติมเงินพร้อมเพย์', 'เติมพร้อมเพย์']
// คำเหล่านี้มี "โอน" แต่เป็น income (ลูกค้าโอนเข้า)
const TRANSFER_INCOME_KWS = ['รับโอน', 'โอนเข้า', 'ลูกค้าโอน', 'เงินเข้า']

const DEBT_KWS = ['ยืม', 'กู้', 'หยิบยืม', 'คืนเงิน', 'ให้ยืม', 'รับเงินยืม', 'เจ้าหนี้', 'ลูกหนี้', 'ค้างจ่าย', 'ค้างชำระ', 'ค้างอยู่']

const STRONG_EXPENSE_KWS = ['จ่าย', 'ซื้อ', 'ใช้จ่าย', 'หมดไป', 'เสียเงิน']
const WEAK_EXPENSE_KWS   = ['ค่า']

const STRONG_INCOME_KWS  = ['ขาย', 'ได้รับ', 'ได้เงิน', 'เงินเดือน', 'โบนัส', 'รายได้', 'รับโอน', 'โอนเข้า', 'ลูกค้าโอน', 'รับงาน', 'รับค่า']
const WEAK_INCOME_KWS    = ['รับ']

export function detectType(text: string): TransactionType {
  const has = (kws: string[]) => kws.some((kw) => text.includes(kw))

  // ฝาก/ถอน — bank operations เสมอ (ไม่มี exclusion)
  if (has(BANK_OPS_KWS)) return 'transfer'

  // Transfer โอนระหว่างบัญชี (ยกเว้น income words)
  if (has(TRANSFER_KWS) && !has(TRANSFER_INCOME_KWS)) return 'transfer'

  if (has(DEBT_KWS)) return 'debt'

  const strongExpense = has(STRONG_EXPENSE_KWS)
  const strongIncome  = has(STRONG_INCOME_KWS)

  if (strongExpense && !strongIncome) return 'expense'
  if (strongIncome)                   return 'income'
  if (strongExpense)                  return 'expense'

  if (has(WEAK_INCOME_KWS))  return 'income'
  if (has(WEAK_EXPENSE_KWS)) return 'expense'

  return 'unknown'
}
