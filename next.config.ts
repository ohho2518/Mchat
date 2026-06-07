import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  // Next.js needs 'unsafe-inline'; Omise.js loaded from CDN; 'unsafe-eval' for dev HMR only
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://static.omise.co`,
  // Tailwind + Google Fonts CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files
  "font-src 'self' https://fonts.gstatic.com",
  // blob: for resized slip images before OCR upload
  "img-src 'self' data: blob:",
  // Omise API + WebSocket
  "connect-src 'self' https://api.omise.co https://vault.omise.co wss://ws.omise.co",
  // Omise 3DS redirect iframe
  "frame-src https://secure.omise.co",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  // camera=() — file input camera doesn't need getUserMedia permission
  // microphone=(self) — Web Speech API for voice input
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(self), geolocation=()' },
  { key: 'Content-Security-Policy',  value: csp },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
