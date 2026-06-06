import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { DEFAULT_TERMS } from '@/app/api/referral/terms/route'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const SETTING_KEY = 'referral_terms'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } })
    return NextResponse.json(row ? JSON.parse(row.value) : DEFAULT_TERMS)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    await prisma.siteSetting.upsert({
      where:  { key: SETTING_KEY },
      update: { value: JSON.stringify(body) },
      create: { key: SETTING_KEY, value: JSON.stringify(body) },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
