> ⚠️ **ARCHIVED** — เอกสาร Brainstorm ก่อน Build (พฤษภาคม 2569)  
> Context ปัจจุบัน: ดูที่ `docs/MChat_PROJECT_CONTEXT.md`

# Chat Accounting App — แนวคิดและเอกสารพัฒนาแบบละเอียดสำหรับ AI Handoff

> แนวคิดหลัก: แอปรายรับรายจ่ายที่ผู้ใช้ไม่ต้องกรอกฟอร์มซับซ้อน แค่พิมพ์ข้อความเหมือนแชท เช่น “จ่ายค่าน้ำมัน 500 วันนี้” แล้วระบบแยกวันที่ ประเภท หมวดหมู่ จำนวนเงิน และรายละเอียดให้อัตโนมัติ พร้อมสรุปเป็น Dashboard แบบ Minimal เข้าใจง่าย

---

## Part 1: สรุปไอเดียแอป

## 1. ชื่อแนวคิด

ชื่อชั่วคราว:

**บัญชีแชท / Chat Accounting / Easy Money Chat**

สโลแกน:

> บันทึกรายรับรายจ่ายง่ายเหมือนแชท พิมพ์ครั้งเดียว ระบบแยกหมวด สรุปยอด และทำแดชบอร์ดให้ทันที

---

## 2. ปัญหาที่ต้องการแก้

ผู้ใช้ทั่วไป เจ้าของร้าน เกษตรกร ฟรีแลนซ์ และธุรกิจขนาดเล็ก มักไม่ชอบบันทึกบัญชีเพราะ:

1. ต้องกรอกหลายช่อง
2. ไม่รู้ว่ารายการควรอยู่หมวดไหน
3. ลืมบันทึกทันทีหลังจ่ายหรือรับเงิน
4. ใช้ Excel ยากสำหรับผู้ใช้ทั่วไป
5. ดูรายงานยาก ไม่เห็นภาพรวมการเงินทันที
6. ข้อมูลรายรับรายจ่ายกระจัดกระจายในสมุด LINE สลิป และ Excel

แอปนี้จึงออกแบบให้ผู้ใช้พิมพ์ภาษาปกติ แล้วระบบช่วยจัดการข้อมูลให้

---

## 3. กลุ่มผู้ใช้เป้าหมาย

### 3.1 ผู้ใช้ทั่วไป

- บันทึกรายรับรายจ่ายส่วนตัว
- คุมรายจ่ายประจำวัน
- ดูเงินคงเหลือรายเดือน

### 3.2 ร้านค้าขนาดเล็ก

- ร้านอาหาร
- ร้านขายของชำ
- ร้านออนไลน์
- ร้านซ่อม/บริการ

### 3.3 เกษตรกร / ฟาร์ม

- รายรับจากขายผลผลิต
- รายจ่ายปุ๋ย อาหารสัตว์ น้ำมัน ค่าแรง
- แยกบัญชีสวน ฟาร์ม ร้าน และครอบครัว

### 3.4 ฟรีแลนซ์ / งานบริการ

- รายรับจากงานแต่ละโปรเจกต์
- รายจ่ายเดินทาง อุปกรณ์ ซอฟต์แวร์
- สรุปกำไรขาดทุนแบบง่าย

---

## 4. จุดขายหลักของแอป

1. บันทึกง่ายเหมือนแชท
2. ไม่ต้องกรอกฟอร์มหลายช่อง
3. ระบบแยกหมวดให้อัตโนมัติ
4. แก้ไขรายการก่อนบันทึกได้
5. Dashboard ดูง่าย Minimal
6. Export Excel ได้
7. รองรับรายรับ รายจ่าย โอนเงิน หนี้ ลูกหนี้ เจ้าหนี้
8. ต่อ AI / OCR / LINE OA ได้ในอนาคต

---

## 5. ตัวอย่างการใช้งาน

ผู้ใช้พิมพ์:

```text
จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้
```

ระบบแปลงเป็น:

```json
{
  "type": "expense",
  "category": "ค่าน้ำมัน",
  "amount": 500,
  "date": "today",
  "description": "รถกระบะ",
  "payment_method": "ไม่ระบุ"
}
```

ผู้ใช้พิมพ์:

```text
ขายของ 1250 เงินสด
```

ระบบแปลงเป็น:

```json
{
  "type": "income",
  "category": "ขายของ",
  "amount": 1250,
  "date": "today",
  "description": "",
  "payment_method": "เงินสด"
}
```

---

## 6. หมวดหมู่หลัก

## 6.1 รายรับ

| หมวด | คำที่ควรจับ | ตัวอย่าง |
|---|---|---|
| ขายของ | ขาย, ขายสินค้า, ขายของ | ขายของ 850 |
| รับโอน | รับโอน, ลูกค้าโอน, เงินเข้า | รับโอนลูกค้า 3500 |
| ค่าบริการ | รับค่าบริการ, งานซ่อม, งานติดตั้ง | รับค่างานติดตั้ง 5000 |
| เงินยืม | ยืมเงิน, รับเงินยืม | ยืมเงินแม่ 5000 |
| เงินสวน | ขายผลไม้, เงินสวน, ขายพืช | ขายทุเรียน 12000 |
| รายรับอื่น | ได้เงิน, รายรับอื่น | ได้เงิน 300 |

