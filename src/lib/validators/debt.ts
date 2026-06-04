import { z } from 'zod'

export const CreateDebtSchema = z.object({
  personName:  z.string().min(1, 'กรุณาระบุชื่อ').max(100).optional(),
  debtType:    z.enum(['borrowed_from_other', 'lent_to_other', 'receivable', 'payable']),
  amount:      z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  dueDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
})

export const UpdateDebtSchema = z.object({
  personName:      z.string().min(1).max(100).optional().nullable(),
  debtType:        z.enum(['borrowed_from_other', 'lent_to_other', 'receivable', 'payable']).optional(),
  amount:          z.number().positive().optional(),
  remainingAmount: z.number().min(0).optional(),
  dueDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status:          z.enum(['open', 'partial', 'paid', 'cancelled']).optional(),
  description:     z.string().max(200).optional().nullable(),
})

export type CreateDebtInput = z.infer<typeof CreateDebtSchema>
export type UpdateDebtInput = z.infer<typeof UpdateDebtSchema>
