# PROJECT_STATUS.md

## Last Updated

2026-06-06 EOD — Referral system ครบ + Landing page + BottomNav

---

## Current Goal

MVP สมบูรณ์แล้ว — ขั้นตอนถัดไปคือ QA/UAT ใน production, เพิ่ม feature ตาม feedback ผู้ใช้จริง

---

## Current State

**Production-ready MVP.** ทุก Phase (0–7) เสร็จสมบูรณ์และ deploy บน Vercel + Supabase แล้ว  
Parser ผ่าน 44/44 test cases, PWA ติดตั้งได้บน Android/iOS, Voice input ทำงานบน Chrome/Safari/Edge  
ผ่าน security & bug fix pass (15 issues จาก code review — Critical/High/Medium ทั้งหมดแก้แล้ว)

---

## Completed

- [x] Phase 0 — Environment Setup, Prisma Schema, Seed categories
- [x] Phase 1 — Layout + UI Components (AppShell, BottomNav, Header, ui/*)
- [x] Phase 2 — Database + API Layer (transactions, categories, dashboard APIs)
- [x] Phase 3 — Thai Parser rule-based (25/25 test cases pass)
- [x] Phase 4 — Chat UI + Voice Input (continuous mode, 4s silence timeout, auto-restart)
- [x] Phase 5 — Dashboard (SummaryCard, 3 charts: IncomeExpense, Cashflow, CategoryPie)
- [x] Phase 6 — Transactions page (list, filter, pagination, edit, soft-delete, Excel/CSV export)
- [x] Phase 7 — Categories + Settings (category CRUD + keywords, profile edit, password change)
- [x] Auth middleware (withAuth, redirect unauthenticated to /login)
- [x] Profile edit (update name + change password via `/api/user`)
- [x] User avatar/name in chat header
- [x] PWA (manifest.json, service worker, icons, install button in Settings)
- [x] Vercel deploy (build script: `prisma generate && next build`)
- [x] Account Management UI (CRUD: /accounts, API /api/accounts, AccountCard, AccountForm)
- [x] OCR Slip + holderName feature — อ่านสลิป/บิลด้วย GPT-4o-mini, ดึง holderName, ระบุรายรับ/รายจ่ายจากชื่อบัญชี, ใช้ memo → category (✅ ทดสอบ production แล้ว)
- [x] Parser: เพิ่ม keyword "ชำระ" เป็น expense type — รองรับ text จาก OCR สลิป
- [x] Fix: แก้ชื่อใน Settings อัปเดตทันที — JWT callback handle trigger=update
- [x] Fix: camera button ใช้งานง่ายขึ้น — mini menu แทน long-press; รับไฟล์ถึง 20MB + resize ก่อนส่ง
- [x] Fix: Transactions page แสดงข้อมูลใหม่ทันที — router.refresh() + window focus re-fetch
- [x] Perf: parse API เร็วขึ้น — cache categories ด้วย unstable_cache (TTL 5 นาที)
- [x] **User Behavior Tracking** — AppEvent model, POST /api/events, trackEvent() fire-and-forget, PageTracker component, track: transaction_saved/rejected, voice_used, ocr_used, ocr_corrected, export_done, page_view
- [x] **User Feedback** — Feedback model, POST /api/feedback, FeedbackButton floating ล่างขวา (ดาว 1-5 + ประเภท + ข้อความ)
- [x] **Admin Analytics** — GET /api/admin/analytics, หน้า /admin (events, daily chart, top users, OCR stats, feedbacks)
- [x] **OCR Correction + Learning Data** — OcrReviewModal ให้ user แก้ข้อความ OCR ก่อน submit, บันทึก correction ลง OcrCorrection table, GET /api/ocr-corrections สำหรับ admin export
- [x] **Transfer UI** — หน้า /transfers, TransferCard/TransferForm, API CRUD (/api/transfers, /api/transfers/[id]), linked from Settings
- [x] **Referral & Affiliate System Phase 1–3**:
  - DB: `ReferralCode`, `Referral`, `Commission`, `PayoutRequest` models + User relations
  - `src/lib/referral.ts` — generateReferralCode()
  - `src/lib/commission.ts` — COMMISSION_TABLE, getPlanCode, createCommissionAfterPayment()
  - `/ref/[code]` — validate code → set localStorage (30 days) → redirect to /login (+ click counter)
  - `POST /api/ref/click` — increment click counter
  - `POST /api/auth/register` — สร้าง ReferralCode ของตัวเอง + ผูก Referral ถ้ามี refCode
  - `/login` — refCode field (auto-fill จาก localStorage), `?mode=register` param
  - Commission hooks: admin payment confirm, Omise webhook, Omise card charge
  - Pricing modal — refCode input field (ใช้ได้ทั้ง Omise + manual flow)
  - Fraud rules: no self-referral, 1 referred user → 1 referrer, commission เฉพาะ paid payment
- [x] **Referral & Affiliate System Phase 4–5**:
  - `GET /api/referral/code` — lazy-create + return referral code ของ user
  - `GET /api/referral/stats` — clicks, signups, conversions, pending/available commission
  - `GET /api/referral/commissions` — commission history ของ user
  - `POST /api/referral/payout` + `GET /api/referral/payout` — ขอถอนเงิน + ประวัติ (min ฿300, masked account)
  - `GET /api/admin/referral/commissions` — admin list all commissions
  - `PATCH /api/admin/referral/commissions/[id]` — approve (check holdUntil) / cancel
  - `GET /api/admin/referral/payouts` — admin list all payout requests
  - `PATCH /api/admin/referral/payouts/[id]` — pay (mark commissions paid) / reject
  - `/referral` page — referral dashboard: code card + share, stats, payout form, commission history
  - `/admin` page — Commissions + Payout Requests sections with approve/cancel/pay/reject actions
- [x] **Referral UX Polish (2026-06-06)**:
  - QR code + Download button ใน `/referral` page
  - `/download` landing page — hero, features, PWA install, register CTA
  - `/ref/[code]` redirect ไป `/download` (แทน `/login`) พร้อม badge "เพื่อนแนะนำมา"
  - Middleware: `/download` + `/ref` เป็น public routes (ไม่ต้อง auth)
  - `SiteSetting` model — key/value store สำหรับ configurable content
  - `GET /api/referral/terms` — public terms endpoint (default → DB override)
  - `GET /api/admin/settings` + `PATCH` — admin แก้ไขเงื่อนไข referral
  - `/download` — collapsible referral terms section (commission table + rules)
  - `/admin` — Referral Terms Editor (rates, holdDays, minPayout, payoutDay, extraNote)
  - Header — amber chip "💰 แนะนำเพื่อน" ทุกหน้าที่ login → `/referral`
  - BottomNav — เพิ่ม tab "แนะนำเพื่อน" (Gift icon) ครบ 5 tabs
- [x] **Phase 3: Omise Automated Payment**:
  - `src/lib/omise.ts` — Omise client wrapper (createPromptPayCharge, createCardCharge, retrieveEvent)
  - `POST /api/omise/charge` — สร้าง charge (PromptPay/Card) + บันทึก Payment
  - `GET /api/omise/status` — poll payment status
  - `POST /api/webhooks/omise` — re-fetch event → activate plan อัตโนมัติ
  - `/pricing` PaymentModal — 3 tabs: PromptPay (auto), บัตร, โอนเอง (manual)
  - Polling 5s/tick สูงสุด 3 นาที — auto-close modal เมื่อ plan activate
  - QR download: manual (canvas.toDataURL) + Omise (fetch blob → download)
  - Env: `OMISE_SECRET_KEY` + `OMISE_PUBLIC_KEY` + webhook URL
- [x] **Plan System Phase 2 (Payment Flow)**:
  - `src/lib/promptpay.ts` — EMVCo PromptPay QR payload generator (CRC-16 CCITT)
  - `GET /api/payments/info` — คืน promptpayPhone จาก env (สำหรับ QR generation)
  - `POST /api/payments` — สร้าง pending Payment record (ป้องกัน duplicate pending)
  - `GET /api/payments` — list ประวัติชำระของ user
  - `GET /api/admin/payments` — list pending payments สำหรับ admin
  - `PATCH /api/admin/payments/[id]` — ยืนยัน → paid + update user.plan + planExpiresAt
  - `DELETE /api/admin/payments/[id]` — ปฏิเสธ → failed
  - `/pricing` page — plan comparison + feature table + PaymentModal (QR + period selector)
  - Admin page — Pending Payments section ด้านบนสุด (confirm/reject inline)
  - Settings — ลิงก์ "ดูแผนราคาทั้งหมด" → /pricing
  - UpgradePrompt → /pricing (เดิม /settings#plan)
  - `.env.example` — เพิ่ม ADMIN_EMAIL + PROMPTPAY_PHONE
- [x] **Plan System Phase 1.5 (Frontend Enforcement)**:
  - Categories/Accounts: gate FAB when at limit
  - Transactions: gate Export button with Lock icon
  - Transfers/Debts: UpgradePrompt banner + hide FAB for free users
- [x] **Plan/Feature Gate System (Phase 1)** — FREE/PRO/MAX plan tiers:
  - DB: `Plan` enum, `UsageQuota` model, `Payment` model + `PaymentStatus` enum on User
  - `src/lib/features.ts` — PLAN_LIMITS, PLAN_LABELS, PLAN_COLORS, PLAN_PRICES, getThaiMonth()
  - Auth: plan included in JWT + session (login fetches plan from DB)
  - OCR: monthly quota per plan (FREE=20, PRO=100, MAX=unlimited) — tracked in UsageQuota
  - Transactions: history capped at 90 days for free plan (GET enforces cutoff)
  - Categories: max 5 custom categories for free plan (POST returns 403 PLAN_LIMIT_CATEGORIES)
  - Accounts: max 2 accounts for free plan (POST returns 403 PLAN_LIMIT_ACCOUNTS)
  - Admin: GET /api/admin/users + PATCH /api/admin/users/[id]/plan — plan management + Payment record
  - Settings: แสดง plan badge + OCR usage progress bar + upgrade nudge
  - Admin page: User management section — list users + plan editor per row
  - `GET /api/user/quota` — ดึงสถานะ OCR quota ของ user
  - `src/components/ui/UpgradePrompt.tsx` — reusable upgrade prompt (compact + card)
- [x] **Security & Bug Fix Pass (15 issues)** — Critical/High/Medium ทั้งหมดแก้แล้ว:
  - Bug: date range filter ใน transactions API (startDate+endDate spread overwrite กัน)
  - Security: OCR rate limiting (10 req/min/user), mimeType allowlist, base64 size limit (20 MB), fetch timeout (20s)
  - Security: Register email validation (`z.string().email()`), IP rate limiting (5 req/min)
  - Bug: `api/user` PATCH ขาด try/catch — เพิ่มแล้ว
  - Security: JWT name update ตอน trigger=update — validate type + slice(0,50)
  - Perf: dashboard/summary ครอบด้วย unstable_cache (TTL 60s per userId)
  - Bug: "today" คำนวณผิด timezone — แก้เป็น UTC+7 (Thai Standard Time)
  - Bug: Parser ขาด `ร้อย` (100) — เพิ่มใน UNIT_MAP + refactor accumulate compound numbers ("สองพันห้าร้อย" = 2500)
  - Bug: Transfer account ownership check อยู่นอก $transaction (TOCTOU) — ย้ายเข้าใน
  - Security: scrypt N upgrade 16384→65536, เก็บ N ใน hash format (backward-compat legacy)
  - Security: admin analytics ลบ hardcoded fallback email ออก (fail-closed ถ้าไม่ set ADMIN_EMAIL env)

---

## In Progress

ไม่มี — รอ QA ใน production

---

## Next Tasks

เรียงตามลำดับความสำคัญ:

1. **QA ทดสอบ Referral flow** — Scan QR → /download → register → commission hook ทำงาน
2. **ตั้งค่า Omise env vars บน Vercel** — `OMISE_SECRET_KEY` + `OMISE_PUBLIC_KEY`
3. **ตั้งค่า Omise Webhook** — `https://your-domain.vercel.app/api/webhooks/omise`
4. **QA Omise payment** — ทดสอบ Test mode (test card: 4242 4242 4242 4242)
5. **Switch Omise to Live mode** — เมื่อพร้อม launch จริง

---

## Important Files

| ไฟล์ | ความสำคัญ |
|---|---|
| `src/lib/parser/parseTransactionText.ts` | parser entry point — core business logic |
| `src/lib/auth.ts` | NextAuth config |
| `src/app/chat/page.tsx` | main user flow: parse → confirm → save |
| `middleware.ts` | auth guard (route protection) |
| `prisma/schema.prisma` | DB schema ครบ |
| `src/data/seedCategories.ts` | parser keywords + default categories |
| `src/lib/validators/transaction.ts` | Zod schemas ใช้ทั้ง API + frontend |
| `src/app/api/parser/ocr/route.ts` | OCR slip — prompt + holderName logic |
| `src/components/chat/SlipUploadButton.tsx` | กล้อง/แกลเลอรี + ส่ง holderName |
| `tests/parser/parseTransactionText.test.ts` | 25 test cases |
| `public/sw.js` | PWA service worker |

---

## Known Issues

1. **Transfer จากแชท ≠ Transfer ใน /transfers** — Transaction type=transfer ที่บันทึกจากแชทไม่มี fromAccountId/toAccountId จึงไม่แสดงในหน้า /transfers (ต้องสร้างผ่านหน้า /transfers เท่านั้น)

2. **Voice input บน iOS Safari**  
   Web Speech API บน iOS Safari มี behavior แตกต่างจาก Android Chrome เล็กน้อย  
   ควรทดสอบ 4s silence timeout บนอุปกรณ์จริง

3. **Parser: "ขาย" keyword**  
   บางประโยคที่ไม่มี context ชัดเจนอาจถูก detect เป็น income หรือ expense ไม่ถูกต้อง  
   → confidence < 0.6 จะแสดง warning ให้ผู้ใช้ยืนยัน

---

## Decisions Made

| Decision | เหตุผล |
|---|---|
| Rule-based parser (ไม่ใช้ AI/ML) | ควบคุม cost, latency, และ offline capability ได้ง่าย |
| Soft delete transactions | ป้องกัน accidental data loss; สามารถ restore ได้ |
| JWT session (ไม่ใช้ database sessions) | ลด DB queries; เหมาะกับ Vercel serverless |
| Transfer/Debt ไม่นับใน P&L dashboard | Business rule — ไม่เป็น income/expense จริง |
| Confirm before save (ทุกครั้ง) | ผู้ใช้ต้องรู้ว่าระบบ parse ถูกก่อนบันทึก |
| PWA แทน Native App | ลด friction การติดตั้ง; รองรับทุก platform ด้วย codebase เดียว |
| Prisma v6 + Next.js 16 | เวอร์ชันล่าสุดตอน init โปรเจกต์ |
| scrypt N:salt:hash format | เก็บ cost factor ไว้ใน hash string เพื่อ backward-compat เมื่อ upgrade N ในอนาคต |
| In-memory rate limiting (Map) | ไม่ต้องการ Redis สำหรับ scale ปัจจุบัน; per-instance แต่เพียงพอสำหรับ personal app |
| Phase 2 ใช้ manual confirmation (ไม่ใช้ webhook) | MVP รองรับ volume น้อย; Omise webhook เพิ่มได้ใน Phase 3 ถ้าจำเป็น |
| PromptPay QR สร้าง client-side | payload ไม่มีข้อมูล sensitive — phone อยู่ใน QR อยู่แล้ว; ไม่ต้องส่งผ่าน server |
| Plan ใน JWT token (ไม่ query DB ทุก request) | ลด DB load; plan สตาเลถ้า admin เปลี่ยน plan — user ต้อง re-login เพื่อให้มีผล |
| UsageQuota keyed ด้วย userId+month (Thai timezone) | นับ OCR ต่อเดือนตาม TZ ไทย (UTC+7) เพื่อให้ตรงกับความคาดหวังผู้ใช้ |
| db push (ไม่ใช้ migrate) | ลด friction สำหรับ Supabase cloud; ใช้ migrate เฉพาะเมื่อต้องการ rollback history |

---

## Need Confirmation

1. ✅ Account management UI — เสร็จ (/accounts, linked from Settings)
2. ✅ Debt Tracking UI — เสร็จ (/debts, linked from Settings)
3. ✅ Production domain ยืนยันแล้ว: `https://mchat-git-main-vinit-deekhanu-s-projects.vercel.app`
4. ✅ Analytics — เสร็จ (/admin สำหรับ admin, Vercel Analytics ติดแล้วใน layout.tsx)
5. ✅ Transfer UI — เสร็จ (/transfers, linked from Settings)
