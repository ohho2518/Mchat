import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { PLAN_LIMITS, getThaiMonth } from '@/lib/features'
import type { Plan } from '@/lib/features'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_B64_LEN  = 20 * 1024 * 1024

// 10 OCR calls per 60 s per user (per serverless instance)
const ocrRateMap = new Map<string, { count: number; resetAt: number }>()
function checkOcrRate(userId: string): boolean {
  const now = Date.now()
  const entry = ocrRateMap.get(userId)
  if (!entry || entry.resetAt < now) {
    ocrRateMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const BASE_PROMPT = `คุณคือผู้ช่วยอ่านสลิปธนาคาร บิล และใบเสร็จภาษาไทย

ดูรูปภาพนี้แล้วตอบเป็น JSON ตามรูปแบบนี้เท่านั้น:
{
  "text": "ประโยคสรุป 1 บรรทัดภาษาไทย",
  "holderName": "ชื่อผู้โอน หรือ ผู้รับเงินในสลิป (null ถ้าไม่เห็น)"
}

─── ชื่อบัญชีของเจ้าของระบบ ───
บัญชีที่ลงทะเบียนไว้: {ACCOUNT_NAMES}
ถ้าชื่อในสลิปตรงหรือคล้ายกับชื่อบัญชีใดข้างต้น = เป็นบัญชีของเจ้าของระบบ

─── กฎการระบุทิศทางเงิน ───
1. ถ้าชื่อ "จาก" / "ผู้โอน" / "Sender" ตรงกับบัญชีของเจ้าของระบบ
   → โอนเงินออก = รายจ่าย → ขึ้นต้นด้วย "โอนเงิน"

2. ถ้าชื่อ "ถึง" / "ผู้รับ" / "Receiver" ตรงกับบัญชีของเจ้าของระบบ
   → รับเงินเข้า = รายรับ → ขึ้นต้นด้วย "รับโอน"

3. ถ้าช่องผู้รับเป็นชื่อร้านค้า / บริษัท / แบรนด์ (ไม่ใช่ชื่อบุคคล)
   → ชำระค่าสินค้าหรือบริการ = รายจ่าย → ขึ้นต้นด้วย "ชำระ"

─── กฎการใส่รายละเอียด ───
4. ดูช่อง "บันทึก" / "หมายเหตุ" / "Note" / "Memo" / "รายละเอียด" ในสลิป
   → ใส่ข้อความนั้นในประโยคสรุปด้วย เพื่อช่วยจำแนกหมวดหมู่
   เช่น: "โอนเงิน ค่าน้ำมัน 500 บาท", "ชำระ ค่าอาหาร 250 บาท"

5. ถ้าช่องผู้รับเป็นชื่อร้านค้า → ใส่ชื่อร้านในประโยคสรุปด้วย
   เช่น: "ชำระ ร้านเซเว่น 89 บาท", "ชำระ ปตท. ค่าน้ำมัน 650 บาท"

6. วันที่: ใช้ตัวเลขเท่านั้น เช่น "03/06/2569"
   เดือนไทย: ม.ค.=01, ก.พ.=02, มี.ค.=03, เม.ย.=04, พ.ค.=05, มิ.ย.=06,
              ก.ค.=07, ส.ค.=08, ก.ย.=09, ต.ค.=10, พ.ย.=11, ธ.ค.=12
   ถ้าไม่เห็นวันที่ → ละไว้

─── กฎ holderName ───
7. ใส่ชื่อคู่ค้า (อีกฝ่าย) ที่เห็นในสลิป
   ถ้าโอนออก → ชื่อผู้รับ | ถ้ารับเข้า → ชื่อผู้โอน | ถ้าร้านค้า → ชื่อร้าน
   ถ้าไม่มีชื่อ → null

─── ตัวอย่าง (บัญชี = "กสิกร-วินิต, SCB-วินิต") ───
สลิปจาก "กสิกร-วินิต" → "สมชาย ใจดี" หมายเหตุ "ค่าเช่า":
  { "text": "โอนเงิน ค่าเช่า 3500 บาท 01/06/2568", "holderName": "สมชาย ใจดี" }

สลิปจาก "กสิกร-วินิต" → "ปตท." ไม่มีหมายเหตุ:
  { "text": "ชำระ ปตท. ค่าน้ำมัน 650 บาท 02/06/2568", "holderName": "ปตท." }

สลิปจาก "สมชาย ใจดี" → "SCB-วินิต" หมายเหตุ "ค่าขายของ":
  { "text": "รับโอน ค่าขายของ 200 บาท 03/06/2569", "holderName": "สมชาย ใจดี" }

ถ้าอ่านไม่ออก หรือไม่ใช่เอกสารการเงิน:
  { "text": "อ่านไม่ได้", "holderName": null }

ตอบ JSON เท่านั้น ไม่ต้องอธิบายเพิ่ม`

function buildPrompt(accountNames: string[]): string {
  const names = accountNames.length > 0
    ? accountNames.map(n => `"${n}"`).join(', ')
    : '(ไม่มีข้อมูลบัญชี)'
  return BASE_PROMPT.replace('{ACCOUNT_NAMES}', names)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkOcrRate(session.user.id)) {
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

    // Fetch user's account names for sender/receiver matching (fail gracefully)
    let accountNames: string[] = []
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { name: true },
      })
      accountNames = accounts.map(a => a.name)
    } catch (dbErr) {
      console.error('[OCR] DB query failed, continuing without account names:', dbErr)
    }
    const prompt = buildPrompt(accountNames)

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
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
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
