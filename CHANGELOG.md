# CHANGELOG.md

บันทึกการเปลี่ยนแปลงสำคัญของ MChat เรียงจากใหม่ไปเก่า

---

## 2026-07-20 — 🚀 GO-LIVE / PRODUCTION · ON SALE

**MChat เปิดขายจริงแล้ว** — สลับ Stripe เป็น LIVE mode + ทดสอบชำระเงินจริงผ่านครบทุก flow
- Stripe LIVE: บัตร + PromptPay (ทดสอบจ่ายจริง ฿99 → webhook 200 → เปิดแผนสำเร็จ)
- webhook endpoint live "MChat production" (8 events) · Vercel env (sk_live + whsec live)
- ผ่าน adversarial payment review ก่อน go-live: กัน double-subscribe (C1), plan หมดอายุ downgrade (H1: cron + read-time), renewal ไม่ลบเวลา one-time (M2)
- Supabase RLS เปิดครบ 21 ตาราง · UptimeRobot กัน DB pause

### 🔁 Auto-renew — ต่ออายุแผนอัตโนมัติ (Stripe Subscription รายเดือน)

- Added: ตัวเลือก **"ต่ออายุอัตโนมัติทุกเดือน"** ในหน้าจ่ายเงิน (Stripe tab) — คู่ขนานกับจ่ายครั้งเดียวเดิม
  - เปิด toggle → สมัคร subscription รายเดือน (PRO ฿99/เดือน, MAX ฿249/เดือน) ตัดบัตรอัตโนมัติ
  - บัตรอย่างเดียว (PromptPay ไม่รองรับ recurring) · จ่ายครั้งเดียว 1/3/6/12 เดือนยังใช้ได้เหมือนเดิม
  - webhook เลื่อนวันหมดอายุให้อัตโนมัติทุกรอบ (`invoice.paid`) — idempotent ด้วย invoice id
- Added: **จัดการ subscription ในหน้า `/settings`** — ดูสถานะ, วันต่ออายุถัดไป, ยกเลิก/กลับมาต่อ (ยกเลิกแบบสิ้นรอบ ยังใช้ได้จนหมดอายุที่จ่ายไว้)
- Note: ต้องเพิ่ม event `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted` ใน Stripe webhook endpoint

### 🔒 Hardening

- Fixed: `getBaseUrl` / `STRIPE_WEBHOOK_SECRET` — `.trim()` ช่องว่างจาก env (Vercel copy-paste ติดช่องว่าง → checkout 500 / webhook 401)
- Added: `prisma/enable-rls.sql` — เปิด Row Level Security ทุกตาราง (กัน Supabase auto-API)

---

## 2026-07-18

### 💳 Stripe Checkout — ช่องทางชำระเงินหลัก (พร้อมจำหน่าย)

- Added: **Stripe Checkout (redirect)** รองรับบัตรเครดิต/เดบิต + PromptPay สกุลเงิน THB
  - หน้า `/pricing` แสดง Stripe เป็นช่องทางหลักเมื่อตั้ง `STRIPE_SECRET_KEY` — ทั้งอัปเกรดแผนและซื้อเครดิต OCR
  - ชำระสำเร็จ → plan/เครดิตอัปเดตอัตโนมัติผ่าน webhook (ไม่ต้องรอ admin)
  - คง manual PromptPay ไว้เป็น fallback เสมอ · Omise เดิมยังใช้ได้ถ้าตั้ง env (แนวทางจาก d_PDFx: Stripe เป็นหลัก)
- Fixed: **payment webhooks ไม่เคยเป็น public route** — `/api/webhooks/*` ไม่อยู่ใน `proxy.ts` PUBLIC_PREFIXES → ถ้า go-live จะโดน auth guard redirect 307 (คลาสเดียวกับบั๊ก cron ที่ทำ Supabase pause) แก้แล้ว ครอบทั้ง Stripe + Omise

---

## 2026-07-13

### 🔥 Fix: auth guard ไม่เคยทำงานบน production

