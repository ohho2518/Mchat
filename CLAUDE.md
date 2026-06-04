# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**MChat** คือ Web App (PWA) บันทึกรายรับรายจ่ายแบบแชทภาษาไทย  
ผู้ใช้พิมพ์ข้อความธรรมดา เช่น `"จ่ายค่าน้ำมัน 500 วันนี้"` ระบบจะแยกหมวด สรุปยอด และแสดงใน Dashboard อัตโนมัติ  
**กลุ่มผู้ใช้:** เจ้าของร้านเล็ก, เกษตรกร, ฟรีแลนซ์, บุคคลทั่วไป

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 + tailwind-merge + clsx |
| Charts | Recharts v3 |
| Forms | React Hook Form v7 + Zod v4 + @hookform/resolvers |
| Icons | lucide-react |
| Auth | NextAuth.js v4 (JWT strategy, credentials only) |
| Database | Supabase PostgreSQL + Prisma ORM v6 |
| Voice | Web Speech API built-in (lang=th-TH) |
| Export | xlsx + papaparse |
| PWA | public/manifest.json + public/sw.js + src/app/PwaRegister.tsx |
| Package manager | npm |
| Deploy | Vercel + Supabase Cloud |

---

## Project Structure

```
src/
  app/
    layout.tsx              ← root layout (Sarabun font, Providers, PwaRegister)
    page.tsx                ← redirect to /chat
    login/page.tsx
    chat/page.tsx           ← หน้าหลัก: parse → confirm → save flow
    dashboard/page.tsx
    transactions/page.tsx
    categories/page.tsx
    settings/page.tsx       ← profile edit, password change, PWA install
    api/
      auth/[...nextauth]/   ← NextAuth handler
      auth/register/        ← POST สร้าง account ใหม่
      user/                 ← PATCH update profile/password
      parser/parse/         ← POST text → ParsedTransaction (ไม่ write DB)
      transactions/         ← GET list, POST create
      transactions/[id]/    ← PUT update, DELETE soft-delete
      categories/           ← GET, POST
      categories/[id]/      ← PUT, DELETE
      dashboard/summary/    ← GET summary (today + month)
      dashboard/daily-cashflow/
      dashboard/category-expense/

  components/
    layout/    AppShell, Header, BottomNav
    chat/      ChatInput, ChatMessage, ParsedTransactionCard, VoiceInputButton
    dashboard/ SummaryCard, PeriodSelector, IncomeExpenseChart, CashflowLineChart, CategoryPieChart
    transactions/ TransactionTable, TransactionFilter, TransactionForm
    categories/  CategoryList, CategoryForm
    ui/        Button, Card, Input, Badge, Modal, Spinner, EmptyState, ConfirmDialog

  lib/
    auth.ts                 ← NextAuth config
    parser/
      parseTransactionText.ts  ← entry point
      normalize.ts, amountParser.ts, dateParser.ts
      typeDetector.ts, categoryDetector.ts, paymentMethodDetector.ts
    db/prisma.ts            ← Prisma singleton
    export/exportExcel.ts, exportCsv.ts
    utils/cn.ts, password.ts
    validators/transaction.ts, category.ts  ← Zod schemas (shared API+client)

  types/transaction.ts, dashboard.ts
  data/seedCategories.ts

middleware.ts               ← withAuth: ป้องกันทุก route ยกเว้น /login, /api/auth
prisma/schema.prisma, seed.ts, migrations/
public/manifest.json, sw.js, icons/
tests/parser/parseTransactionText.test.ts
```

---

## How to Run

```bash
npm install

# ตั้งค่า environment
cp .env.example .env.local
# แก้ DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET

# Setup database
npx prisma migrate dev
npx prisma db seed

npm run dev
# → http://localhost:3000
```

---

## How to Build

```bash
npm run build    # prisma generate && next build
npm run start    # start production server
```

---

## How to Test

```bash
# Parser unit tests (41 test cases)
npm run test:parser

# E2E tests (Playwright) — ต้องมี dev server รันอยู่ หรือ playwright จะรันให้อัตโนมัติ
npm run test:e2e           # headless
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:debug     # debug mode with browser

# Lint
npm run lint
```

