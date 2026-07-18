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

// Base URL สำหรับ success/cancel redirect — เอาจาก request origin ก่อน แล้ว fallback env
export function getBaseUrl(req: Request): string {
  return (
    req.headers.get('origin') ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000'
  )
}