- Fixed: **Next.js 16 อ่าน `proxy.ts` ไม่ใช่ `middleware.ts`** — logic ของ Security Sprint (public routes + admin IP gate) ถูกเขียนไว้ใน `middleware.ts` ที่ root ซึ่ง Next.js 16 **เมินเงียบ ๆ ไม่มี warning** ตัวที่รันจริงคือ `src/proxy.ts` เวอร์ชันแรกสุด
  - ผลกระทบจริงบน production ~1 เดือน:
    - `/privacy-policy` + `/terms` เปิดไม่ได้ถ้าไม่ล็อกอิน (ขัดข้อกำหนด PDPA)
    - `/api/referral/terms` ไม่ public จริง
    - **`/api/cron/data-retention` โดน redirect ไป `/login` ทุกวัน → ไม่เคยแตะ DB เลย → เป็นเหตุให้ Supabase pause เมื่อ 2026-07-06**
    - S05 Admin IP allowlisting ไม่เคยทำงาน
  - แก้: ย้าย logic ทั้งหมดไป `src/proxy.ts`, ลบ `middleware.ts` ทิ้ง, ใส่คอมเมนต์เตือนกันพลาดซ้ำ

### Keep-alive + Cron Observability (S12 follow-up)

- Added: **`GET /api/health`** — public health check (ไม่ต้อง auth) คืน `{ ok, db, latencyMs, lastCronRun, time }` และคืน **503 เมื่อ DB ล่ม**
  - ให้ uptime monitor ภายนอก (UptimeRobot / cron-job.org) ping ทุก 5–15 นาที → กัน **Supabase free-tier auto-pause** (pause เมื่อ idle 7 วัน — เคยทำ production ล่มเมื่อ 6 ก.ค.)
  - เป็นช่องทางตรวจว่า cron รันจริงหรือไม่ โดยไม่ต้องเปิด Vercel logs
- Added: **cron run record** — `/api/cron/data-retention` เขียน `SiteSetting['cron:data-retention:lastRun']` ทุกครั้งที่รันสำเร็จ (แม้ไม่มีอะไรถูกลบ) เป็นทั้งหลักฐานการรันและ DB write รายวัน
- Fixed: **cron fail เงียบ** — `/api/cron/data-retention` เดิมไม่มี try/catch (ผิด coding rule) → error กลายเป็น unhandled 500 ที่ไม่มี log; เพิ่ม try/catch + `console.error` + `dynamic = 'force-dynamic'` + `maxDuration = 60`
- Changed: `middleware.ts` — เพิ่ม `/api/health` เป็น public route

---

## 2026-06-08

### OCR Fix + Train OCR UX + Header Version

- Fixed: **OCR อ่านสลิป portrait ไม่ได้** — เปลี่ยน `detail: 'low'` → `detail: 'auto'` ใน `/api/parser/ocr` ให้ OpenAI ใช้หลาย tile สำหรับรูปสูง (Bangkok Bank, BBL ฯลฯ) แทนการบีบทั้งสลิปลงใน 512×512 tile เดียว
- Added: **Parser result panel ใน Train OCR test tab** — หลังอัปโหลดรูป จะแสดงผล rule-based parser ทันที (ประเภท, จำนวน, วันที่, หมวดหมู่, confidence %) พร้อมปุ่ม Re-run สำหรับทดสอบหลังแก้ข้อความ
- Added: **Version + deploy time ใน Header** — แสดง `v1.2.0 · 8 มิ.ย. 69, HH:MM` (Thai timezone UTC+7) ใต้ logo ทุกหน้า อัปเดตอัตโนมัติทุก deploy
- Changed: version bump `0.1.0` → `1.2.0`

---

## 2026-06-07

### Security Sprint 2 — S06–S09

- Added: **Email Verification (S08)** — หลัง register ระบบส่ง email ยืนยัน (ผ่าน Resend API)
  - `/api/auth/verify-email?token=xxx` — ยืนยัน token → mark `emailVerified` → redirect ไป /settings
  - `/settings` — banner เตือน "อีเมลยังไม่ได้รับการยืนยัน" ถ้ายังไม่ verify
  - ถ้าไม่มี `RESEND_API_KEY` → auto-verify ให้ (dev mode ไม่ต้องตั้งค่า)
- Added: **OCR Improvement Consent Toggle (S06)** — `/settings` มี toggle ให้ user เลือกว่าจะ opt-in แชร์ข้อมูล OCR corrections เพื่อพัฒนาระบบหรือไม่ (default: off)
  - `GET/PATCH /api/user/consent` — อ่าน/แก้ consent ของ user
  - `/api/ocr-corrections POST` — ตรวจ consent ก่อนบันทึก; ถ้าไม่ consent → skip silently
