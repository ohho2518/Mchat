import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/utils/password'

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
        })
        if (!user?.passwordHash) return null

        const valid = await verifyPassword(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session: updateData }) {
      if (user) token.userId = user.id
      // Handle update() call from client — update name in JWT token
      if (trigger === 'update' && typeof updateData?.name === 'string') {
        token.name = updateData.name.trim().slice(0, 50)
      }
      return token
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      if (token.name)   session.user.name = token.name as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
