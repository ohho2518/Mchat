import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { CreateAccountSchema } from '@/lib/validators/account'
import { PLAN_LIMITS } from '@/lib/features'
import type { Plan } from '@/lib/features'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where:   { userId: session.user.id, isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(accounts)
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

    // Enforce account limit per plan
    const plan    = (session.user.plan ?? 'free') as Plan
    const accLimit = PLAN_LIMITS[plan].accounts
    if (accLimit !== null) {
      const count = await prisma.account.count({
        where: { userId: session.user.id, isActive: true },
      })
      if (count >= accLimit) {
        return NextResponse.json({
          error: `แผน ${plan.toUpperCase()} สร้างบัญชีได้สูงสุด ${accLimit} บัญชี`,
          code:  'PLAN_LIMIT_ACCOUNTS',
          limit: accLimit,
        }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = CreateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: { ...parsed.data, userId: session.user.id },
    })

    return NextResponse.json(account, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
