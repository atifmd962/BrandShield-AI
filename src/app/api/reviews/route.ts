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

    const canViewAll = can(session.user.role, 'viewAllReviews')

    const reviews = await prisma.review.findMany({
      where: canViewAll ? {} : { submittedById: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        findings: { select: { id: true, status: true, severity: true } },
        decisions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { reviewer: { select: { name: true } } },
        },
        _count: { select: { revisions: true } },
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role, 'submitReview')) {
      return NextResponse.json({ error: 'You do not have permission to submit reviews' }, { status: 403 })
    }

    const body = await request.json()
    const { campaignName, product, content } = body

    if (!campaignName?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }
    if (!product?.trim()) {
      return NextResponse.json({ error: 'Product/service is required' }, { status: 400 })
    }
    if (!content?.trim() || content.trim().length < 10) {
      return NextResponse.json({ error: 'Promotional content must be at least 10 characters' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        campaignName: campaignName.trim(),
        product: product.trim(),
        content: content.trim(),
        status: 'DRAFT',
        submittedById: session.user.id,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
