# MChat Referral & Affiliate Program — Dev Spec

> เอกสารสำหรับทีมพัฒนา  
> วัตถุประสงค์: สร้างระบบแนะนำเพื่อน / Affiliate / Commission สำหรับ MChat โดยรองรับการขายแพ็กเกจ Free, Pro, Max และสามารถเริ่มจาก Manual ก่อน แล้วค่อยพัฒนาเป็นระบบอัตโนมัติเต็มรูปแบบ

---

## 1. ภาพรวมระบบ

MChat ต้องการระบบบอกต่อเพื่อให้ผู้ใช้หรือ Partner สามารถแนะนำลูกค้าใหม่ได้ โดยระบบต้องติดตามว่าใครเป็นผู้แนะนำ ใครสมัครผ่านลิงก์หรือโค้ดนั้น และเมื่อผู้ถูกแนะนำชำระเงินสำเร็จ ระบบต้องคำนวณคอมมิชชันให้ผู้แนะนำ

แนวคิดหลัก:

```text
User / Partner ได้ Referral Code หรือ Referral Link
↓
แชร์ให้เพื่อน / ลูกค้า / กลุ่ม Facebook / LINE / TikTok
↓
ลูกค้าสมัครผ่านลิงก์หรือกรอกโค้ด
↓
ลูกค้าอัปเกรด Pro หรือ Max
↓
ระบบสร้าง Commission แบบ Pending
↓
ครบระยะ Hold และไม่มี refund → Approved
↓
ผู้แนะนำขอถอนเงิน
↓
Admin จ่ายผ่าน PromptPay / โอนธนาคาร
```

---

## 2. แพ็กเกจ MChat ปัจจุบัน

| Feature | Free | Pro 99 บาท/เดือน | Max 249 บาท/เดือน |
|---|---:|---:|---:|
| บันทึกแชท / Voice | ไม่จำกัด | ✅ | ✅ |
| Dashboard | วันนี้ + เดือนนี้ | ครบ | ครบ |
| ประวัติรายการ | 90 วัน | ไม่จำกัด | ไม่จำกัด |
| OCR สแกนสลิป | 20 ครั้ง/เดือน | 100 ครั้ง/เดือน | ไม่จำกัด* |
| Export Excel/CSV | ❌ | ✅ | ✅ |
| Custom Categories | 5 หมวด | ไม่จำกัด | ไม่จำกัด |
| Accounts | 2 บัญชี | ไม่จำกัด | ไม่จำกัด |
| Transfer / Debt | ❌ | ✅ | ✅ |
| Multi-user | ❌ | ❌ | 5 คน |

> หมายเหตุ: สำหรับ Max ควรกำหนด Fair Usage Policy สำหรับ OCR เช่น “ไม่จำกัดภายใต้การใช้งานปกติ” หรือ soft limit ภายในระบบ เพื่อป้องกันต้นทุน OCR สูงเกินควบคุม

---

## 3. ราคา Yearly ที่ควรเพิ่ม

ระบบ Affiliate ควรเน้นการขายรายปี เพราะคอมมิชชันชัดเจนกว่าและช่วยให้ MChat ได้รายได้ล่วงหน้า

| Plan | Monthly | Yearly | Early Price แนะนำ |
|---|---:|---:|---:|
| Pro | 99 บาท/เดือน | 990 บาท/ปี | 899 บาท/ปี |
| Max | 249 บาท/เดือน | 2,490 บาท/ปี | 1,990 บาท/ปี |

---

## 4. Commission Model

### 4.1 Commission ช่วงเปิดตัว

| Plan ที่ลูกค้าซื้อ | ราคาขาย | Commission |
|---|---:|---:|
| Pro Monthly | 99 บาท | 20 บาท |
| Pro Yearly | 990 บาท | 200 บาท |
| Max Monthly | 249 บาท | 50 บาท |
| Max Yearly | 2,490 บาท | 500 บาท |

### 4.2 Commission โปร Early Launch

