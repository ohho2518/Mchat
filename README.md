# MChat — ระบบบันทึกรายรับรายจ่ายแบบแชท

> พิมพ์ พูด ส่งสลิป — บัญชีจัดให้

ผู้ใช้พิมพ์ข้อความธรรมดา เช่น `"จ่ายค่าน้ำมัน 500 วันนี้"` ระบบแยกหมวด สรุปยอด และแสดงใน Dashboard อัตโนมัติ

**Production:** https://mchat-theta.vercel.app  
**Repository:** https://github.com/ohho2518/Mchat

---

## Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment
cp .env.example .env.local
# แก้ไข DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET

# 3. Setup database
npx prisma migrate dev
npx prisma db seed

# 4. รัน development
npm run dev
# เปิด http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 |
| Charts | Recharts v3 |
| Forms | React Hook Form v7 + Zod v4 |
| Auth | NextAuth.js v4 (JWT, credentials) |
| Database | Supabase PostgreSQL + Prisma ORM v6 |
| OCR | Anthropic Claude Haiku 4.5 |
| Payment | Omise (PromptPay + Card) |
| Voice | Web Speech API (th-TH) |
| Export | xlsx + papaparse |
| PWA | manifest.json + service worker |
| Deploy | Vercel + Supabase Cloud |

---

## Features

### Core
- ✅ บันทึกรายรับรายจ่ายด้วยภาษาไทยธรรมชาติ (Thai rule-based parser — 44/44 test cases)
- ✅ Voice Input (พูดภาษาไทยด้วย Web Speech API)
- ✅ OCR อ่านสลิปโอนเงิน → ระบุรายรับ/รายจ่ายอัตโนมัติ
- ✅ Dashboard: ยอดวันนี้/เดือนนี้ + 3 charts (Bar, Line, Pie)
- ✅ รายการย้อนหลัง: filter, search, pagination, soft-delete
- ✅ Export Excel (.xlsx) และ CSV
- ✅ Categories + keyword management (parser ใช้ได้ทันที)
- ✅ Account Management (หลายบัญชี)
- ✅ Transfer ระหว่างบัญชี
- ✅ Debt Tracking (ลูกหนี้/เจ้าหนี้)
- ✅ PWA — ติดตั้งบน Android/iOS ได้

### Plan System
- ✅ Free / Pro / Max plan tiers
- ✅ Feature gates: OCR quota, Categories limit, Accounts limit, Export lock, History cutoff
- ✅ Pricing page + Payment: PromptPay QR (Omise auto) + บัตรเครดิต + โอนเอง (manual)

### Referral & Affiliate
- ✅ Referral Code + Link (/ref/[code] → /download)
- ✅ Referral dashboard: stats, commission history, payout request
- ✅ Commission system: hold 14 วัน, approve, payout ≥ ฿300
- ✅ Admin panel: จัดการ commission + payout requests

### Analytics & Admin
- ✅ User behavior tracking (AppEvent)
- ✅ User feedback (rating + ประเภท)
- ✅ OCR correction learning data
- ✅ Admin dashboard: event stats, top users, pending payments, user management

---

## โครงสร้างโปรเจกต์

