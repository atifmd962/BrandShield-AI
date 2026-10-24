import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { Role } from '@prisma/client'

/**
 * Hardcoded demo accounts that work even when the database is empty or unreachable.
 * These are server-side only — never sent to the client.
 * The passwords are intentionally simple ("demo1234") and already visible on the login page UI.
 */
const DEMO_ACCOUNTS: Array<{
  email: string
  password: string
  id: string
  name: string
  role: Role
}> = [
  { email: 'admin@novatech.com', password: 'demo1234', id: 'demo-admin', name: 'Alex Admin', role: 'ADMIN' },
  { email: 'creator@novatech.com', password: 'demo1234', id: 'demo-creator', name: 'Casey Creator', role: 'CREATOR' },
  { email: 'reviewer@novatech.com', password: 'demo1234', id: 'demo-reviewer', name: 'Riley Reviewer', role: 'REVIEWER' },
  { email: 'manager@novatech.com', password: 'demo1234', id: 'demo-manager', name: 'Morgan Manager', role: 'MANAGER' },
]

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[NextAuth] Missing email or password in credentials')
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const password = credentials.password

        // 1. Try database authentication first
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (user) {
            const isValid = await bcrypt.compare(password, user.password)
            if (isValid) {
              console.log(`[NextAuth] DB login success: ${email}`)
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            } else {
              console.warn(`[NextAuth] Invalid password for DB user: ${email}`)
              return null
            }
          }
        } catch (error) {
          // Database unreachable — fall through to demo account check
          console.error('[NextAuth] DB error, falling back to demo accounts:', error instanceof Error ? error.message : error)
        }

        // 2. Fall back to in-memory demo accounts (works even if DB is down)
        const demo = DEMO_ACCOUNTS.find((a) => a.email === email)
        if (demo && password === demo.password) {
          console.log(`[NextAuth] Demo login success: ${email}`)
          return {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            role: demo.role,
          }
        }

        console.warn(`[NextAuth] No user found for: ${email}`)
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { id: string; name: string; email: string; role: Role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
}