| Plan | ราคาโปร | Commission |
|---|---:|---:|
| Pro Yearly Early | 899 บาท | 150 บาท |
| Max Yearly Early | 1,990 บาท | 350 บาท |

### 4.3 เงื่อนไขการถอนเงิน

```text
ถอนขั้นต่ำ: 300 บาท
Commission Hold Period: 14 วัน
รอบจ่าย: ทุกวันที่ 15 ของเดือน
ช่องทางจ่าย: PromptPay / โอนธนาคาร
```

---

## 5. Partner Level

### Level 1: User Referral

สำหรับผู้ใช้ทั่วไปที่แนะนำเพื่อน

| ลูกค้าซื้อ | ผู้แนะนำได้ |
|---|---:|
| Pro Monthly | Pro ฟรีเพิ่ม 7 วัน หรือ 10 บาท |
| Pro Yearly | 100 บาท |
| Max Monthly | 30 บาท |
| Max Yearly | 250 บาท |

### Level 2: Affiliate Partner

สำหรับคนทำคอนเทนต์ เพจ TikTok กลุ่ม Facebook หรือคนขายออนไลน์

| ลูกค้าซื้อ | Affiliate ได้ |
|---|---:|
| Pro Monthly | 20 บาท |
| Pro Yearly | 200 บาท |
| Max Monthly | 50 บาท |
| Max Yearly | 500 บาท |

### Level 3: Local Sales Partner

สำหรับคนลงพื้นที่ขายร้านค้า ตลาดนัด เกษตรกร หรือร้านที่มีทีม

| ดีล | Commission แนะนำ |
|---|---:|
| Pro รายปี 5 บัญชีขึ้นไป | 20% |
| Max Yearly | 500 บาท/ร้าน |
| งานติดตั้ง / สอนใช้งานหน้างาน | คิดค่าบริการแยกได้ |

---

## 6. User Flow

### 6.1 ฝั่งผู้แนะนำ

```text
Login MChat
↓
เข้าเมนู “แนะนำเพื่อน / รับคอม”
↓
เห็น Referral Code เช่น WINIT001
↓
กดคัดลอกลิงก์ / แชร์ LINE / แชร์ Facebook
↓
มีคนสมัครผ่านลิงก์
↓
มีคนอัปเกรด Pro/Max และชำระเงิน
↓
Commission ขึ้นสถานะ Pending
↓
ครบ 14 วัน → Approved
↓
ยอดครบ 300 บาท → ขอถอนเงิน
```

### 6.2 ฝั่งลูกค้าใหม่

```text
กด Referral Link
↓
Landing Page จำ Referral Code
↓
สมัครบัญชี Free
↓
ระบบผูก referred_user_id กับ referrer_user_id
↓
ลูกค้าอัปเกรด Pro/Max
↓
Payment สำเร็จ
↓
ระบบสร้าง Commission ให้ผู้แนะนำ
```

---

## 7. Referral Attribution Logic

### 7.1 URL รูปแบบที่ต้องรองรับ

```text
https://mchat.app/ref/WINIT001
https://mchat.app/signup?ref=WINIT001
```

### 7.2 Logic การจำ Referral

1. เมื่อ visitor เข้า `/ref/:code` ให้ validate code
2. ถ้า code valid ให้เก็บ `referral_code` ใน cookie/localStorage
3. อายุ referral cookie แนะนำ: 30 วัน
4. เมื่อ visitor สมัครสมาชิก ให้ผูก referral กับ user ใหม่
5. ถ้า user สมัครโดยตรงแต่กรอก referral code ใน checkout ให้ใช้ code ที่กรอกแทน
6. ถ้ามีหลาย code ให้ใช้กฎ “first valid referral wins” ยกเว้น admin override

### 7.3 กฎสำคัญ

- ห้ามแนะนำตัวเอง
- 1 referred user ผูกกับ 1 referrer เท่านั้น
- Commission เกิดเมื่อ payment status = paid เท่านั้น
- หาก refund / chargeback ให้ cancel commission

---

