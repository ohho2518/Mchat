// Phase 3: extract numeric amount from normalized Thai text

export function extractAmount(text: string): number | null {
  // Remove commas used as thousands separators
  const cleaned = text.replace(/(\d),(\d{3})/g, '$1$2')

  // k/K shorthand (e.g. "1.5k", "2k บาท") — check before plain number
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK](?:\s*บาท)?/)
  if (kMatch) {
    const n = parseFloat(kMatch[1])
    if (n > 0) return n * 1000
  }

  // Plain number with optional บาท/฿ suffix
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)(?:\s*บาท|\s*฿)?/)
  if (numMatch) {
    const n = parseFloat(numMatch[1])
    if (n > 0) return n
  }

  return null
}
