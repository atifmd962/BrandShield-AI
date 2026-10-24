import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        findings: { orderBy: { createdAt: 'asc' } },
        decisions: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { id: true, name: true, email: true, role: true } } },
        },
        revisions: { orderBy: { versionNumber: 'asc' } },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check access: CREATOR can only see their own reviews
    if (
      !can(session.user.role, 'viewAllReviews') &&
      review.submittedById !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('GET /api/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 })
  }
}
