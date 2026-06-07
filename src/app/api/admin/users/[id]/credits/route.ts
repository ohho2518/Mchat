import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const schema = z.object({
  credits: z.number().int().min(1).max(10_000),
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
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const user = await prisma.user.update({
      where:  { id },
      data:   { ocrCredits: { increment: parsed.data.credits } },
      select: { id: true, name: true, email: true, ocrCredits: true },
    })

    logAudit({
      actorId:    session.user.id,
      actorEmail: session.user.email!,
      action:     'admin.user.grant_credits',
      targetType: 'user',
      targetId:   id,
      metadata:   { creditsAdded: parsed.data.credits, newTotal: user.ocrCredits },
      ip:         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
