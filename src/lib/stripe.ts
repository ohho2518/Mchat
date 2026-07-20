// Stripe client — server-side only
// ใช้ Stripe Checkout (redirect) รองรับ card + promptpay สกุลเงิน THB
import Stripe from 'stripe'

let _client: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
  if (!_client) {
    // ไม่ pin apiVersion — ใช้ default ที่ SDK เวอร์ชันนี้ผูกไว้ (กัน type mismatch)
    _client = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _client
}

export const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY)

// Base URL สำหรับ success/cancel redirect
// ⚠️ ใช้ NEXTAUTH_URL ที่ config ไว้เป็นหลักเสมอ — ไม่เชื่อ Origin header จาก client
// (Origin ปลอมได้ → success_url/cancel_url ชี้ไปโดเมนปลอมเพื่อ phishing หลังจ่ายเงิน)
// เหลือ Origin ไว้เป็น dev fallback เท่านั้น กรณีไม่ได้ตั้ง NEXTAUTH_URL
export function getBaseUrl(req: Request): string {
  // .trim() สำคัญ — env จาก Vercel มักมีช่องว่าง/newline ติดท้ายเวลา copy-paste
  // ถ้าไม่ trim จะได้ success_url แบบ "https://x.app  /pricing" → Stripe ปฏิเสธ (Invalid URL) → 500
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  const origin = req.headers.get('origin')?.trim()
  return origin || 'http://localhost:3000'
}
