# MChat — API Reference

Base URL: `/api`

---

## Parser

### POST /api/parser/parse
แปลงข้อความภาษาไทยเป็น transaction

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
    "transactionDate": "2026-05-31",
    "description": "รถกระบะ",
    "paymentMethod": null,
    "confidence": 0.9,
    "rawText": "จ่ายค่าน้ำมัน 500 รถกระบะ วันนี้"
  }
}
```

---

## Transactions

### GET /api/transactions
Query: `start_date`, `end_date`, `type`, `category_id`, `keyword`, `page`, `limit`

### POST /api/transactions
```json
{
  "type": "expense",
  "categoryId": "uuid",
  "amount": 500,
  "transactionDate": "2026-05-31",
  "description": "รถกระบะ",
  "rawText": "จ่ายค่าน้ำมัน 500 วันนี้",
  "paymentMethod": "cash"
}
```

### PUT /api/transactions/:id
### DELETE /api/transactions/:id — soft delete (status = 'deleted')

---

## Categories

### GET /api/categories
### POST /api/categories
### PUT /api/categories/:id
### DELETE /api/categories/:id

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

### GET /api/dashboard/daily-cashflow
### GET /api/dashboard/category-expense

---

## Error Format
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "amount is required"
}
```
