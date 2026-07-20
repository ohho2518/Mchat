# MChat — Feature Summary
### สำหรับ Content การตลาด & White Paper

**เวอร์ชัน:** 2.0
**อัปเดต:** 2026-07-20
**สถานะ:** 🚀 LIVE — Production · เปิดขายจริงแล้ว (On Sale)

---

## 1. Product Overview

**MChat** คือ Web App (PWA) บันทึกรายรับรายจ่ายด้วยแชทภาษาไทย
ผู้ใช้พิมพ์ข้อความธรรมดา เช่น `"จ่ายค่าน้ำมัน 500 วันนี้"` ระบบวิเคราะห์และบันทึกให้อัตโนมัติ
ไม่ต้องโหลดแอป — ติดตั้งได้เหมือน Native App ผ่านเบราว์เซอร์ (PWA)

**กลุ่มเป้าหมาย:** เจ้าของร้านค้าขนาดเล็ก · เกษตรกร · ฟรีแลนซ์ · บุคคลทั่วไป

**จุดขายหลัก:** พิมพ์/พูด/ถ่ายสลิป → บันทึกบัญชีอัตโนมัติเป็นภาษาไทย — ง่ายที่สุดสำหรับคนไทย

---

## 2. Core Features — บันทึกรายรับรายจ่าย

| Feature | รายละเอียด |
|---|---|
| **แชทภาษาไทย** | พิมพ์ประโยคธรรมดา → ระบบแยกหมวด จำนวน วันที่ อัตโนมัติ |
| **Voice Input** | พูดแทนพิมพ์ — Web Speech API (ภาษาไทย) รองรับ Chrome/Safari/Edge |
| **สแกนสลิป OCR** | ถ่ายรูปสลิปธนาคาร → ระบบอ่านและบันทึกให้อัตโนมัติ (AI vision) |
| **Confirm ก่อนบันทึก** | แสดง Confidence Score — แจ้งเตือนถ้าระบบไม่มั่นใจ |
| **แก้ไข / ลบ** | แก้ไขรายการย้อนหลังได้ · Soft Delete (กู้คืนได้) |
| **หมวดหมู่อัตโนมัติ** | จับหมวดจาก keyword: อาหาร, น้ำมัน, ค่าเช่า, เงินเดือน ฯลฯ |
| **บัญชีหลายบัญชี** | จัดการหลายบัญชีธนาคาร/กระเป๋าเงิน |
| **โอนเงินระหว่างบัญชี** | บันทึก Transfer (ไม่นับเป็นรายรับ/รายจ่าย) |
| **ติดตามหนี้** | บันทึกลูกหนี้/เจ้าหนี้ (Debt Tracking) |

---

## 3. AI & Technology

| Technology | การใช้งาน |
|---|---|
| **Thai NLP Parser** | Rule-based parser 100% ไม่พึ่ง AI — เร็ว, ไม่มี cost, ทำงาน offline |
| **OCR (AI Vision)** | อ่านสลิปธนาคาร — ระบุผู้โอน/ผู้รับ, จำนวน, วันที่ |
| **ระบุรายรับ/รายจ่ายจากสลิป** | เปรียบชื่อในสลิปกับบัญชีของผู้ใช้ → ตัดสินทิศทางเงิน |
| **Confidence Score** | แต่ละ parse มี score 0–1 — แจ้งเตือนถ้า < 0.6 |
| **OCR Learning Data** | บันทึกการแก้ไขสลิป (Opt-in) เพื่อปรับปรุงความแม่นยำ |

---

## 4. Dashboard & Analytics

| Feature | รายละเอียด |
|---|---|
| **Summary Card** | ยอดรับ / ยอดจ่าย / คงเหลือ วันนี้ + เดือนนี้ |
| **กราฟรายรับ-รายจ่าย** | Bar Chart เปรียบ Income vs Expense รายวัน/เดือน/ปี |
| **Cashflow Line Chart** | แนวโน้ม Cashflow ต่อเนื่อง |
| **Category Pie Chart** | สัดส่วนค่าใช้จ่ายแต่ละหมวด |
| **กรอง Period** | วันนี้ / 7 วัน / 30 วัน / เดือนนี้ / ปีนี้ |
| **Export ข้อมูล** | ส่งออก Excel (.xlsx) และ CSV รองรับภาษาไทย |
| **PDPA Data Export** | ผู้ใช้ดาวน์โหลดข้อมูลตัวเองได้ (JSON/CSV) |

