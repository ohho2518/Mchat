import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const schema = z.object({
  action:    z.enum(['pay', 'reject']),
  adminNote: z.string().max(200).optional(),
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
  const { action, adminNote } = parsed.data

  try {
    const payout = await prisma.payoutRequest.findUnique({ where: { id } })
    if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!['requested', 'processing'].includes(payout.status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 409 })
    }

    if (action === 'pay') {
      // Mark payout paid + mark corresponding commissions as paid
      await prisma.$transaction([
        prisma.payoutRequest.update({
          where: { id },
          data: { status: 'paid', paidAt: new Date(), adminNote: adminNote ?? null },
        }),
        prisma.commission.updateMany({
          where: { referrerUserId: payout.userId, status: 'approved' },
          data:  { status: 'paid', paidAt: new Date() },
        }),
      ])
    } else {
      await prisma.payoutRequest.update({
        where: { id },
        data: { status: 'rejected', adminNote: adminNote ?? null },
      })
    }

    logAudit({
      actorId:    session.user.id,
      actorEmail: session.user.email!,
      action:     `admin.payout.${action}`,
      targetType: 'payout',
      targetId:   id,
      metadata:   { userId: payout.userId, amount: payout.amount, adminNote },
      ip:         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
