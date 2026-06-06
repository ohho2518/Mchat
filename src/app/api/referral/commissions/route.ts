import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const commissions = await prisma.commission.findMany({
      where: { referrerUserId: session.user.id },
      include: {
        referral: {
          include: { referred: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(commissions)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
