# PROJECT_STATUS.md

## Last Updated

2026-06-06 (EOD — security & bug fix pass)

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

ไม่มีงานที่กำลังทำอยู่ — รอ feedback จากการใช้งานจริง

---

## Next Tasks

เรียงตามลำดับความสำคัญ:

1. **QA ใน Production** — ทดสอบ golden path บน mobile browser จริง (Android Chrome, iOS Safari)
2. **ตั้งค่า ADMIN_EMAIL env var บน Vercel** — `ADMIN_EMAIL=vndn2518@gmail.com` (จำเป็น หลังจากลบ hardcode fallback)
3. ~~**Transfer UI**~~ ✅ เสร็จ
4. ~~**Debt Tracking UI**~~ ✅ เสร็จ
5. ~~**Account Management UI**~~ ✅ เสร็จ
6. ~~**Parser improvement**~~ ✅ เสร็จ
7. ~~**E2E tests**~~ ✅ เสร็จ
8. ~~**Security & Bug Fix Pass**~~ ✅ เสร็จ

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

---

## Need Confirmation

1. ✅ Account management UI — เสร็จ (/accounts, linked from Settings)
2. ✅ Debt Tracking UI — เสร็จ (/debts, linked from Settings)
3. ✅ Production domain ยืนยันแล้ว: `https://mchat-git-main-vinit-deekhanu-s-projects.vercel.app`
4. ✅ Analytics — เสร็จ (/admin สำหรับ admin, Vercel Analytics ติดแล้วใน layout.tsx)
5. ✅ Transfer UI — เสร็จ (/transfers, linked from Settings)
