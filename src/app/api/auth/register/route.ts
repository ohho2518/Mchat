import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/utils/password'

const RegisterSchema = z.object({
  name:     z.string().min(1).max(50),
  email:    z.string().min(3).max(100),
  password: z.string().min(6).max(100),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    await prisma.user.create({ data: { name, email, passwordHash } })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
