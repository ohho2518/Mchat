import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const PROMPT = `คุณคือผู้ช่วยอ่านสลิปธนาคาร บิล และใบเสร็จภาษาไทย

ดูรูปภาพนี้แล้วสรุปเป็น 1 ประโยคภาษาไทยสั้นๆ เพื่อใช้กรอกในระบบบัญชี
รูปแบบ: "[ประเภท][รายละเอียด] [จำนวนเงิน] บาท [วันที่ถ้าเห็นชัด]"

ตัวอย่าง:
- สลิปโอน: "โอนเงิน ค่าสินค้า 1500 บาท"
- บิลค่าไฟ: "จ่ายค่าไฟฟ้า 780 บาท"
- ใบเสร็จร้าน: "ซื้อของ 320 บาท"
- สลิปรับเงิน: "รับโอน 2500 บาท"

ถ้าอ่านไม่ออก หรือไม่ใช่เอกสารการเงิน ตอบว่า: อ่านไม่ได้
ตอบเฉพาะประโยคสรุป ไม่ต้องอธิบายเพิ่ม`

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 400 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
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
      const type = err?.error?.type ?? ''
      // 400 from OpenAI = image unreadable/invalid format → 422 to client
      // 4xx auth/quota errors or 5xx server errors → 500
      const isImageError = response.status === 400 ||
        type.includes('invalid') || type.includes('image')
      if (isImageError) {
        return NextResponse.json({ error: 'อ่านรูปไม่ได้ — ลองถ่ายรูปใหม่ให้ชัดขึ้น' }, { status: 422 })
      }
      console.error('OpenAI error:', err)
      return NextResponse.json({ error: 'OCR ล้มเหลว กรุณาลองใหม่' }, { status: 500 })
    }

    const data = await response.json()
    const text = (data.choices?.[0]?.message?.content ?? '').trim()

    if (!text || text === 'อ่านไม่ได้') {
      return NextResponse.json({ error: 'อ่านรูปไม่ได้ — ลองถ่ายรูปใหม่ให้ชัดขึ้น' }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
