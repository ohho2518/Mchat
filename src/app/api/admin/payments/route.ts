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

    const payments = await prisma.payment.findMany({
      where:   { status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true, plan: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(payments)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