### E2E test setup
- ต้องมี `.env.local` พร้อม `DATABASE_URL` และ `NEXTAUTH_SECRET`
- Playwright รัน `npm run dev` อัตโนมัติก่อน test
- global-setup.ts สร้าง test user (`e2e-test@mchat.test`) อัตโนมัติ
- Override credentials ด้วย env vars: `TEST_EMAIL`, `TEST_PASSWORD`
- Auth state เก็บใน `tests/e2e/.auth/user.json` (gitignored)

---

## Environment Variables

จาก `.env.example`:

```env
DATABASE_URL="postgresql://..."       # Supabase pooler URL — ใช้สำหรับ runtime queries
DIRECT_URL="postgresql://..."         # Supabase direct URL — ใช้สำหรับ prisma migrate เท่านั้น
NEXTAUTH_SECRET="..."                 # generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"  # production: https://mchat-git-main-vinit-deekhanu-s-projects.vercel.app
```

> ทั้ง `DATABASE_URL` และ `DIRECT_URL` จำเป็นต้องมีทั้งคู่ — ดู URL แต่ละแบบได้ที่ Supabase Dashboard → Settings → Database → Connection string

---

## Architecture Notes

### Chat Flow (หน้าหลัก)
```
User types text
  → POST /api/parser/parse  (rule-based, no DB write)
  → ParsedTransactionCard แสดงผล + confidence score
  → ถ้า confidence < 0.6 → warning สีแดง "กรุณาตรวจสอบก่อนบันทึก"
  → User กด ยืนยัน → POST /api/transactions
  → User กด ยกเลิก → ไม่บันทึก
```

### Auth Flow
- `middleware.ts` ใช้ `withAuth` จาก NextAuth — redirect ทุก route ไป `/login` ยกเว้น `/login`, `/api/auth/**`
- JWT token เก็บ `userId` ผ่าน `callbacks.jwt` → `callbacks.session` → `session.user.id`
- ทุก API route: `getServerSession(authOptions)` → 401 ถ้าไม่มี session

### Parser Pipeline
```
input → normalize → extractAmount → extractDate → detectType → detectCategory → detectPaymentMethod → calculateConfidence
```
Type detection priority (fixed): **transfer > debt > expense > income**

### Dashboard
- `GET /api/dashboard/summary` คืน today + month totals (exclude transfer/debt)
- `GET /api/dashboard/daily-cashflow?days=N` คืน array วันต่อวัน
- `GET /api/dashboard/category-expense?period=...` คืน breakdown ตามหมวดหมู่
- Dashboard page group daily → monthly เมื่อ period = "year"

### Database
- Soft delete เท่านั้น: `status = 'deleted'` (ห้าม hard delete Transaction)
- ทุก query filter: `status: { not: 'deleted' }`
- Transfer/Debt type ไม่นับใน dashboard sum (filter `type: { in: ['income','expense'] }`)
- Schema มี model: `User`, `Account`, `Category`, `CategoryKeyword`, `Transaction`, `Transfer`, `Debt`
- `Account`, `Transfer`, `Debt` model มีใน schema แต่ยังไม่มี CRUD API/UI รองรับ

---

## Coding Rules

### API Routes
- ทุก async route: `try/catch` + return `{ error: string }` JSON
- Validate ด้วย Zod `.safeParse()` ก่อนแตะ DB เสมอ
- ใช้ Prisma เท่านั้น ห้าม raw SQL
- เช็ค session ก่อนทุก operation

### Parser (`src/lib/parser/`)
- Logic ทั้งหมดอยู่ใน `src/lib/parser/` ห้ามใส่ใน API route
- Type detection priority คงที่: `transfer > debt > expense > income`
- เก็บ `rawText` ทุก Transaction สำหรับ debug