- Added: **Audit Log (S07)** — บันทึกทุก admin action ลง `AuditLog` table
  - `src/lib/audit.ts` — `logAudit()` fire-and-forget (ไม่ block main flow)
  - Actions ที่ log: payment confirm/reject, plan change, commission approve/cancel, payout pay/reject, grant credits
- Added: **Security Headers + CSP (S09)** — `next.config.ts` ส่ง headers ทุก request
  - `X-Frame-Options: SAMEORIGIN` — ป้องกัน clickjacking
  - `X-Content-Type-Options: nosniff` — ป้องกัน MIME sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
  - `Content-Security-Policy` — whitelist Omise CDN, Google Fonts; block `object-src`

### Files Changed
`next.config.ts`, `prisma/schema.prisma` (+AuditLog, +emailVerified, +emailVerifyToken),
`src/lib/audit.ts` (new), `src/lib/email.ts` (new),
`src/app/api/auth/verify-email/route.ts` (new), `src/app/api/user/consent/route.ts` (new),
`src/app/api/admin/users/[id]/credits/route.ts` (new),
`src/app/api/admin/payments/[id]/route.ts`, `src/app/api/admin/users/[id]/plan/route.ts`,
`src/app/api/admin/referral/commissions/[id]/route.ts`, `src/app/api/admin/referral/payouts/[id]/route.ts`,
`src/app/api/ocr-corrections/route.ts`, `src/app/api/auth/register/route.ts`,
`src/app/api/user/quota/route.ts`, `src/app/settings/page.tsx`, `.env.example`

---

### Security Sprint 1 — S01–S05 + PDPA

- Added: **PDPA Consent on Register (S03)** — checkbox "ยอมรับเงื่อนไข + นโยบาย" ใน Register form (required)
  - `UserConsent` model — บันทึก consent timestamp, IP, UserAgent ทุกครั้งที่ register
- Added: **`/privacy-policy` page (S04)** — นโยบายความเป็นส่วนตัว 7 sections (PDPA compliant)
- Added: **`/terms` page (S04)** — เงื่อนไขการใช้งาน 10 sections (Referral fraud, payment policy, etc.)
- Added: **`middleware.ts` (S05)** — Admin IP Allowlisting ผ่าน `ADMIN_IP_ALLOWLIST` env var
  - `/admin` + `/api/admin/*` → redirect ไป /login ถ้า IP ไม่อยู่ใน allowlist
  - Public routes: `/download`, `/privacy-policy`, `/terms`, `/ref/`, `/api/ref/`, `/api/referral/terms`
- Updated: `.env.example` — เพิ่ม `OMISE_WEBHOOK_SECRET`, `ADMIN_IP_ALLOWLIST`, `RESEND_API_KEY`

### Files Changed
`middleware.ts` (new), `src/app/privacy-policy/page.tsx` (new), `src/app/terms/page.tsx` (new),
`src/app/login/page.tsx`, `src/app/api/auth/register/route.ts`, `prisma/schema.prisma` (+UserConsent)

---

### OCR Credit System

- Changed: **MAX plan** — OCR จาก unlimited → **500 ครั้ง/เดือน** (soft cap)
- Added: **OCR Credit Packs** — ซื้อเครดิตเพิ่มเมื่อ quota หมด (ไม่มีวันหมดอายุ)
  - 3 packs: 100 ครั้ง/฿29 · 300 ครั้ง/฿79 · 500 ครั้ง/฿119
  - `/pricing` — section "เติมเครดิต OCR" + CreditModal (manual PromptPay flow)
  - `/settings` — แสดง "เครดิต OCR เสริม: X ครั้ง" badge สีม่วงเมื่อมีเครดิตคงเหลือ
- Updated: `POST /api/payments` — รองรับ `{ credits, amount, method }` นอกเหนือจาก plan purchase
- Updated: `PATCH /api/admin/payments/[id]` — เมื่อ confirm credit payment → increment `user.ocrCredits`
- Added: `PATCH /api/admin/users/[id]/credits` — admin grant credits โดยตรง (1–10,000)
- Added: **Admin CreditGranter** — dropdown 50/100/200/300/500 ในหน้า User Management

