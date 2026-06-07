import { prisma } from '@/lib/db/prisma'

export const COMMISSION_TABLE: Record<string, number> = {
  pro_monthly:       20,
  pro_yearly:       200,
  max_monthly:       50,
  max_yearly:       500,
  pro_yearly_early: 150,
  max_yearly_early: 350,
}

export function getPlanCode(plan: string, months: number): string {
  return `${plan}_${months >= 12 ? 'yearly' : 'monthly'}`
}

export function getCommissionAmount(plan: string, months: number): number {
  const code = getPlanCode(plan, months)
  const base = COMMISSION_TABLE[code] ?? 0
  // Intermediate periods (3, 6 months): prorate from monthly rate
  if (months > 1 && months < 12) return base * months
  return base
}

interface PaymentInfo {
  id:     string
  userId: string
  plan:   string
  months: number
}

export async function createCommissionAfterPayment(
  payment: PaymentInfo,
  refCode?: string | null,
): Promise<void> {
  // Prevent double-processing same payment
  const already = await prisma.commission.findFirst({ where: { paymentId: payment.id } })
  if (already) return

  // Find existing referral or create one from refCode provided at checkout
  let referral = await prisma.referral.findUnique({ where: { referredUserId: payment.userId } })

  if (!referral && refCode) {
    const code = await prisma.referralCode.findFirst({
      where: { code: refCode.toUpperCase(), status: 'active' },
    })
    // Guard: valid code, not self-referral
    if (code && code.userId !== payment.userId) {
      referral = await prisma.referral.create({
        data: {
          referrerUserId: code.userId,
          referredUserId: payment.userId,
          referralCodeId: code.id,
          status:         'paid',
          paidAt:         new Date(),
        },
      })
    }
  }

  if (!referral) return
  if (referral.referrerUserId === payment.userId) return // no self-referral

  const planCode = getPlanCode(payment.plan, payment.months)
  const amount   = getCommissionAmount(payment.plan, payment.months)
  if (amount <= 0) return

  const holdUntil = new Date()
  holdUntil.setDate(holdUntil.getDate() + 14)

  const [commission] = await prisma.$transaction([
    prisma.commission.create({
      data: {
        referrerUserId: referral.referrerUserId,
        referredUserId: payment.userId,
        referralId:     referral.id,
        paymentId:      payment.id,
        planCode,
        amount,
        status:         'pending',
        holdUntil,
      },
    }),
    ...(referral.status !== 'paid'
      ? [prisma.referral.update({ where: { id: referral.id }, data: { status: 'paid', paidAt: new Date() } })]
      : []),
  ])

  // S13: Async risk check (fire-and-forget, never blocks payment flow)
  checkCommissionRisk(commission.id, referral.referrerUserId, payment.userId).catch(
    (err) => console.error('[commission] Risk check error:', err),
  )
}

// Common free email domains — same domain on these is not suspicious
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'me.com', 'live.com', 'msn.com',
])

async function checkCommissionRisk(
  commissionId:    string,
  referrerUserId:  string,
  referredUserId:  string,
): Promise<void> {
  const [referrer, referred] = await Promise.all([
    prisma.user.findUnique({ where: { id: referrerUserId }, select: { email: true, createdAt: true } }),
    prisma.user.findUnique({ where: { id: referredUserId }, select: { email: true, createdAt: true } }),
  ])
  if (!referrer || !referred) return

  const risks: string[] = []

  // Rule 1: Same non-public email domain
  const rDomain  = referrer.email.split('@')[1]?.toLowerCase() ?? ''
  const rdDomain = referred.email.split('@')[1]?.toLowerCase() ?? ''
  if (rDomain && rDomain === rdDomain && !PUBLIC_EMAIL_DOMAINS.has(rDomain)) {
    risks.push('same_email_domain')
  }

  // Rule 2: Referrer's total commission this month > ฿5,000
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthly = await prisma.commission.aggregate({
    where: {
      referrerUserId,
      status:    { in: ['pending', 'approved'] },
      createdAt: { gte: monthStart },
    },
    _sum: { amount: true },
  })
  if (Number(monthly._sum.amount ?? 0) > 5000) {
    risks.push(`high_monthly_commission_${Math.round(Number(monthly._sum.amount))}`)
  }

  // Rule 3: Accounts created within 7 days of each other
  const daysDiff =
    (referred.createdAt.getTime() - referrer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff >= 0 && daysDiff < 7) {
    risks.push('accounts_created_within_7_days')
  }

  if (risks.length > 0) {
    await prisma.commission.update({
      where: { id: commissionId },
      data:  { riskFlag: true, riskReason: risks.join(', ') },
    })
  }
}
