import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'
import { runAnalysis } from '@/lib/analysis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role, 'submitReview')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis is not configured. Please set GEMINI_API_KEY in your environment.' },
        { status: 503 }
      )
    }

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!can(session.user.role, 'viewAllReviews') && review.submittedById !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (review.status === 'ANALYZING') {
      return NextResponse.json({ error: 'Analysis already in progress' }, { status: 409 })
    }

    // Delete previous findings if re-analyzing
    await prisma.finding.deleteMany({ where: { reviewId: id } })

    // Run analysis (synchronous for Vercel serverless)
    await runAnalysis(id)

    const updatedReview = await prisma.review.findUnique({
      where: { id },
      include: { findings: true },
    })

    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    console.error('POST /api/reviews/[id]/analyze error:', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