### Files Changed
`src/lib/features.ts`, `prisma/schema.prisma` (+ocrCredits on User, Payment.plan nullable, +credits field),
`src/app/api/parser/ocr/route.ts`, `src/app/api/user/quota/route.ts`,
`src/app/api/payments/route.ts`, `src/app/api/admin/payments/[id]/route.ts`,
`src/app/api/admin/users/[id]/credits/route.ts` (new), `src/app/api/webhooks/omise/route.ts`,
`src/app/pricing/page.tsx`, `src/app/settings/page.tsx`, `src/app/admin/page.tsx`

---

### Referral UX Polish

- Added: **QR Code ใน `/referral`** — แสดง QR code ของ referral link ให้แชร์ + ปุ่ม Download
- Added: **`/download` landing page** — หน้าสาธารณะ (ไม่ต้อง login): hero, features, PWA install guide, ปุ่ม register
- Changed: **`/ref/[code]`** — redirect ไป `/download` (แทน `/login`) พร้อม badge "เพื่อนแนะนำมา"
- Added: **Referral tab ใน BottomNav** — ไอคอน Gift เป็น tab ที่ 4 (BottomNav ครบ 5 tabs)
- Added: **Header chip "แนะนำเพื่อน"** — chip สีเหลืองทอง ทุกหน้าที่ login → `/referral`
- Added: **Referral Terms Editor ใน `/admin`** — แก้ไข commission rates, holdDays, minPayout, payoutDay, extraNote
- Added: `GET /api/referral/terms` — public endpoint คืน terms (อ่านจาก `SiteSetting` DB)
- Added: `GET/PATCH /api/admin/settings` — admin อ่าน/แก้ไข site settings

### Files Changed
`src/app/referral/page.tsx`, `src/app/download/page.tsx` (new),
`src/app/ref/[code]/page.tsx`, `src/components/layout/BottomNav.tsx`,
`src/components/layout/Header.tsx`, `src/app/admin/page.tsx`,
`src/app/api/referral/terms/route.ts` (new), `src/app/api/admin/settings/route.ts` (new),
`prisma/schema.prisma` (+SiteSetting model)

---

## 2026-06-06

### Features — Referral & Affiliate System Phase 4–5 (User Dashboard + Admin Management)

- Added: **`/referral` page** — Referral dashboard สำหรับผู้ใช้
  - กล่อง referral code สีฟ้า + ปุ่ม Copy, แชร์ LINE, แชร์ Facebook
  - Stats grid: ลิงก์ถูกคลิก / สมัครสมาชิก / ชำระเงิน / คอมมิชชันรอรับ
  - กล่อง "ยอดพร้อมถอน" พร้อมปุ่ม "ขอถอนเงิน" (minimum ฿300)
  - ฟอร์มถอนเงิน: PromptPay / บัญชีธนาคาร, mask account number
  - ประวัติคำขอถอน + ประวัติคอมมิชชันพร้อม holdUntil status badge
- Added: **Referral APIs** (`/api/referral/*`)
  - `GET /api/referral/code` — lazy-create referral code สำหรับผู้ใช้เดิม
  - `GET /api/referral/stats` — สถิติ clicks / signups / conversions / commissions รวม
  - `GET /api/referral/commissions` — ประวัติคอมมิชชันของ user
  - `POST /api/referral/payout` — ส่งคำขอถอนเงิน (ตรวจสอบยอดขั้นต่ำ ฿300 + ไม่มี pending ค้างอยู่)
  - `GET /api/referral/payout` — ประวัติคำขอถอน (masked account number)
- Added: **Admin Referral Management APIs** (`/api/admin/referral/*`)
  - `GET /api/admin/referral/commissions` — list all commissions พร้อม referrer + referred info
  - `PATCH /api/admin/referral/commissions/[id]` — approve (ตรวจสอบ holdUntil 14 วัน) / cancel
  - `GET /api/admin/referral/payouts` — list all payout requests
  - `PATCH /api/admin/referral/payouts/[id]` — pay (mark commissions paid) / reject พร้อม adminNote
