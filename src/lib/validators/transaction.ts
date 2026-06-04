import { z } from 'zod'

const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'debt', 'unknown'])
const PaymentMethodSchema   = z.enum(['cash', 'bank_transfer', 'card', 'unknown'])

export const CreateTransactionSchema = z.object({
  type:            TransactionTypeSchema,
  amount:          z.number().positive(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ต้องเป็นรูปแบบ YYYY-MM-DD'),
  categoryId:      z.string().optional(),
  accountId:       z.string().optional(),
  description:     z.string().optional(),
  rawText:         z.string().optional(),
  paymentMethod:   PaymentMethodSchema.optional(),
})

export const UpdateTransactionSchema = CreateTransactionSchema.partial()

export const TransactionFilterSchema = z.object({
  startDate:  z.string().optional(),
  endDate:    z.string().optional(),
  type:       TransactionTypeSchema.optional(),
  categoryId: z.string().optional(),
  keyword:    z.string().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(10000).default(20),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
export type TransactionFilterInput = z.infer<typeof TransactionFilterSchema>
