import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateCategorySchema } from '@/lib/validators/category'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: null },
          { userId: session.user.id },
        ],
      },
      include: { keywords: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Enforce custom category limit per plan
    const plan      = (session.user.plan ?? 'free') as Plan
    const catLimit  = PLAN_LIMITS[plan].categories
    if (catLimit !== null) {
      const count = await prisma.category.count({
        where: { userId: session.user.id, isActive: true },
      })
      if (count >= catLimit) {
        return NextResponse.json({
          error: `แผน ${plan.toUpperCase()} สร้างหมวดหมู่ได้สูงสุด ${catLimit} หมวดหมู่`,
          code:  'PLAN_LIMIT_CATEGORIES',
          limit: catLimit,
        }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = CreateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { keywords, ...categoryData } = parsed.data

    const category = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.create({
        data: { ...categoryData, userId: session.user.id, isDefault: false },
      })
      if (keywords?.length) {
        await tx.categoryKeyword.createMany({
          data: keywords.map((kw) => ({ categoryId: cat.id, keyword: kw })),
        })
      }
      return tx.category.findUnique({ where: { id: cat.id }, include: { keywords: true } })
    })

    return NextResponse.json(category, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
