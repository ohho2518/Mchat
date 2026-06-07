export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-gray-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">เงื่อนไขการใช้งาน</h1>
        <p className="text-xs text-gray-400">อัปเดตล่าสุด: มิถุนายน 2569 (Version 2026-06)</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">1. การยอมรับเงื่อนไข</h2>
        <p>การสมัครหรือใช้งาน MChat ถือว่าคุณยอมรับเงื่อนไขการใช้งานฉบับนี้ทุกข้อ หากไม่ยอมรับ กรุณาอย่าใช้งาน</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">2. บริการที่ให้</h2>
        <p>MChat ให้บริการ Web Application สำหรับ:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>บันทึกรายรับรายจ่ายผ่านข้อความภาษาไทย</li>
          <li>อ่านสลิปธนาคารด้วย AI (OCR)</li>
          <li>สรุปยอดและวิเคราะห์การเงินส่วนตัว</li>
          <li>โปรแกรม Referral สำหรับแนะนำเพื่อน</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">3. บัญชีผู้ใช้</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ผู้ใช้ต้องอายุ 18 ปีขึ้นไป หรือได้รับอนุญาตจากผู้ปกครอง</li>
          <li>ต้องให้ข้อมูลที่ถูกต้องตามความเป็นจริงในการสมัคร</li>
          <li>รับผิดชอบดูแลรักษารหัสผ่านและความปลอดภัยของบัญชีตนเอง</li>
          <li>แจ้งเราทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต</li>
          <li>1 อีเมล = 1 บัญชีเท่านั้น ห้ามสร้างบัญชีซ้อน</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">4. ข้อห้ามในการใช้งาน</h2>
        <p>ห้ามใช้ MChat เพื่อ:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>กิจกรรมที่ผิดกฎหมาย ฉ้อโกง หรือทำให้ผู้อื่นเสียหาย</li>
          <li>ฟอกเงินหรือบันทึกธุรกรรมทางการเงินที่ผิดกฎหมาย</li>
          <li>เข้าถึงข้อมูลของผู้ใช้อื่น</li>
          <li>โจมตีระบบ เช่น DDoS, SQL Injection, XSS</li>
          <li>Reverse engineer หรือ copy โค้ด/ระบบ</li>
          <li>ใช้ Bot หรือ script อัตโนมัติโดยไม่ได้รับอนุญาต</li>
          <li>Referral Fraud: สร้างหลายบัญชีเพื่อรับ Commission</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">5. แผนราคาและการชำระเงิน</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>แผน Free ใช้งานได้ฟรีโดยมีข้อจำกัดบางประการ</li>
          <li>แผน Pro / Max ต้องชำระค่าบริการตามที่กำหนด</li>
          <li>ชำระแล้วไม่สามารถขอคืนเงินได้ ยกเว้นกรณีที่เราพิจารณาเป็นรายกรณี</li>
          <li>เราขอสงวนสิทธิ์ปรับราคาโดยแจ้งล่วงหน้า 30 วัน</li>
          <li>เครดิต OCR ที่ซื้อแล้วไม่มีวันหมดอายุและไม่สามารถขอคืนเงินได้</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">6. โปรแกรม Referral</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Commission จะถูกพักไว้ 14 วันก่อนอนุมัติ เพื่อป้องกันการคืนเงิน</li>
          <li>ห้าม Refer ตัวเอง — หากตรวจพบจะยกเลิก Commission ทั้งหมด</li>
          <li>เราขอสงวนสิทธิ์ระงับบัญชีที่พบ Referral Fraud</li>
          <li>อัตรา Commission อาจเปลี่ยนแปลงโดยแจ้งล่วงหน้า</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">7. ความรับผิดชอบ</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>MChat ให้บริการ "ตามสภาพที่เป็น" (As-Is) ไม่รับประกันความสมบูรณ์ 100%</li>
          <li>ข้อมูลทางการเงินในแอปเป็นความรับผิดชอบของผู้ใช้ เราไม่ใช่ที่ปรึกษาทางการเงิน</li>
          <li>เราไม่รับผิดชอบต่อความสูญเสียที่เกิดจากการใช้ข้อมูลในแอป</li>
          <li>ในกรณีบริการหยุดชะงัก เราจะแจ้งและพยายามแก้ไขโดยเร็วที่สุด</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">8. การระงับบัญชี</h2>
        <p>เราขอสงวนสิทธิ์ระงับหรือลบบัญชีในกรณี:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>ละเมิดเงื่อนไขการใช้งาน</li>
          <li>มีกิจกรรมที่ผิดกฎหมายหรือน่าสงสัย</li>
          <li>ไม่ชำระค่าบริการ</li>
          <li>ได้รับคำสั่งจากหน่วยงานกฎหมาย</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">9. กฎหมายที่ใช้บังคับ</h2>
        <p>เงื่อนไขการใช้งานนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใด ๆ ให้อยู่ภายใต้เขตอำนาจศาลไทย</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">10. ติดต่อเรา</h2>
        <p>อีเมล: <strong>support@mchat.app</strong></p>
        <p className="text-xs text-gray-400 mt-4">เงื่อนไขนี้อาจมีการอัปเดต — วันที่มีผลจะแสดงที่ด้านบน</p>
      </section>
    </main>
  )
}
