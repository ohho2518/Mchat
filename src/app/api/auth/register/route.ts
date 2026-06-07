import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/utils/password'
import { generateReferralCode } from '@/lib/referral'
import { sendEmail, buildVerifyEmailHtml } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'

const RegisterSchema = z.object({
  name:    z.string().min(1).max(50),
  email:   z.string().email().max(100),
  password: z.string().min(6).max(100),
  refCode: z.string().max(20).optional(),
})

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
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const allowed  = await checkRateLimit(`register:${clientIp}`, 5, 60_000)
    if (!allowed) {
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

    const passwordHash     = await hashPassword(password)
    const myCode           = await generateUniqueCode(name)
    const emailVerifyToken = crypto.randomUUID()

    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const userAgent = req.headers.get('user-agent') ?? undefined

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { name, email, passwordHash, emailVerifyToken } })

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

      // Record PDPA consent
      await tx.userConsent.createMany({
        data: [
          { userId: newUser.id, type: 'privacy_policy', version: '2026-06', ip, userAgent },
          { userId: newUser.id, type: 'terms',          version: '2026-06', ip, userAgent },
        ],
      })

      return newUser
    })

    // Send verification email (fire-and-forget)
    const baseUrl   = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerifyToken}`
    sendEmail({
      to:      email,
      subject: 'ยืนยันอีเมล MChat ของคุณ',
      html:    buildVerifyEmailHtml(name, verifyUrl),
    }).catch(() => {})

    // If no email provider → auto-verify so user isn't stuck
    if (!process.env.RESEND_API_KEY) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { emailVerified: new Date(), emailVerifyToken: null },
      })
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
