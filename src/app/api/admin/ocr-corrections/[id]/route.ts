import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? 'vndn2518@gmail.com'

const BodySchema = z.object({
  action:        z.enum(['apply', 'skip', 'reject']),
  categoryId:    z.string().optional(),
  keyword:       z.string().min(1).max(100).optional(),
  reviewedType:  z.enum(['income', 'expense', 'transfer', 'debt']).optional(),
  adminNote:     z.string().max(500).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.email !== ADMIN_EMAIL()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body   = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, categoryId, keyword, reviewedType, adminNote } = parsed.data

    if (action === 'apply') {
      if (!categoryId) return NextResponse.json({ error: 'categoryId required for apply' }, { status: 400 })

      // Verify category exists (global)
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: null, isActive: true },
      })
      if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

      // Add keyword to category if provided (avoid duplicates)
      if (keyword) {
        const exists = await prisma.categoryKeyword.findFirst({
          where: { categoryId, keyword: { equals: keyword, mode: 'insensitive' } },
        })
        if (!exists) {
          await prisma.categoryKeyword.create({ data: { categoryId, keyword } })
        }
      }

      // Upsert MerchantProfile using holderName (the stable identity for this merchant)
      const correction = await prisma.ocrCorrection.findUnique({ where: { id }, select: { holderName: true } })
      const merchantName = correction?.holderName?.trim() || keyword?.trim()
      if (merchantName && reviewedType) {
        await prisma.merchantProfile.upsert({
          where:  { name: merchantName },
          create: { name: merchantName, type: reviewedType, categoryId: categoryId ?? null },
          update: { type: reviewedType, categoryId: categoryId ?? null, sourceCount: { increment: 1 } },
        })
      }

      const updated = await prisma.ocrCorrection.update({
        where: { id },
        data: {
          status:             'applied',
          reviewedType:       reviewedType ?? null,
          reviewedCategoryId: categoryId,
          adminNote:          adminNote ?? null,
          reviewedAt:         new Date(),
        },
      })
      return NextResponse.json(updated)
    }

    // skip | reject
    const updated = await prisma.ocrCorrection.update({
      where: { id },
      data: {
        status:     action === 'reject' ? 'rejected' : 'reviewed',
        adminNote:  adminNote ?? null,
        reviewedAt: new Date(),
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
