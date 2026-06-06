import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getOmiseClient, OMISE_ENABLED } from '@/lib/omise'

// GET /api/omise/qr?paymentId=xxx
// Server-side proxy — fetches QR image from Omise CDN and serves as download
export async function GET(req: Request) {
  if (!OMISE_ENABLED) return NextResponse.json({ error: 'Omise not configured' }, { status: 503 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paymentId = new URL(req.url).searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
      select: { omiseChargeId: true, plan: true, amount: true },
    })
    if (!payment?.omiseChargeId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Retrieve charge from Omise to get the latest QR URL
    const omise = getOmiseClient()
    const charge = await new Promise<{ source?: { scannable_code?: { image?: { download_uri?: string } } } }>(
      (resolve, reject) => omise.charges.retrieve(payment.omiseChargeId, (err: unknown, res: unknown) =>
        err ? reject(err) : resolve(res as { source?: { scannable_code?: { image?: { download_uri?: string } } } })
      )
    )

    const qrUrl = charge?.source?.scannable_code?.image?.download_uri
    if (!qrUrl) return NextResponse.json({ error: 'QR not available' }, { status: 404 })

    // Fetch and proxy the image
    const imgRes = await fetch(qrUrl)
    if (!imgRes.ok) return NextResponse.json({ error: 'Failed to fetch QR' }, { status: 502 })

    const blob = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') ?? 'image/png'
    const filename = `promptpay-${payment.plan}-${Math.round(Number(payment.amount))}thb.png`

    return new NextResponse(blob, {
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'private, max-age=300',
      },
    })
  } catch (err) {
    console.error('QR proxy error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
