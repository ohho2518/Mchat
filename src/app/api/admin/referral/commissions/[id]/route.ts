import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const schema = z.object({
  action: z.enum(['approve', 'cancel']),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { id } = await params
  const { action } = parsed.data

  try {
    const commission = await prisma.commission.findUnique({ where: { id } })
    if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (commission.status !== 'pending') {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 409 })
    }

    if (action === 'approve' && new Date() < commission.holdUntil) {
      return NextResponse.json(
        { error: `Hold period ยังไม่ครบ (ครบ ${commission.holdUntil.toLocaleDateString('th-TH')})` },
        { status: 400 }
      )
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: {
        status:     action === 'approve' ? 'approved' : 'canceled',
        approvedAt: action === 'approve' ? new Date() : null,
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
