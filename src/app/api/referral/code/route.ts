import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { generateReferralCode } from '@/lib/referral'

async function generateUnique(name: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode(name)
    const exists = await prisma.referralCode.findUnique({ where: { code } })
    if (!exists) return code
  }
  return `REF${Date.now().toString(36).toUpperCase().slice(-6)}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId: session.user.id },
    })

    // Lazy-create for users who registered before this feature
    if (!referralCode) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      })
      const code = await generateUnique(user?.name ?? 'USER')
      referralCode = await prisma.referralCode.create({
        data: { userId: session.user.id, code },
      })
    }

    return NextResponse.json(referralCode)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
