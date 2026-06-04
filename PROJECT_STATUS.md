# PROJECT_STATUS.md

## Last Updated

2026-06-04

---

## Current Goal

MVP สมบูรณ์แล้ว — ขั้นตอนถัดไปคือ QA/UAT ใน production, เพิ่ม feature ตาม feedback ผู้ใช้จริง

---

## Current State

**Production-ready MVP.** ทุก Phase (0–7) เสร็จสมบูรณ์และ deploy บน Vercel + Supabase แล้ว  
Parser ผ่าน 25/25 test cases, PWA ติดตั้งได้บน Android/iOS, Voice input ทำงานบน Chrome/Safari/Edge

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

---

## In Progress

ไม่มีงานที่กำลังทำอยู่ — รอ feedback จากการใช้งานจริง

---

## Next Tasks

เรียงตามลำดับความสำคัญ:

1. **QA ใน Production** — ทดสอบ golden path บน mobile browser จริง (Android Chrome, iOS Safari)
2. **DIRECT_URL ใน .env.example** — เพิ่ม `DIRECT_URL` เพื่อรองรับ `prisma migrate dev` บน Supabase (ดู Known Issues)
3. **Account Management UI** — schema มี `Account` model แต่ยังไม่มีหน้าจัดการ/CRUD API
4. **Debt Tracking UI** — schema มี `Debt` model แต่ยังไม่มีหน้าติดตามลูกหนี้/เจ้าหนี้
5. **Parser improvement** — เพิ่ม test cases สำหรับ edge case เช่น ตัวเลขภาษาไทยผสม
6. **README update** — README.md ยังระบุ Next.js 14 (จริงคือ v16)
7. **E2E tests** — `tests/e2e/` ยังว่างอยู่ ยังไม่มี automated E2E

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
| `tests/parser/parseTransactionText.test.ts` | 25 test cases |
| `public/sw.js` | PWA service worker |

---

## Known Issues

1. **Account/Transfer/Debt models ยังไม่มี UI**  
   Schema มี model เหล่านี้ครบ แต่ไม่มี API routes หรือ UI component รองรับ  
   Transaction ที่ type=transfer/debt บันทึกได้แต่ไม่มีหน้าจัดการแยก

3. **Voice input บน iOS Safari**  
   Web Speech API บน iOS Safari มี behavior แตกต่างจาก Android Chrome เล็กน้อย  
   ควรทดสอบ 4s silence timeout บนอุปกรณ์จริง

4. **Parser: "ขาย" keyword**  
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

---

## Need Confirmation

1. ต้องการให้เพิ่ม Account management UI ไหม? (เลือกบัญชีตอนบันทึก transaction)
2. ต้องการหน้าติดตาม Debt (ลูกหนี้/เจ้าหนี้) แยกต่างหากไหม?
3. ✅ Production domain ยืนยันแล้ว: `https://mchat.vercel.app` — ตั้ง `NEXTAUTH_URL` นี้ใน Vercel Dashboard → Settings → Environment Variables
4. ต้องการ analytics หรือ crash monitoring ไหม? (Sentry, Vercel Analytics ฯลฯ)