## 6.2 รายจ่าย

| หมวด | คำที่ควรจับ | ตัวอย่าง |
|---|---|---|
| ซื้อของ | ซื้อของ, ซื้อสินค้า, วัตถุดิบ | ซื้อของเข้าร้าน 2400 |
| ค่าน้ำมัน | น้ำมัน, เติมน้ำมัน | เติมน้ำมัน 1000 |
| ค่าอาหาร | อาหาร, กินข้าว, กับข้าว | กินข้าว 80 |
| ค่าไฟ | ค่าไฟ, จ่ายไฟ | ค่าไฟ 1780 |
| ค่าน้ำ | ค่าน้ำ, จ่ายน้ำ | ค่าน้ำ 250 |
| ค่าแรง | ค่าแรง, จ่ายลูกน้อง | จ่ายค่าแรง 3000 |
| ค่าซ่อม | ซ่อมรถ, ซ่อมเครื่อง | ซ่อมรถ 2500 |
| ค่าเดินทาง | เดินทาง, รถ, ค่ารถ | ค่ารถ 120 |
| รายจ่ายอื่น | จ่ายอื่น, ค่าใช้จ่ายอื่น | จ่ายอื่น 200 |

## 6.3 โอนเงินระหว่างบัญชี

ตัวอย่าง:

```text
โอนจากบัญชีร้านไปบัญชีสวน 3000
ถอนเงินสด 5000
ฝากเงินเข้าธนาคาร 12000
```

หมายเหตุ: รายการโอนเงินไม่ควรนับเป็นกำไรหรือขาดทุน เพราะเป็นการย้ายเงินระหว่างบัญชี

## 6.4 หนี้ / ลูกหนี้ / เจ้าหนี้

ตัวอย่าง:

```text
ลูกค้าค้างจ่าย 3500
ยืมเงินพี่ 5000
คืนเงินแม่ 2000
```

---

## 7. หน้าจอหลักของระบบ

## 7.1 หน้า Chat Input

หน้าจอหลักสำหรับพิมพ์รายการ

ส่วนประกอบ:

1. ช่องแสดงประวัติการบันทึกแบบแชท
2. ช่องพิมพ์ข้อความด้านล่าง
3. ปุ่มส่งข้อความ
4. ปุ่มไมโครโฟนในอนาคต
5. การ์ดยืนยันรายการก่อนบันทึก

ตัวอย่างการ์ด:

```text
บันทึกรายการแล้ว

ประเภท: รายจ่าย
หมวด: ค่าน้ำมัน
จำนวน: 500 บาท
วันที่: วันนี้
รายละเอียด: รถกระบะ

[แก้ไข] [ลบ] [ยืนยัน]
```

## 7.2 หน้า Dashboard

แสดงภาพรวมการเงินแบบเข้าใจง่าย

การ์ดหลัก:

1. รายรับวันนี้
2. รายจ่ายวันนี้
3. คงเหลือวันนี้
4. รายรับเดือนนี้
5. รายจ่ายเดือนนี้
6. กำไร/คงเหลือเดือนนี้

กราฟ:

1. รายรับ vs รายจ่าย รายวัน
2. สัดส่วนรายจ่ายตามหมวด
3. เงินคงเหลือสะสม

## 7.3 หน้ารายการย้อนหลัง

ฟีเจอร์:

1. ค้นหาด้วยคำ
2. กรองตามวันที่
3. กรองตามประเภท
4. กรองตามหมวด
5. แก้ไขรายการ
6. ลบรายการ
7. Export Excel

## 7.4 หน้าหมวดหมู่

ฟีเจอร์:

1. เพิ่มหมวด
2. แก้ไขหมวด
3. ลบหมวด
4. เพิ่ม keyword สำหรับ AI Parser
5. กำหนดสีและ icon หมวดหมู่

## 7.5 หน้าตั้งค่า

ฟีเจอร์:

1. ข้อมูลผู้ใช้
2. ตั้งค่าสกุลเงิน
3. ตั้งค่าวันเริ่มต้นของเดือนบัญชี
4. สำรองข้อมูล
5. Export / Import
6. ตั้งค่าบัญชีเงินสด/ธนาคาร

---

## 8. รูปแบบ UX/UI

Style: Minimal, Clean, Friendly

แนวทาง:

- พื้นหลังสีขาวหรือเทาอ่อน
- Card มุมโค้ง
- เงาอ่อน
- ใช้สีไม่เยอะ
- รายรับใช้สีเขียว
- รายจ่ายใช้สีแดง/ส้ม
- คงเหลือใช้สีน้ำเงิน
- ฟอนต์ไทยอ่านง่าย เช่น Prompt, Sarabun
- เมนูล่าง 4 เมนู: บันทึก / รายงาน / รายการ / ตั้งค่า

---

## 9. MVP Version 1

เป้าหมาย: ทำระบบที่ใช้งานจริงได้เร็วที่สุด

