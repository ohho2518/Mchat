import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { DEFAULT_REFERRAL_TERMS } from '@/lib/referral'

const SETTING_KEY = 'referral_terms'

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } })
    const terms = row ? JSON.parse(row.value) : DEFAULT_REFERRAL_TERMS
    return NextResponse.json(terms)
  } catch {
    return NextResponse.json(DEFAULT_REFERRAL_TERMS)
  }
}
