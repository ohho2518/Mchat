// สร้าง PNG icons สำหรับ PWA โดยใช้ zlib built-in (ไม่ต้องติดตั้ง package เพิ่ม)
import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

function createPNG(size, r, g, b) {
  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // Pixel data: filter byte (0) + RGB per row
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    const off = y * rowSize
    raw[off] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const px = off + 1 + x * 3
      raw[px] = r; raw[px + 1] = g; raw[px + 2] = b
    }
  }

  const compressed = deflateSync(raw, { level: 9 })

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32BE(data.length)
    const crcInput = Buffer.concat([typeBuf, data])
    const crc = crc32(crcInput)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc >>> 0)
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// CRC32
function crc32(buf) {
  let crc = 0xFFFFFFFF
  const table = makeCrcTable()
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF)
}
function makeCrcTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
}

// สีน้ำเงิน #2563EB = rgb(37, 99, 235)
const R = 37, G = 99, B = 235

writeFileSync('public/icons/icon-192.png', createPNG(192, R, G, B))
writeFileSync('public/icons/icon-512.png', createPNG(512, R, G, B))
writeFileSync('public/icons/icon-180.png', createPNG(180, R, G, B))
console.log('✅ PNG icons generated')