ฟีเจอร์ที่ต้องมี:

1. Login แบบง่าย
2. หน้า Chat Input
3. Rule-based Parser สำหรับอ่านข้อความ
4. เพิ่ม/แก้ไข/ลบรายการ
5. ระบบหมวดหมู่
6. Dashboard รายวัน/รายเดือน
7. ตารางรายการย้อนหลัง
8. Export Excel
9. ฐานข้อมูล transaction
10. Responsive Web ใช้ได้ทั้งมือถือและคอมพิวเตอร์

ฟีเจอร์ที่ยังไม่ต้องทำใน Version 1:

1. OCR อ่านสลิป
2. เชื่อมธนาคาร
3. AI เต็มรูปแบบ
4. LINE OA
5. ผู้ใช้หลายคนในองค์กร
6. ระบบภาษีซับซ้อน

---

# Part 2: เอกสารพัฒนาแบบละเอียดสำหรับสั่งงาน AI / Codex

## 10. เป้าหมายการพัฒนา

สร้าง Web App สำหรับบันทึกรายรับรายจ่ายแบบ Chat-based Input โดยมีระบบแยกข้อความเป็นข้อมูลบัญชีเบื้องต้น แสดงรายการย้อนหลัง และ Dashboard สรุปรายรับรายจ่ายแบบ Minimal

ระบบต้องรองรับการต่อยอดเป็น Mobile App, OCR, LINE OA และ AI Parser ในอนาคต

---

## 11. Recommended Tech Stack

## 11.1 Frontend

ตัวเลือกแนะนำ:

```text
Next.js + React + TypeScript + Tailwind CSS
```

เหตุผล:

- ทำ Web App ได้เร็ว
- Responsive ง่าย
- ต่อ API ได้ดี
- Deploy ง่าย
- เหมาะกับ Dashboard
- AI/Codex ช่วยเขียนได้ดี

Library แนะนำ:

```text
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- React Hook Form
- Zod
- Axios หรือ Fetch API
- date-fns
```

## 11.2 Backend

มี 2 ทางเลือก

### ทางเลือก A: Node.js

```text
Next.js API Routes หรือ NestJS
```

เหมาะกับ MVP ที่ต้องการทำเร็ว

### ทางเลือก B: .NET API

```text
ASP.NET Core Web API + SQL Server
```

เหมาะกับผู้พัฒนาที่มีพื้นฐาน VB.NET / SQL Server และต้องการต่อยอดระบบองค์กร

## 11.3 Database

แนะนำ:

```text
PostgreSQL หรือ SQL Server
```

ถ้าต้องการทำเร็วและ deploy ง่าย:

```text
Supabase PostgreSQL
```

ถ้าต้องการเข้ากับงานเดิม:

```text
SQL Server 2019/2022
```

---

## 12. Architecture ภาพรวม

```text
User
  ↓
Web App / Mobile Browser
  ↓
Chat Input UI
  ↓
Parser Service
  ↓
Transaction API
  ↓
Database
  ↓
Dashboard API
  ↓
Dashboard UI
```

---

## 13. Module หลักของระบบ

## 13.1 Auth Module

หน้าที่:

- Login
- Register
- Logout
- เก็บข้อมูลผู้ใช้

MVP สามารถเริ่มด้วย email/password หรือ mock user ก่อนก็ได้

ตารางที่เกี่ยวข้อง:

```text
users
```

## 13.2 Chat Input Module

หน้าที่:

- รับข้อความจากผู้ใช้
- ส่งข้อความไป Parser
- แสดงผลลัพธ์เป็นการ์ด
- ให้ผู้ใช้แก้ไขก่อนบันทึก
- บันทึก transaction

## 13.3 Parser Module

หน้าที่:

- อ่านข้อความภาษาไทย
- ตรวจจับจำนวนเงิน
- ตรวจจับวันที่
- ตรวจจับประเภท income/expense/transfer/debt
- ตรวจจับหมวดหมู่จาก keyword
- แยกรายละเอียดที่เหลือ

MVP ใช้ rule-based parser ก่อน แล้วค่อยต่อ AI ภายหลัง

## 13.4 Transaction Module

หน้าที่:

- Create transaction
- Read transaction
- Update transaction
- Delete transaction
- Filter transaction
- Export transaction

## 13.5 Category Module

หน้าที่:

- จัดการหมวดหมู่
- จัดการ keyword
- ใช้ keyword ช่วย Parser

## 13.6 Dashboard Module

หน้าที่:

- รวมยอดรายวัน
- รวมยอดรายเดือน
- รวมยอดตามหมวด
- คำนวณกำไร/คงเหลือ
- ส่งข้อมูลให้กราฟ

## 13.7 Export Module

หน้าที่:

- Export Excel
- Export CSV
- Export PDF ในอนาคต

---

## 14. Database Design

## 14.1 Table: users

```sql
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(500) NULL,
    currency NVARCHAR(10) DEFAULT 'THB',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

## 14.2 Table: accounts

ใช้สำหรับแยกเงินสด ธนาคาร ร้าน สวน ฟาร์ม ฯลฯ

```sql
CREATE TABLE accounts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    opening_balance DECIMAL(18,2) DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

