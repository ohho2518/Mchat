# Security & PDPA Implementation Plan

> อัปเดต: 2026-06-07  
> อ้างอิง: `docs/MChat Security & PDPA Policy.docx.md` — Section 47–48  
> **Dev พร้อมเริ่มได้ทันที** — เรียงตาม Priority สูงสุดก่อน

---

## 🔴 Sprint 1 — Critical (ทำก่อน Launch จริง)

---

### TASK-S01: Omise Webhook Signature Verification

**ไฟล์:** `src/app/api/webhooks/omise/route.ts`  
**เวลา:** ~2 ชั่วโมง  
**ทำไม:** ปัจจุบันรับ POST จากใครก็ได้และ activate plan ทันที — ความเสี่ยงสูงมาก

**วิธีทำ:**

```typescript
// เพิ่มที่ต้นของ POST handler
import crypto from 'crypto'

export async function POST(req: Request) {
  const rawBody = await req.text()
  
  // 1. Verify Omise webhook signature
  const signature = req.headers.get('x-omise-webhook-signature')
  const webhookSecret = process.env.OMISE_WEBHOOK_SECRET
  
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // 2. Parse body after verification
  const event = JSON.parse(rawBody)
  // ... rest of handler
}
```

**Env ที่ต้องเพิ่ม:**
```env
OMISE_WEBHOOK_SECRET="whsec_..."  # ดูได้จาก Omise Dashboard → Webhooks
```

**ทดสอบ:** ส่ง POST มาโดยไม่มี signature → ควร return 401

---

### TASK-S02: Supabase Row Level Security (RLS)

**ไฟล์:** Supabase Dashboard → SQL Editor  
**เวลา:** ~3 ชั่วโมง  
**ทำไม:** ถ้า DATABASE_URL รั่วออกไป ใครก็อ่าน/แก้ข้อมูลทุก user ได้

**วิธีทำ:**  
เปิด Supabase Dashboard → SQL Editor → รัน script นี้:

```sql
-- Enable RLS on all user-data tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageQuota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReferralCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayoutRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OcrCorrection" ENABLE ROW LEVEL SECURITY;

-- Note: Prisma ใช้ service_role key (bypasses RLS) ใน server-side
-- RLS ป้องกัน direct DB connection จาก client หรือ leaked credentials
-- ไม่กระทบ application behavior เพราะ Prisma ใช้ service_role
```

**สำคัญ:** ตรวจสอบว่า `DATABASE_URL` ใช้ `service_role` key ไม่ใช่ `anon` key  
Prisma ต้องใช้ service_role เพื่อ bypass RLS → ดูได้ที่ Supabase Dashboard → Settings → API

---

### TASK-S03: Privacy Notice + Consent on Register

**ไฟล์:** `src/app/login/page.tsx`, `prisma/schema.prisma`  
**เวลา:** ~4 ชั่วโมง  
**ทำไม:** PDPA กำหนดต้องแจ้งและได้ consent ก่อนเก็บข้อมูล

**Step 1 — เพิ่ม DB schema:**
```prisma
// prisma/schema.prisma
model UserConsent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // "privacy_policy", "terms", "ocr_improvement"
  version   String   // "2026-06" — เปลี่ยนเมื่ออัปเดต policy
  agreedAt  DateTime @default(now())
  ip        String?
  userAgent String?
  
  @@index([userId, type])
}
```

**Step 2 — เพิ่ม consent checkbox ใน Register form:**
```tsx
// ใน Register form section
<label className="flex items-start gap-2 text-sm">
  <input 
    type="checkbox" 
    {...register('acceptTerms', { required: 'กรุณายอมรับเงื่อนไข' })}
    className="mt-1"
  />
  <span>
    ฉันยอมรับ{' '}
    <a href="/terms" target="_blank" className="text-blue-600 underline">เงื่อนไขการใช้งาน</a>
    {' '}และ{' '}
    <a href="/privacy-policy" target="_blank" className="text-blue-600 underline">นโยบายความเป็นส่วนตัว</a>
  </span>
</label>
```

