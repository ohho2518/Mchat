import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const PatchPlanSchema = z.object({
  plan:   z.enum(['free', 'pro', 'max']),
  months: z.number().int().min(0).max(24).default(1),
  amount: z.number().min(0).default(0),
  method: z.enum(['manual', 'promptpay']).default('manual'),
  note:   z.string().max(200).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = PatchPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { plan, months, amount, method, note } = parsed.data

    let planExpiresAt: Date | null = null
    if (plan !== 'free' && months > 0) {
      const base = new Date()
      planExpiresAt = new Date(base)
      planExpiresAt.setMonth(planExpiresAt.getMonth() + months)
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data:  { plan, planExpiresAt },
        select: { id: true, name: true, email: true, plan: true, planExpiresAt: true },
      }),
      prisma.payment.create({
        data: { userId: id, plan, months, amount, method, note, status: 'paid', paidAt: new Date() },
      }),
    ])

    logAudit({
      actorId:    session.user.id,
      actorEmail: session.user.email!,
      action:     'admin.user.plan_change',
      targetType: 'user',
      targetId:   id,
      metadata:   { plan, months, amount, method },
      ip:         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