ตัวอย่าง type:

```text
cash, bank, wallet, business, farm, other
```

## 14.3 Table: categories

```sql
CREATE TABLE categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NULL,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    color NVARCHAR(50) NULL,
    icon NVARCHAR(100) NULL,
    is_default BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

ค่า type:

```text
income, expense, transfer, debt
```

## 14.4 Table: category_keywords

```sql
CREATE TABLE category_keywords (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    category_id UNIQUEIDENTIFIER NOT NULL,
    keyword NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

## 14.5 Table: transactions

```sql
CREATE TABLE transactions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER NULL,
    category_id UNIQUEIDENTIFIER NULL,
    transaction_date DATE NOT NULL,
    type NVARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    description NVARCHAR(1000) NULL,
    raw_text NVARCHAR(1000) NULL,
    payment_method NVARCHAR(100) NULL,
    status NVARCHAR(50) DEFAULT 'confirmed',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

ค่า type:

```text
income, expense, transfer, debt
```

ค่า status:

```text
draft, confirmed, deleted
```

## 14.6 Table: transfers

สำหรับเก็บรายละเอียดการโอนระหว่างบัญชี

```sql
CREATE TABLE transfers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    from_account_id UNIQUEIDENTIFIER NOT NULL,
    to_account_id UNIQUEIDENTIFIER NOT NULL,
    transaction_id UNIQUEIDENTIFIER NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    transfer_date DATE NOT NULL,
    description NVARCHAR(1000) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

## 14.7 Table: debts

สำหรับลูกหนี้/เจ้าหนี้

```sql
CREATE TABLE debts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    person_name NVARCHAR(255) NULL,
    debt_type NVARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    remaining_amount DECIMAL(18,2) NOT NULL,
    due_date DATE NULL,
    status NVARCHAR(50) DEFAULT 'open',
    description NVARCHAR(1000) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

ค่า debt_type:

```text
borrowed_from_other, lent_to_other, receivable, payable
```

---

## 15. API Design

## 15.1 Parser API

### POST /api/parser/parse

Request:

```json
{
  "text": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "type": "expense",
    "category_name": "ค่าน้ำมัน",
    "amount": 500,
    "transaction_date": "2026-05-31",
    "description": "รถกระบะ",
    "payment_method": null,
    "confidence": 0.9,
    "raw_text": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้"
  }
}
```

## 15.2 Transaction API

### GET /api/transactions

Query params:

```text
start_date
end_date
type
category_id
keyword
page
limit
```

### POST /api/transactions

Request:

```json
{
  "type": "expense",
  "category_id": "category-guid",
  "account_id": "account-guid",
  "amount": 500,
  "transaction_date": "2026-05-31",
  "description": "รถกระบะ",
  "raw_text": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้",
  "payment_method": "cash"
}
```

### PUT /api/transactions/{id}

แก้ไขรายการ

### DELETE /api/transactions/{id}

ลบรายการแบบ soft delete โดยเปลี่ยน status เป็น deleted

## 15.3 Category API

### GET /api/categories

### POST /api/categories

### PUT /api/categories/{id}

### DELETE /api/categories/{id}

## 15.4 Dashboard API

### GET /api/dashboard/summary

Query params:

```text
period=today|week|month|year
start_date
end_date
```

Response:

```json
{
  "income_today": 8500,
  "expense_today": 3200,
  "balance_today": 5300,
  "income_month": 126000,
  "expense_month": 89500,
  "balance_month": 36500
}
```

### GET /api/dashboard/daily-cashflow

Response:

```json
[
  {
    "date": "2026-05-01",
    "income": 5000,
    "expense": 2300,
    "balance": 2700
  }
]
```

### GET /api/dashboard/category-expense

Response:

```json
[
  {
    "category": "ค่าน้ำมัน",
    "amount": 6000,
    "percent": 18
  }
]
```

---

## 16. Parser Logic แบบละเอียด

## 16.1 ขั้นตอน Parser

```text
1. รับ raw text
2. normalize ข้อความ
3. หา amount
4. หา date
5. หา payment method
6. หา type
7. หา category จาก keyword
8. ตัดคำที่ถูกจับแล้วออก
9. ส่วนที่เหลือเป็น description
10. ส่งผลลัพธ์พร้อม confidence
```

## 16.2 Normalize

ตัวอย่าง:

```text
- แปลงเลขไทยเป็นเลขอารบิก
- ลบ comma ในจำนวนเงิน เช่น 1,200 -> 1200
- trim space
- แปลงคำซ้ำหรือคำผิดบางส่วน
```

## 16.3 ตรวจจับจำนวนเงิน

Pattern:

```regex
\d+(,\d{3})*(\.\d{1,2})?
```

ตัวอย่าง:

```text
500
1,200
1200.50
```

## 16.4 ตรวจจับวันที่

คำที่รองรับ:

```text
วันนี้ = current date
เมื่อวาน = current date - 1
พรุ่งนี้ = current date + 1
วันที่ 25 = วันที่ 25 ของเดือนปัจจุบัน
25/5/2569 = แปลงเป็น ค.ศ.
25-05-2026 = วันที่ปกติ
เดือนนี้ = ใช้ current month
```

## 16.5 ตรวจจับประเภท

### income keywords

```text
ขาย, รับ, ได้เงิน, เงินเข้า, ลูกค้าโอน, รับโอน, ค่าบริการ, รายรับ
```

### expense keywords

```text
จ่าย, ซื้อ, ค่า, เติม, โอนจ่าย, รายจ่าย, หัก, ชำระ
```

### transfer keywords

```text
โอนจาก, โอนไป, ย้ายเงิน, ถอนเงิน, ฝากเงิน
```

### debt keywords

```text
ยืม, คืนเงิน, ค้างจ่าย, ลูกหนี้, เจ้าหนี้
```

ลำดับความสำคัญ:

```text
transfer > debt > expense > income
```

เพราะคำบางคำอาจซ้อนกัน เช่น “รับเงินยืม” เป็น debt ไม่ใช่ income ปกติ

## 16.6 ตรวจจับหมวดหมู่

ใช้ตาราง category_keywords

ตัวอย่าง:

```json
[
  { "category": "ค่าน้ำมัน", "keywords": ["น้ำมัน", "เติมน้ำมัน", "ดีเซล", "แก๊สโซฮอล"] },
  { "category": "ค่าอาหาร", "keywords": ["อาหาร", "กินข้าว", "กับข้าว", "กาแฟ"] },
  { "category": "ขายของ", "keywords": ["ขายของ", "ขายสินค้า", "ขาย"] }
]
```

ถ้าไม่พบหมวด:

```text
รายรับอื่น ๆ หรือ รายจ่ายอื่น ๆ
```

## 16.7 Confidence Score

กำหนดคะแนนคร่าว ๆ:

```text
พบ amount = +0.3
พบ type = +0.2
พบ category = +0.2
พบ date = +0.1
description ชัดเจน = +0.1
payment method ชัดเจน = +0.1
```

ถ้า confidence ต่ำกว่า 0.6 ให้แสดงเตือน:

```text
ระบบไม่แน่ใจ กรุณาตรวจสอบก่อนบันทึก
```

---

## 17. Frontend Page Specification

## 17.1 Route Structure

```text
/
/login
/dashboard
/chat
/transactions
/categories
/settings
```

## 17.2 Component Structure

```text
components/
  layout/
    AppShell.tsx
    BottomNav.tsx
    Header.tsx
  chat/
    ChatInput.tsx
    ChatMessage.tsx
    ParsedTransactionCard.tsx
  dashboard/
    SummaryCard.tsx
    IncomeExpenseChart.tsx
    CategoryPieChart.tsx
    CashflowLineChart.tsx
  transactions/
    TransactionTable.tsx
    TransactionFilter.tsx
    TransactionForm.tsx
  categories/
    CategoryList.tsx
    CategoryForm.tsx
  ui/
    Button.tsx
    Card.tsx
    Input.tsx
    Modal.tsx