**Step 3 — บันทึก consent ใน `/api/auth/register`:**
```typescript
// หลัง create User
await prisma.userConsent.create({
  data: {
    userId: user.id,
    type: 'privacy_policy',
    version: '2026-06',
    ip: req.headers.get('x-forwarded-for') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  }
})
```

---

### TASK-S04: /privacy-policy และ /terms Pages

**ไฟล์:** สร้างใหม่ `src/app/privacy-policy/page.tsx`, `src/app/terms/page.tsx`  
**เวลา:** ~2 ชั่วโมง  
**ทำไม:** Required by PDPA + commercial launch requirement

**โครงสร้าง `/privacy-policy/page.tsx`:**
```tsx
// static page — ไม่ต้อง auth
export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 prose">
      <h1>นโยบายความเป็นส่วนตัว</h1>
      <p className="text-sm text-gray-500">อัปเดตล่าสุด: มิถุนายน 2569</p>
      
      <h2>1. ข้อมูลที่เก็บรวบรวม</h2>
      {/* ดูเนื้อหาจาก Section 17 ของ Security Policy doc */}
      
      <h2>2. วัตถุประสงค์การใช้ข้อมูล</h2>
      {/* Section 18 */}
      
      <h2>3. สิทธิ์ของเจ้าของข้อมูล</h2>
      {/* Section 22 */}
      
      <h2>4. การเก็บรักษาและลบข้อมูล</h2>
      {/* Section 27 */}
      
      <h2>5. การส่งข้อมูลไปยังบุคคลที่สาม</h2>
      {/* Section 28 */}
      
      <h2>6. ติดต่อเรา</h2>
      <p>อีเมล: support@mchat.app</p>
    </main>
  )
}
```

**เพิ่มใน `middleware.ts`:** (public routes)
```typescript
// เพิ่ม '/privacy-policy', '/terms' ใน publicRoutes array
```

---

### TASK-S05: Admin 2FA หรือ IP Allowlisting

**ไฟล์:** `src/lib/auth.ts`, `src/app/api/admin/`  
**เวลา:** ~3 ชั่วโมง  
**ทำไม:** Admin account เป็น single point of failure — ถูก compromise = ข้อมูลทั้งระบบ

**Option A (เร็วกว่า): IP Allowlisting สำหรับ /admin routes**
```typescript
// middleware.ts — เพิ่ม admin IP check
const ADMIN_IP_ALLOWLIST = process.env.ADMIN_IP_ALLOWLIST?.split(',') ?? []

if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ADMIN_IP_ALLOWLIST.length > 0 && ip && !ADMIN_IP_ALLOWLIST.includes(ip)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
```

**Env:**
```env
ADMIN_IP_ALLOWLIST="1.2.3.4,5.6.7.8"  # home + office IP
```

**Option B (ปลอดภัยกว่า): TOTP 2FA**  
ใช้ library `otplib` + บันทึก `totpSecret` ใน User model  
(เพิ่มเป็น Phase 2 ถ้า Option A ไม่เพียงพอ)

---

## 🟡 Sprint 2 — High Priority (ภายใน 2 สัปดาห์)

---

### TASK-S06: OCR Improvement Consent

**ไฟล์:** `src/app/settings/page.tsx`, `src/app/api/parser/ocr/route.ts`  
**เวลา:** ~3 ชั่วโมง  
**ทำไม:** OcrCorrection table เก็บข้อมูลอัตโนมัติโดยไม่ขอ consent

**Step 1 — เพิ่ม toggle ใน Settings:**
```tsx
// /settings — OCR section
<div className="flex items-center justify-between">
  <div>
    <p className="font-medium">ช่วยปรับปรุงการอ่านสลิป</p>
    <p className="text-sm text-gray-500">ยอมให้ระบบเก็บข้อมูลการแก้ไขของคุณเพื่อพัฒนาความแม่นยำ</p>
  </div>
  <Switch checked={ocrConsent} onChange={handleOcrConsentChange} />
</div>
```

