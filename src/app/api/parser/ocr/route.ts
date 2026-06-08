import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { PLAN_LIMITS, getThaiMonth } from '@/lib/features'
import type { Plan } from '@/lib/features'
import { checkRateLimit } from '@/lib/ratelimit'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_B64_LEN  = 20 * 1024 * 1024

const BASE_PROMPT = `คุณคือผู้ช่วยอ่านสลิปธนาคาร บิล และใบเสร็จภาษาไทย

ดูรูปภาพนี้แล้วตอบเป็น JSON ตามรูปแบบนี้เท่านั้น:
{
  "text": "ประโยคสรุป 1 บรรทัดภาษาไทย",
  "holderName": "ชื่อคู่ค้า (null ถ้าไม่เห็น)"
}

─── ชื่อบัญชีของเจ้าของระบบ ───
บัญชีที่ลงทะเบียนไว้: {ACCOUNT_NAMES}
ถ้าชื่อในสลิปตรงหรือคล้ายกับชื่อบัญชีใดข้างต้น = เป็นบัญชีของเจ้าของระบบ

─── กฎการเลือกยอดเงิน (สำคัญที่สุด) ───
0. ใช้ยอดที่จ่ายจริงเท่านั้น คือช่องที่มีชื่อว่า "จำนวนเงินที่ชำระ" / "ยอดชำระ" / "ยอดสุทธิ" / "รวมทั้งสิ้น" / "Total"
   ห้ามใช้ยอดก่อนหักส่วนลด (เช่น "ค่าสินค้า/บริการ") หรือยอดส่วนลด/สิทธิ (มีเครื่องหมาย "-" หรือคำว่า "ลด" / "สิทธิ" / "Discount" / "Cashback")
   ตัวอย่าง: ค่าสินค้า 333 บาท, สิทธิไทยช่วยไทย -199.80 บาท, จำนวนเงินที่ชำระ 133.20 บาท → ใช้ 133.20

─── กฎการระบุทิศทางเงิน (ใช้ตามลำดับ — หยุดเมื่อพบกฎแรกที่ตรง) ───
1. ถ้าผู้รับ/ถึงเป็นชื่อร้านค้า / บริษัท / แบรนด์ หรือมีคำว่าประเภทธุรกิจ (ไม่ใช่ชื่อบุคคล)
   → รายจ่าย → ขึ้นต้นด้วย "ชำระ"

2. ถ้าชื่อ "ถึง" / "ผู้รับ" / "Receiver" ตรงกับบัญชีของเจ้าของระบบ
   → รายรับ → ขึ้นต้นด้วย "รับโอน"

3. ถ้าผู้โอน = บัญชีเจ้าของระบบ AND ผู้รับ = บัญชีเจ้าของระบบอีกใบหนึ่ง
   → โอนระหว่างบัญชีตัวเอง → ขึ้นต้นด้วย "โอนเงิน"

4. ถ้าผู้โอน = บัญชีเจ้าของระบบ AND ผู้รับเป็นบุคคล (ไม่ใช่บัญชีตัวเอง ไม่ใช่ร้านค้า)
   → รายจ่าย → ขึ้นต้นด้วย "จ่าย"

─── กฎการใส่รายละเอียด ───
5. ดูช่อง "บันทึก" / "หมายเหตุ" / "Note" / "Memo" / "รายละเอียด" → ใส่ในประโยคสรุปด้วย
6. ถ้าผู้รับเป็นชื่อร้านค้า → ใส่ชื่อร้านในประโยคสรุปด้วย
   เช่น: "ชำระ ร้านเซเว่น 89 บาท", "ชำระ ปตท. ค่าน้ำมัน 650 บาท"

7. วันที่: ใช้รูปแบบ DD/MM/YYYY เท่านั้น เช่น "07/06/2569" (ปี พ.ศ.)
   เดือนไทย: ม.ค.=01, ก.พ.=02, มี.ค.=03, เม.ย.=04, พ.ค.=05, มิ.ย.=06,
              ก.ค.=07, ส.ค.=08, ก.ย.=09, ต.ค.=10, พ.ย.=11, ธ.ค.=12
   ถ้าไม่เห็นวันที่ → ละไว้

─── กฎ holderName ───
8. ใส่ชื่อคู่ค้า (อีกฝ่าย): จ่ายออก → ชื่อผู้รับ | รับเข้า → ชื่อผู้โอน | ร้านค้า → ชื่อร้าน | ไม่มี → null

─── ตัวอย่าง (บัญชี = "กสิกร-วินิต, SCB-วินิต") ───
เป๋าตัง: วินิต → ร้านนาเดียร์แอ็ค, ค่าสินค้า 333, สิทธิไทยช่วยไทย -199.80, จำนวนเงินที่ชำระ 133.20 บาท, 7 มิ.ย. 2569:
  { "text": "ชำระ ร้านนาเดียร์แอ็ค 133.20 บาท 07/06/2569", "holderName": "ร้านนาเดียร์แอ็ค" }

สลิปจาก "กสิกร-วินิต" → "สมชาย ใจดี" หมายเหตุ "ค่าเช่า" 3500 บาท:
  { "text": "จ่าย ค่าเช่า สมชาย ใจดี 3500 บาท 01/06/2568", "holderName": "สมชาย ใจดี" }

สลิปจาก "กสิกร-วินิต" → "ปตท." 650 บาท:
  { "text": "ชำระ ปตท. ค่าน้ำมัน 650 บาท 02/06/2568", "holderName": "ปตท." }

สลิปจาก "สมชาย ใจดี" → "SCB-วินิต" หมายเหตุ "ค่าขายของ" 200 บาท:
  { "text": "รับโอน ค่าขายของ 200 บาท 03/06/2569", "holderName": "สมชาย ใจดี" }

ถ้าอ่านไม่ออก หรือไม่ใช่เอกสารการเงิน:
  { "text": "อ่านไม่ได้", "holderName": null }

ตอบ JSON เท่านั้น ไม่ต้องอธิบายเพิ่ม`

