import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? 'vndn2518@gmail.com'

const PostSchema = z.object({
  originalText:  z.string().min(1).max(2000),
  correctedText: z.string().min(1).max(2000),
  holderName:    z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.email !== ADMIN_EMAIL()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body   = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const correction = await prisma.ocrCorrection.create({
      data: {
        userId:        session.user.id,
        originalText:  parsed.data.originalText,
        correctedText: parsed.data.correctedText,
        holderName:    parsed.data.holderName ?? null,
        status:        'pending',
      },
    })
    return NextResponse.json(correction, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.email !== ADMIN_EMAIL()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'pending'
    const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const limit  = 20
    const skip   = (page - 1) * limit

    const where = status === 'all' ? {} : { status }

    const [data, total, globalCategories] = await Promise.all([
      prisma.ocrCorrection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.ocrCorrection.count({ where }),
      prisma.category.findMany({
        where: { userId: null, isActive: true },
        include: { keywords: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
    ])

    // Count by status for the tab badges
    const [pending, applied, reviewed, rejected] = await Promise.all([
      prisma.ocrCorrection.count({ where: { status: 'pending' } }),
      prisma.ocrCorrection.count({ where: { status: 'applied' } }),
      prisma.ocrCorrection.count({ where: { status: 'reviewed' } }),
      prisma.ocrCorrection.count({ where: { status: 'rejected' } }),
    ])

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      globalCategories,
      counts: { pending, applied, reviewed, rejected },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
