// สร้าง PWA icons เป็น SVG (รองรับ modern browsers)
import { writeFileSync } from 'fs'

function makeSvg(size) {
  const r = Math.round(size * 0.15)
  const fontSize = Math.round(size * 0.42)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2563EB"/>
  <text x="50%" y="54%" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`
}

writeFileSync('public/icons/icon-192.svg', makeSvg(192))
writeFileSync('public/icons/icon-512.svg', makeSvg(512))
writeFileSync('public/icons/icon-180.svg', makeSvg(180))
console.log('✅ Icons generated')