## 8. Required Pages / UI

### 8.1 หน้า Referral Dashboard สำหรับผู้ใช้

Route แนะนำ:

```text
/referral
```

ข้อมูลที่ต้องแสดง:

| Field | ตัวอย่าง |
|---|---|
| Referral Code | WINIT001 |
| Referral Link | https://mchat.app/ref/WINIT001 |
| Partner Level | Affiliate Partner |
| Clicks | 128 |
| Signups | 24 |
| Paid Customers | 6 |
| Pending Commission | 600 บาท |
| Approved Commission | 400 บาท |
| Paid Out | 1,200 บาท |

ปุ่มที่ต้องมี:

```text
[คัดลอกลิงก์]
[แชร์ LINE]
[แชร์ Facebook]
[ขอถอนเงิน]
[ดูประวัติ Commission]
```

---

### 8.2 หน้า Payout Request

Field ที่ต้องกรอก:

- ชื่อบัญชีรับเงิน
- เบอร์ PromptPay หรือเลขบัญชีธนาคาร
- ธนาคาร
- จำนวนเงินที่ต้องการถอน
- ยืนยันเงื่อนไขการถอน

สถานะ:

```text
requested
processing
paid
rejected
```

---

### 8.3 หน้า Admin Referral Management

Route แนะนำ:

```text
/admin/referrals
/admin/commissions
/admin/payouts
```

เมนู Admin:

| Menu | ใช้ทำอะไร |
|---|---|
| Partners | ดูรายชื่อผู้แนะนำและระดับ Partner |
| Referrals | ดูคนที่สมัครผ่านลิงก์ |
| Commissions | ตรวจคอมที่รออนุมัติ |
| Payouts | ตรวจคำขอถอนเงิน |
| Fraud Check | ตรวจเคสผิดปกติ |
| Top Partners | ดูคนแนะนำยอดสูงสุด |

---

## 9. Database Schema

### 9.1 `referral_codes`

```sql
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  code text not null unique,
  partner_level text not null default 'user', -- user, affiliate, local_partner
  status text not null default 'active', -- active, disabled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 9.2 `referral_clicks`

```sql
create table referral_clicks (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references referral_codes(id),
  visitor_id text,
  ip_hash text,
  user_agent_hash text,
  landing_page text,
  created_at timestamptz not null default now()
);
```

### 9.3 `referrals`

```sql
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id),
  referred_user_id uuid not null references auth.users(id),
  referral_code_id uuid not null references referral_codes(id),
  status text not null default 'signed_up', -- signed_up, trial, paid, rejected
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(referred_user_id)
);
```

### 9.4 `commissions`

```sql
create table commissions (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id),
  referred_user_id uuid not null references auth.users(id),
  referral_id uuid not null references referrals(id),
  payment_id uuid,
  plan_code text not null,
  commission_amount numeric(10,2) not null,
  commission_status text not null default 'pending', -- pending, approved, paid, canceled
  hold_until timestamptz not null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz
);
```

### 9.5 `payout_requests`

```sql
create table payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount numeric(10,2) not null,
  payment_method text not null default 'promptpay', -- promptpay, bank_transfer
  account_name text not null,
  account_no_masked text,
  promptpay_no_masked text,
  status text not null default 'requested', -- requested, processing, paid, rejected
  admin_note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