**Step 2 — บันทึก consent ลง UserConsent:**
```typescript
// PATCH /api/user/consent
await prisma.userConsent.upsert({
  where: { userId_type: { userId, type: 'ocr_improvement' } },
  create: { userId, type: 'ocr_improvement', version: '2026-06', agreedAt: new Date() },
  update: { agreedAt: new Date() }  // หรือ mark revoked
})
```

**Step 3 — เช็ค consent ก่อนบันทึก OcrCorrection:**
```typescript
// src/app/api/ocr-corrections/route.ts
const consent = await prisma.userConsent.findFirst({
  where: { userId, type: 'ocr_improvement' }
})
if (!consent) return NextResponse.json({ ok: true })  // skip silently
```

---

### TASK-S07: Basic Audit Log

**ไฟล์:** `prisma/schema.prisma`, สร้างใหม่ `src/lib/audit.ts`  
**เวลา:** ~4 ชั่วโมง  
**ทำไม:** ต้องมี trail สำหรับ incident investigation และ PDPA compliance

**Step 1 — เพิ่ม model:**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?  // userId ของคนที่ทำ (null = system)
  actorEmail String?
  action     String   // "admin.payment.confirm", "admin.plan.change", "user.export", etc.
  targetType String?  // "Payment", "User", "Commission"
  targetId   String?
  metadata   Json?    // before/after values
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}
```

**Step 2 — utility function:**
```typescript
// src/lib/audit.ts
export async function auditLog(params: {
  actorId?: string
  actorEmail?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: object
  ip?: string
  userAgent?: string
}) {
  // fire-and-forget — ไม่ block main flow
  prisma.auditLog.create({ data: params }).catch(console.error)
}
```

**Step 3 — เพิ่มใน critical admin actions:**
```typescript
// ใน PATCH /api/admin/payments/[id]
await auditLog({
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: 'admin.payment.confirm',
  targetType: 'Payment',
  targetId: params.id,
  metadata: { before: { status: 'pending' }, after: { status: 'paid', plan } },
  ip: req.headers.get('x-forwarded-for') ?? undefined,
})
```

**Actions ที่ต้อง log:**
- `admin.payment.confirm` / `admin.payment.reject`
- `admin.plan.change`
- `admin.commission.approve` / `admin.commission.cancel`
- `admin.payout.pay` / `admin.payout.reject`
- `admin.credits.grant`
- `user.data.export`
- `user.account.delete` (ถ้า implement)

---

### TASK-S08: Email Verification on Register

**ไฟล์:** `prisma/schema.prisma`, `src/app/api/auth/register/route.ts`  
**เวลา:** ~5 ชั่วโมง  
**ทำไม:** ป้องกัน fake accounts, required สำหรับ PDPA data accuracy

**Step 1 — เพิ่ม field ใน User:**
```prisma
emailVerified   DateTime?
emailVerifyToken String?  @unique
```

**Step 2 — ส่ง verify email หลัง register:**
```typescript
// POST /api/auth/register
const token = crypto.randomBytes(32).toString('hex')
await prisma.user.update({
  where: { id: user.id },
  data: { emailVerifyToken: token }
})
// ส่ง email: https://your-domain.com/api/auth/verify-email?token=xxx
// ใช้ Resend/Sendgrid/Nodemailer
```

**Step 3 — verify endpoint:**
```typescript
// GET /api/auth/verify-email?token=xxx
await prisma.user.update({
  where: { emailVerifyToken: token },
  data: { emailVerified: new Date(), emailVerifyToken: null }
})
```

---

### TASK-S09: Security Headers + CSP

**ไฟล์:** `next.config.ts`  
**เวลา:** ~1 ชั่วโมง  
**ทำไม:** ป้องกัน XSS, clickjacking, MIME sniffing

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.omise.co",  // Omise SDK
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.omise.co https://vault.omise.co",
      "frame-src https://omise.co",
    ].join('; ')
  },
]

const nextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: securityHeaders,
    }]
  },
}
```

