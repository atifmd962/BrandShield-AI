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

    if (!can(session.user.role, 'makeDecision')) {
      return NextResponse.json({ error: 'Only reviewers and admins can make decisions' }, { status: 403 })
    }

    const body = await request.json()
    const { action, comment } = body

    if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE, REJECT, or REQUEST_CHANGES' }, { status: 400 })
    }

    if ((action === 'REJECT' || action === 'REQUEST_CHANGES') && !comment?.trim()) {
      return NextResponse.json({ error: 'A comment is required when rejecting or requesting changes' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: { findings: true },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.status === 'DRAFT' || review.status === 'ANALYZING') {
      return NextResponse.json({ error: 'Review must be analyzed before a decision can be made' }, { status: 409 })
    }

    const newStatus =
      action === 'APPROVE'
        ? 'APPROVED'
        : action === 'REJECT'
        ? 'REJECTED'
        : 'CHANGES_REQUESTED'

    // Pre-compute next version number before transaction
    const nextVersion = await getNextVersion(id)

    // Save decision, update review status, and create revision snapshot in transaction
    const [decision] = await prisma.$transaction([
      prisma.reviewDecision.create({
        data: {
          reviewId: id,
          reviewerId: session.user.id,
          action,
          comment: comment?.trim() || null,
        },
      }),
      prisma.review.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.reviewRevision.create({
        data: {
          reviewId: id,
          versionNumber: nextVersion,
          content: review.content,
          findingsSnapshot: review.findings as unknown as object,
          decisionAction: action,
          decisionComment: comment?.trim() || null,
          reviewerName: session.user.name || session.user.email || null,
        },
      }),
    ])

    return NextResponse.json({ decision, status: newStatus })
  } catch (error) {
    console.error('POST /api/reviews/[id]/decision error:', error)
    return NextResponse.json({ error: 'Failed to save decision' }, { status: 500 })
  }
}

async function getNextVersion(reviewId: string): Promise<number> {
  const latest = await prisma.reviewRevision.findFirst({
    where: { reviewId },
    orderBy: { versionNumber: 'desc' },
  })
  return (latest?.versionNumber || 0) + 1
}
