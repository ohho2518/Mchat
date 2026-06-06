import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { generateReferralCode } from '@/lib/referral'

async function getOrCreateReferralCode(userId: string) {
  const existing = await prisma.referralCode.findUnique({ where: { userId } })
  if (existing) return existing
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode(user?.name ?? 'USER')
    const taken = await prisma.referralCode.findUnique({ where: { code } })
    if (!taken) return prisma.referralCode.create({ data: { userId, code } })
  }
  return prisma.referralCode.create({ data: { userId, code: `REF${Date.now().toString(36).toUpperCase().slice(-6)}` } })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  try {
    const [referralCode, referrals, commissionAgg, payoutAgg] = await Promise.all([
      getOrCreateReferralCode(userId),
      prisma.referral.findMany({ where: { referrerUserId: userId } }),
      prisma.commission.groupBy({
        by: ['status'],
        where: { referrerUserId: userId },
        _sum: { amount: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { userId, status: { in: ['requested', 'processing'] } },
        _sum: { amount: true },
      }),
    ])

    const byStatus = Object.fromEntries(
      commissionAgg.map(r => [r.status, Number(r._sum.amount ?? 0)])
    )

    const approvedAmount  = byStatus.approved  ?? 0
    const pendingAmount   = byStatus.pending   ?? 0
    const paidOutAmount   = byStatus.paid      ?? 0
    const inPayoutQueue   = Number(payoutAgg._sum.amount ?? 0)
    const availableForPayout = Math.max(0, approvedAmount - inPayoutQueue)

    return NextResponse.json({
      code:               referralCode?.code ?? null,
      partnerLevel:       referralCode?.partnerLevel ?? 'user',
      clicks:             referralCode?.clicks ?? 0,
      signups:            referrals.length,
      paid:               referrals.filter(r => r.status === 'paid').length,
      pendingAmount,
      approvedAmount,
      paidOutAmount,
      availableForPayout,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
