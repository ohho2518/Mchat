# MChat — แผนการพัฒนาแบบครบวงจร
### ระบบบันทึกรายรับรายจ่ายแบบแชท
**วิเคราะห์จาก:** mchat_app_ai_handoff.md  
**จัดทำ:** พฤษภาคม 2569 | MVP Target: 8 Phases

---

## สารบัญ
1. [วิเคราะห์ภาพรวม](#1-วิเคราะห์ภาพรวม)
2. [Design System](#2-design-system)
3. [การเตรียมงาน (Phase 0)](#3-การเตรียมงาน-phase-0)
4. [งานพัฒนา (Phase 1–7)](#4-งานพัฒนา-phase-17)
5. [งานทดสอบ (Testing Plan)](#5-งานทดสอบ-testing-plan)
6. [งานเผยแพร่ (Deployment)](#6-งานเผยแพร่-deployment)
7. [Timeline ภาพรวม](#7-timeline-ภาพรวม)
8. [Risk & Mitigation](#8-risk--mitigation)
9. [Definition of Done](#9-definition-of-done)

---

## 1. วิเคราะห์ภาพรวม

### 1.1 สิ่งที่ระบบต้องทำได้ (Core Value)

```
ผู้ใช้พิมพ์: "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้"
                        ↓
               Parser แยก: type=expense, category=ค่าน้ำมัน,
                            amount=500, date=today, desc=รถกระบะ
                        ↓
               ผู้ใช้ยืนยัน → บันทึก DB
                        ↓
               Dashboard อัปเดตทันที
```

### 1.2 Modules หลัก (6 Modules)

| Module | ความสำคัญ | ความซับซ้อน |
|---|---|---|
| **Thai Parser** | 🔴 Critical | สูง — core ของระบบ |
| **Chat UI** | 🔴 Critical | ปานกลาง |
| **Transaction CRUD** | 🔴 Critical | ต่ำ |
| **Dashboard** | 🟠 High | ปานกลาง |
| **Category Mgmt** | 🟡 Medium | ต่ำ |
| **Export** | 🟡 Medium | ต่ำ |

### 1.3 Tech Stack ที่เลือก

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Charts:    Recharts
Forms:     React Hook Form + Zod
HTTP:      Fetch API (Next.js built-in)
Dates:     date-fns

Backend:   Next.js API Routes (monorepo MVP)
Database:  Supabase PostgreSQL (เพื่อ deploy เร็ว)
ORM:       Prisma
Auth:      NextAuth.js (email/password)

Export:    xlsx (ExcelJS) + papaparse (CSV)
Voice:     Web Speech API (SpeechRecognition — built-in browser, ไม่มีค่าใช้จ่าย)
Deploy:    Vercel (Frontend + API) + Supabase Cloud (DB)
```

### 1.4 สิ่งที่ไม่ทำใน MVP
- ❌ AI Parser (OpenAI) — ใช้ rule-based ก่อน
- ❌ OCR สลิป
- ❌ LINE OA
- ✅ Voice input — **รวมใน MVP** (Web Speech API)
- ❌ Multi-user / Organization
- ❌ เชื่อมธนาคาร

### 1.5 Voice Input — รายละเอียด

ใช้ **Web Speech API** (built-in browser) ไม่ต้องจ่ายค่า API เพิ่ม

```
รองรับ: Chrome, Edge, Safari (iOS 15+)
ไม่รองรับ: Firefox (ต้องแสดง fallback)
ภาษา: th-TH
```

**Flow:**
```
1. ผู้ใช้กดปุ่มไมโครโฟน 🎤
2. browser ขอ permission microphone
3. SpeechRecognition เริ่มฟัง (lang='th-TH')
4. ผู้ใช้พูด: "จ่ายค่าน้ำมัน ห้าร้อย วันนี้"
5. transcript → ใส่ใน chat input
6. ส่งไป parser เหมือน text ปกติ
```

**Component เพิ่มใน Phase 4:**
```typescript
// components/chat/VoiceInputButton.tsx
// ใช้ window.SpeechRecognition || window.webkitSpeechRecognition
// States: idle → listening → processing → done/error
```

**UI States ของปุ่มไมโครโฟน:**
```
🎤 (idle)     → กดเพื่อพูด
🔴 (listening) → กำลังฟัง... (pulse animation)
⏳ (processing)→ กำลังแปลง...
❌ (error)    → ไม่รองรับหรือไม่ได้รับ permission
```

**ข้อควรระวัง:**
- ต้องขอ permission ก่อนครั้งแรก
- Firefox ไม่รองรับ → ซ่อนปุ่มอัตโนมัติ (`'SpeechRecognition' in window`)
- HTTPS เท่านั้น (Vercel มี HTTPS อยู่แล้ว)

---

## 2. Design System

### 2.1 Design Tokens

#### Colors
```css
/* Primary */
--color-income:    #16A34A;   /* green-600 — รายรับ */
--color-income-bg: #DCFCE7;   /* green-100 */
--color-expense:   #DC2626;   /* red-600 — รายจ่าย */
--color-expense-bg:#FEE2E2;   /* red-100 */
--color-balance:   #2563EB;   /* blue-600 — คงเหลือ */
--color-balance-bg:#DBEAFE;   /* blue-100 */
--color-transfer:  #D97706;   /* amber-600 — โอนเงิน */
--color-debt:      #7C3AED;   /* violet-600 — หนี้ */

/* Neutral */
--color-bg:        #F9FAFB;   /* gray-50 */
--color-surface:   #FFFFFF;   /* white */
--color-border:    #E5E7EB;   /* gray-200 */
--color-text:      #111827;   /* gray-900 */
--color-text-muted:#6B7280;   /* gray-500 */

/* Semantic */
--color-success:   #16A34A;
--color-warning:   #D97706;
--color-error:     #DC2626;
--color-info:      #2563EB;
```

#### Typography
```css
/* Font */
--font-thai: 'Sarabun', 'Prompt', sans-serif;

/* Scale */
--text-xs:   12px / 16px;
--text-sm:   14px / 20px;
--text-base: 16px / 24px;
--text-lg:   18px / 28px;
--text-xl:   20px / 28px;
--text-2xl:  24px / 32px;
--text-3xl:  30px / 36px;
```

#### Spacing & Radius
```css
--spacing-1: 4px;   --spacing-2: 8px;
--spacing-3: 12px;  --spacing-4: 16px;
--spacing-6: 24px;  --spacing-8: 32px;

--radius-sm: 6px;   --radius-md: 12px;
--radius-lg: 16px;  --radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
```

### 2.2 Component Library (ui/)

| Component | Variants | States |
|---|---|---|
| `Button` | primary, secondary, ghost, danger | default, hover, loading, disabled |
| `Card` | default, income, expense, balance | default, hover |
| `Input` | text, number, date, textarea | default, focus, error, disabled |
| `Badge` | income, expense, transfer, debt | — |
| `Modal` | sm, md, lg | open, closing |
| `Spinner` | sm, md | — |
| `EmptyState` | — | — |
| `ErrorState` | — | — |
| `ConfirmDialog` | — | — |

### 2.3 Layout System

```
AppShell
├── Header (mobile: 56px, desktop: 64px)
│   ├── Logo / Page Title
│   └── User Avatar
├── Main Content (flex-1, overflow-y-auto)
│   └── Page Content
└── BottomNav (mobile: 56px)
    ├── บันทึก (Chat icon)
    ├── รายงาน (Bar chart icon)
    ├── รายการ (List icon)
    └── ตั้งค่า (Settings icon)
```

---

## 3. การเตรียมงาน (Phase 0)

### 3.1 Environment Setup

**สัปดาห์ที่ 1 — วันที่ 1–3**

```bash
# 1. สร้าง Next.js Project
npx create-next-app@latest mchat \
  --typescript --tailwind --app --src-dir

# 2. ติดตั้ง Dependencies
npm install @prisma/client prisma next-auth
npm install recharts date-fns react-hook-form zod
npm install xlsx papaparse @types/papaparse
npm install lucide-react clsx tailwind-merge

# 3. Setup Supabase
# สร้าง project ที่ supabase.com
# copy connection string
npx prisma init --datasource-provider postgresql
```

### 3.2 Checklist การเตรียมงาน

- [ ] สร้าง GitHub repository (private)
- [ ] ตั้งค่า branch strategy: `main` / `develop` / `feature/*`
- [ ] สร้าง Supabase project + copy DATABASE_URL
- [ ] สร้างไฟล์ `.env.local`
- [ ] ตั้งค่า ESLint + Prettier
- [ ] สร้าง Tailwind config (เพิ่ม font Sarabun)
- [ ] สร้าง `globals.css` ใส่ CSS variables
- [ ] สร้าง layout พื้นฐาน (AppShell, BottomNav)
- [ ] ทดสอบ run `npm run dev` ผ่าน

### 3.3 Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  passwordHash String?
  currency     String        @default("THB")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  accounts     Account[]
  categories   Category[]
  transactions Transaction[]
  debts        Debt[]
}

model Account {
  id             String   @id @default(uuid())
  userId         String
  name           String
  type           String   // cash|bank|wallet|business|farm|other
  openingBalance Decimal  @default(0) @db.Decimal(18, 2)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id])
}

model Category {
  id           String            @id @default(uuid())
  userId       String?
  name         String
  type         String            // income|expense|transfer|debt
  color        String?
  icon         String?
  isDefault    Boolean           @default(false)
  isActive     Boolean           @default(true)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  user         User?             @relation(fields: [userId], references: [id])
  keywords     CategoryKeyword[]
  transactions Transaction[]
}

model CategoryKeyword {
  id         String   @id @default(uuid())
  categoryId String
  keyword    String
  createdAt  DateTime @default(now())
  category   Category @relation(fields: [categoryId], references: [id])
}

model Transaction {
  id              String   @id @default(uuid())
  userId          String
  accountId       String?
  categoryId      String?
  transactionDate DateTime @db.Date
  type            String   // income|expense|transfer|debt
  amount          Decimal  @db.Decimal(18, 2)
  description     String?
  rawText         String?
  paymentMethod   String?
  status          String   @default("confirmed") // draft|confirmed|deleted
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
  category        Category? @relation(fields: [categoryId], references: [id])
}

model Debt {
  id              String   @id @default(uuid())
  userId          String
  personName      String?
  debtType        String   // borrowed_from_other|lent_to_other|receivable|payable
  amount          Decimal  @db.Decimal(18, 2)
  remainingAmount Decimal  @db.Decimal(18, 2)
  dueDate         DateTime? @db.Date
  status          String   @default("open") // open|partial|paid|cancelled
  description     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}
```

### 3.4 Seed Data Script

```typescript
// prisma/seed.ts
// Seed default categories + keywords
// Income: ขายของ, รับโอน, ค่าบริการ, เงินสวน, รายรับอื่นๆ
// Expense: ซื้อของ, ค่าน้ำมัน, ค่าอาหาร, ค่าไฟ, ค่าน้ำ, ค่าแรง, ค่าซ่อม, ค่าเดินทาง, รายจ่ายอื่นๆ
```

---

## 4. งานพัฒนา (Phase 1–7)

---

### Phase 1 — Project Setup & Layout
**เป้าหมาย:** เปิดเว็บได้ มี layout หลักและเมนู  
**ระยะเวลา:** 2–3 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 1.1 | สร้าง AppShell Layout | `components/layout/AppShell.tsx` | 2 ชม. |
| 1.2 | สร้าง BottomNav | `components/layout/BottomNav.tsx` | 1 ชม. |
| 1.3 | สร้าง Header | `components/layout/Header.tsx` | 1 ชม. |
| 1.4 | สร้าง Base UI Components | `components/ui/` | 3 ชม. |
| 1.5 | สร้าง Route Pages (empty) | `app/*/page.tsx` | 1 ชม. |
| 1.6 | ตั้งค่า Google Font Sarabun | `app/layout.tsx` | 0.5 ชม. |
| 1.7 | สร้าง Mock Data | `data/mockTransactions.ts` | 1 ชม. |
| 1.8 | สร้าง Types | `types/transaction.ts`, `types/category.ts` | 1 ชม. |

#### ผลลัพธ์
```
✅ npm run dev → เปิดได้ เห็น layout
✅ Bottom nav นำทางได้ทุก route
✅ Responsive บน mobile และ desktop
```

---

### Phase 2 — Database & API Layer
**เป้าหมาย:** API CRUD ทำงานได้ครบ  
**ระยะเวลา:** 3–4 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 2.1 | Run Prisma migration | Terminal | 1 ชม. |
| 2.2 | Run Seed categories | Terminal | 0.5 ชม. |
| 2.3 | สร้าง Prisma client helper | `lib/db/prisma.ts` | 0.5 ชม. |
| 2.4 | Auth Setup (NextAuth email/password) | `app/api/auth/` | 3 ชม. |
| 2.5 | GET /api/transactions | `app/api/transactions/route.ts` | 2 ชม. |
| 2.6 | POST /api/transactions | เดิม | 1 ชม. |
| 2.7 | PUT /api/transactions/[id] | `app/api/transactions/[id]/route.ts` | 1 ชม. |
| 2.8 | DELETE /api/transactions/[id] | เดิม | 0.5 ชม. |
| 2.9 | GET /api/categories | `app/api/categories/route.ts` | 1 ชม. |
| 2.10 | POST/PUT/DELETE /api/categories | เดิม | 1 ชม. |
| 2.11 | GET /api/dashboard/summary | `app/api/dashboard/summary/route.ts` | 2 ชม. |
| 2.12 | GET /api/dashboard/daily-cashflow | `app/api/dashboard/daily-cashflow/route.ts` | 1 ชม. |
| 2.13 | GET /api/dashboard/category-expense | `app/api/dashboard/category-expense/route.ts` | 1 ชม. |

#### API Contract สำคัญ

```typescript
// GET /api/transactions
// Query: start_date, end_date, type, category_id, keyword, page, limit

// POST /api/transactions
interface CreateTransactionBody {
  type: 'income' | 'expense' | 'transfer' | 'debt'
  categoryId?: string
  accountId?: string
  amount: number
  transactionDate: string    // YYYY-MM-DD
  description?: string
  rawText?: string
  paymentMethod?: string
}

// GET /api/dashboard/summary?period=month
interface DashboardSummary {
  incomeToday: number
  expenseToday: number
  balanceToday: number
  incomeMonth: number
  expenseMonth: number
  balanceMonth: number
}
```

#### ผลลัพธ์
```
✅ POST /api/transactions → สร้างได้ ดึงได้ แก้ไขได้ ลบได้
✅ GET /api/dashboard/summary → คืนยอดถูกต้อง
✅ Login / Logout ทำงานได้
```

---

### Phase 3 — Thai Rule-based Parser
**เป้าหมาย:** พิมพ์ภาษาไทย → ได้ JSON ถูกต้อง  
**ระยะเวลา:** 3–5 วัน (สำคัญที่สุด)

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 3.1 | สร้าง normalize function | `lib/parser/normalize.ts` | 1 ชม. |
| 3.2 | สร้าง amountParser | `lib/parser/amountParser.ts` | 2 ชม. |
| 3.3 | สร้าง dateParser | `lib/parser/dateParser.ts` | 2 ชม. |
| 3.4 | สร้าง typeDetector | `lib/parser/typeDetector.ts` | 2 ชม. |
| 3.5 | สร้าง categoryDetector | `lib/parser/categoryDetector.ts` | 2 ชม. |
| 3.6 | สร้าง paymentMethodDetector | `lib/parser/paymentMethodDetector.ts` | 1 ชม. |
| 3.7 | รวม parseTransactionText | `lib/parser/parseTransactionText.ts` | 2 ชม. |
| 3.8 | สร้าง confidence score | เดิม | 1 ชม. |
| 3.9 | สร้าง POST /api/parser/parse | `app/api/parser/parse/route.ts` | 1 ชม. |
| 3.10 | เขียน test cases 20+ | `__tests__/parser/` | 3 ชม. |

#### Parser Architecture

```typescript
// lib/parser/parseTransactionText.ts

export interface ParsedTransaction {
  type: 'income' | 'expense' | 'transfer' | 'debt' | 'unknown'
  amount: number | null
  transactionDate: string | null   // YYYY-MM-DD
  categoryName: string | null
  description: string
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'unknown'
  confidence: number               // 0.0 – 1.0
  rawText: string
}

export function parseTransactionText(
  input: string,
  categories: CategoryKeyword[]
): ParsedTransaction {
  const normalized = normalize(input)
  const amount     = extractAmount(normalized)
  const date       = extractDate(normalized)
  const type       = detectType(normalized)
  const category   = detectCategory(normalized, categories, type)
  const method     = detectPaymentMethod(normalized)
  const description = extractDescription(normalized, { amount, date, type, category, method })
  const confidence = calculateConfidence({ amount, date, type, category, method, description })

  return { type, amount, transactionDate: date, categoryName: category,
           description, paymentMethod: method, confidence, rawText: input }
}
```

#### Confidence Scoring

```typescript
function calculateConfidence(parts): number {
  let score = 0
  if (parts.amount    !== null)      score += 0.30
  if (parts.type      !== 'unknown') score += 0.20
  if (parts.category  !== null)      score += 0.20
  if (parts.date      !== null)      score += 0.15
  if (parts.method    !== 'unknown') score += 0.10
  if (parts.description.length > 0)  score += 0.05
  return Math.min(score, 1.0)
}
// confidence < 0.6 → แสดง warning "กรุณาตรวจสอบก่อนบันทึก"
```

#### ผลลัพธ์
```
✅ ทดสอบ 20 test case ผ่านครบ
✅ จับ amount ได้ทุกกรณี (เลขไทย, comma, ทศนิยม)
✅ แยก income/expense/transfer/debt ถูกต้อง
✅ ตีความวันที่ "วันนี้", "เมื่อวาน", "วันที่ 25" ได้
```

---

### Phase 4 — Chat UI
**เป้าหมาย:** ผู้ใช้พิมพ์และบันทึกรายการได้จริง  
**ระยะเวลา:** 3–4 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 4.1 | สร้าง ChatInput component | `components/chat/ChatInput.tsx` | 1 ชม. |
| 4.2 | สร้าง ChatMessage bubble | `components/chat/ChatMessage.tsx` | 1 ชม. |
| 4.3 | สร้าง ParsedTransactionCard | `components/chat/ParsedTransactionCard.tsx` | 3 ชม. |
| 4.4 | สร้าง EditTransactionModal | `components/chat/EditTransactionModal.tsx` | 2 ชม. |
| 4.5 | สร้าง หน้า /chat | `app/chat/page.tsx` | 3 ชม. |
| 4.6 | เชื่อม API parser | เดิม | 1 ชม. |
| 4.7 | เชื่อม API transactions POST | เดิม | 1 ชม. |
| 4.8 | แสดง loading state | เดิม | 1 ชม. |
| 4.9 | แสดง error state | เดิม | 0.5 ชม. |
| 4.10 | **สร้าง VoiceInputButton** | `components/chat/VoiceInputButton.tsx` | 2 ชม. |
| 4.11 | เชื่อม Voice → Chat Input | `app/chat/page.tsx` | 1 ชม. |
| 4.12 | Fallback ถ้า browser ไม่รองรับ | เดิม | 0.5 ชม. |
| 4.13 | ทดสอบบนมือถือ | Browser DevTools + จริง | 1 ชม. |

#### Chat Flow Detail

```
State: messages: ChatMessage[]
       pendingTransaction: ParsedTransaction | null

1. ผู้ใช้พิมพ์ข้อความ → กด Enter หรือปุ่มส่ง
2. เพิ่ม user bubble ลง messages
3. set loading = true
4. POST /api/parser/parse → ได้ ParsedTransaction
5. set pendingTransaction = result
6. แสดง ParsedTransactionCard ใน messages
7. ผู้ใช้กด:
   - [ยืนยัน] → POST /api/transactions → แสดง "บันทึกสำเร็จ ✅"
   - [แก้ไข]  → เปิด EditTransactionModal → แก้ไข → POST
   - [ลบ]    → clear pendingTransaction
```

#### ParsedTransactionCard Design
```
┌─────────────────────────────────┐
│ 📋 รายการที่ตรวจพบ             │
│ ─────────────────────────────── │
│ ประเภท:    🔴 รายจ่าย          │
│ หมวดหมู่:  ⛽ ค่าน้ำมัน        │
│ จำนวน:     ฿500                │
│ วันที่:    31 พ.ค. 2569        │
│ รายละเอียด: รถกระบะ            │
│ ─────────────────────────────── │
│ ⚠️ ความมั่นใจ 90%              │
│ ─────────────────────────────── │
│ [แก้ไข]  [ลบ]  [✅ ยืนยันบันทึก]│
└─────────────────────────────────┘
```

#### ผลลัพธ์
```
✅ พิมพ์ข้อความ → เห็น card แยกหมวด
✅ กดยืนยัน → บันทึกสำเร็จ แสดง feedback
✅ กดแก้ไข → modal เปิด แก้ไขได้
✅ confidence < 0.6 → เห็น warning
```

---

### Phase 5 — Dashboard
**เป้าหมาย:** เห็นภาพรวมรายรับรายจ่ายชัดเจน  
**ระยะเวลา:** 3 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 5.1 | สร้าง SummaryCard | `components/dashboard/SummaryCard.tsx` | 1 ชม. |
| 5.2 | สร้าง IncomeExpenseChart (Bar) | `components/dashboard/IncomeExpenseChart.tsx` | 2 ชม. |
| 5.3 | สร้าง CategoryPieChart | `components/dashboard/CategoryPieChart.tsx` | 2 ชม. |
| 5.4 | สร้าง CashflowLineChart | `components/dashboard/CashflowLineChart.tsx` | 2 ชม. |
| 5.5 | สร้าง RecentTransactionList | `components/dashboard/RecentTransactionList.tsx` | 1 ชม. |
| 5.6 | สร้าง Period Selector (วันนี้/เดือนนี้/ปีนี้) | เดิม | 1 ชม. |
| 5.7 | สร้างหน้า /dashboard | `app/dashboard/page.tsx` | 2 ชม. |
| 5.8 | เชื่อม API dashboard ทั้งหมด | เดิม | 1 ชม. |

#### Dashboard Layout

```
/dashboard
├── Header: "สวัสดี [ชื่อ]" + วันที่
├── Period Selector: [วันนี้] [สัปดาห์] [เดือนนี้] [ปีนี้]
├── Summary Cards (2x3 grid):
│   ├── รายรับวันนี้ (สีเขียว)
│   ├── รายจ่ายวันนี้ (สีแดง)
│   ├── คงเหลือวันนี้ (สีน้ำเงิน)
│   ├── รายรับเดือนนี้
│   ├── รายจ่ายเดือนนี้
│   └── กำไร/คงเหลือเดือนนี้
├── Chart 1: Bar — รายรับ vs รายจ่าย รายวัน
├── Chart 2: Pie — สัดส่วนรายจ่ายตามหมวด
├── Chart 3: Line — เงินคงเหลือสะสม
└── รายการล่าสุด (5 รายการ) + [ดูทั้งหมด]
```

#### ผลลัพธ์
```
✅ Summary cards แสดงยอดถูกต้อง
✅ กราฟแสดงข้อมูลจริงจาก DB
✅ เปลี่ยน period → ข้อมูลอัปเดต
✅ Responsive บนมือถือ
```

---

### Phase 6 — Transactions Page & Export
**เป้าหมาย:** ดูและจัดการรายการย้อนหลังได้ครบ  
**ระยะเวลา:** 3 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 6.1 | สร้าง TransactionTable | `components/transactions/TransactionTable.tsx` | 2 ชม. |
| 6.2 | สร้าง TransactionFilter | `components/transactions/TransactionFilter.tsx` | 2 ชม. |
| 6.3 | สร้าง TransactionForm (Edit Modal) | `components/transactions/TransactionForm.tsx` | 2 ชม. |
| 6.4 | สร้าง ConfirmDelete Dialog | `components/ui/ConfirmDialog.tsx` | 1 ชม. |
| 6.5 | สร้างหน้า /transactions | `app/transactions/page.tsx` | 2 ชม. |
| 6.6 | Export Excel (.xlsx) | `lib/export/exportExcel.ts` | 2 ชม. |
| 6.7 | Export CSV | `lib/export/exportCsv.ts` | 1 ชม. |
| 6.8 | Pagination | เดิม | 1 ชม. |

#### Table Columns
```
วันที่ | ประเภท | หมวดหมู่ | รายละเอียด | ช่องทาง | จำนวน (฿) | แก้ไข | ลบ
```

#### Filter Options
```
📅 ช่วงวันที่: [__/__/____] ถึง [__/__/____]
📂 ประเภท: [ทั้งหมด ▼] [รายรับ] [รายจ่าย] [โอน] [หนี้]
🏷️ หมวดหมู่: [ทั้งหมด ▼]
🔍 ค้นหา: [พิมพ์คำค้นหา...]
📥 Export: [Excel] [CSV]
```

#### ผลลัพธ์
```
✅ แสดงรายการ filter ได้ทุกแบบ
✅ แก้ไขรายการผ่าน modal ได้
✅ ลบรายการ (soft delete) ได้
✅ Export Excel และ CSV ได้
```

---

### Phase 7 — Category Management & Settings
**เป้าหมาย:** ผู้ใช้ปรับหมวดหมู่เองได้  
**ระยะเวลา:** 2–3 วัน

#### งานที่ต้องทำ

| # | งาน | ไฟล์ | เวลา |
|---|---|---|---|
| 7.1 | สร้าง CategoryList | `components/categories/CategoryList.tsx` | 1 ชม. |
| 7.2 | สร้าง CategoryForm | `components/categories/CategoryForm.tsx` | 2 ชม. |
| 7.3 | Keyword management UI | เดิม | 2 ชม. |
| 7.4 | หน้า /categories | `app/categories/page.tsx` | 1 ชม. |
| 7.5 | หน้า /settings | `app/settings/page.tsx` | 2 ชม. |
| 7.6 | ตั้งค่าวันเริ่มต้นเดือนบัญชี | เดิม | 1 ชม. |
| 7.7 | ตั้งค่าสกุลเงิน | เดิม | 0.5 ชม. |
| 7.8 | Reload keywords ใน parser | `app/api/parser/parse/route.ts` | 1 ชม. |

#### ผลลัพธ์
```
✅ เพิ่ม/แก้ไข/ลบหมวดหมู่ได้
✅ เพิ่ม keyword → parser ใช้ได้ทันที
✅ หน้าตั้งค่าพื้นฐานทำงานได้
```

---

## 5. งานทดสอบ (Testing Plan)

### 5.1 Testing Levels

```
Unit Tests      → Parser functions (เป็นส่วนที่สำคัญที่สุด)
Integration     → API endpoints
E2E (manual)    → Critical user flows
Responsive      → Mobile + Desktop browsers
```

### 5.2 Unit Test — Parser (ต้องผ่าน 100%)

**ไฟล์:** `__tests__/parser/parseTransactionText.test.ts`

```typescript
// 20 test cases จากเอกสาร + เพิ่มเติม

describe('parseTransactionText', () => {
  // Amount extraction
  test('จับ amount ตัวเลขปกติ: "จ่าย 500"')
  test('จับ amount มี comma: "เติมน้ำมัน 1,200"')
  test('จับ amount เลขไทย: "จ่าย ๕๐๐"')

  // Type detection
  test('expense: "จ่ายค่าน้ำมัน 500 วันนี้"')
  test('income:  "ขายของ 850 เงินสด"')
  test('transfer:"โอนจากบัญชีร้านไปบัญชีสวน 3000"')
  test('debt:    "ยืมเงินแม่ 5000"')
  test('debt:    "คืนเงินพี่ 2000"')

  // Date extraction
  test('วันนี้   → today')
  test('เมื่อวาน → yesterday')
  test('วันที่ 25 → day 25 of current month')

  // Category detection
  test('ค่าน้ำมัน → "ค่าน้ำมัน" category')
  test('กินข้าว   → "ค่าอาหาร" category')
  test('ขายทุเรียน → "เงินสวน" category')
  test('ไม่มี keyword → "รายจ่ายอื่น ๆ"')

  // Confidence
  test('ข้อความครบ → confidence >= 0.8')
  test('ไม่มี amount → confidence < 0.5')

  // All 20 test cases from doc
  testCases20.forEach(({ input, expected }) => {
    test(input, () => {
      const result = parseTransactionText(input, mockCategories)
      expect(result.type).toBe(expected.type)
      expect(result.amount).toBe(expected.amount)
    })
  })
})
```

### 5.3 Integration Test — API

```typescript
// __tests__/api/transactions.test.ts

describe('POST /api/transactions', () => {
  test('สร้าง transaction income ได้')
  test('สร้าง transaction expense ได้')
  test('ขาด amount → return 400')
  test('ขาด type → return 400')
})

describe('GET /api/transactions', () => {
  test('ดึงรายการทั้งหมดได้')
  test('filter by type ได้')
  test('filter by date range ได้')
  test('search by keyword ได้')
})

describe('GET /api/dashboard/summary', () => {
  test('คืน income/expense/balance ถูกต้อง')
  test('period=today คำนวณถูก')
  test('period=month คำนวณถูก')
})
```

### 5.4 Manual E2E Test — Critical Flows

| # | Flow | Steps | Pass Criteria |
|---|---|---|---|
| E1 | **บันทึกรายจ่าย** | พิมพ์ "จ่ายค่าน้ำมัน 500 วันนี้" → ยืนยัน | เห็น "บันทึกสำเร็จ" + ปรากฏใน dashboard |
| E2 | **บันทึกรายรับ** | พิมพ์ "ขายของ 1250 เงินสด" → ยืนยัน | บันทึกได้ + dashboard อัปเดต |
| E3 | **แก้ไขก่อนบันทึก** | พิมพ์ข้อความ → กดแก้ไข → เปลี่ยน amount → ยืนยัน | บันทึกด้วยค่าที่แก้ไข |
| E4 | **ลบรายการ** | เปิด /transactions → กดลบ → ยืนยัน | รายการหายออกจากตาราง |
| E5 | **Export Excel** | กด Export Excel ใน /transactions | ดาวน์โหลด .xlsx ได้ เปิดได้ ข้อมูลถูก |
| E6 | **Dashboard period** | เปิด /dashboard → เปลี่ยนจาก "วันนี้" เป็น "เดือนนี้" | ยอดรวม + กราฟเปลี่ยน |
| E7 | **Login/Logout** | Login → ใช้งาน → Logout | Session clear redirect ไป /login |
| E8 | **เพิ่มหมวดใหม่** | /categories → เพิ่มหมวด "ค่าปุ๋ย" → keyword "ปุ๋ย" | พิมพ์ "ซื้อปุ๋ย 500" → detect ได้ |
| E9 | **Voice Input** | กดไมโครโฟน → พูด "จ่ายค่าน้ำมัน ห้าร้อย วันนี้" | transcript ปรากฏใน input → parser ตีความได้ |
| E10 | **Voice — browser ไม่รองรับ** | เปิดบน Firefox | ปุ่มไมโครโฟนซ่อน / แสดง tooltip แจ้ง |

### 5.5 Responsive Test

| Device | Breakpoint | ต้องผ่าน |
|---|---|---|
| iPhone SE | 375px | Chat UI ใช้งานได้ BottomNav เห็น |
| iPhone 14 | 390px | Dashboard card 2 col |
| iPad | 768px | Layout ดีขึ้น |
| Desktop | 1280px | ใช้งานได้สะดวก |

### 5.6 Browser Compatibility

| Browser | ต้องผ่าน |
|---|---|
| Chrome (latest) | ✅ ทุก feature |
| Safari iOS | ✅ ทุก feature |
| Firefox | ✅ ทุก feature |
| Edge | ✅ ทุก feature |

### 5.7 Error State Testing

| Scenario | Expected |
|---|---|
| API ล่ม | แสดง error message ชัดเจน ไม่ crash |
| Parser confidence ต่ำ | แสดง warning แดง |
| Network ออฟไลน์ | แสดง "ไม่มีการเชื่อมต่อ" |
| รายการว่าง | แสดง Empty State พร้อมปุ่มนำทาง |
| Token หมดอายุ | redirect ไป /login |

---

## 6. งานเผยแพร่ (Deployment)

### 6.1 Environment Variables

```bash
# .env.local (development)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="random-secret-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Environment Variables (production)
DATABASE_URL=<Supabase connection pooler URL>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://mchat.vercel.app
```

### 6.2 Pre-deploy Checklist

**Database**
- [ ] Migration รันบน production DB แล้ว (`prisma migrate deploy`)
- [ ] Seed categories รันแล้ว
- [ ] Connection string ใช้ connection pooler (port 6543)
- [ ] Row Level Security (RLS) เปิดใน Supabase ถ้าต้องการ

**Code**
- [ ] `npm run build` ผ่าน ไม่มี error
- [ ] `npm run lint` ผ่าน
- [ ] Unit tests ผ่านทั้งหมด
- [ ] ลบ console.log ที่ไม่จำเป็น
- [ ] ตรวจ `.env` ไม่ถูก commit ลง git
- [ ] `next.config.js` ตั้งค่า production ถูก

**Security**
- [ ] API routes ทุกอันมี authentication check
- [ ] Input validation ด้วย Zod ทุก endpoint
- [ ] SQL injection ป้องกันผ่าน Prisma (parameterized)
- [ ] Rate limiting (ถ้ามีเวลา)
- [ ] HTTPS เปิด (Vercel ทำให้อัตโนมัติ)

**UX**
- [ ] Loading states ครบทุก async action
- [ ] Error states ครบ
- [ ] Empty states ครบ
- [ ] ทดสอบ mobile browser จริง (ไม่ใช่แค่ DevTools)

### 6.3 Deploy Steps

```
Step 1: Push code to GitHub
  git push origin main

Step 2: Deploy Database
  npx prisma migrate deploy   ← รันบน production
  npx prisma db seed          ← seed categories

Step 3: Deploy to Vercel
  vercel --prod
  หรือ connect GitHub repo → auto deploy

Step 4: Verify
  เปิด https://mchat.vercel.app
  ทดสอบ login, บันทึกรายการ, dashboard

Step 5: Custom Domain (optional)
  Vercel → Domains → Add domain
```

### 6.4 Monitoring (หลัง Deploy)

| สิ่งที่ monitor | Tool | Alert เมื่อ |
|---|---|---|
| Error logs | Vercel Logs | 500 error rate สูง |
| DB connections | Supabase Dashboard | Connection pool เต็ม |
| Response time | Vercel Analytics | > 3 วินาที |
| Build failures | GitHub Actions | Build fail |

### 6.5 Rollback Plan

```
ถ้า production มีปัญหา:
1. Vercel → Deployments → Rollback to previous
2. ถ้า DB migration มีปัญหา:
   npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 7. Timeline ภาพรวม

| Phase | งาน | ระยะเวลา | รวมสะสม |
|---|---|---|---|
| **Phase 0** | เตรียมงาน + Environment + Schema | 3 วัน | 3 วัน |
| **Phase 1** | Layout + UI Components + Mock Data | 3 วัน | 6 วัน |
| **Phase 2** | Database + API Layer | 4 วัน | 10 วัน |
| **Phase 3** | Thai Parser (Rule-based) + Tests | 5 วัน | 15 วัน |
| **Phase 4** | Chat UI | 4 วัน | 19 วัน |
| **Phase 5** | Dashboard | 3 วัน | 22 วัน |
| **Phase 6** | Transactions + Export | 3 วัน | 25 วัน |
| **Phase 7** | Category + Settings | 3 วัน | 28 วัน |
| **Testing** | Unit + Integration + E2E + Responsive | 3 วัน | 31 วัน |
| **Deploy** | Pre-deploy checks + Deploy + Verify | 2 วัน | 33 วัน |
| **Buffer** | แก้ bug + polis