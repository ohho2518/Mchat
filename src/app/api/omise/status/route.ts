import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paymentId = new URL(req.url).searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
      select: { status: true },
    })
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ paid: payment.status === 'paid' })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
