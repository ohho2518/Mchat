# MChat — Parser Guide

Thai Rule-based Transaction Parser

---

## ขั้นตอนการทำงาน

```
1. normalize(text)         — แปลงเลขไทย, ตัด comma, trim
2. extractAmount()         — หาจำนวนเงิน
3. extractDate()           — หาวันที่
4. detectType()            — แยก income/expense/transfer/debt
5. detectCategory()        — จับหมวดจาก keyword
6. detectPaymentMethod()   — จับช่องทางชำระ
7. extractDescription()    — ส่วนที่เหลือเป็น description
8. calculateConfidence()   — คะแนนความมั่นใจ
```

---

## Type Detection Keywords

| Type | Keywords |
|---|---|
| **income** | ขาย, รับ, ได้เงิน, เงินเข้า, ลูกค้าโอน, รับโอน |
| **expense** | จ่าย, ซื้อ, ค่า, เติม, โอนจ่าย, ชำระ |
| **transfer** | โอนจาก, โอนไป, ย้ายเงิน, ถอนเงิน, ฝากเงิน |
| **debt** | ยืม, คืนเงิน, ค้างจ่าย, ลูกหนี้, เจ้าหนี้ |

ลำดับ: `transfer > debt > expense > income`

---

## Date Keywords

| คำ | แปลง |
|---|---|
| วันนี้ | current date |
| เมื่อวาน | current date - 1 |
| พรุ่งนี้ | current date + 1 |
| วันที่ 25 | day 25 ของเดือนปัจจุบัน |
| 25/5/2569 | แปลง พ.ศ. → ค.ศ. |

---

## Confidence Score

| พบ | คะแนน |
|---|---|
| amount | +0.30 |
| type | +0.20 |
| category | +0.20 |
| date | +0.15 |
| paymentMethod | +0.10 |
| description | +0.05 |

`confidence < 0.6` → แสดง warning ให้ผู้ใช้ตรวจสอบ

---

## Files

```
src/lib/parser/
├── parseTransactionText.ts   ← main function
├── normalize.ts              ← normalize ข้อความ
├── amountParser.ts           ← หาจำนวนเงิน
├── dateParser.ts             ← หาวันที่
├── typeDetector.ts           ← แยกประเภท
├── categoryDetector.ts       ← จับหมวดหมู่
└── paymentMethodDetector.ts  ← จับช่องทางชำระ
```
