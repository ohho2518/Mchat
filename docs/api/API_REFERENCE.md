# MChat — API Reference

Base URL: `/api`  
Auth: ทุก endpoint ต้องมี session ยกเว้นที่ระบุ (public)

---

## Parser

### POST /api/parser/parse
แปลงข้อความภาษาไทยเป็น transaction (ไม่ write DB)

**Request:**
```json
{ "text": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "expense",
    "categoryName": "ค่าน้ำมัน",
    "amount": 500,
    "transactionDate": "2026-06-07",
    "description": "รถกระบะ",
    "paymentMethod": null,
    "confidence": 0.9,
    "rawText": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้"
  }
}
```

### POST /api/parser/ocr
อ่านสลิปโอนเงินด้วย Claude Haiku → คืน text + holderName

**Request:** `multipart/form-data` — field `image` (JPEG/PNG/WEBP, max 20MB)

**Response:**
```json
{
  "text": "รับโอน 1500 จาก สมชาย ใจดี",
  "holderName": "สมชาย ใจดี"
}
```
- OCR quota: FREE=20/เดือน, PRO=100/เดือน, MAX=ไม่จำกัด
- Rate limit: 10 req/min/user

---

## Transactions

### GET /api/transactions
Query params: `start_date`, `end_date`, `type`, `category_id`, `keyword`, `page` (default 1), `limit` (default 20)  
FREE plan: ประวัติสูงสุด 90 วัน

### POST /api/transactions
```json
{
  "type": "expense",
  "categoryId": "uuid",
  "accountId": "uuid",
  "amount": 500,
  "transactionDate": "2026-06-07",
  "description": "รถกระบะ",
  "rawText": "จ่ายค่าน้ำมัน 500 วันนี้",
  "paymentMethod": "cash",
  "holderName": "ชื่อคู่ค้าจาก OCR"
}
```

### PUT /api/transactions/:id
### DELETE /api/transactions/:id — soft delete (`status = 'deleted'`)

---

## Categories

### GET /api/categories
### POST /api/categories — FREE plan: max 5 custom categories (403 PLAN_LIMIT_CATEGORIES ถ้าเกิน)
### PUT /api/categories/:id
### DELETE /api/categories/:id

---

## Accounts

### GET /api/accounts
### POST /api/accounts — FREE plan: max 2 accounts (403 PLAN_LIMIT_ACCOUNTS ถ้าเกิน)
### PUT /api/accounts/:id
### DELETE /api/accounts/:id

---

## Transfers

