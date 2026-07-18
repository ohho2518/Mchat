import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/stripe/status?session_id=cs_xxx → { status } ของ Payment ที่ผูกกับ session นี้
// หน้า /pricing เรียก poll หลัง redirect กลับจาก Checkout เพื่อดูว่า webhook fulfill แล้วหรือยัง
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = new URL(req.url).searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where:  { stripeSessionId: sessionId, userId: session.user.id },
      select: { status: true, plan: true, credits: true },
    })
    if (!payment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: payment.status,          // pending | paid | failed
      paid:   payment.status === 'paid',
      plan:   payment.plan,
      credits: payment.credits,
    })
  } catch (err) {
    console.error('[stripe status] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
