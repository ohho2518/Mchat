// EMVCo QR Code standard — PromptPay payload generator

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`
}

function crc16ccitt(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Accepts Thai mobile number (10 digits starting with 0) or 13-digit national ID
export function generatePromptPayPayload(phoneOrId: string, amount: number): string {
  const digits = phoneOrId.replace(/\D/g, '')
  const id = digits.length === 10 && digits[0] === '0'
    ? `0066${digits.slice(1)}`  // 0812345678 → 0066812345678
    : digits

  const merchantInfo = tlv('00', 'A000000677010111') + tlv('01', id)

  let payload = ''
  payload += tlv('00', '01')           // Payload format indicator
  payload += tlv('01', '12')           // Point of initiation: 12 = dynamic (one-time with amount)
  payload += tlv('29', merchantInfo)   // Merchant account (PromptPay)
  payload += tlv('53', '764')          // Currency: 764 = THB
  if (amount > 0) {
    payload += tlv('54', amount.toFixed(2))  // Transaction amount
  }
  payload += tlv('58', 'TH')           // Country code
  payload += '6304'                    // CRC tag placeholder

  return payload + crc16ccitt(payload)
}

// Format phone for display: 0812345678 → 081-234-5678
export function formatThaiPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return phone
}
