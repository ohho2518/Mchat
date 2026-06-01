// MChat — Transaction Types

export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt' | 'unknown'
export type TransactionStatus = 'draft' | 'confirmed' | 'deleted'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'unknown'

export interface Transaction {
  id: string
  userId: string
  accountId?: string
  categoryId?: string
  transactionDate: string   // YYYY-MM-DD
  type: TransactionType
  amount: number
  description?: string
  rawText?: string
  paymentMethod?: PaymentMethod
  status: TransactionStatus
  createdAt: string
  updatedAt: string
  category?: Category
}

export interface ParsedTransaction {
  type: TransactionType
  amount: number | null
  transactionDate: string | null  // YYYY-MM-DD
  categoryName: string | null
  description: string
  paymentMethod: PaymentMethod
  confidence: number              // 0.0 – 1.0
  rawText: string
}

export interface CreateTransactionBody {
  type: TransactionType
  categoryId?: string
  accountId?: string
  amount: number
  transactionDate: string
  description?: string
  rawText?: string
  paymentMethod?: PaymentMethod
}

export interface TransactionFilter {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryId?: string
  keyword?: string
  page?: number
  limit?: number
}

// ─── Category ─────────────────────────────────────────────
export interface Category {
  id: string
  userId?: string
  name: string
  type: 'income' | 'expense' | 'transfer' | 'debt'
  color?: string
  icon?: string
  isDefault: boolean
  isActive: boolean
  keywords?: CategoryKeyword[]
}

export interface CategoryKeyword {
  id: string
  categoryId: string
  keyword: string
}
