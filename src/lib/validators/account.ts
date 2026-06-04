import { z } from 'zod'

export const ACCOUNT_TYPES = ['cash', 'bank', 'wallet', 'business', 'farm', 'other'] as const

export const CreateAccountSchema = z.object({
  name:           z.string().min(1, 'กรุณาระบุชื่อบัญชี').max(50),
  type:           z.enum(ACCOUNT_TYPES),
  openingBalance: z.coerce.number().default(0),
})

export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>
