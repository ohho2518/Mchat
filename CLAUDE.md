# MChat — Claude Code Handoff

> อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง

---

## โปรเจกต์คืออะไร

**MChat** คือ Web App บันทึกรายรับรายจ่ายแบบแชท  
ผู้ใช้พิมพ์ภาษาไทยธรรมดา เช่น `"จ่ายค่าน้ำมัน 500 วันนี้"` แล้วระบบแยกหมวด สรุปยอด และทำ Dashboard ให้ทันที

**กลุ่มผู้ใช้:** เจ้าของร้านเล็ก, เกษตรกร, ฟรีแลนซ์, บุคคลทั่วไป

---

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Charts:    Recharts
Forms:     React Hook Form + Zod
Backend:   Next.js API Routes
Database:  Supabase PostgreSQL + Prisma ORM
Auth:      NextAuth.js (email/password)
Voice:     Web Speech API (built-in browser, lang=th-TH)
Export:    ExcelJS + papaparse
Deploy:    Vercel + Supabase Cloud
```

---

## โครงสร้างโฟลเดอร์

```
src/
  app/
    chat/page.tsx               ← หน้าหลัก (บันทึกด้วยแชท)
    dashboard/page.tsx
    transactions/page.tsx
    categories/page.tsx
    settings/page.tsx
    api/
      parser/parse/route.ts     ← POST: แปลง text → transaction
      transactions/route.ts     ← GET, POST
      transactions/[id]/route.ts← PUT, DELETE
      categories/route.ts
      dashboard/summary/route.ts
      dashboard/daily-cashflow/route.ts
      dashboard/category-expense/route.ts

  components/
    layout/  AppShell, Header, BottomNav
    chat/    ChatInput, ChatMessage, ParsedTransactionCard, VoiceInputButton
    dashboard/ SummaryCard, IncomeExpenseChart, CategoryPieChart, CashflowLineChart
    transactions/ TransactionTable, TransactionFilter, TransactionForm
    categories/  CategoryList, CategoryForm
    ui/      Button, Card, Input, Badge, Modal, Spinner, EmptyState, ConfirmDialog

  lib/
    parser/
      parseTransactionText.ts   ← main function (entry point)
      normalize.ts
      amountParser.ts
      dateParser.ts
      typeDetector.ts
      categoryDetector.ts
      paymentMethodDetector.ts
    db/prisma.ts
    export/exportExcel.ts
    export/exportCsv.ts

  types/
    transaction.ts
    dashboard.ts

  data/
    seedCategories.ts           ← seed data พร้อมใช้

prisma/schema.prisma            ← DB schema ครบแล้ว
tests/
  parser/                       ← unit tests
  api/                          ← integration tests
  e2e/
docs/
  plan/DEV_PLAN.md              ← แผนพัฒนาครบวงจร
  plan/PARSER_GUIDE.md
  api/API_REFERENCE.md
  db/SCHEMA.md
  design/DESIGN_SYSTEM.md
```

---

## Development Phases — สถานะปัจจุบัน

| Phase | งาน | สถานะ |
|---|---|---|
| **Phase 0** | Environment Setup + Schema + Seed | ✅ เสร็จ |
| **Phase 1** | Layout + UI Components | ✅ เสร็จ |
| **Phase 2** | Database + API Layer | ✅ เสร็จ |
| **Phase 3** | Thai Parser (Rule-based) | ✅ เสร็จ |
| **Phase 4** | Chat UI + Voice Input | ✅ เสร็จ |
| **Phase 5** | Dashboard | ✅ เสร็จ |
| **Phase 6** | Transactions + Export | ✅ เสร็จ |
| **Phase 7** | Category + Settings | ✅ เสร็จ |

> อัปเดต status เป็น 🔄 กำลังทำ / ✅ เสร็จ เมื่อเริ่มและจบแต่ละ phase

---

## เริ่มต้นใช้งาน (ถ้า Next.js ยังไม่ได้ init)

```bash
# 1. init Next.js project ใน folder นี้
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# 2. ติดตั้ง dependencies
npm install @prisma/client prisma next-auth @auth/prisma-adapter
npm install recharts date-fns react-hook-form zod
npm install xlsx papaparse @types/papaparse
npm install lucide-react clsx tailwind-merge

# 3. ตั้งค่า .env.local
cp .env.example .env.local
# แก้ไข DATABASE_URL และ NEXTAUTH_SECRET

# 4. DB setup
npx prisma migrate dev --name init
npx prisma db seed

