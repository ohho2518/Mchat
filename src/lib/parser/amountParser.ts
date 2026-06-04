// Thai word-digit mappings (longest first to avoid partial match)
const THAI_DIGIT_WORDS: Array<[string, number]> = [
  ['สิบเอ็ด', 11], ['สิบสอง', 12], ['สิบสาม', 13], ['สิบสี่', 14],
  ['สิบห้า', 15], ['สิบหก', 16], ['สิบเจ็ด', 17], ['สิบแปด', 18], ['สิบเก้า', 19],
  ['สิบ', 10], ['เก้า', 9], ['แปด', 8], ['เจ็ด', 7], ['หก', 6],
  ['ห้า', 5], ['สี่', 4], ['สาม', 3], ['สอง', 2], ['หนึ่ง', 1],
]

// multiplier units in descending order
const UNIT_MAP: Array<[string, number]> = [
  ['ล้าน', 1_000_000],
  ['แสน', 100_000],
  ['หมื่น', 10_000],
  ['พัน', 1_000],
]

function tryThaiWordAmount(text: string): number | null {
  for (const [unit, mult] of UNIT_MAP) {
    if (!text.includes(unit)) continue

    // "3พัน", "12 พัน"
    const digitMatch = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`))
    if (digitMatch) return parseFloat(digitMatch[1]) * mult

    // "สองพัน", "หนึ่งหมื่น"
    for (const [word, val] of THAI_DIGIT_WORDS) {
      if (text.includes(word + unit)) return val * mult
    }

    // bare unit with no digit/word before it ("ยืมพัน" = 1000)
    const idx = text.indexOf(unit)
    const before = text.slice(0, idx)
    if (!before.match(/[\d]$/) && !THAI_DIGIT_WORDS.some(([w]) => before.endsWith(w))) {
      return mult
    }
  }
  return null
}

export function extractAmount(text: string): number | null {
  // Strip date patterns that would cause false number matches
  const stripped = text
    .replace(/วันที่\s*\d{1,2}/g, ' ')
    .replace(/\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/g, ' ')  // DD/MM, DD/MM/YYYY
    .replace(/(\d),(\d{3})/g, '$1$2')

  // k/K shorthand: "2k", "1.5K", "2.5k บาท"
  const kMatch = stripped.match(/(\d+(?:\.\d+)?)\s*[kK](?:\s*บาท)?/)
  if (kMatch) {
    const n = parseFloat(kMatch[1])
    if (n > 0) return n * 1000
  }

  // Thai word numbers: สองพัน, หนึ่งหมื่น, 3พัน
  const wordAmt = tryThaiWordAmount(stripped)
  if (wordAmt !== null && wordAmt > 0) return wordAmt

  // Prefer number immediately before บาท/฿ (most unambiguous)
  const withBaht = stripped.match(/(\d+(?:\.\d+)?)\s*(?:บาท|฿)/)
  if (withBaht) {
    const n = parseFloat(withBaht[1])
    if (n > 0) return n
  }

  // Any remaining number
  const numMatch = stripped.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) {
    const n = parseFloat(numMatch[1])
    if (n > 0) return n
  }

  return null
}
