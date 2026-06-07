# MChat Project Context

> เอกสารนี้คือ Context หลักของโปรเจกต์ **MChat** สำหรับใช้เปิด Chat ใหม่, ส่งต่อให้ AI, ทีม Dev, ทีม Marketing หรือใช้เป็นเอกสารกลางในการทำงานต่อ

---

## 1. Project Overview

**MChat** คือ Web App สำหรับบันทึกรายรับรายจ่ายง่ายเหมือนแชท ผู้ใช้สามารถพิมพ์หรือพูดภาษาไทยธรรมชาติ เช่น

- “ขายของ 500”
- “จ่ายค่าน้ำมัน 300”
- “เมื่อวานซื้อปุ๋ย 1200”

ระบบจะช่วยแยกข้อมูลเป็น:

- รายรับ / รายจ่าย
- หมวดหมู่
- จำนวนเงิน
- วันที่
- รายการบัญชี

พร้อมแสดงผลใน Dashboard และดูรายการย้อนหลังได้

---

## 2. Live URL และ Repository

### Live URL

```text
https://mchat-theta.vercel.app
```

### GitHub Repository

```text
https://github.com/ohho2518/Mchat
```

---

## 3. Core Slogan

```text
MChat — พิมพ์ พูด ส่งสลิป บัญชีจัดให้
```

ความหมายของ Slogan:

- **พิมพ์**: พิมพ์ข้อความรายรับรายจ่ายแบบภาษาไทยธรรมชาติ
- **พูด**: ใช้ Voice Input เพื่อบันทึกบัญชีด้วยเสียง
- **ส่งสลิป**: รองรับแนวคิดอ่านสลิปโอนเงินในอนาคต
- **บัญชีจัดให้**: ระบบช่วยแยกหมวดและจัดการข้อมูลบัญชีให้

---

## 4. Target Users

กลุ่มเป้าหมายหลักของ MChat ได้แก่:

- พ่อค้าแม่ค้าออนไลน์
- ร้านค้าเล็ก
- ร้านตลาดนัด
- เกษตรกร
- ฟรีแลนซ์
- เจ้าของกิจการขนาดเล็ก
- คนที่ไม่อยากกรอกบัญชีแบบเดิม
- คนที่ต้องการรู้รายรับ รายจ่าย และกำไรแบบง่าย ๆ

Pain Point หลัก:

- ไม่มีเวลาจดบัญชี
- ลืมบันทึกรายรับรายจ่าย
- ไม่อยากกรอกฟอร์มหลายช่อง
- รับเงินผ่านโอนเยอะ แต่รวมยอดยาก
- อยากรู้กำไร แต่ไม่มีระบบช่วยสรุป

---

## 5. Current Pricing Plan

## Free Plan

ราคา: **0 บาท**

ฟีเจอร์:

- บันทึกแชท / Voice ไม่จำกัด
- Dashboard วันนี้ + เดือนนี้
- ประวัติรายการ 90 วัน
- OCR สแกนสลิป 20 ครั้ง/เดือน
- Custom Categories 5 หมวด
- Accounts 2 บัญชี

เหมาะกับ:

- ผู้ใช้ใหม่
- คนที่อยากทดลองใช้งาน
- ผู้ใช้ทั่วไปที่บันทึกไม่ซับซ้อน

---

## Pro Plan

ราคา: **99 บาท/เดือน**

ฟีเจอร์:

- Dashboard ครบ
- ประวัติรายการไม่จำกัด
- OCR สแกนสลิป 100 ครั้ง/เดือน
- Export Excel/CSV
- Custom Categories ไม่จำกัด
- Accounts ไม่จำกัด
- Transfer / Debt

เหมาะกับ:

- แม่ค้าออนไลน์
- ฟรีแลนซ์
- เจ้าของร้านเล็ก
- ผู้ใช้ที่ต้องการ Export ข้อมูล
- คนที่ต้องการดูประวัติย้อนหลังเต็มรูปแบบ

---

## Max Plan

ราคา: **249 บาท/เดือน**

ฟีเจอร์:

- ทุกอย่างใน Pro
- OCR ไม่จำกัด หรือใช้ตาม Fair Usage Policy
- Multi-user 5 คน