```

---

## 10. Commission Calculation Function

### 10.1 Commission Mapping

```ts
const COMMISSION_TABLE = {
  pro_monthly: 20,
  pro_yearly: 200,
  max_monthly: 50,
  max_yearly: 500,
  pro_yearly_early: 150,
  max_yearly_early: 350,
} as const;
```

### 10.2 Pseudo Logic

```ts
async function createCommissionAfterPayment(payment) {
  if (payment.status !== 'paid') return;

  const referral = await getReferralByReferredUser(payment.userId);
  if (!referral) return;

  if (referral.referrer_user_id === payment.userId) return;

  const amount = COMMISSION_TABLE[payment.plan_code];
  if (!amount) return;

  await insertCommission({
    referrer_user_id: referral.referrer_user_id,
    referred_user_id: payment.userId,
    referral_id: referral.id,
    payment_id: payment.id,
    plan_code: payment.plan_code,
    commission_amount: amount,
    commission_status: 'pending',
    hold_until: addDays(new Date(), 14),
  });

  await updateReferralStatus(referral.id, 'paid');
}
```

---

## 11. Fraud Prevention Rules

ต้องมีตั้งแต่เวอร์ชันแรกที่เริ่มจ่ายเงินจริง

1. ห้ามผู้ใช้ใช้ referral code ของตัวเอง
2. 1 user ใหม่รับ referral ได้ครั้งเดียว
3. Commission จ่ายเฉพาะ payment ที่สำเร็จจริง
4. หาก refund / chargeback → commission = canceled
5. Commission pending 14 วันก่อน approve
6. ถอนขั้นต่ำ 300 บาท
7. IP / device / payment source ซ้ำผิดปกติ → mark for review
8. ห้าม spam, หลอกลวง, โฆษณาเกินจริง
9. Admin สามารถ disable referral code ได้
10. Admin สามารถ hold payout ได้ถ้าพบความเสี่ยง

---

## 12. Analytics Events

ควรเพิ่ม event เพื่อวัดผล Affiliate

| Event | Metadata |
|---|---|
| `referral_link_clicked` | code, landing_page |
| `referral_signup_completed` | code, referred_user_id |
| `referral_payment_completed` | code, plan_code, amount |
| `commission_created` | commission_amount, plan_code |
| `commission_approved` | commission_id |
| `payout_requested` | amount |
| `payout_paid` | amount |

---

## 13. Development Roadmap

### Phase 1: Manual Referral

- เพิ่มช่อง referral code ตอนสมัคร/checkout
- เก็บข้อมูลใน Google Sheet หรือ DB แบบง่าย
- Admin ตรวจ payment และบันทึกคอมเอง
- จ่ายคอมผ่าน PromptPay

### Phase 2: Referral Link

- สร้าง `/ref/:code`
- เก็บ cookie/localStorage
- ผูก user ใหม่กับ referrer
- สร้าง commission หลัง payment สำเร็จ

### Phase 3: Partner Dashboard

- ผู้แนะนำดูยอดคลิก สมัคร จ่ายเงิน คอมมิชชัน
- ขอถอนเงินได้ในระบบ
- Admin อนุมัติ payout

### Phase 4: Full Affiliate System

- Auto commission approval
- Fraud check
- Partner tier
- Campaign tracking
- Export report

---

## 14. Acceptance Criteria

ระบบถือว่าผ่านเมื่อ:

- ผู้ใช้มี referral code ของตัวเองได้
- ลิงก์ `/ref/:code` ใช้งานได้
- สมัครผ่านลิงก์แล้วผูก referrer ถูกต้อง
- จ่าย Pro/Max แล้วสร้าง commission ถูกต้อง
- commission มีสถานะ pending/approved/paid/canceled
- ผู้แนะนำเห็นยอดใน dashboard ได้
- ถอนเงินได้เมื่อยอด approved >= 300 บาท
- Admin ตรวจและจ่าย payout ได้
- มี fraud rule พื้นฐานกัน self-referral และ duplicate referral

---

## 15. Recommendation สำหรับ Dev

เริ่มจาก Phase 1 ก่อน อย่าเพิ่งทำระบบซับซ้อนเต็มรูปแบบ เพราะเป้าหมายแรกคือทดสอบว่ามี Partner ช่วยขายได้จริงหรือไม่

ลำดับที่ควรทำทันที:

1. เพิ่ม plan yearly ในระบบ
2. เพิ่ม referral code field ใน checkout
3. เพิ่ม table `referral_codes`, `referrals`, `commissions`
4. สร้าง admin page ตรวจคอมเบื้องต้น
5. ค่อยเพิ่ม referral dashboard หลังเริ่มมี transaction จริง