```

## 17.3 หน้า Chat

Flow:

```text
1. ผู้ใช้พิมพ์ข้อความ
2. กดส่ง
3. เรียก /api/parser/parse
4. แสดง ParsedTransactionCard
5. ผู้ใช้กดยืนยัน
6. เรียก /api/transactions
7. แสดงข้อความ “บันทึกสำเร็จ”
```

## 17.4 หน้า Dashboard

Layout:

```text
Header: สวัสดี + วันที่ปัจจุบัน
Summary Cards: 2x3 grid
Chart 1: รายรับ vs รายจ่าย
Chart 2: หมวดรายจ่าย
Chart 3: เงินคงเหลือสะสม
Recent Transactions: 5 รายการล่าสุด
```

## 17.5 หน้า Transactions

Columns:

```text
วันที่ | ประเภท | หมวด | รายละเอียด | ช่องทาง | จำนวนเงิน | Action
```

Action:

```text
แก้ไข | ลบ
```

Filter:

```text
ช่วงวันที่
ประเภท
หมวด
คำค้นหา
```

---

## 18. Dashboard Calculation

## 18.1 รายรับรวม

```sql
SELECT SUM(amount)
FROM transactions
WHERE type = 'income'
AND status = 'confirmed'
AND transaction_date BETWEEN @start_date AND @end_date;
```

## 18.2 รายจ่ายรวม

```sql
SELECT SUM(amount)
FROM transactions
WHERE type = 'expense'
AND status = 'confirmed'
AND transaction_date BETWEEN @start_date AND @end_date;
```

## 18.3 คงเหลือ

```text
balance = total_income - total_expense
```

## 18.4 รายจ่ายตามหมวด

```sql
SELECT c.name, SUM(t.amount) AS total_amount
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
AND t.status = 'confirmed'
AND t.transaction_date BETWEEN @start_date AND @end_date
GROUP BY c.name
ORDER BY total_amount DESC;
```

---

## 19. Seed Data หมวดหมู่เริ่มต้น

## 19.1 Income Categories

```json
[
  { "name": "ขายของ", "keywords": ["ขาย", "ขายของ", "ขายสินค้า"] },
  { "name": "รับโอน", "keywords": ["รับโอน", "ลูกค้าโอน", "เงินเข้า"] },
  { "name": "ค่าบริการ", "keywords": ["ค่าบริการ", "งานซ่อม", "งานติดตั้ง"] },
  { "name": "เงินสวน", "keywords": ["เงินสวน", "ขายผลไม้", "ขายพืช", "ขายทุเรียน"] },
  { "name": "รายรับอื่น ๆ", "keywords": ["รายรับอื่น", "ได้เงิน"] }
]
```

## 19.2 Expense Categories

```json
[
  { "name": "ซื้อของ", "keywords": ["ซื้อของ", "ซื้อสินค้า", "วัตถุดิบ"] },
  { "name": "ค่าน้ำมัน", "keywords": ["น้ำมัน", "เติมน้ำมัน", "ดีเซล"] },
  { "name": "ค่าอาหาร", "keywords": ["อาหาร", "กินข้าว", "กับข้าว", "กาแฟ"] },
  { "name": "ค่าไฟ", "keywords": ["ค่าไฟ", "จ่ายไฟ"] },
  { "name": "ค่าน้ำ", "keywords": ["ค่าน้ำ", "จ่ายน้ำ"] },
  { "name": "ค่าแรง", "keywords": ["ค่าแรง", "จ่ายลูกน้อง", "ค่าช่าง"] },
  { "name": "ค่าซ่อม", "keywords": ["ซ่อม", "ซ่อมรถ", "ซ่อมเครื่อง"] },
  { "name": "ค่าเดินทาง", "keywords": ["เดินทาง", "ค่ารถ", "รถตู้", "รถเมล์"] },
  { "name": "รายจ่ายอื่น ๆ", "keywords": ["รายจ่ายอื่น", "จ่ายอื่น"] }
]
```

---

## 20. Development Roadmap

## Phase 1: Project Setup

งานที่ต้องทำ:

1. สร้าง repository
2. สร้าง Next.js project
3. ติดตั้ง Tailwind CSS
4. ติดตั้ง chart library
5. สร้าง layout พื้นฐาน
6. สร้าง theme minimal
7. สร้าง mock data

ผลลัพธ์ที่ต้องได้:

```text
เปิดเว็บได้ มี layout หลัก และเมนูล่าง
```

## Phase 2: Database & API

งานที่ต้องทำ:

1. ออกแบบ schema
2. สร้าง migration
3. สร้าง seed categories
4. สร้าง API transactions
5. สร้าง API categories
6. สร้าง API dashboard

ผลลัพธ์ที่ต้องได้:

```text
เพิ่ม/แก้ไข/ลบ/อ่าน transaction ได้ผ่าน API
```

## Phase 3: Rule-based Parser

งานที่ต้องทำ:

1. สร้าง normalize function
2. สร้าง extractAmount
3. สร้าง extractDate
4. สร้าง detectType
5. สร้าง detectCategory
6. สร้าง parseTransactionText
7. เขียน test case

ผลลัพธ์ที่ต้องได้:

```text
พิมพ์ “จ่ายค่าน้ำมัน 500 วันนี้” แล้วได้ JSON ถูกต้อง
```

## Phase 4: Chat UI

งานที่ต้องทำ:

1. สร้างหน้า chat
2. สร้างช่อง input
3. สร้าง message bubble
4. สร้าง parsed card
5. เพิ่มปุ่ม confirm/edit/delete
6. เชื่อม API parser
7. เชื่อม API transaction

ผลลัพธ์ที่ต้องได้:

```text
ผู้ใช้พิมพ์ข้อความและบันทึกรายการได้จริง
```

## Phase 5: Dashboard

งานที่ต้องทำ:

1. สร้าง summary cards
2. สร้างกราฟรายรับรายจ่าย
3. สร้างกราฟหมวดรายจ่าย
4. สร้างกราฟเงินคงเหลือสะสม
5. แสดงรายการล่าสุด

ผลลัพธ์ที่ต้องได้:

```text
เห็นภาพรวมรายรับรายจ่ายรายวันและรายเดือน
```

## Phase 6: Transactions Page

งานที่ต้องทำ:

1. สร้างตารางรายการ
2. สร้าง filter
3. สร้าง search
4. สร้าง edit modal
5. สร้าง delete confirm
6. สร้าง export CSV/Excel

ผลลัพธ์ที่ต้องได้:

```text
จัดการรายการย้อนหลังได้ครบ
```

## Phase 7: Category Management

งานที่ต้องทำ:

1. แสดงหมวดหมู่
2. เพิ่มหมวด
3. แก้ไขหมวด
4. ลบ/ปิดใช้งานหมวด
5. เพิ่ม keyword
6. ให้ parser ใช้ keyword ใหม่ได้

ผลลัพธ์ที่ต้องได้:

```text
ผู้ใช้ปรับหมวดหมู่เองได้
```

## Phase 8: Polish & Deploy

งานที่ต้องทำ:

1. ปรับ UI มือถือ
2. ตรวจ error state
3. เพิ่ม loading state
4. เพิ่ม empty state
5. ทดสอบ browser
6. Deploy
7. ทำคู่มือใช้งาน

ผลลัพธ์ที่ต้องได้:

```text
MVP พร้อมใช้งานจริง
```

---

## 21. AI/Codex Prompt สำหรับเริ่มพัฒนา

ใช้ prompt นี้สั่ง AI/Codex ได้เลย:

```text
You are a senior full-stack developer. Build a minimal Thai chat-based income and expense tracking web app.

