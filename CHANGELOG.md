# CHANGELOG.md

บันทึกการเปลี่ยนแปลงสำคัญของ MChat เรียงจากใหม่ไปเก่า

---

## 2026-06-06

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