---

## 5. แผนราคา (Pricing)

| | **Free** | **Pro** | **Max** |
|---|---|---|---|
| ราคา/เดือน | ฟรี | ฿99 | ฿249 |
| ราคา/ปี | ฟรี | ฿990 | ฿2,490 |
| OCR สลิป/เดือน | 20 ครั้ง | 100 ครั้ง | 500 ครั้ง |
| ประวัติรายการ | 90 วัน | ไม่จำกัด | ไม่จำกัด |
| หมวดหมู่เอง | 5 | ไม่จำกัด | ไม่จำกัด |
| บัญชี | 2 | ไม่จำกัด | ไม่จำกัด |
| Transfer / Debt | ✗ | ✓ | ✓ |
| Export Excel/CSV | ✗ | ✓ | ✓ |
| Multi-user | ✗ | ✗ | ✓ |

### OCR Credit Packs (ซื้อเพิ่มได้ ไม่มีวันหมดอายุ)

| Pack | ครั้ง | ราคา |
|---|---|---|
| Starter | 100 ครั้ง | ฿29 |
| Popular | 300 ครั้ง | ฿79 |
| Pro Pack | 500 ครั้ง | ฿119 |

### 💳 ช่องทางชำระเงิน — Stripe (พร้อมใช้งานจริง)

| ช่องทาง | รายละเอียด |
|---|---|
| **บัตรเครดิต / เดบิต** | ผ่าน Stripe Checkout — ปลอดภัยระดับสากล (PCI-DSS) |
| **PromptPay QR** | สแกนจ่ายผ่านแอปธนาคาร — ยืนยันอัตโนมัติ |
| **โอนเงินแจ้งสลิป** | ช่องทางสำรอง (Manual) |

### 🔁 ต่ออายุอัตโนมัติ (Auto-renew) — ใหม่!

- สมัครแบบ **ตัดบัตรอัตโนมัติทุกเดือน** (PRO ฿99/เดือน · MAX ฿249/เดือน)
- ไม่ต้องจ่ายเองทุกเดือน — ระบบต่ออายุให้อัตโนมัติ
- **ยกเลิกได้ทุกเมื่อ** ในหน้าตั้งค่า (ใช้ได้ต่อจนจบรอบที่จ่ายไว้)
- หรือเลือกจ่ายครั้งเดียว (1/3/6/12 เดือน) — ยิ่งนานยิ่งลด (6 เดือน −10% · 1 ปี −17%)

---

## 6. Referral & Affiliate System

| Feature | รายละเอียด |
|---|---|
| **รหัสแนะนำส่วนตัว** | ทุก account มีรหัสเฉพาะ (เช่น WINIT001) |
| **QR Code แชร์** | สแกน QR → /download → สมัครพร้อมผูก referral อัตโนมัติ |
| **Dashboard Referral** | ดู clicks / สมาชิกใหม่ / ยอด commission / ประวัติ |
| **ถอนเงิน** | ถอนขั้นต่ำ ฿300 · จ่ายทุกวันที่ 15 ผ่าน PromptPay |
| **Hold Period** | ถือเงิน 14 วัน (ป้องกันการคืนเงิน) |
| **Commission Risk Flag** | ตรวจสอบ commission ผิดปกติอัตโนมัติ (3 กฎ) |

### อัตราค่าแนะนำ

| แผน | ค่าคอมมิชชั่น |
|---|---|
| Pro รายเดือน | ฿20 |
| Pro รายปี | ฿200 |
| Max รายเดือน | ฿50 |
| Max รายปี | ฿500 |

---

## 7. ความปลอดภัย & PDPA Compliance