- Updated: **`/admin` page** — เพิ่มส่วน Commissions + Payout Requests
  - Commissions: แสดงรายการพร้อม holdUntil timer, ปุ่ม "อนุมัติ" (disable ถ้า hold ยังไม่ครบ) / "ยกเลิก"
  - Payout Requests: แสดงยอด, ชื่อบัญชี, PromptPay/bank info, ปุ่ม "โอนแล้ว" / "ปฏิเสธ" + prompt adminNote
  - Badge counter แจ้ง pending items

### Files Changed
`src/app/referral/page.tsx` (new), `src/app/api/referral/code/route.ts` (new), `src/app/api/referral/stats/route.ts` (new), `src/app/api/referral/commissions/route.ts` (new), `src/app/api/referral/payout/route.ts` (new), `src/app/api/admin/referral/commissions/route.ts` (new), `src/app/api/admin/referral/commissions/[id]/route.ts` (new), `src/app/api/admin/referral/payouts/route.ts` (new), `src/app/api/admin/referral/payouts/[id]/route.ts` (new), `src/app/admin/page.tsx`

---

### Features — Phase 3: Omise Automated Payment (PromptPay + Credit Card)

- Added: **Omise integration** — ชำระเงินอัตโนมัติผ่าน Omise gateway (ไม่ต้องรอ admin confirm)
- Added: `src/lib/omise.ts` — Omise Node.js client wrapper (createPromptPayCharge, createCardCharge, retrieveEvent)
- Added: `POST /api/omise/charge` — สร้าง Omise charge (PromptPay หรือ Card) + บันทึก Payment record พร้อม omiseChargeId
- Added: `GET /api/omise/status?paymentId=` — poll สถานะ payment (paid/pending)
- Added: `POST /api/webhooks/omise` — webhook handler: re-fetch event จาก Omise API เพื่อยืนยัน → activate plan อัตโนมัติ
- Updated: `GET /api/payments/info` — เพิ่ม `omisePublicKey` ใน response
- Updated: `/pricing` page — PaymentModal มี 3 tabs: **PromptPay (Omise auto)** / **บัตร (Omise)** / **โอนเอง (manual)**
  - PromptPay tab: กด "สร้าง QR" → QR image จาก Omise → polling 5s → auto-activate เมื่อชำระสำเร็จ
  - บัตร tab: โหลด Omise.js → popup → tokenize บัตร → charge → auto-activate ทันที (synchronous)
  - โอนเอง tab: manual PromptPay flow เดิม (admin confirm ภายใน 24 ชั่วโมง)
- Added: QR Download button — บันทึก QR PromptPay เป็น PNG (ทั้ง Omise QR และ manual QR)
- Updated: `.env.example` — เพิ่ม `OMISE_SECRET_KEY`, `OMISE_PUBLIC_KEY` + webhook URL guide
- Webhook setup: ตั้งใน Omise Dashboard → Webhooks → `https://your-domain.vercel.app/api/webhooks/omise`

### Files Changed
`src/lib/omise.ts` (new), `src/app/api/omise/charge/route.ts` (new), `src/app/api/omise/status/route.ts` (new), `src/app/api/webhooks/omise/route.ts` (new), `src/app/api/payments/info/route.ts`, `src/app/pricing/page.tsx`, `.env.example`

---

### Features — User Behavior Tracking + Feedback + OCR Learning Data

- Added: **AppEvent model** — บันทึก event การใช้งาน (transaction_saved, transaction_rejected, voice_used, ocr_used, ocr_corrected, export_done, page_view)
- Added: `POST /api/events` — fire-and-forget event tracking endpoint
- Added: `trackEvent()` utility ใน `src/lib/analytics/track.ts`
- Added: **PageTracker component** — track page_view ทุกครั้งที่เปลี่ยนหน้า
- Added: **FeedbackButton** — ปุ่มลอยมุมขวาล่าง, modal ให้ rating ดาว 1-5 + ประเภท (บัค/ฟีเจอร์/ทั่วไป) + ข้อความ
- Added: `POST /api/feedback` — บันทึก feedback ลง DB
- Added: **Admin Analytics page** (`/admin`) — event counts, daily bar chart (7 วัน), top users, OCR correction stats, recent feedbacks (admin only)
- Added: `GET /api/admin/analytics` — stats รวมใน 30 วัน
- Added: **OCR Correction + Learning Data** — `OcrReviewModal` แสดงผล OCR ให้ผู้ใช้แก้ไขก่อน submit, บันทึกคู่ original↔corrected ลง `OcrCorrection` table
- Added: `POST /api/ocr-corrections` — บันทึกเฉพาะเมื่อ user แก้ไขจริง
- Added: `GET /api/ocr-corrections` — admin-only export JSON สำหรับใช้เป็น training data

