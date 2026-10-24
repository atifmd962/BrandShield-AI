import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health-check endpoint for diagnosing Vercel deployment issues.
 * Reports whether critical environment variables and database connectivity are working.
 * Does NOT expose any secret values — only reports presence/absence.
 */
export async function GET() {
  const checks: Record<string, string> = {}

  // Check environment variables (presence only — never expose values)
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING'
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ? 'SET' : 'MISSING (auto-detected by Vercel)'
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'SET' : 'MISSING'
  checks.GEMINI_API_KEY = process.env.GEMINI_API_KEY ? 'SET' : 'MISSING'
  checks.NODE_ENV = process.env.NODE_ENV ?? 'undefined'

  // Check database connectivity
  try {
    const userCount = await prisma.user.count()
    checks.database = `CONNECTED (${userCount} users)`
  } catch (error) {
    checks.database = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  const allOk =
    checks.NEXTAUTH_SECRET === 'SET' &&
    checks.DATABASE_URL === 'SET' &&
    checks.database.startsWith('CONNECTED')

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'unhealthy', checks },
    { status: allOk ? 200 : 503 }
  )
}
