import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const transfer = await prisma.transfer.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!transfer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // soft-delete Transaction
      await tx.transaction.update({
        where: { id: transfer.transactionId },
        data:  { status: 'deleted' },
      })
      // hard-delete Transfer record
      await tx.transfer.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
