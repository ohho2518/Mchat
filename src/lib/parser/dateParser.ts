import { format, subDays, addDays } from 'date-fns'

// Phase 3: extract YYYY-MM-DD date from normalized Thai text

const THAI_MONTHS_LONG: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
}

const THAI_MONTHS_SHORT: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
  'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
  'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
}

function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function extractDate(text: string): string | null {
  const today = new Date()

  // วันนี้
  if (/วันนี้/.test(text)) return fmt(today)
  // เมื่อวาน / เมื่อวานนี้
  if (/เมื่อวาน/.test(text)) return fmt(subDays(today, 1))
  // พรุ่งนี้
  if (/พรุ่งนี้/.test(text)) return fmt(addDays(today, 1))

  // DD/MM/YYYY หรือ DD-MM-YYYY (รองรับ พ.ศ. — ถ้าปี > 2400 ให้ลบ 543)
  const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (dmy) {
    let year = parseInt(dmy[3])
    if (year > 2400) year -= 543          // Buddhist era full year (e.g. 2567 → 2024)
    else if (year < 100) {
      // 2-digit year: Thai receipts use BE short form e.g. "67" = BE 2567 = CE 2024
      const candidateCE    = year + 2000
      const candidateThai  = (2500 + year) - 543  // BE short → CE
      // If CE interpretation is > 1 year in future, it's likely a Thai BE short year
      year = candidateCE > today.getFullYear() + 1 ? candidateThai : candidateCE
    }
    const month = parseInt(dmy[2])
    const day   = parseInt(dmy[1])
    const d = new Date(year, month - 1, day)
    if (!isNaN(d.getTime())) return fmt(d)
  }

  // วันที่ X (ของเดือนปัจจุบัน)
  const dayNum = text.match(/วันที่\s*(\d{1,2})/)
  if (dayNum) {
    const day = parseInt(dayNum[1])
    const d = new Date(today.getFullYear(), today.getMonth(), day)
    if (!isNaN(d.getTime()) && day >= 1 && day <= 31) return fmt(d)
  }

  // X <ชื่อเดือน> [YYYY]
  for (const [name, month] of Object.entries(THAI_MONTHS_LONG)) {
    const re = new RegExp(`(\\d{1,2})\\s*${name}(?:\\s*(\\d{4}))?`)
    const m = text.match(re)
    if (m) {
      let year = m[2] ? parseInt(m[2]) : today.getFullYear()
      if (year > 2400) year -= 543
      const d = new Date(year, month - 1, parseInt(m[1]))
      if (!isNaN(d.getTime())) return fmt(d)
    }
  }

  for (const [name, month] of Object.entries(THAI_MONTHS_SHORT)) {
    const re = new RegExp(`(\\d{1,2})\\s*${name.replace('.', '\\.')}(?:\\s*(\\d{4}))?`)
    const m = text.match(re)
    if (m) {
      let year = m[2] ? parseInt(m[2]) : today.getFullYear()
      if (year > 2400) year -= 543
      const d = new Date(year, month - 1, parseInt(m[1]))
      if (!isNaN(d.getTime())) return fmt(d)
    }
  }

  return null
}
