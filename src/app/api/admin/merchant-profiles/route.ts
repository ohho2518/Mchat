import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? 'vndn2518@gmail.com'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.email !== ADMIN_EMAIL()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const q     = searchParams.get('q') ?? ''
    const page  = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const limit = 30
    const skip  = (page - 1) * limit

    const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {}

    const [data, total] = await Promise.all([
      prisma.merchantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sourceCount: 'desc' },
        include: { category: { select: { id: true, name: true, type: true } } },
      }),
      prisma.merchantProfile.count({ where }),
    ])

    return NextResponse.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
