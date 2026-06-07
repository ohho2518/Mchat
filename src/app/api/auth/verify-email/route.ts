import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  const baseUrl = new URL(req.url).origin

  if (!token) {
    return NextResponse.redirect(new URL('/settings?verified=error', baseUrl))
  }

  try {
    const user = await prisma.user.findUnique({
      where:  { emailVerifyToken: token },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.redirect(new URL('/settings?verified=error', baseUrl))
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { emailVerified: new Date(), emailVerifyToken: null },
    })

    return NextResponse.redirect(new URL('/settings?verified=1', baseUrl))
  } catch {
    return NextResponse.redirect(new URL('/settings?verified=error', baseUrl))
  }
}
