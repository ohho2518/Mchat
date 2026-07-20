import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET — สถานะ subscription ของ user (auto-renew)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { plan: true, planExpiresAt: true, stripeSubscriptionId: true, subscriptionStatus: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const hasSub = Boolean(user.stripeSubscriptionId && user.subscriptionStatus)
    let cancelAtPeriodEnd = false

    // ถาม Stripe live เฉพาะ cancel_at_period_end (source of truth) — best-effort
    if (STRIPE_ENABLED && user.stripeSubscriptionId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId)
        cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end)
      } catch { /* subscription อาจถูกลบไปแล้ว — ปล่อยเป็น false */ }
    }

    return NextResponse.json({
      hasSubscription:  hasSub,
      status:           user.subscriptionStatus,
      plan:             user.plan,
      currentPeriodEnd: user.planExpiresAt,
      cancelAtPeriodEnd,
    })
  } catch (err) {
    console.error('[subscription GET] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — ยกเลิก (cancel_at_period_end) หรือกลับมาต่อ (resume)
const bodySchema = z.object({ action: z.enum(['cancel', 'resume']) })

export async function POST(req: Request) {
  try {
    if (!STRIPE_ENABLED) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { stripeSubscriptionId: true },
    })
    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    // cancel = จบเมื่อสิ้นรอบ (ผู้ใช้ยังใช้ต่อจนหมดอายุที่จ่ายไว้) · resume = ยกเลิกการยกเลิก
    const sub = await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: parsed.data.action === 'cancel',
    })

    return NextResponse.json({ ok: true, cancelAtPeriodEnd: sub.cancel_at_period_end })
  } catch (err) {
    console.error('[subscription POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
