# CHANGELOG.md

บันทึกการเปลี่ยนแปลงสำคัญของ MChat เรียงจากใหม่ไปเก่า

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
