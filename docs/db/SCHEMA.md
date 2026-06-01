# MChat — Database Schema

Database: PostgreSQL (Supabase)
ORM: Prisma

---

## Tables

| Table | หน้าที่ |
|---|---|
| `users` | ผู้ใช้งาน |
| `accounts` | บัญชีเงิน (สด/ธนาคาร/ร้าน/สวน) |
| `categories` | หมวดหมู่รายรับ-รายจ่าย |
| `category_keywords` | keyword สำหรับ parser |
| `transactions` | รายการรับ-จ่าย-โอน-หนี้ |
| `transfers` | รายละเอียดการโอนระหว่างบัญชี |
| `debts` | ลูกหนี้ / เจ้าหนี้ |

---

## Transaction Types
```
income    — รายรับ
expense   — รายจ่าย
transfer  — โอนระหว่างบัญชี (ไม่นับกำไร/ขาดทุน)
debt      — หนี้ ลูกหนี้ เจ้าหนี้
```

## Transaction Status
```
draft     — รอยืนยัน
confirmed — บันทึกแล้ว
deleted   — ลบ (soft delete)
```

## Account Types
```
cash, bank, wallet, business, farm, other
```

## Debt Types
```
borrowed_from_other — ยืมเงินคนอื่น (เราเป็นหนี้)
lent_to_other       — ให้คนอื่นยืม (คนอื่นเป็นหนี้เรา)
receivable          — ลูกหนี้การค้า
payable             — เจ้าหนี้การค้า
```

---

## Schema file: `prisma/schema.prisma`
