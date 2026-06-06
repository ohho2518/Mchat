import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/utils/password'
import { generateReferralCode } from '@/lib/referral'

const RegisterSchema = z.object({
  name:    z.string().min(1).max(50),
  email:   z.string().email().max(100),
  password: z.string().min(6).max(100),
  refCode: z.string().max(20).optional(),
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

async function generateUniqueCode(name: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode(name)
    const exists = await prisma.referralCode.findUnique({ where: { code } })
    if (!exists) return code
  }
  // Fallback with timestamp suffix
  return `REF${Date.now().toString(36).toUpperCase().slice(-6)}`
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

    const { name, email, password, refCode } = parsed.data

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 })
    }

    // Resolve referrer if refCode provided
    let referrerCode: { id: string; userId: string } | null = null
    if (refCode) {
      referrerCode = await prisma.referralCode.findFirst({
        where: { code: refCode.toUpperCase(), status: 'active' },
        select: { id: true, userId: true },
      })
    }

    const passwordHash = await hashPassword(password)
    const myCode = await generateUniqueCode(name)

    // Create user + their referral code in one transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { name, email, passwordHash } })

      // Give new user their own referral code
      await tx.referralCode.create({
        data: { userId: newUser.id, code: myCode },
      })

      // Link referral (if valid refCode and not self-referral)
      if (referrerCode && referrerCode.userId !== newUser.id) {
        await tx.referral.create({
          data: {
            referrerUserId: referrerCode.userId,
            referredUserId: newUser.id,
            referralCodeId: referrerCode.id,
          },
        })
      }

      return newUser
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
