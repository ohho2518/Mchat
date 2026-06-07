import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const PatchSchema = z.object({
  type:   z.enum(['ocr_improvement']),
  agreed: z.boolean(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    const consents = await prisma.userConsent.findMany({
      where: type
        ? { userId: session.user.id, type }
        : { userId: session.user.id },
      select: { type: true, version: true, agreedAt: true },
    })

    return NextResponse.json(consents)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = PatchSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { type, agreed } = parsed.data
    const userId   = session.user.id
    const ip       = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const userAgent = req.headers.get('user-agent') ?? undefined

    if (agreed) {
      const existing = await prisma.userConsent.findFirst({ where: { userId, type } })
      if (existing) {
        await prisma.userConsent.update({
          where: { id: existing.id },
          data:  { agreedAt: new Date(), version: '2026-06', ip, userAgent },
        })
      } else {
        await prisma.userConsent.create({
          data: { userId, type, version: '2026-06', ip, userAgent },
        })
      }
    } else {
      await prisma.userConsent.deleteMany({ where: { userId, type } })
    }

    return NextResponse.json({ ok: true, agreed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