const TYPE_PREFIX: Record<string, string> = {
  expense:  'ชำระ/จ่าย',
  income:   'รับโอน',
  transfer: 'โอนเงิน',
  debt:     'หนี้',
}

function buildPrompt(
  accountNames: string[],
  merchants: Array<{ name: string; type: string; category: { name: string } | null }>
): string {
  const names = accountNames.length > 0
    ? accountNames.map(n => `"${n}"`).join(', ')
    : '(ไม่มีข้อมูลบัญชี)'

  let merchantSection = ''
  if (merchants.length > 0) {
    const lines = merchants.map(m => {
      const prefix = TYPE_PREFIX[m.type] ?? m.type
      const cat    = m.category?.name ? `, ${m.category.name}` : ''
      return `- "${m.name}" → ${prefix} (${m.type}${cat})`
    }).join('\n')
    merchantSection = `\n\n─── ร้านค้า/บุคคลที่รู้จักแล้ว (ใช้ prefix นี้เสมอถ้าเห็นชื่อนี้) ───\n${lines}`
  }

  return BASE_PROMPT.replace('{ACCOUNT_NAMES}', names) + merchantSection
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ocrAllowed = await checkRateLimit(`ocr:${session.user.id}`, 10, 60_000)
    if (!ocrAllowed) {
      return NextResponse.json({ error: 'ส่งรูปเร็วเกินไป กรุณารอสักครู่' }, { status: 429 })
    }

    // Monthly quota check + credit fallback
    const plan      = (session.user.plan ?? 'free') as Plan
    const ocrLimit  = PLAN_LIMITS[plan].ocrPerMonth
    const month     = getThaiMonth()
    let   useCredit = false

    if (ocrLimit !== null) {
      const quota = await prisma.usageQuota.upsert({
        where:  { userId_month: { userId: session.user.id, month } },
        create: { userId: session.user.id, month, ocrCount: 0 },
        update: {},
        select: { ocrCount: true },
      })
      if (quota.ocrCount >= ocrLimit) {
        // Monthly quota exceeded — fall back to extra credits
        const user = await prisma.user.findUnique({
          where:  { id: session.user.id },
          select: { ocrCredits: true },
        })
        if (!user?.ocrCredits || user.ocrCredits <= 0) {
          return NextResponse.json({
            error: `ใช้ OCR ครบ ${ocrLimit} ครั้งแล้วในเดือนนี้ กรุณาซื้อเครดิตเพิ่ม`,
            code:  'OCR_QUOTA_EXCEEDED',
            used:  quota.ocrCount,
            limit: ocrLimit,
          }, { status: 429 })
        }
        useCredit = true
      }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OCR ไม่พร้อมใช้งาน (ไม่มี OPENAI_API_KEY)' }, { status: 503 })
    }

    const body = await req.json()
    const { imageBase64, mimeType = 'image/jpeg' } = body as {
      imageBase64: string
      mimeType?: string
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 400 })
    }
    if (imageBase64.length > MAX_B64_LEN) {
      return NextResponse.json({ error: 'รูปภาพมีขนาดใหญ่เกินไป' }, { status: 413 })
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ error: 'ประเภทไฟล์ไม่รองรับ' }, { status: 400 })
    }

    // Fetch accounts + known merchants in parallel (fail gracefully)
    let accountNames: string[] = []
    let merchants: Array<{ name: string; type: string; category: { name: string } | null }> = []
    try {
      const [accounts, merchantRows] = await Promise.all([
        prisma.account.findMany({
          where:  { userId: session.user.id, isActive: true },
          select: { name: true },
        }),
        prisma.merchantProfile.findMany({
          take:     50,
          orderBy:  { sourceCount: 'desc' },
          select:   { name: true, type: true, category: { select: { name: true } } },
        }),
      ])
      accountNames = accounts.map(a => a.name)
      merchants    = merchantRows
    } catch (dbErr) {
      console.error('[OCR] DB query failed, continuing without account/merchant data:', dbErr)
    }
    const prompt = buildPrompt(accountNames, merchants)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      signal: AbortSignal.timeout(20_000),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'auto' },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errType = (err as any)?.error?.type ?? ''
      const isImageError = response.status === 400 ||
        errType.includes('invalid') || errType.includes('image')
      if (isImageError) {
        return NextResponse.json({ error: 'อ่านรูปไม่ได้ — ลองถ่ายรูปใหม่ให้ชัดขึ้น' }, { status: 422 })
      }
      console.error('[OCR] OpenAI error:', err)
      return NextResponse.json({ error: 'OCR ล้มเหลว กรุณาลองใหม่' }, { status: 500 })
    }

    const data = await response.json()
    const raw  = (data.choices?.[0]?.message?.content ?? '').trim()

    let text: string
    let holderName: string | null = null
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed  = JSON.parse(cleaned)
      text       = (parsed.text ?? '').trim()
      holderName = parsed.holderName ?? null
    } catch {
      text = raw
    }

    if (!text || text === 'อ่านไม่ได้') {
      return NextResponse.json({ error: 'อ่านรูปไม่ได้ — ลองถ่ายรูปใหม่ให้ชัดขึ้น' }, { status: 422 })
    }

    // Deduct quota or credit after successful OCR
    if (useCredit) {
      await prisma.user.update({
        where: { id: session.user.id },
        data:  { ocrCredits: { decrement: 1 } },
      })
    } else if (ocrLimit !== null) {
      await prisma.usageQuota.update({
        where: { userId_month: { userId: session.user.id, month } },
        data:  { ocrCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ text, holderName })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'OCR ใช้เวลานานเกินไป กรุณาลองใหม่' }, { status: 504 })
    }
    console.error('[OCR] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
