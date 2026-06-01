# MChat — ระบบบันทึกรายรับรายจ่ายแบบแชท

> พิมพ์ครั้งเดียว ระบบแยกหมวด สรุปยอด และทำแดชบอร์ดให้ทันที

---

## Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment
cp .env.example .env.local
# แก้ไข DATABASE_URL และ NEXTAUTH_SECRET

# 3. Setup database
npx prisma migrate dev
npx prisma db seed

# 4. รัน development
npm run dev
# เปิด http://localhost:3000
```

---

## โครงสร้างโปรเจกต์

```
MChat/
├── docs/                   ← เอกสารทั้งหมด
│   ├── plan/               ← แผนการพัฒนา
│   ├── design/             ← Design System
│   ├── api/                ← API Documentation
│   └── db/                 ← Database Schema
│
├── src/
│   ├── app/                ← Next.js App Router (Pages + API)
│   │   ├── chat/           ← หน้า Chat Input
│   │   ├── dashboard/      ← หน้า Dashboard
│   │   ├── transactions/   ← หน้ารายการย้อนหลัง
│   │   ├── categories/     ← หน้าจัดการหมวดหมู่
│   │   ├── settings/       ← หน้าตั้งค่า
│   │   └── api/            ← API Routes
│   │
│   ├── components/         ← React Components
│   │   ├── layout/         ← AppShell, Header, BottomNav
│   │   ├── chat/           ← ChatInput, ChatMessage, ParsedCard, Voice
│   │   ├── dashboard/      ← SummaryCard, Charts
│   │   ├── transactions/   ← Table, Filter, Form
│   │   ├── categories/     ← List, Form
│   │   └── ui/             ← Button, Card, Input, Modal, Badge...
│   │
│   ├── lib/                ← Utilities & Business Logic
│   │   ├── parser/         ← Thai text parser (core)
│   │   ├── db/             ← Prisma client
│   │   ├── export/         ← Excel, CSV export
│   │   └── utils/          ← Helper functions
│   │
│   ├── hooks/              ← Custom React Hooks
│   ├── types/              ← TypeScript types
│   ├── data/               ← Seed data, mock data
│   └── styles/             ← Global CSS, Tailwind config
│
├── prisma/                 ← Database schema & migrations
├── tests/                  ← Unit, Integration, E2E tests
│   ├── parser/             ← Parser unit tests (20+ cases)
│   ├── api/                ← API integration tests
│   └── e2e/                ← End-to-End manual test cases
│
└── scripts/                ← Utility scripts (seed, migrate)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + React + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Backend | Next.js API Routes |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | NextAuth.js |
| Voice | Web Speech API (built-in browser) |
| Export | ExcelJS + papaparse |
| Deploy | Vercel + Supabase Cloud |

---

## เอกสาร

| เอกสาร | ตำแหน่ง |
|---|---|
| แผนการพัฒนาครบวงจร | `docs/plan/DEV_PLAN.md` |
| Design System | `docs/design/DESIGN_SYSTEM.md` |
| API Reference | `docs/api/API_REFERENCE.md` |
| Database Schema | `docs/db/SCHEMA.md` |
| Parser Guide | `docs/plan/PARSER_GUIDE.md` |
| Test Cases | `tests/parser/TEST_CASES.md` |

---

## MVP Acceptance Criteria

- [x] พิมพ์ข้อความรายรับรายจ่ายภาษาไทยได้
- [ ] Parser แปลง text → transaction ได้ถูกต้อง >= 80%
- [ ] กดยืนยันก่อนบันทึกได้เสมอ
- [ ] Dashboard แสดงยอดรายวัน + รายเดือน + กราฟ
- [ ] ดูรายการย้อนหลัง filter ได้
- [ ] Export Excel ได้
- [ ] Voice input พูดภาษาไทยได้
- [ ] ใช้งานบน mobile ได้ดี

---

*MChat MVP — พฤษภาคม 2569*