เหมาะกับ:

- ร้านค้าที่มีทีม
- ธุรกิจเล็กที่มีลูกน้องช่วยบันทึก
- ร้านที่รับโอนเงินจำนวนมาก
- ผู้ใช้ที่ต้องการ OCR มากกว่า Pro

หมายเหตุ:

> ควรใช้คำว่า **OCR ไม่จำกัดแบบใช้งานปกติ** หรือกำหนด Fair Usage Policy เพื่อป้องกันต้นทุน OCR สูงเกินควบคุม

---

## 6. Recommended Yearly Pricing

เพื่อให้ระบบ Referral / Affiliate ขายง่ายขึ้น ควรเพิ่มราคาแบบรายปี

| Plan | Monthly | Yearly |
|---|---:|---:|
| Pro | 99 บาท/เดือน | 990 บาท/ปี |
| Max | 249 บาท/เดือน | 2,490 บาท/ปี |

### Early Promotion

| Plan | ราคาโปรเปิดตัว |
|---|---:|
| Pro Yearly Early | 899 บาท/ปี |
| Max Yearly Early | 1,990 บาท/ปี |

---

## 7. Planned Features / แนวคิดเพิ่ม

## 7.1 Slip Reader

ฟีเจอร์อ่านสลิปจาก:

- แอปธนาคาร
- LINE
- Messenger
- Directory / Folder
- รูปภาพที่ผู้ใช้อัปโหลด

ข้อมูลที่ควรอ่านจากสลิป:

- วันที่ / เวลาโอน
- จำนวนเงิน
- ชื่อผู้โอน
- ชื่อผู้รับ
- ธนาคาร
- เลขอ้างอิง
- QR / miniQR ถ้ามี

Workflow:

```text
Upload / Detect Slip
↓
OCR + QR Reader
↓
Extract Data
↓
Detect Duplicate
↓
Classify Income / Expense / Transfer
↓
Create Pending Transaction
↓
User Confirm
↓
Save
```

แนวคิด Directory Structure:

```text
/MChat-Slips
  /Inbox
  /Processed
  /Duplicate
  /Failed
  /NeedReview
```

Roadmap Slip Reader:

1. Manual Upload Slip
2. Folder Import
3. Local Agent / Desktop Agent
4. LINE OA / Messenger / Google Drive Integration

---

## 7.2 Background Insight System

ชื่อระบบ:

```text
MChat Usage Insight & Feedback System
```

เป้าหมาย:

- เก็บพฤติกรรมการใช้งานจริง
- วิเคราะห์ UX/UI
- วิเคราะห์ความแม่นยำ Parser
- เก็บ Feedback จากผู้ใช้จริง
- ใช้จัดลำดับ Feature Roadmap

Event ที่ควรเก็บ:

```text
chat_input_submitted
voice_input_used
parse_success
parse_failed
transaction_confirmed
transaction_edited_before_save
transaction_deleted
category_changed_by_user
amount_edited_by_user
date_edited_by_user
export_clicked
page_view_dashboard
page_view_transactions
onboarding_completed
onboarding_skipped
```

Feedback UI ที่ควรมี:

- ปุ่ม “แจ้งปัญหา / เสนอแนะ”
- หลัง Parser ทำงาน ให้ถาม “ระบบแยกข้อมูลถูกต้องไหม?”
- ตัวเลือก Feedback:
  - จำนวนเงินผิด
  - หมวดผิด
  - รายรับ/รายจ่ายผิด
  - วันที่ผิด
  - อ่านไม่เข้าใจ
  - อื่น ๆ

Privacy Requirement:

- ต้องมี Consent
- ไม่ควรเก็บข้อมูลการเงินละเอียดโดยไม่แจ้ง
- ถ้าเก็บ rawText เพื่อปรับ Parser ต้องเปิด/ปิดได้
- ควร Mask ข้อมูลสำคัญ เช่น ชื่อคน เลขบัญชี หรือข้อมูลส่วนตัว

Database ที่เกี่ยวข้อง:

```sql
usage_events
user_feedback
parser_corrections
```

---

## 7.3 Referral & Affiliate Program