### Components
- ทุก component ต้องมี loading + error + empty state
- Mobile-first (design ที่ 375px ก่อน)
- สีมาตรฐาน: income `green-600`, expense `red-600`, balance `blue-600`
- Font: Sarabun (โหลดจาก Google Fonts ใน layout.tsx)

### Voice Input
- เช็ค `'SpeechRecognition' in window` ก่อนแสดงปุ่ม
- Firefox ไม่รองรับ → ซ่อนปุ่มอัตโนมัติ
- ต้อง HTTPS ใน production

### TypeScript
- strict mode เสมอ
- Validators ใน `src/lib/validators/` ใช้ทั้ง API route และ React Hook Form (ไม่เขียน Zod schema ซ้ำ)

---

## AI Working Rules

1. อ่าน `CLAUDE.md` และ `PROJECT_STATUS.md` ก่อนเริ่มงานทุกครั้ง
2. ห้าม scan ทั้งโปรเจกต์ถ้าไม่จำเป็น — อ่านเฉพาะไฟล์ที่เกี่ยวกับ task ปัจจุบัน
3. แก้เฉพาะส่วนที่เกี่ยวข้อง ห้าม rewrite ทั้งไฟล์ถ้าไม่จำเป็น
4. รักษา behavior เดิมของระบบ ห้ามเปลี่ยน business logic นอกเหนือ task
5. ถ้าไม่แน่ใจ ให้ระบุ assumption ให้ชัดเจนก่อนทำ
6. หลังทำงานเสร็จ ต้องอัปเดต `PROJECT_STATUS.md`
7. ถ้ามีการเปลี่ยน architecture, folder structure, command, DB schema หรือ coding rule → อัปเดต `CLAUDE.md`
8. ถ้ามีการเปลี่ยน feature หรือ user-facing behavior → อัปเดต `CHANGELOG.md`

---

## Common Tasks

| งาน | ไฟล์ที่เกี่ยวข้อง |
|---|---|
| เพิ่มหน้าใหม่ | `src/app/<page>/page.tsx` + เพิ่ม BottomNav ถ้าจำเป็น |
| เพิ่ม component | `src/components/<group>/ComponentName.tsx` + อัปเดต `index.ts` |
| เพิ่ม API endpoint | `src/app/api/<group>/route.ts` + validator ใน `src/lib/validators/` |
| เพิ่ม DB field | `prisma/schema.prisma` → `npx prisma migrate dev` → อัปเดต types |
| เพิ่ม parser keyword | `src/data/seedCategories.ts` (keywords array) → re-seed |
| แก้ parser logic | `src/lib/parser/*.ts` → รัน test ด้วย `npx tsx tests/parser/...` |
| แก้ dashboard chart | `src/components/dashboard/` + `src/app/api/dashboard/*/route.ts` |
| Export ข้อมูล | `src/lib/export/exportExcel.ts` หรือ `exportCsv.ts` |

---

## Do Not Do

- ห้ามใส่ API key, password, token หรือ secret จริงลงในโค้ดหรือเอกสาร
- ห้ามลบไฟล์สำคัญโดยไม่ได้รับคำสั่ง
- ห้ามเปลี่ยน type detection priority ใน parser (transfer > debt > expense > income)
- ห้าม hard delete Transaction (ใช้ soft delete เสมอ)
- ห้ามเปลี่ยน dependency หลักโดยไม่แจ้งเหตุผล
- ห้าม format ทั้งโปรเจกต์ถ้า task ไม่ได้ขอ
- ห้ามนำ business logic ของโปรเจกต์อื่น (dPRO / BC_Upgrade) มาใช้

---

## Reference Docs

| เอกสาร | ตำแหน่ง |
|---|---|
| แผนพัฒนา | `docs/plan/DEV_PLAN.md` |
| Parser Logic | `docs/plan/PARSER_GUIDE.md` |
| API Reference | `docs/api/API_REFERENCE.md` |
| DB Schema | `docs/db/SCHEMA.md` |
| Design System | `docs/design/DESIGN_SYSTEM.md` |
| Parser Test Cases | `tests/parser/TEST_CASES.md` |

*MChat | มิถุนายน 2569*
