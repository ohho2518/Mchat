import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const BodySchema = z.object({
  originalText:  z.string().min(1).max(2000),
  correctedText: z.string().min(1).max(2000),
  holderName:    z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // บันทึกเฉพาะเมื่อ corrected ≠ original
    if (parsed.data.originalText === parsed.data.correctedText) {
      return NextResponse.json({ ok: true, saved: false })
    }

    await prisma.ocrCorrection.create({
      data: {
        userId:        session.user.id,
        originalText:  parsed.data.originalText,
        correctedText: parsed.data.correctedText,
        holderName:    parsed.data.holderName,
      },
    })

    return NextResponse.json({ ok: true, saved: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'vndn2518@gmail.com'
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const corrections = await prisma.ocrCorrection.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })

    return NextResponse.json(corrections)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
