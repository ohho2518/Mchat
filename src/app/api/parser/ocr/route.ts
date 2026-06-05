import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

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

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OCR ไม่พร้อมใช้งาน (ไม่มี ANTHROPIC_API_KEY)' }, { status: 503 })
    }

    const body = await req.json()
    const { imageBase64, mimeType = 'image/jpeg' } = body as {
      imageBase64: string
      mimeType?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 400 })
    }

    // Fetch user's account names for sender/receiver matching
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { name: true },
    })
    const accountNames = accounts.map(a => a.name)
    const prompt = buildPrompt(accountNames)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const errType = (err as any)?.error?.type ?? ''
      const isImageError = response.status === 400 || errType.includes('invalid')
      if (isImageError) {
        return NextResponse.json({ error: 'อ่านรูปไม่ได้ — ลองถ่ายรูปใหม่ให้ชัดขึ้น' }, { status: 422 })
      }
      console.error('Anthropic error:', err)
      return NextResponse.json({ error: 'OCR ล้มเหลว กรุณาลองใหม่' }, { status: 500 })
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>
    }
    const raw = (data.content?.[0]?.text ?? '').trim()

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

    return NextResponse.json({ text, holderName })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
