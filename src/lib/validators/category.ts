import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name:     z.string().min(1, 'ชื่อหมวดหมู่ต้องไม่ว่าง').max(50),
  type:     z.enum(['income', 'expense', 'transfer', 'debt']),
  color:    z.string().optional(),
  icon:     z.string().optional(),
  keywords: z.array(z.string().min(1).max(50)).optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