| Feature | รายละเอียด |
|---|---|
| **PDPA Consent** | Checkbox ยอมรับนโยบาย + Terms ตอนสมัคร (บันทึก IP/UA) |
| **Email Verification** | ยืนยันอีเมลหลังสมัคร (Resend API) |
| **Privacy Center** | `/settings/privacy` — จัดการ consent, ดาวน์โหลดข้อมูล, ขอลบบัญชี |
| **OCR Consent** | ผู้ใช้เลือกได้ว่ายินยอมแชร์ข้อมูลสลิปหรือไม่ |
| **Audit Log** | บันทึก admin actions ทุกครั้ง (เปลี่ยน plan, อนุมัติเงิน ฯลฯ) |
| **Security Headers** | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Rate Limiting** | ป้องกัน brute force — OCR 10 req/min, Register 5 req/min |
| **Data Retention** | ลบข้อมูลเก่าอัตโนมัติ — AppEvent >90 วัน, OCR Correction >1 ปี |
| **scrypt Password Hashing** | Cost factor สูง (แข็งแกร่งกว่า bcrypt) |
| **Supabase Row Level Security** | เปิดใช้จริงครบทุกตาราง — ปิดการเข้าถึงข้อมูลจากภายนอก |
| **Payment Signature Verify** | ตรวจสอบ HMAC signature ทุก Stripe webhook (idempotent fulfillment) |
| **Server-authoritative Pricing** | ราคาคำนวณฝั่ง server เสมอ — จ่ายต่ำกว่าราคาจริงไม่ได้ |

---

## 8. PWA & Platform

| Feature | รายละเอียด |
|---|---|
| **Progressive Web App** | ติดตั้งได้บน Android/iOS เหมือน Native App |
| **ไม่ต้องผ่าน App Store** | ติดตั้งตรงจากเบราว์เซอร์ — ลด friction |
| **Offline Service Worker** | Cache asset สำหรับโหลดเร็ว |
| **Mobile-First Design** | ออกแบบสำหรับหน้าจอ 375px ขึ้นไป |
| **รองรับทุก Platform** | iOS Safari · Android Chrome · Desktop |
| **Font ภาษาไทย** | Sarabun (Google Fonts) อ่านง่ายบนมือถือ |
| **Uptime Monitoring** | ตรวจสุขภาพระบบทุก 5 นาที (กันฐานข้อมูลหลับ) |

---

## 9. Admin Panel

| Feature | รายละเอียด |
|---|---|
| **Analytics Dashboard** | Events, DAU, OCR usage, Feedback ratings |
| **User Management** | ดู/เปลี่ยน plan ผู้ใช้, Grant OCR credits |
| **Payment Management** | Approve/Reject manual payment |
| **Commission Management** | Approve/Cancel commission (พร้อม Risk Flag) |
| **Payout Management** | Pay/Reject payout requests |
| **Referral Terms Editor** | แก้ไขเงื่อนไข commission ได้จาก UI |
| **OCR Corrections Export** | ดาวน์โหลด learning data สำหรับ model improvement |

---

## 10. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL + Prisma ORM v6 (RLS เปิดใช้) |
| Auth | NextAuth.js v4 (JWT) |
| AI/OCR | AI Vision (GPT-4o-mini) |
| **Payment** | **Stripe Checkout (บัตร + PromptPay, auto-renew subscription)** — Omise/manual สำรอง |
| Email | Resend API |
| Deploy | Vercel + Supabase Cloud |
| Monitoring | UptimeRobot (health check) |
| PWA | Web App Manifest + Service Worker |

---

## 11. Parser — ความสามารถภาษาไทย

ระบบ parse ข้อความภาษาไทยแบบ Rule-based ผ่าน 44 test cases:

- **ประเภท:** รายรับ · รายจ่าย · โอนเงิน · หนี้
- **จำนวนเงิน:** ตัวเลข + คำไทย ("สองพันห้าร้อย" = 2,500)
- **วันที่:** วันนี้ / เมื่อวาน / วันจันทร์ / 3 วันก่อน / วันที่ 15
- **หมวดหมู่:** ตรวจจับจาก keyword อัตโนมัติ (50+ keyword)
- **วิธีชำระ:** เงินสด / โอน / บัตร / พร้อมเพย์
- **Confidence Score:** 0.0–1.0 แจ้งเตือนถ้าไม่แน่ใจ

---

## 12. สถานะโปรดักต์ (Product Status)

| | |
|---|---|
| **สถานะ** | 🟢 LIVE — Production เปิดขายจริง (2026-07-20) |
| **Payment** | Stripe live พร้อมรับเงินจริง (บัตร + PromptPay + auto-renew) |
| **Parser** | ผ่าน 44/44 test cases |
| **แพลตฟอร์ม** | PWA — Android · iOS · Desktop |
| **ความปลอดภัย** | RLS เปิดครบ · PDPA compliant · webhook signature verify |

---

*MChat · พิมพ์ พูด อ่าน บัญชีจัด ให้ · กรกฎาคม 2569*