```
src/
  app/
    layout.tsx
    page.tsx                  ← redirect to /chat
    login/page.tsx
    chat/page.tsx             ← หน้าหลัก: parse → confirm → save
    dashboard/page.tsx
    transactions/page.tsx
    categories/page.tsx
    accounts/page.tsx
    transfers/page.tsx
    debts/page.tsx
    settings/page.tsx
    pricing/page.tsx
    referral/page.tsx
    admin/page.tsx            ← admin only
    download/page.tsx         ← landing page (public)
    ref/[code]/page.tsx       ← referral redirect (public)
    api/
      auth/[...nextauth]/
      auth/register/
      user/                   ← PATCH update profile/password
      user/quota/             ← GET OCR quota
      parser/parse/
      parser/ocr/
      transactions/
      transactions/[id]/
      categories/
      categories/[id]/
      accounts/
      accounts/[id]/
      transfers/
      transfers/[id]/
      debts/
      debts/[id]/
      dashboard/summary/
      dashboard/daily-cashflow/
      dashboard/category-expense/
      events/                 ← POST track event
      feedback/               ← POST user feedback
      ocr-corrections/        ← POST/GET OCR correction data
      payments/               ← POST create payment, GET history
      payments/info/          ← GET PromptPay + Omise public key
      omise/charge/           ← POST create Omise charge
      omise/status/           ← GET poll payment status
      webhooks/omise/         ← POST Omise webhook
      referral/code/
      referral/stats/
      referral/commissions/
      referral/payout/
      ref/click/              ← POST increment click counter
      admin/analytics/
      admin/users/
      admin/users/[id]/plan/
      admin/payments/
      admin/payments/[id]/
      admin/settings/
      admin/referral/commissions/
      admin/referral/commissions/[id]/
      admin/referral/payouts/
      admin/referral/payouts/[id]/

  components/
    layout/    AppShell, Header, BottomNav, PageTracker
    chat/      ChatInput, ChatMessage, ParsedTransactionCard, VoiceInputButton, SlipUploadButton, OcrReviewModal
    dashboard/ SummaryCard, PeriodSelector, IncomeExpenseChart, CashflowLineChart, CategoryPieChart
    transactions/ TransactionTable, TransactionFilter, TransactionForm
    categories/  CategoryList, CategoryForm
    ui/        Button, Card, Input, Badge, Modal, Spinner, EmptyState, ConfirmDialog, UpgradePrompt, FeedbackButton

  lib/
    auth.ts
    features.ts               ← PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES
    referral.ts               ← generateReferralCode()
    commission.ts             ← COMMISSION_TABLE, createCommissionAfterPayment()
    omise.ts                  ← Omise client wrapper
    promptpay.ts              ← EMVCo PromptPay QR generator
    parser/
      parseTransactionText.ts
      normalize.ts, amountParser.ts, dateParser.ts
      typeDetector.ts, categoryDetector.ts, paymentMethodDetector.ts
    db/prisma.ts
    export/exportExcel.ts, exportCsv.ts
    analytics/track.ts        ← trackEvent() fire-and-forget
    utils/cn.ts, password.ts
    validators/transaction.ts, category.ts

  types/transaction.ts, dashboard.ts
  data/seedCategories.ts

middleware.ts                 ← withAuth (public: /login, /download, /ref/*, /api/auth/*)
prisma/schema.prisma, seed.ts, migrations/
public/manifest.json, sw.js, icons/
tests/parser/parseTransactionText.test.ts (44 cases)
tests/e2e/
```

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."       # Supabase pooler (runtime)
DIRECT_URL="postgresql://..."         # Supabase direct (prisma migrate)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"  # production: https://mchat-theta.vercel.app
ANTHROPIC_API_KEY="sk-ant-..."        # OCR สลิป
ADMIN_EMAIL="..."                     # email ของ admin
PROMPTPAY_PHONE="..."                 # เบอร์ PromptPay สำหรับ QR
OMISE_SECRET_KEY="..."                # Omise secret key
OMISE_PUBLIC_KEY="..."                # Omise public key
```

---

## Commands

```bash
npm run dev              # development server
npm run build            # prisma generate && next build
npm run start            # production server
npm run lint             # ESLint
npm run test:parser      # parser unit tests (44 cases)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
```

---

## เอกสาร

| เอกสาร | ตำแหน่ง |
|---|---|
| สถานะโปรเจกต์ | `PROJECT_STATUS.md` |
| Changelog | `CHANGELOG.md` |
| AI Working Rules | `CLAUDE.md` |
| API Reference | `docs/api/API_REFERENCE.md` |
| Database Schema | `docs/db/SCHEMA.md` |
| Parser Guide | `docs/plan/PARSER_GUIDE.md` |
| Design System | `docs/design/DESIGN_SYSTEM.md` |
| Parser Test Cases | `tests/parser/TEST_CASES.md` |
| Project Context | `docs/MChat_PROJECT_CONTEXT.md` |

---

*MChat | มิถุนายน 2569*