ชื่อระบบ:

```text
MChat Referral & Affiliate Program
```

แนวคิด:

- ผู้ใช้หรือ Partner มี Referral Link / Referral Code ของตัวเอง
- คนอื่นสมัครผ่านลิงก์หรือโค้ดนั้น
- เมื่อผู้ถูกแนะนำชำระเงิน Pro / Max สำเร็จ
- ผู้แนะนำได้รับ Commission

ตัวอย่าง Referral Link:

```text
https://mchat.app/ref/VINIT001
```

ตัวอย่าง Referral Code:

```text
VINIT001
```

---

## 8. Referral Commission Recommendation

| Plan | ราคาขาย | Commission |
|---|---:|---:|
| Pro Monthly | 99 บาท | 20 บาท |
| Pro Yearly | 990 บาท | 200 บาท |
| Max Monthly | 249 บาท | 50 บาท |
| Max Yearly | 2,490 บาท | 500 บาท |

### Early Promotion Commission

| Plan | ราคาโปร | Commission |
|---|---:|---:|
| Pro Yearly Early | 899 บาท | 150 บาท |
| Max Yearly Early | 1,990 บาท | 350 บาท |

---

## 9. Referral Rules

เงื่อนไขหลัก:

- ถอนขั้นต่ำ 300 บาท
- Commission รออนุมัติ 14 วัน
- จ่ายทุกวันที่ 15 ของเดือน
- จ่ายผ่าน PromptPay / โอนธนาคาร
- จ่าย Commission เมื่อผู้ถูกแนะนำชำระเงินจริงเท่านั้น
- หากมี Refund / Chargeback ให้ยกเลิก Commission
- ห้ามแนะนำตัวเอง
- 1 ลูกค้าให้ Commission กับ Referral Code แรกเท่านั้น
- IP / Device ซ้ำผิดปกติต้องตรวจสอบ
- ห้าม Spam / หลอกลวง / ใช้ข้อความเกินจริง

Referral Flow:

```text
User gets referral code/link
↓
Share to friend
↓
Friend signs up
↓
Friend upgrades Pro/Max
↓
Commission pending
↓
Approved after 14 days
↓
Payout when >= 300 THB
```

Database ที่เกี่ยวข้อง:

```sql
referral_codes
referral_clicks
referrals
commissions
payout_requests
```

---

## 10. Payment Strategy

ช่วงแรกควรใช้ระบบง่ายก่อน:

```text
PromptPay QR + Upload Slip + Admin Approve
```

Payment Flow:

```text
User chooses plan
↓
Show PromptPay QR
↓
User pays
↓
Upload slip
↓
Admin verifies
↓
Activate Pro/Max
```

ต่อไปค่อยเพิ่ม:

- Payment Gateway เช่น Omise / Stripe
- Webhook Auto Activate
- Recurring Billing
- In-App Purchase สำหรับ Play Store / App Store

Database ที่ควรมี:

```sql
plans
subscriptions
payments
payment_slip_reviews
invoices
```

---

## 11. App Store / Play Store Roadmap

ลำดับที่แนะนำ:

1. ทำ Web App / PWA ให้เสถียรก่อน
2. ห่อเป็น Android App ด้วย Capacitor
3. ขึ้น Google Play ก่อน
4. เก็บ Feedback และปรับ UX
5. ค่อยทำ iOS App
6. เตรียม In-App Purchase ถ้าขาย Digital Feature ผ่าน Store

ค่าใช้จ่ายสำคัญ:

- Google Play Console: 25 USD ครั้งเดียว
- Apple Developer Program: 99 USD/ปี
- Vercel Pro: 20 USD/เดือน หากขยับ Production
- Supabase Pro: 25 USD/เดือน หากขยับ Production
- Domain: ประมาณ 400–1,500 บาท/ปี

---

## 12. Marketing Direction

ชุดสื่อที่ควรทำ:

1. คู่มือผู้ใช้ฉบับสั้น
2. คู่มือผู้ใช้ฉบับละเอียด
3. Screenshot Checklist
4. Quick Start Guide 1 หน้า
5. Script คลิปการ์ตูน Animation 60 วินาที
6. Prompt สำหรับ AI Video Generator

