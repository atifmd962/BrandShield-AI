import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth v4 handler for Next.js App Router
// Must be a function — not the raw handler object — to work with App Router route segments
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