### Bug Fixes
- Fixed: ปุ่มกล้อง (SlipUploadButton) ต้องกดค้างถึงจะถ่ายรูปได้ — เปลี่ยนเป็น mini menu (ถ่ายรูป / เลือกจากคลัง) เมื่อแตะปุ่มครั้งเดียว
- Fixed: รูปภาพจากกล้องมือถือ (5–15MB) ถูก reject ก่อน resize — ย้าย size check ไปใช้ 20MB และให้ resizeImage() บีบก่อนส่ง API เสมอ
- Fixed: Transactions page ไม่แสดงข้อมูลใหม่หลังบันทึก — router.refresh() + window focus re-fetch
- Perf: parse API ช้า (DB query ทุกครั้ง) — cache categories ด้วย unstable_cache TTL 5 นาที

### Files Changed
`prisma/schema.prisma` (+ AppEvent, Feedback, OcrCorrection models)  
`src/lib/analytics/track.ts` (new)  
`src/app/api/events/route.ts` (new)  
`src/app/api/feedback/route.ts` (new)  
`src/app/api/ocr-corrections/route.ts` (new)  
`src/app/api/admin/analytics/route.ts` (new)  
`src/app/admin/page.tsx` (new)  
`src/components/ui/FeedbackButton.tsx` (new)  
`src/components/layout/PageTracker.tsx` (new)  
`src/components/chat/OcrReviewModal.tsx` (new)  
`src/components/layout/AppShell.tsx` (FeedbackButton + PageTracker)  
`src/app/chat/page.tsx` (trackEvent saved/rejected)  
`src/components/chat/VoiceInputButton.tsx` (trackEvent voice_used)  
`src/components/chat/SlipUploadButton.tsx` (OCR review modal + trackEvent)

---

## 2026-06-05

### Features — OCR Slip + holderName

- Added: `holderName` field ใน `Transaction` model (Prisma schema + DB migration)
- Added: `/api/parser/ocr` อัปเกรด — ดึงชื่อบัญชี (Account.name) ของ user จาก DB ส่งเข้า prompt
- Added: OCR logic ระบุทิศทางเงินจากชื่อบัญชี (ไม่ใช่ชื่อ login)
  - ชื่อผู้โอน = บัญชีตัวเอง → รายจ่าย (โอนเงิน)
  - ชื่อผู้รับ = บัญชีตัวเอง → รายรับ (รับโอน)
  - ผู้รับเป็นชื่อร้านค้า → รายจ่าย (ชำระ)
  - ดึง memo/บันทึกในสลิปใส่ใน text → parser จับ keyword → หมวดหมู่อัตโนมัติ
- Added: `SlipUploadButton` รองรับ **ถ่ายภาพจากกล้อง** (`capture="environment"`) และเลือกจาก Gallery
- Changed: OCR response เพิ่ม `holderName` — `{ text, holderName }` แทนที่ `{ text }` เดิม
- Changed: `ChatInput` เก็บ `pendingHolder` state → ส่งพร้อม submit
- Changed: `chat/page.tsx` — `MsgParsed` มี `holderName`, `handleConfirm` ส่งไปบันทึกใน Transaction
- Changed: `CreateTransactionSchema` + `CreateTransactionBody` รองรับ `holderName`

### Bug Fixes
- Fixed: แก้ชื่อใน Settings แล้วไม่อัปเดต — JWT callback ไม่ handle `trigger=update` ทำให้ token ไม่เปลี่ยน → เพิ่ม handler ใน `src/lib/auth.ts`
- Fixed: Parser ไม่รู้จัก "ชำระ" เป็น expense — เพิ่ม keyword ใน `typeDetector.ts` (44/44 tests pass)
- Fixed: `prisma generate` ต้องรันก่อน dev server หลังแก้ schema — holderName จะ 500 ถ้าไม่ generate

### Files Changed
`prisma/schema.prisma`, `src/app/api/parser/ocr/route.ts`, `src/lib/validators/transaction.ts`,
`src/types/transaction.ts`, `src/components/chat/SlipUploadButton.tsx`,
`src/components/chat/ChatInput.tsx`, `src/app/chat/page.tsx`

