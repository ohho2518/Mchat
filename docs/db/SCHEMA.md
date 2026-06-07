# MChat — Database Schema

Database: PostgreSQL (Supabase)  
ORM: Prisma v6  
Schema file: `prisma/schema.prisma`

---

## Tables Overview

| Table | หน้าที่ |
|---|---|
| `users` | ผู้ใช้งาน + plan + planExpiresAt |
| `accounts` | บัญชีเงิน (สด/ธนาคาร/ร้าน/สวน) |
| `categories` | หมวดหมู่รายรับ-รายจ่าย |
| `category_keywords` | keyword สำหรับ parser |
| `transactions` | รายการรับ-จ่าย-โอน-หนี้ |
| `transfers` | รายละเอียดการโอนระหว่างบัญชี |
| `debts` | ลูกหนี้ / เจ้าหนี้ |
| `app_events` | User behavior tracking |
| `feedbacks` | User feedback (rating + ข้อความ) |
| `ocr_corrections` | OCR correction pairs สำหรับ training data |
| `usage_quotas` | OCR quota รายเดือนต่อ user |
| `payments` | ประวัติการชำระเงิน (manual + Omise) |
| `referral_codes` | Referral code ของแต่ละ user |
| `referrals` | ความสัมพันธ์ referrer ↔ referred |
| `commissions` | Commission ที่รอจ่าย/จ่ายแล้ว |
| `payout_requests` | คำขอถอนเงิน commission |
| `site_settings` | Key-value store สำหรับ configurable content |

---

## Enums

```
Plan:          FREE | PRO | MAX
PaymentStatus: pending | paid | failed | refunded
CommStatus:    pending | approved | paid | cancelled
PayoutStatus:  pending | paid | rejected
```

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

## Model Details

### User (เพิ่มเติมจากเดิม)
| Field | Type | Note |
|---|---|---|
| plan | Plan | default FREE |
| planExpiresAt | DateTime? | null = Free (ไม่หมดอายุ) |

### Transaction (เพิ่มเติมจากเดิม)
| Field | Type | Note |
|---|---|---|
| holderName | String? | ชื่อคู่ค้าจาก OCR slip |

### UsageQuota
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| month | String | format YYYY-MM (Thai timezone UTC+7) |
| ocrCount | Int | นับ OCR ต่อเดือน |
| updatedAt | DateTime | |

Unique: `(userId, month)`

### Payment
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| plan | Plan | PRO\|MAX |
| period | String | monthly\|yearly |
| amount | Decimal(18,2) | |
| status | PaymentStatus | pending\|paid\|failed\|refunded |
| omiseChargeId | String? | Omise charge ID (auto payment) |
| paidAt | DateTime? | |
| createdAt | DateTime | |

### ReferralCode
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String (unique) | FK User |
| code | String (unique) | e.g. VINIT001 |
| clicks | Int | click counter |
| createdAt | DateTime | |

### Referral
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| referrerId | String | FK User (ผู้แนะนำ) |
| referredId | String (unique) | FK User (ผู้ถูกแนะนำ) |
| codeId | String | FK ReferralCode |
| createdAt | DateTime | |

### Commission
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| referralId | String | FK Referral |
| paymentId | String | FK Payment |
| amount | Decimal(18,2) | commission amount |
| holdUntil | DateTime | createdAt + 14 วัน |
| status | CommStatus | pending\|approved\|paid\|cancelled |
| createdAt | DateTime | |

### PayoutRequest
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| amount | Decimal(18,2) | total payout |
| method | String | promptpay\|bank |
| accountNumber | String | masked ก่อน return |
| accountName | String | |
| status | PayoutStatus | pending\|paid\|rejected |
| adminNote | String? | |
| createdAt | DateTime | |

### AppEvent
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| eventType | String | transaction_saved\|voice_used\|ocr_used\|… |
| metadata | Json? | extra data |
| createdAt | DateTime | |

### Feedback
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| rating | Int | 1–5 |
| type | String | bug\|feature\|general |
| message | String? | |
| createdAt | DateTime | |

### OcrCorrection
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| userId | String | FK User |
| originalText | String | OCR raw output |
| correctedText | String | user-corrected text |
| createdAt | DateTime | |

### SiteSetting
| Field | Type | Note |
|---|---|---|
| id | String (uuid) | PK |
| key | String (unique) | e.g. referral_terms |
| value | String | JSON or plain text |
| updatedAt | DateTime | |

---

## Important Rules

- **Soft delete only**: `Transaction.status = 'deleted'` — ห้าม hard delete
- ทุก query filter: `status: { not: 'deleted' }`
- Transfer/Debt type ไม่นับใน dashboard P&L
- `UsageQuota` keyed ด้วย `userId + month` (Thai timezone UTC+7)
- `Commission.holdUntil` = createdAt + 14 วัน
- `PayoutRequest.accountNumber` mask ก่อน return ทุกครั้ง
- `scrypt` format: `N:salt:hash` — เก็บ cost factor ใน hash string (backward-compat)
- Plan ใน JWT token — ไม่ query DB ทุก request; user ต้อง re-login เมื่อ admin เปลี่ยน plan

---

*MChat DB Schema | มิถุนายน 2569*
