import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_PREFIXES = [
  '/login',
  '/download',
  '/privacy-policy',
  '/terms',
  '/ref/',
  '/api/auth/',
  '/api/ref/',
  '/api/referral/terms',
]
// Note: /api/auth/ already covers /api/auth/verify-email

// S05: Admin IP allowlisting — set ADMIN_IP_ALLOWLIST env var (comma-separated)
function checkAdminAccess(req: NextRequest): boolean {
  const allowlist = process.env.ADMIN_IP_ALLOWLIST
  if (!allowlist) return true // not configured → allow (rely on session check)

  const ips = allowlist.split(',').map(s => s.trim()).filter(Boolean)
  if (ips.length === 0) return true

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  return ips.includes(ip)
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Admin IP gate (S05)
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (!checkAdminAccess(req)) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl

        // Public routes — no token required
        if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true

        // Everything else requires a valid session token
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  // Match all routes except Next.js internals + static files
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.json|sw\\.js).*)',
  ],
}