Animation Concept:

- แม่ค้าออนไลน์ขายของยุ่ง
- ลืมจดรายรับรายจ่าย
- เปิด MChat พิมพ์ “ขายของ 500”
- ระบบแยกหมวดให้
- ดู Dashboard แล้วรู้รายรับรายจ่ายทันที
- ปิดท้ายด้วย Slogan

Slogan ใช้ใน Marketing:

```text
MChat — พิมพ์ พูด บันทึกบัญชีง่ายเหมือนแชท
```

หรือ

```text
MChat — พิมพ์ พูด ส่งสลิป บัญชีจัดให้
```

---

## 13. Dev Priority — Status Update (มิถุนายน 2569)

1. ✅ ทำระบบ Pricing Page — `/pricing`, plan comparison, PaymentModal (Omise + manual)
2. ✅ ทำระบบ Payment Manual — PromptPay QR + Admin Approve + Activate Pro/Max
3. ✅ ทำระบบ Payment Auto (Omise) — PromptPay QR auto + Card + Webhook
4. ✅ ทำระบบ Subscription — Free/Pro/Max plan tiers, feature gates, quota
5. ✅ ทำ Referral MVP (Phase 1–5) — Code, Link, Tracking, Commission, Admin Payout
6. ✅ เพิ่ม Background Insight — AppEvent tracking, User Feedback, Admin analytics
7. ✅ เพิ่ม Slip Reader Phase 1 — OCR upload, holderName detection, OcrReviewModal

**Next Dev Priority:**
- QA/UAT ระบบ Referral + Omise ใน production (ดู PROJECT_STATUS.md)
- Android App (Capacitor wrap PWA)
- Multi-user / Organization (Max plan)
- Slip Reader Phase 2 (Folder Import / LINE OA)

---

## Marketing Priority

1. ทำแคมเปญ **MChat Early Partner 50 คนแรก**
2. เสนอ Commission:
   - Pro Yearly: 200 บาท
   - Max Yearly: 500 บาท
3. ลูกค้าที่สมัครผ่านลิงก์ได้ Pro เพิ่ม 7 วัน
4. ทำโพสต์ขาย Pro / Max
5. ทำคลิปสั้น 30–60 วินาที
6. ทำคู่มือใช้งานและภาพ Screenshot
7. เริ่มขายผ่าน Facebook / LINE / กลุ่มแม่ค้า / กลุ่มเกษตรกร

---

## 14. Instruction for New Chat / AI Handoff

เมื่อเปิด Chat ใหม่ ให้ใช้ไฟล์นี้เป็น Context หลัก แล้วสั่งว่า:

```text
อ่านไฟล์ MChat_PROJECT_CONTEXT.md นี้ก่อน แล้วใช้เป็นข้อมูลหลักของโปรเจกต์ MChat
จากนี้ให้ช่วยวิเคราะห์ ออกแบบ เขียนเอกสาร หรือสั่งงาน Dev/Marketing โดยยึดข้อมูลในไฟล์นี้เป็นพื้นฐาน
```

---

## 15. Current Project Direction Summary

สถานะ มิถุนายน 2569:

```text
✅ Web App Core Flow
✅ Pricing + Payment Manual
✅ Omise Payment Gateway (PromptPay + Card)
✅ Pro / Max Subscription
✅ Referral & Affiliate MVP (Phase 1–5)
✅ Usage Insight + Feedback
✅ Slip Reader Phase 1 (OCR)
✅ PWA (Android/iOS install)
→  QA/UAT Referral + Omise ใน production
→  Android App (Capacitor)
→  Multi-user / Organization
→  Slip Reader Phase 2
```

เป้าหมายระยะสั้น:

> QA/UAT ระบบ Referral + Omise → Launch จริง → เก็บ feedback → scale

เป้าหมายระยะกลาง:

> เพิ่ม Slip Reader, Background Insight, Referral Dashboard และ Android App

เป้าหมายระยะยาว:

> พัฒนา MChat เป็น AI Accounting Assistant สำหรับพ่อค้าแม่ค้า ร้านค้าเล็ก เกษตรกร และฟรีแลนซ์ในไทย