---

## 2026-06-04

### Documentation
- Added CLAUDE.md (rewrite) — AI working rules, common tasks, correct Next.js version (16), full API list, env vars
- Added PROJECT_STATUS.md — current state, next tasks, known issues, decisions
- Added CHANGELOG.md
- Fixed .env.example — added missing DIRECT_URL (required by Prisma schema), clarified production NEXTAUTH_URL
- Fixed README.md — corrected Next.js version 14 → 16

### Features
- Added Account Management UI — `/accounts` page, CRUD API, AccountCard + AccountForm, link from Settings
- Added Debt Tracking UI — `/debts` page (3 tabs, summary cards), DebtCard + DebtForm + PaymentModal, partial/full payment, CRUD API

### Parser
- Fixed: date number before amount (e.g. "วันที่ 5 ค่าไฟ 780" → amount=5 bug)
- Fixed: DD/MM date format without year extracted as amount
- Added: Thai word numbers (สองพัน→2000, หนึ่งหมื่น→10000, 3พัน→3000)
- Added: categories — ค่าโทรศัพท์, ค่าเช่า, เงินเดือน + expanded keywords
- Tests: 25 → 41 cases (41/41 pass)

### Testing
- Added Playwright E2E suite — 19 tests (auth, chat, navigation); global-setup auto-creates test user

---

## 2026-06-01

### Voice Input
- Fixed: auto-restart เมื่อ browser หยุด recognition กลางคัน
- Fixed: เปลี่ยน silence timeout จาก 3s → 4s เพื่อลด false stop
- Fixed: continuous mode + ตรวจจับ silence อัตโนมัติ (ไม่ต้องกดหยุดเอง)

### PWA
- Fixed: SW pre-cache — เพิ่ม install guide แบบ manual ใน Settings
- Fixed: เปลี่ยน PWA icons จาก SVG → PNG แก้ปัญหา Android Chrome ติดตั้งไม่ได้
- Added: PWA install button ใน Settings page
- Added: manifest.json, service worker (public/sw.js), icons, PwaRegister.tsx
- Added: หน้า Settings แสดง manual install guide เมื่อ browser ไม่รองรับ `beforeinstallprompt`

### Auth
- Added: middleware.ts — ป้องกันทุก route ยกเว้น `/login`, `/api/auth/**`
- Added: `PATCH /api/user` — update display name + change password
- Added: แสดงชื่อผู้ใช้และ avatar ตัวอักษรแรกใน chat header

### Parser
- Fixed: เพิ่ม keyword `ถอน`, `ฝาก` → transfer type
- Fixed: เพิ่ม keyword `ค้างจ่าย` → debt type
- Result: 25/25 test cases pass (เพิ่มจาก 20 → 25 cases)

### Deploy
- Fixed: ย้าย `prisma migrate deploy` ออกจาก build script (schema apply ไปแล้ว)
- Fixed: เพิ่ม `prisma generate` ใน build script สำหรับ Vercel

---

## 2026-06-01 (Initial Release)

### MVP Complete — Phase 0–7

- Added: Next.js 16 project setup (TypeScript, Tailwind CSS v4, App Router)
- Added: Prisma schema (User, Account, Category, CategoryKeyword, Transaction, Transfer, Debt)
- Added: Seed data — 20+ default categories พร้อม keywords ภาษาไทย
- Added: Thai rule-based parser (`src/lib/parser/`) — normalize, amount, date, type, category, payment method
- Added: Chat UI — parse → ParsedTransactionCard → confirm/reject → save
- Added: Dashboard — SummaryCard (today/month), IncomeExpenseChart, CashflowLineChart, CategoryPieChart
- Added: Transactions page — list, filter, pagination (20/page), inline edit, soft-delete
- Added: Export Excel (.xlsx) และ CSV จากหน้า Transactions
- Added: Categories page — CRUD + keyword management (ใช้ใน parser)
- Added: Settings page — profile edit, logout
- Added: Auth — NextAuth.js JWT, register, login, session
- Added: Voice input (Web Speech API th-TH) ใน chat
- Added: Bottom navigation 4 เมนู: บันทึก / รายงาน / รายการ / ตั้งค่า
- Added: Responsive layout (mobile-first, 375px+)
