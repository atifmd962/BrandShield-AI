import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'

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

    if (!can(session.user.role, 'reviseContent')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content?.trim() || content.trim().length < 10) {
      return NextResponse.json({ error: 'Revised content must be at least 10 characters' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!can(session.user.role, 'viewAllReviews') && review.submittedById !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (review.status !== 'CHANGES_REQUESTED') {
      return NextResponse.json(
        { error: 'Content can only be revised when changes have been requested' },
        { status: 409 }
      )
    }

    // Delete old findings, update content and reset to DRAFT for re-analysis
    await prisma.finding.deleteMany({ where: { reviewId: id } })

    const updated = await prisma.review.update({
      where: { id },
      data: { content: content.trim(), status: 'DRAFT' },
    })

    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error('POST /api/reviews/[id]/revise error:', error)
    return NextResponse.json({ error: 'Failed to save revision' }, { status: 500 })
  }
}