Goal:
Create a web app where users can type natural Thai text such as “จ่ายค่าน้ำมัน 500 วันนี้” and the system parses it into a structured transaction, lets the user confirm/edit it, saves it, and shows a minimal dashboard.

Tech stack:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- SQL database layer can be mocked first

Core pages:
1. /chat
2. /dashboard
3. /transactions
4. /categories
5. /settings

Core modules:
1. Rule-based Thai transaction parser
2. Transaction CRUD
3. Category and keyword management
4. Dashboard summary
5. Responsive minimal UI

Parser requirements:
- Extract amount
- Extract date such as today, yesterday, explicit date
- Detect type: income, expense, transfer, debt
- Detect category from keyword list
- Return confidence score
- Preserve raw text

UI requirements:
- Minimal clean design
- Mobile-first
- Card-based layout
- Bottom navigation
- Green for income
- Red/orange for expense
- Blue for balance

Please implement the project step by step. Start with project structure, mock data, parser utility, and basic pages. Keep the code clean and production-ready.
```

---

## 22. Prompt สำหรับสั่ง AI ทำ Parser

```text
Create a TypeScript utility function named parseTransactionText(input: string, options?: ParserOptions): ParsedTransaction.

The function must parse Thai natural language transaction text.

It must return:
- type: income | expense | transfer | debt | unknown
- amount: number | null
- transactionDate: string | null in YYYY-MM-DD format
- categoryName: string | null
- description: string
- paymentMethod: cash | bank_transfer | card | unknown
- confidence: number from 0 to 1
- rawText: string

