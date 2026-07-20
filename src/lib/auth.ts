import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/utils/password'
import type { Plan } from '@/lib/features'
import { effectivePlan } from '@/lib/features'

// refresh plan จาก DB อย่างมากทุก 60 วินาที (กัน DB read ทุก request)
const PLAN_SYNC_INTERVAL_MS = 60_000

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'อีเมล', type: 'email' },
        password: { label: 'รหัสผ่าน', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, name: true, email: true, passwordHash: true, plan: true },
        })
        if (!user?.passwordHash) return null

        const valid = await verifyPassword(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, plan: user.plan as Plan }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.userId = user.id
        token.plan   = user.plan as Plan
      }
      if (trigger === 'update' && typeof updateData?.name === 'string') {
        token.name = updateData.name.trim().slice(0, 50)
      }

      // read-time plan refresh — คำนวณ effective plan จาก DB (ลด plan ที่หมดอายุ + สะท้อนการอัปเกรด)
      // throttle 60s + login (user) เพื่อไม่ query ทุก request · DB ล่ม → คงค่าเดิมไว้
      const now = Date.now()
      const stale = now - (token.planSyncedAt ?? 0) > PLAN_SYNC_INTERVAL_MS
      if (token.userId && (user || stale)) {
        try {
          const u = await prisma.user.findUnique({
            where:  { id: token.userId as string },
            select: { plan: true, planExpiresAt: true, stripeSubscriptionId: true, subscriptionStatus: true },
          })
          if (u) {
            token.plan = effectivePlan(u.plan as Plan, u.planExpiresAt, u.stripeSubscriptionId, u.subscriptionStatus)
            token.planSyncedAt = now
          }
        } catch { /* DB blip — คงค่า token.plan เดิมไว้ */ }
      }
      return token
    },
    session({ session, token }) {
      if (token.userId) session.user.id   = token.userId as string
      if (token.name)   session.user.name = token.name as string
      session.user.plan = (token.plan ?? 'free') as Plan
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
