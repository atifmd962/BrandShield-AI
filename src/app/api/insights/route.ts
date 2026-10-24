import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role, 'viewInsights')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const [reviewStats, findingStats, issueCategoryStats, recentDecisions] = await Promise.all([
      // Review status breakdown
      prisma.review.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Claim status breakdown
      prisma.finding.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Most common issue categories
      prisma.finding.groupBy({
        by: ['issueCategory'],
        _count: { issueCategory: true },
        orderBy: { _count: { issueCategory: 'desc' } },
        take: 5,
      }),
      // Recent decisions
      prisma.reviewDecision.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          reviewer: { select: { name: true, role: true } },
          review: { select: { campaignName: true, product: true } },
        },
      }),
    ])

    const totalDocuments = await prisma.brandDocument.count()
    const totalPassages = await prisma.passage.count()

    return NextResponse.json({
      reviewStats,
      findingStats,
      issueCategoryStats,
      recentDecisions,
      totalDocuments,
      totalPassages,
    })
  } catch (error) {
    console.error('GET /api/insights error:', error)
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}
