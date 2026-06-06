import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id:           true,
        name:         true,
        email:        true,
        plan:         true,
        planExpiresAt: true,
        createdAt:    true,
        _count: {
          select: {
            transactions: { where: { status: { not: 'deleted' } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