# 5. รัน dev
npm run dev
```

---

## กฎการทำงาน

### การเขียน Code
- ใช้ TypeScript strict เสมอ
- ทุก async API route ต้องมี try/catch + return error JSON
- Validation ด้วย Zod ทุก API endpoint
- ใช้ Prisma เท่านั้น ห้าม raw SQL
- Component ต้องมี loading + error + empty state

### Parser (สำคัญมาก)
- Parser อยู่ใน `src/lib/parser/` ห้ามใส่ logic ใน API route
- ลำดับ type detection: `transfer > debt > expense > income`
- ถ้า confidence < 0.6 ต้องแสดง warning ให้ผู้ใช้ยืนยัน
- `transfer` ต้องไม่นับเป็น income หรือ expense ในรายงาน
- เก็บ `rawText` ทุกครั้งเพื่อ debug

### Database
- Soft delete เท่านั้น (status = 'deleted') ห้าม hard delete transaction
- ทุก query ต้อง filter `status != 'deleted'`
- Transfer ไม่นับใน dashboard sum

### UI/UX
- Mobile-first เสมอ (test ที่ 375px ก่อน)
- สีรายรับ: green-600 (#16A34A)
- สีรายจ่าย: red-600 (#DC2626)
- สีคงเหลือ: blue-600 (#2563EB)
- Font: Sarabun (Google Fonts)
- Bottom navigation 4 เมนู: บันทึก / รายงาน / รายการ / ตั้งค่า

### Voice Input
- ใช้ Web Speech API (`lang='th-TH'`)
- ตรวจสอบ `'SpeechRecognition' in window` ก่อนแสดงปุ่ม
- Firefox ไม่รองรับ → ซ่อนปุ่มอัตโนมัติ
- ต้อง HTTPS (Vercel จัดการให้อยู่แล้ว)

---

## Business Rules ที่ต้องรู้

1. **ฟรีถ้าจอดไม่เกิน FreeTime** — ไม่ใช่ระบบจอดรถ อันนี้คือบัญชี
2. **Transfer ≠ รายรับ/รายจ่าย** — โอนเงินระหว่างบัญชีไม่นับกำไร/ขาดทุน
3. **"รับเงินยืม"** → type = `debt` ไม่ใช่ `income`
4. **หน้ายืนยันก่อนบันทึกเสมอ** — ผู้ใช้ต้องกด confirm ทุกครั้ง
5. **Confidence < 0.6** → แสดง warning สีแดง "กรุณาตรวจสอบก่อนบันทึก"
6. **BillID** — ไม่มีใน MChat (นั่นคือระบบจอดรถ BC20)

---

## Test Cases Parser (20 กรณีหลัก)

ดูรายละเอียดที่ `tests/parser/TEST_CASES.md`

```
"จ่ายค่าน้ำมัน 500 วันนี้"       → expense, 500, ค่าน้ำมัน
"ขายของ 850 เงินสด"               → income, 850, ขายของ
"โอนจากบัญชีร้านไปบัญชีสวน 3000" → transfer, 3000
"ยืมเงินแม่ 5000"                  → debt, 5000
"คืนเงินพี่ 2000"                  → debt, 2000
```

---

## API ที่ต้องสร้าง

```
POST /api/parser/parse          ← แปลง text → ParsedTransaction
GET  /api/transactions          ← list with filter
POST /api/transactions          ← create
PUT  /api/transactions/:id      ← update
DEL  /api/transactions/:id      ← soft delete
GET  /api/categories
POST /api/categories
PUT  /api/categories/:id
DEL  /api/categories/:id
GET  /api/dashboard/summary?period=today|week|month|year
GET  /api/dashboard/daily-cashflow
GET  /api/dashboard/category-expense
```

---

## MVP Acceptance Criteria (10 ข้อ)

- [ ] พิมพ์ข้อความรายรับรายจ่ายภาษาไทยได้
- [ ] Parser แปลง text → transaction ถูกต้อง >= 80% จาก 20 test cases
- [ ] กดยืนยันก่อนบันทึกได้เสมอ
- [ ] รายการบันทึกใน database จริง
- [ ] Dashboard แสดงยอดรายวัน + รายเดือน + 3 กราฟ
- [ ] ดูรายการย้อนหลัง + filter ได้
- [ ] Export Excel ได้
- [ ] เพิ่ม/แก้ไขหมวดหมู่ + keyword ได้
- [ ] Voice input บน Chrome/Safari/Edge ทำงานได้
- [ ] ใช้งานบน mobile ได้ (no horizontal scroll)

---

## เอกสารอ้างอิง

| เอกสาร | ตำแหน่ง |
|---|---|
| แผนพัฒนาครบวงจร | `docs/plan/DEV_PLAN.md` |
| Handoff ต้นฉบับ | `docs/plan/HANDOFF.md` |
| Parser Logic | `docs/plan/PARSER_GUIDE.md` |
| API Reference | `docs/api/API_REFERENCE.md` |
| DB Schema | `docs/db/SCHEMA.md` |
| Design System | `docs/design/DESIGN_SYSTEM.md` |
| Parser Tests | `tests/parser/TEST_CASES.md` |

---

## หมายเหตุ

- โปรเจกต์นี้แยกจาก `D:\Code\2026\BC_Upgrade` (ระบบจอดรถ dPRO) ไม่เกี่ยวกัน
- ถ้าเจอ Business Logic เก่าจาก dPRO (เช่น RFID, Gate, Stamp) ข้ามไปได้เลย ไม่ใช้
- เริ่มจาก Phase 0 → Phase 1 ตามลำดับ อย่าข้าม phase

*MChat | พฤษภาคม 2569*
