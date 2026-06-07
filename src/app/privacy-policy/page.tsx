export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-gray-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-xs text-gray-400">อัปเดตล่าสุด: มิถุนายน 2569 (Version 2026-06)</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">1. ข้อมูลที่เราเก็บรวบรวม</h2>
        <p>MChat เก็บข้อมูลต่อไปนี้เพื่อให้บริการ:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>ข้อมูลบัญชี:</strong> ชื่อ อีเมล รหัสผ่าน (เข้ารหัสด้วย scrypt)</li>
          <li><strong>ข้อมูลทางการเงิน:</strong> รายรับ รายจ่าย หมวดหมู่ จำนวนเงิน วันที่ ที่คุณบันทึกด้วยตนเอง</li>
          <li><strong>ข้อมูลสลิป OCR:</strong> ภาพสลิปที่คุณอัปโหลดเพื่ออ่านข้อมูล (ส่งไปยัง OpenAI API และไม่ถูกเก็บบนเซิร์ฟเวอร์ของเรา)</li>
          <li><strong>ข้อมูลการใช้งาน:</strong> หน้าที่เยี่ยมชม ฟีเจอร์ที่ใช้ เพื่อปรับปรุงผลิตภัณฑ์</li>
          <li><strong>ข้อมูลการชำระเงิน:</strong> จำนวนเงิน แผนที่เลือก วิธีชำระ (ไม่เก็บข้อมูลบัตรเครดิตโดยตรง)</li>
          <li><strong>ข้อมูลการอ้างอิง:</strong> รหัส Referral และข้อมูล Commission สำหรับโปรแกรมแนะนำเพื่อน</li>
          <li><strong>ข้อมูลทางเทคนิค:</strong> IP address, User-agent สำหรับความปลอดภัยและ rate limiting</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">2. วัตถุประสงค์การใช้ข้อมูล</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ให้บริการบันทึกรายรับรายจ่ายและ Dashboard สรุปยอด</li>
          <li>ประมวลผล OCR สลิปธนาคารและบิล</li>
          <li>ดำเนินการชำระเงินและจัดการ Subscription</li>
          <li>บริหารโปรแกรม Referral และ Commission</li>
          <li>ส่ง Notification และการแจ้งเตือนที่เกี่ยวข้องกับบัญชี</li>
          <li>ปรับปรุงและพัฒนาผลิตภัณฑ์</li>
          <li>ปฏิบัติตามกฎหมายที่เกี่ยวข้อง</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">3. การเปิดเผยข้อมูลต่อบุคคลที่สาม</h2>
        <p>เราเปิดเผยข้อมูลเฉพาะในกรณีต่อไปนี้:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>OpenAI:</strong> ภาพสลิปที่คุณอัปโหลดถูกส่งไปประมวลผล OCR ผ่าน OpenAI API ภายใต้นโยบายความเป็นส่วนตัวของ OpenAI</li>
          <li><strong>Omise:</strong> ข้อมูลการชำระเงินบัตรเครดิต/เดบิต ถูกจัดการโดย Omise ซึ่งเป็น Payment Gateway ที่ได้รับการรับรอง PCI-DSS</li>
          <li><strong>Supabase / Vercel:</strong> ผู้ให้บริการโครงสร้างพื้นฐาน (Infrastructure) ที่เก็บและประมวลผลข้อมูล</li>
          <li><strong>ตามกฎหมาย:</strong> เมื่อได้รับคำสั่งจากหน่วยงานราชการหรือศาล</li>
        </ul>
        <p>เราไม่ขายข้อมูลส่วนตัวของคุณให้กับบุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">4. การเก็บรักษาข้อมูล</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ข้อมูลบัญชีและรายการทางการเงิน: เก็บตลอดอายุการใช้งาน + 1 ปีหลังลบบัญชี</li>
          <li>Log การใช้งาน (AppEvent): เก็บ 90 วัน</li>
          <li>ข้อมูล OCR Correction: เก็บ 1 ปี</li>
          <li>Audit Log ของ Admin: เก็บ 2 ปี</li>
          <li>ภาพสลิปที่อัปโหลด: ไม่ถูกเก็บบน Server (ส่งไป OCR แล้วลบทันที)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">5. สิทธิ์ของเจ้าของข้อมูล (PDPA)</h2>
        <p>ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คุณมีสิทธิ์:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>สิทธิ์เข้าถึง:</strong> ขอดูข้อมูลส่วนตัวที่เราเก็บ</li>
          <li><strong>สิทธิ์แก้ไข:</strong> ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
          <li><strong>สิทธิ์ลบ:</strong> ขอลบบัญชีและข้อมูลทั้งหมด</li>
          <li><strong>สิทธิ์โอนย้าย:</strong> ขอ Export ข้อมูลในรูปแบบ CSV/JSON</li>
          <li><strong>สิทธิ์คัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลในบางกรณี</li>
          <li><strong>สิทธิ์ถอนความยินยอม:</strong> ถอน consent ที่เคยให้ไว้ได้ทุกเมื่อ</li>
        </ul>
        <p>ใช้สิทธิ์ได้ที่: <strong>support@mchat.app</strong> หรือผ่านหน้า Settings ในแอป</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">6. ความปลอดภัยของข้อมูล</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>รหัสผ่านเข้ารหัสด้วย scrypt (N=65536) ไม่มีทางถอดได้</li>
          <li>ข้อมูลทั้งหมดส่งผ่าน HTTPS/TLS</li>
          <li>ฐานข้อมูลป้องกันด้วย Row Level Security (Supabase RLS)</li>
          <li>บันทึก Audit Log ทุก Admin Action</li>
          <li>Rate limiting ป้องกัน brute force และ API abuse</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">7. ติดต่อเรา</h2>
        <p>หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการใช้สิทธิ์ตาม PDPA:</p>
        <ul className="list-disc pl-5">
          <li>อีเมล: <strong>support@mchat.app</strong></li>
        </ul>
        <p className="text-xs text-gray-400 mt-4">นโยบายนี้อาจมีการอัปเดต — วันที่มีผลจะแสดงที่ด้านบน</p>
      </section>
    </main>
  )
}
