import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.json({ ok: false })

  try {
    await prisma.referralCode.updateMany({
      where: { code: code.toUpperCase(), status: 'active' },
      data:  { clicks: { increment: 1 } },
    })
  } catch { /* non-critical — ignore errors */ }

  return NextResponse.json({ ok: true })
}
