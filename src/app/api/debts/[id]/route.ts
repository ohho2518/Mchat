import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { UpdateDebtSchema } from '@/lib/validators/debt'

async function getOwned(id: string, userId: string) {
  return prisma.debt.findFirst({ where: { id, userId, status: { not: 'cancelled' } } })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOwned(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { dueDate, remainingAmount, ...rest } = parsed.data

    // auto-derive status from remainingAmount
    let status = rest.status
    if (remainingAmount !== undefined && !rest.status) {
      status = remainingAmount <= 0 ? 'paid' : 'partial'
    }

    const debt = await prisma.debt.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status }),
        ...(remainingAmount !== undefined && { remainingAmount }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    })

    return NextResponse.json(debt)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOwned(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.debt.update({ where: { id }, data: { status: 'cancelled' } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