Rules:
1. Extract amount using regex.
2. Support comma numbers such as 1,200.
3. Support Thai date words: วันนี้, เมื่อวาน, พรุ่งนี้.
4. Support income keywords: ขาย, รับ, ได้เงิน, เงินเข้า, รับโอน.
5. Support expense keywords: จ่าย, ซื้อ, ค่า, เติม, ชำระ.
6. Support transfer keywords: โอนจาก, โอนไป, ถอนเงิน, ฝากเงิน.
7. Support debt keywords: ยืม, คืนเงิน, ค้างจ่าย, ลูกหนี้, เจ้าหนี้.
8. Category detection must use a category keyword list.
9. If no category found, use รายรับอื่น ๆ or รายจ่ายอื่น ๆ depending on type.
10. Include unit tests with at least 20 Thai examples.
```

---

## 23. Prompt สำหรับสั่ง AI ทำ Dashboard

```text
Create a minimal dashboard page for a Thai income and expense tracking app.

Requirements:
- Use React + TypeScript + Tailwind CSS
- Use Recharts for charts
- Mobile-first responsive layout
- Summary cards:
  1. รายรับวันนี้
  2. รายจ่ายวันนี้
  3. คงเหลือวันนี้
  4. รายรับเดือนนี้
  5. รายจ่ายเดือนนี้
  6. คงเหลือเดือนนี้
- Charts:
  1. Bar chart: income vs expense by day
  2. Pie chart: expense by category
  3. Line chart: cumulative balance
- Use mock data first
- Style: minimal, clean, rounded cards, soft shadow
- Thai labels only
```

---

## 24. Prompt สำหรับสั่ง AI ทำ Chat UI

```text
Create a chat input page for a Thai income and expense tracking app.

Requirements:
- React + TypeScript + Tailwind CSS
- Chat-like interface
- Input box at the bottom
- User message bubble
- System parsed transaction card
- Card fields:
  - ประเภท
  - หมวดหมู่
  - จำนวนเงิน
  - วันที่
  - รายละเอียด
  - ช่องทางชำระเงิน
- Buttons:
  - แก้ไข
  - ลบ
  - ยืนยันบันทึก
