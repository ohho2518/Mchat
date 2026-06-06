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

  await prisma.$transaction([
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
    // Mark referral as paid on first commission
    ...(referral.status !== 'paid'
      ? [prisma.referral.update({ where: { id: referral.id }, data: { status: 'paid', paidAt: new Date() } })]
      : []),
  ])
}
