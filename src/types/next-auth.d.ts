import 'next-auth'
import 'next-auth/jwt'
import type { Plan } from '@/lib/features'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      plan: Plan
    }
  }
  interface User {
    id: string
    plan: Plan
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    plan?: Plan
  }
}
