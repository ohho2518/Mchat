import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const BodySchema = z.object({
  rating:   z.number().int().min(1).max(5).optional(),
  category: z.enum(['bug', 'feature', 'general']),
  message:  z.string().min(1).max(1000),
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

    const feedback = await prisma.feedback.create({
      data: {
        userId:   session.user.id,
        rating:   parsed.data.rating,
        category: parsed.data.category,
        message:  parsed.data.message,
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
