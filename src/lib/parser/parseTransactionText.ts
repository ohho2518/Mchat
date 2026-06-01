// MChat — Thai Transaction Parser (Rule-based)
// Phase 3: Core business logic

import { ParsedTransaction, TransactionType, PaymentMethod } from '@/types/transaction'
import { normalize } from './normalize'
import { extractAmount } from './amountParser'
import { extractDate } from './dateParser'
import { detectType } from './typeDetector'
import { detectCategory } from './categoryDetector'
import { detectPaymentMethod } from './paymentMethodDetector'

export interface CategoryKeywordMap {
  categoryName: string
  type: string
  keywords: string[]
}

interface ParseParts {
  amount: number | null
  date: string | null
  type: TransactionType
  category: string | null
  method: PaymentMethod
  description: string
}

const DATE_WORDS = ['วันนี้', 'เมื่อวาน', 'เมื่อวานนี้', 'พรุ่งนี้', 'วันที่']
const PAYMENT_WORDS = ['เงินสด', 'จ่ายสด', 'ชำระสด', 'สด', 'โอน', 'พร้อมเพย์', 'บัตร', 'บัตรเครดิต']

function extractDescription(text: string, amount: number | null): string {
  let result = text
  if (amount !== null) {
    result = result.replace(new RegExp(`${amount}(?:\\s*บาท|\\s*฿|\\s*[kK])?`), ' ')
  }
  for (const w of [...DATE_WORDS, ...PAYMENT_WORDS]) {
    result = result.replace(new RegExp(w, 'g'), '')
  }
  return result.replace(/\s+/g, ' ').trim().slice(0, 100)
}

function calculateConfidence(parts: ParseParts): number {
  let score = 0
  // amount + type เป็น 2 องค์ประกอบหลัก รวมกัน 0.65 → ผ่าน threshold 0.60 ทันที
  if (parts.amount   !== null)       score += 0.35
  if (parts.type     !== 'unknown')  score += 0.30
  if (parts.category !== null)       score += 0.15
  if (parts.date     !== null)       score += 0.10
  if (parts.method   !== 'unknown')  score += 0.05
  if (parts.description.length > 0)  score += 0.05
  return Math.min(score, 1.0)
}

export function parseTransactionText(
  input: string,
  categories: CategoryKeywordMap[] = []
): ParsedTransaction {
  const normalized = normalize(input)
  const amount     = extractAmount(normalized)
  const date       = extractDate(normalized)
  let   type       = detectType(normalized)
  const category   = detectCategory(normalized, categories, type)

  // Fallback: ถ้า type unknown แต่ตรวจ category ได้ ให้ใช้ type ของ category นั้น
  if (type === 'unknown' && category !== null) {
    const matched = categories.find((c) => c.categoryName === category)
    if (matched && matched.type !== 'unknown') {
      type = matched.type as TransactionType
    }
  }

  const method      = detectPaymentMethod(normalized)
  const description = extractDescription(normalized, amount)

  const parts: ParseParts = { amount, date, type, category, method, description }
  const confidence = calculateConfidence(parts)

  return {
    type,
    amount,
    transactionDate: date,
    categoryName: category,
    description,
    paymentMethod: method,
    confidence,
    rawText: input,
  }
}
