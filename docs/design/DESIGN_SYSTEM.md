# MChat — Design System

## Design Tokens

### Colors
```css
/* รายรับ */
--color-income:     #16A34A;   /* green-600 */
--color-income-bg:  #DCFCE7;   /* green-100 */

/* รายจ่าย */
--color-expense:    #DC2626;   /* red-600 */
--color-expense-bg: #FEE2E2;   /* red-100 */

/* คงเหลือ */
--color-balance:    #2563EB;   /* blue-600 */
--color-balance-bg: #DBEAFE;   /* blue-100 */

/* โอนเงิน */
--color-transfer:   #D97706;   /* amber-600 */

/* หนี้ */
--color-debt:       #7C3AED;   /* violet-600 */

/* Neutral */
--color-bg:         #F9FAFB;
--color-surface:    #FFFFFF;
--color-border:     #E5E7EB;
--color-text:       #111827;
--color-text-muted: #6B7280;
```

### Typography
```css
--font-thai: 'Sarabun', 'Prompt', sans-serif;
--text-xs:   12px;
--text-sm:   14px;
--text-base: 16px;
--text-lg:   18px;
--text-xl:   20px;
--text-2xl:  24px;
--text-3xl:  30px;
```

### Spacing & Radius
```css
--radius-sm:   6px;
--radius-md:  12px;
--radius-lg:  16px;
--radius-full: 9999px;
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 6px rgba(0,0,0,0.07);
```

---

## Components

| Component | File | Variants |
|---|---|---|
| Button | `ui/Button.tsx` | primary, secondary, ghost, danger |
| Card | `ui/Card.tsx` | default, income, expense, balance |
| Input | `ui/Input.tsx` | text, number, date, textarea |
| Badge | `ui/Badge.tsx` | income, expense, transfer, debt |
| Modal | `ui/Modal.tsx` | sm, md, lg |
| Spinner | `ui/Spinner.tsx` | sm, md |
| EmptyState | `ui/EmptyState.tsx` | — |
| ErrorState | `ui/ErrorState.tsx` | — |
| ConfirmDialog | `ui/ConfirmDialog.tsx` | — |

---

## Layout

```
AppShell
├── Header (56px mobile / 64px desktop)
├── Main Content (scroll)
└── BottomNav (56px mobile)
    ├── บันทึก
    ├── รายงาน
    ├── รายการ
    └── ตั้งค่า
```