### GET /api/transfers
### POST /api/transfers
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 3000,
  "transferDate": "2026-06-07",
  "description": "โอนจากบัญชีร้านไปบัญชีสวน"
}
```
### PUT /api/transfers/:id
### DELETE /api/transfers/:id

---

## Debts

### GET /api/debts
### POST /api/debts
```json
{
  "debtType": "borrowed_from_other",
  "personName": "แม่",
  "amount": 5000,
  "dueDate": "2026-07-01",
  "description": "ยืมเงิน"
}
```
`debtType`: `borrowed_from_other | lent_to_other | receivable | payable`

### PUT /api/debts/:id — รองรับ partial/full payment
### DELETE /api/debts/:id

---

## Dashboard

### GET /api/dashboard/summary?period=today|week|month|year
```json
{
  "incomeToday": 8500,
  "expenseToday": 3200,
  "balanceToday": 5300,
  "incomeMonth": 126000,
  "expenseMonth": 89500,
  "balanceMonth": 36500
}
```
- exclude type=transfer, type=debt
- cached ด้วย unstable_cache (TTL 60s per userId)

### GET /api/dashboard/daily-cashflow?days=N
คืน array รายวัน: `[{ date, income, expense, balance }]`

### GET /api/dashboard/category-expense?period=today|week|month|year
คืน breakdown ตามหมวดหมู่: `[{ categoryName, total, color }]`

---

## User

### PATCH /api/user
อัปเดต profile/password
```json
{
  "name": "ชื่อใหม่",
  "currentPassword": "รหัสเก่า",
  "newPassword": "รหัสใหม่"
}
```

### GET /api/user/quota
ดูสถานะ OCR quota ของ user
```json
{
  "used": 12,
  "limit": 20,
  "plan": "FREE",
  "month": "2026-06"
}
```

---

## Auth

### POST /api/auth/register
```json
{
  "name": "ชื่อ",
  "email": "email@example.com",
  "password": "รหัสผ่าน",
  "refCode": "VINIT001"
}
```
- Rate limit: 5 req/min/IP
- สร้าง ReferralCode ของตัวเองอัตโนมัติ
- ผูก Referral ถ้ามี refCode

---

## Events (Tracking)

### POST /api/events
Fire-and-forget event tracking
```json
{
  "eventType": "transaction_saved",
  "metadata": { "type": "expense", "amount": 500 }
}
```
`eventType`: `transaction_saved | transaction_rejected | voice_used | ocr_used | ocr_corrected | export_done | page_view`

---

## Feedback

### POST /api/feedback
```json
{
  "rating": 5,
  "type": "general",
  "message": "ใช้งานง่ายมาก"
}
```
`type`: `bug | feature | general`

---

## OCR Corrections (Learning Data)

### POST /api/ocr-corrections
บันทึกเฉพาะเมื่อ user แก้ไขข้อความ OCR จริง
```json
{
  "originalText": "รับโอน 1500 จาก สมชาย",
  "correctedText": "รับโอน 1500 จาก สมชาย ใจดี"
}
```

### GET /api/ocr-corrections — admin only, export JSON สำหรับ training data

---

## Payments

### POST /api/payments
สร้าง pending Payment record (manual PromptPay)
```json
{
  "plan": "PRO",
  "period": "monthly",
  "amount": 99
}
```

### GET /api/payments — ประวัติชำระของ user

### GET /api/payments/info
คืน promptpayPhone + omisePublicKey สำหรับ frontend

---

## Omise

### POST /api/omise/charge
สร้าง Omise charge (PromptPay หรือ Card)
```json
{ "paymentId": "uuid", "method": "promptpay" }
```
หรือ Card: `{ "paymentId": "uuid", "method": "card", "token": "tokn_..." }`

### GET /api/omise/status?paymentId=uuid
Poll สถานะ: `{ "status": "pending|paid|failed" }`

### POST /api/webhooks/omise — public endpoint
Omise webhook: re-fetch event → activate plan อัตโนมัติ

---

## Referral

### GET /api/referral/code
```json
{ "code": "VINIT001", "link": "https://mchat-theta.vercel.app/ref/VINIT001" }
```

### GET /api/referral/stats
```json
{
  "clicks": 42,
  "signups": 10,
  "conversions": 3,
  "pendingCommission": 200,
  "availableCommission": 400
}
```

### GET /api/referral/commissions — ประวัติ commission (holdUntil, status)

### POST /api/referral/payout
ขอถอนเงิน (ขั้นต่ำ ฿300, ไม่มี pending ค้างอยู่)
```json
{
  "method": "promptpay",
  "accountNumber": "0812345678",
  "accountName": "ชื่อ นามสกุล"
}
```

### GET /api/referral/payout — ประวัติคำขอถอน

### GET /api/referral/terms — public (ไม่ต้อง auth)

### POST /api/ref/click — public
```json
{ "code": "VINIT001" }
```

---

## Admin

> ทุก endpoint: session email ต้องตรงกับ `ADMIN_EMAIL` env

### GET /api/admin/analytics — stats รวมใน 30 วัน
### GET /api/admin/users — list users พร้อม plan + usage
### PATCH /api/admin/users/:id/plan
```json
{ "plan": "PRO", "planExpiresAt": "2027-06-07T00:00:00Z" }
```
### GET /api/admin/payments — pending payments รอ confirm
### PATCH /api/admin/payments/:id — `{ "action": "confirm" }` หรือ `"reject"`
### GET /api/admin/settings — referral terms
### PATCH /api/admin/settings — อัปเดต referral terms
### GET /api/admin/referral/commissions — all commissions
### PATCH /api/admin/referral/commissions/:id — `{ "action": "approve" }` หรือ `"cancel"`
### GET /api/admin/referral/payouts — all payout requests
### PATCH /api/admin/referral/payouts/:id — `{ "action": "pay", "adminNote": "..." }` หรือ `"reject"`

---

## Error Format

```json
{ "error": "ข้อความอธิบายข้อผิดพลาด" }
```

Status codes: `400` validation | `401` ไม่มี session | `403` ไม่มีสิทธิ์/plan limit | `404` ไม่พบ | `429` rate limit | `500` server error

---

*MChat API Reference | มิถุนายน 2569*
