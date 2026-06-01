const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙'

export function normalize(text: string): string {
  return text
    .trim()
    .replace(/[๐-๙]/g, (ch) => String(THAI_DIGITS.indexOf(ch)))
    .replace(/\s+/g, ' ')
}
