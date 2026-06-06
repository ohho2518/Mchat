import { z } from 'zod'

export const CreateTransferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId:   z.string().uuid(),
  amount:        z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  transferDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description:   z.string().max(200).optional().nullable(),
})

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>