---

## 🟢 Sprint 3 — Medium Priority (ภายใน 1 เดือน)

---

### TASK-S10: /settings/privacy — User Data Control

**ไฟล์:** สร้างใหม่ `src/app/settings/privacy/page.tsx`  
**เวลา:** ~6 ชั่วโมง

เนื้อหาในหน้า:
- OCR Improvement consent toggle
- Export my data button → ดาวน์โหลด JSON/CSV ของ transactions ทั้งหมด
- Delete account button (soft request → admin ทำ)
- แสดง consent history

---

### TASK-S11: Rate Limiting Persistent (ถ้า Traffic เพิ่ม)

**ไฟล์:** `src/app/api/auth/register/route.ts`, `src/app/api/parser/ocr/route.ts`  
**เวลา:** ~4 ชั่วโมง  
**ทำไม:** in-memory Map ไม่ทำงานข้าม Vercel instances เมื่อ traffic สูง

**Option:** ใช้ Supabase table เป็น rate limit store (ไม่ต้องใช้ Redis)
```typescript
// simple approach — upsert เป็น increment counter
const key = `ratelimit:register:${ip}`
const window = 60 * 1000 // 1 minute
// ใช้ Supabase RPC หรือ table-based approach
```

---

### TASK-S12: Data Retention Cron

**ไฟล์:** สร้างใหม่ `src/app/api/cron/data-retention/route.ts`  
**เวลา:** ~4 ชั่วโมง  
**ทำไม:** ต้องลบข้อมูลตาม retention schedule ที่กำหนดใน Policy

```typescript
// GET /api/cron/data-retention — เรียกจาก Vercel Cron (daily)
// ลบ AppEvent เก่ากว่า 90 วัน
// ลบ OcrCorrection เก่ากว่า 1 ปี  
// ลบ AuditLog เก่ากว่า 2 ปี
// Header check: Authorization: Bearer $CRON_SECRET
```

**Vercel Cron config (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/cron/data-retention",
    "schedule": "0 2 * * *"
  }]
}
```

---

### TASK-S13: Commission Risk Flag

**ไฟล์:** `src/app/api/admin/referral/commissions/route.ts`  
**เวลา:** ~3 ชั่วโมง

```typescript
// flag commission ที่น่าสงสัย:
// - referrer สร้าง account เองหลาย account แล้ว refer ตัวเอง (check email domain)
// - commission จาก referral ที่ register ในเวลาน้อยกว่า 60 วิ หลัง click
// - referrer มี commission > ฿5,000 ในเดือนเดียว
```

---

## 📋 DB Migration Checklist

เมื่อทำ TASK-S03 และ TASK-S07 ต้องรันคำสั่งเหล่านี้:

```bash
# หลังแก้ schema.prisma
npx prisma migrate dev --name add_user_consent_audit_log

# หรือถ้าใช้ db push (ตาม decision ปัจจุบัน)
npx prisma db push
```

---

## 🗓️ Timeline แนะนำ

| Sprint | งาน | เวลา |
|---|---|---|
| Sprint 1 (Week 1) | S01–S05 (Critical) | 14 ชั่วโมง |
| Sprint 2 (Week 2–3) | S06–S09 (High) | 13 ชั่วโมง |
| Sprint 3 (Month 2) | S10–S13 (Medium) | 17 ชั่วโมง |

---

## 🔗 อ้างอิง

- Policy ฉบับเต็ม: `docs/MChat Security & PDPA Policy.docx.md`
- Gap Analysis: `docs/MChat Security & PDPA Policy.docx.md` — Section 47–48
- DB Schema: `docs/db/SCHEMA.md`
- API Reference: `docs/api/API_REFERENCE.md`
