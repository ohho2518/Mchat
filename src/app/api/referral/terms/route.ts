import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const SETTING_KEY = 'referral_terms'

export const DEFAULT_TERMS = {
  commissions: [
    { plan: 'Pro รายเดือน',  code: 'pro_monthly',  amount: 20 },
    { plan: 'Pro รายปี',     code: 'pro_yearly',   amount: 200 },
    { plan: 'Max รายเดือน', code: 'max_monthly',  amount: 50 },
    { plan: 'Max รายปี',    code: 'max_yearly',   amount: 500 },
  ],
  holdDays:   14,
  minPayout:  300,
  payoutDay:  15,
  extraNote:  '',
}

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } })
    const terms = row ? JSON.parse(row.value) : DEFAULT_TERMS
    return NextResponse.json(terms)
  } catch {
    return NextResponse.json(DEFAULT_TERMS)
  }
}
