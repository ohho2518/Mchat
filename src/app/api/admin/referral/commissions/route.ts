import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const commissions = await prisma.commission.findMany({
      include: {
        referrer: { select: { name: true, email: true } },
        referral: {
          include: { referred: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(commissions)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