- On submit, call a mock parser function parseTransactionText()
- On confirm, save to mock transaction list
- Must be mobile friendly
- Minimal clean UI
```

---

## 25. Test Cases สำหรับ Parser

```text
1. จ่ายค่าน้ำมัน 500 วันนี้
2. เติมน้ำมัน 1,200 รถกระบะ
3. ขายของ 850 เงินสด
4. รับโอนจากลูกค้า 3500 งานซ่อมระบบ
5. ซื้อของเข้าร้าน 2450
6. ค่าไฟ 1780 เดือนนี้
7. ค่าน้ำ 250
8. จ่ายค่าแรงช่าง 3000
9. ซ่อมรถ 2500
10. กินข้าว 80
11. ขายทุเรียน 12000 วันที่ 25
12. รับค่างานติดตั้ง 5000
13. โอนจากบัญชีร้านไปบัญชีสวน 3000
14. ถอนเงินสด 5000
15. ฝากเงินเข้าธนาคาร 12000
16. ยืมเงินแม่ 5000
17. คืนเงินพี่ 2000
18. ลูกค้าค้างจ่าย 3500
19. ซื้ออาหารไก่ 480
20. รับเงินสวน 9000
```

Expected result:

- ทุกข้อควรจับ amount ได้
- ข้อ 1-10 ควรแยก income/expense ได้ถูกต้อง
- ข้อ 13-15 ควรเป็น transfer
- ข้อ 16-18 ควรเป็น debt
- ข้อที่มี keyword ชัดเจนควรจับ category ได้

---

## 26. Acceptance Criteria

ระบบ MVP ถือว่าเสร็จเมื่อ:

1. ผู้ใช้พิมพ์ข้อความรายรับรายจ่ายได้
2. ระบบแปลงเป็น transaction ได้ถูกต้องในเคสพื้นฐาน
3. ผู้ใช้แก้ไขก่อนบันทึกได้
4. รายการถูกบันทึกในฐานข้อมูลหรือ mock storage
5. Dashboard แสดงยอดรวมได้
6. ดูรายการย้อนหลังได้
7. เพิ่ม/แก้ไขหมวดหมู่ได้
8. Export Excel หรือ CSV ได้อย่างน้อย 1 แบบ
9. ใช้งานบนมือถือได้ดี
10. UI อ่านง่าย Minimal

---

## 27. Future Version

## Version 2

1. AI Parser ด้วย OpenAI API
2. OCR อ่านสลิป
3. Upload รูปสลิป
4. LINE OA Bot
5. Voice input
6. Multi-account
7. Debt reminder
8. Budget alert
9. Monthly PDF report
10. Sync cloud

## Version 3

1. เชื่อมธนาคาร
2. วิเคราะห์กระแสเงินสดด้วย AI
3. แนะนำลดรายจ่าย
4. ระบบทีม/หลายผู้ใช้
5. ระบบธุรกิจ SME
6. เชื่อม POS
7. เชื่อมภาษี/เอกสารบัญชี

---

## 28. ข้อแนะนำเชิงกลยุทธ์

ควรเริ่มจาก Web App ก่อน ไม่ควรเริ่มจาก Mobile App เต็มรูปแบบทันที เพราะ Web App ทำเร็วกว่า ทดสอบตลาดง่ายกว่า และเปิดใช้ได้ทั้งมือถือกับคอมพิวเตอร์

ลำดับที่แนะนำ:

```text
1. ทำ Web MVP
2. ใช้กับตัวเองและกลุ่มเล็ก
3. เก็บตัวอย่างคำสั่งจริง
4. ปรับ Parser ให้แม่น
5. เพิ่ม Export Excel
6. เพิ่ม OCR/LINE OA
7. ค่อยทำ Mobile App หรือ PWA
```

สิ่งที่ต้องระวัง:

1. อย่าทำฟีเจอร์เยอะเกินใน Version แรก
2. Parser ภาษาไทยต้องเริ่มจาก rule-based ก่อนเพื่อควบคุมได้
3. ต้องมีหน้ากดยืนยันก่อนบันทึก เพราะระบบอาจตีความผิด
4. ต้องแยก transfer ออกจาก income/expense ไม่เช่นนั้นรายงานกำไรจะเพี้ยน
5. ต้องออกแบบหมวดหมู่ให้ผู้ใช้แก้เองได้

---

## 29. โครงสร้างไฟล์แนะนำ

```text
src/
  app/
    dashboard/
      page.tsx
    chat/
      page.tsx
    transactions/
      page.tsx
    categories/
      page.tsx
    settings/
      page.tsx
    api/
      parser/
        parse/route.ts
      transactions/
        route.ts
      categories/
        route.ts
      dashboard/
        summary/route.ts
  components/
    layout/
    chat/
    dashboard/
    transactions/
    categories/
    ui/
  lib/
    parser/
      parseTransactionText.ts
      dateParser.ts
      amountParser.ts
      typeDetector.ts
      categoryDetector.ts
    db/
    utils/
  data/
    seedCategories.ts
    mockTransactions.ts
  types/
    transaction.ts
    category.ts
    dashboard.ts
```

---

## 30. สรุปสุดท้าย

แอปนี้ควรวางตำแหน่งเป็น:

> ระบบบัญชีรายรับรายจ่ายสำหรับคนที่ไม่อยากทำบัญชี

หัวใจของระบบไม่ใช่แค่ Dashboard แต่คือ “Chat Input” ที่ลดแรงเสียดทานในการบันทึกข้อมูล ถ้าผู้ใช้บันทึกง่าย ข้อมูลจะครบ และ Dashboard จะมีประโยชน์จริง

MVP ที่ควรทำก่อน:

```text
Chat Input + Parser + Transaction + Dashboard + Export
```

เมื่อ MVP ใช้งานได้จริง จึงค่อยต่อยอดเป็น:

```text
AI Parser + OCR + LINE OA + SME Accounting
```
