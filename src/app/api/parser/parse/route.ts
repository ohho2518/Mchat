import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { parseTransactionText, type CategoryKeywordMap } from '@/lib/parser/parseTransactionText'
import { z } from 'zod'

const BodySchema = z.object({
  text: z.string().min(1).max(500),
})

// Cache categories per user — revalidate ทุก 5 นาที
function getCachedCategories(userId: string) {
  return unstable_cache(
    () => prisma.category.findMany({
      where: { isActive: true, OR: [{ userId: null }, { userId }] },
      include: { keywords: true },
    }),
    [`parse-categories-${userId}`],
    { revalidate: 300 }
  )()
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const categories = await getCachedCategories(session.user.id)

    const categoryMap: CategoryKeywordMap[] = categories.map((c) => ({
      categoryName: c.name,
      type:         c.type,
      keywords:     c.keywords.map((k) => k.keyword),
    }))

    const result = parseTransactionText(parsed.data.text, categoryMap)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
