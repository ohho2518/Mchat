import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/utils/password'

const RegisterSchema = z.object({
  name:     z.string().min(1).max(50),
  email:    z.string().email().max(100),
  password: z.string().min(6).max(100),
})

// 5 registrations per minute per IP (per serverless instance)
const registerRateMap = new Map<string, { count: number; resetAt: number }>()
function checkRegisterRate(ip: string): boolean {
  const now = Date.now()
  const entry = registerRateMap.get(ip)
  if (!entry || entry.resetAt < now) {
    registerRateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRegisterRate(ip)) {
      return NextResponse.json({ error: 'ลองใหม่ในอีกสักครู่' }, { status: 429 })
    }

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
