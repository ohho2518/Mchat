-- ============================================================================
-- MChat — Enable Row Level Security (RLS) on all tables
-- ============================================================================
-- วัตถุประสงค์: ปิดการเข้าถึงตารางผ่าน Supabase auto-API (PostgREST / anon key)
-- MChat ใช้ Prisma ต่อผ่าน pooler ด้วย role `postgres` (table owner) ซึ่ง *bypass RLS*
-- → เปิด RLS แบบไม่มี policy = deny ทุก request จาก anon/public แต่ Prisma ยังทำงานปกติ
--
-- ⚠️ ใช้ ENABLE (ไม่ใช่ FORCE) เจตนา — FORCE จะบังคับ RLS กับ owner ด้วย → Prisma พัง
-- ⚠️ รันใน Supabase Dashboard → SQL Editor (ต่อเป็น postgres/owner)
-- ⚠️ หลังรัน: ทดสอบแอปทันที (login, /chat บันทึกรายการ, /dashboard) — ถ้าพังให้ rollback ด้านล่าง
-- ============================================================================

ALTER TABLE "User"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserConsent"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CategoryKeyword" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MerchantProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppEvent"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OcrCorrection"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debt"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageQuota"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReferralCode"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayoutRequest"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSetting"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"        ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ตรวจสอบ: ควรได้ rowsecurity = true ทุกตาราง
-- ============================================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- ROLLBACK (ถ้าแอปพังหลังเปิด RLS) — uncomment แล้วรัน
-- ============================================================================
-- ALTER TABLE "User"            DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "UserConsent"     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Account"         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Category"        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "CategoryKeyword" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "MerchantProfile" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Transaction"     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AppEvent"        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Feedback"        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "OcrCorrection"   DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Transfer"        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Debt"            DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "UsageQuota"      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ReferralCode"    DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Referral"        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Commission"      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "PayoutRequest"   DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Payment"         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "SiteSetting"     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "RateLimit"       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AuditLog"        DISABLE ROW LEVEL SECURITY;
