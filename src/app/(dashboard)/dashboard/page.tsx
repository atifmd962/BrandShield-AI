import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { Badge, getReviewStatusVariant } from '@/components/ui/Badge'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  DRAFT:             'Draft',
  ANALYZING:         'Analyzing',
  ANALYZED:          'Analyzed',
  APPROVED:          'Approved',
  REJECTED:          'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const role = session.user.role
  const isViewAll = ['ADMIN', 'REVIEWER', 'MANAGER'].includes(role)
  const userId = session.user.id

  const whereReview = isViewAll ? {} : { submittedById: userId }

  const [reviewStats, findingStats, docCount, recentReviews] = await Promise.all([
    prisma.review.groupBy({ by: ['status'], _count: { status: true }, where: whereReview }),
    prisma.finding.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.brandDocument.count(),
    prisma.review.findMany({
      where: whereReview,
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        submittedBy: { select: { name: true } },
        findings:    { select: { status: true } },
        decisions:   { orderBy: { createdAt: 'desc' }, take: 1, select: { action: true } },
      },
    }),
  ])

  const getCount = (arr: { status: string; _count: { status: number } }[], s: string) =>
    arr.find((x) => x.status === s)?._count?.status ?? 0

  const getFindingCount = (arr: { status: string; _count: { status: number } }[], s: string) =>
    arr.find((x) => x.status === s)?._count?.status ?? 0

  const totalReviews = reviewStats.reduce((sum, s) => sum + s._count.status, 0)

  const statCards = [
    { label: 'Brand Documents',    value: docCount,                                               color: 'text-slate-700',  bg: 'bg-slate-50'   },
    { label: 'Total Reviews',      value: totalReviews,                                           color: 'text-slate-700',  bg: 'bg-slate-50'   },
    { label: 'Pending',            value: getCount(reviewStats,'DRAFT') + getCount(reviewStats,'ANALYZED'), color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved',           value: getCount(reviewStats,'APPROVED'),                        color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Rejected',           value: getCount(reviewStats,'REJECTED'),                        color: 'text-red-600',    bg: 'bg-red-50'     },
    { label: 'Changes Requested',  value: getCount(reviewStats,'CHANGES_REQUESTED'),               color: 'text-amber-600',  bg: 'bg-amber-50'   },
    { label: 'Supported Claims',   value: getFindingCount(findingStats,'SUPPORTED'),               color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Unverified Claims',  value: getFindingCount(findingStats,'UNVERIFIED'),              color: 'text-amber-600',  bg: 'bg-amber-50'   },
    { label: 'Contradicted Claims',value: getFindingCount(findingStats,'CONTRADICTED'),            color: 'text-red-600',    bg: 'bg-red-50'     },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back,{' '}
          <span className="font-medium text-slate-700">{session.user.name}</span>
          {' '}— {role.charAt(0) + role.slice(1).toLowerCase()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-slate-200 rounded-xl p-5`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {['ADMIN', 'CREATOR'].includes(role) && (
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/reviews/new"
            id="dashboard-new-review-btn"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Review
          </Link>
          {role === 'ADMIN' && (
            <Link
              href="/documents"
              className="border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Upload Document
            </Link>
          )}
        </div>
      )}

      {/* Recent reviews */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent Reviews</h2>
          <Link href="/reviews" className="text-blue-600 text-sm hover:text-blue-700 transition-colors">
            View all →
          </Link>
        </div>
        {recentReviews.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No reviews yet.{' '}
            {['ADMIN', 'CREATOR'].includes(role) && (
              <Link href="/reviews/new" className="text-blue-600 hover:underline">
                Submit your first review
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentReviews.map((review) => {
              const supported    = review.findings.filter((f) => f.status === 'SUPPORTED').length
              const unverified   = review.findings.filter((f) => f.status === 'UNVERIFIED').length
              const contradicted = review.findings.filter((f) => f.status === 'CONTRADICTED').length
              return (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  id={`dashboard-review-${review.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{review.campaignName}</p>
                    <p className="text-xs text-slate-500">
                      {review.product} · {review.submittedBy.name}
                    </p>
                    {review.findings.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {supported > 0 && <span className="text-emerald-600">{supported} supported</span>}
                        {supported > 0 && (unverified > 0 || contradicted > 0) && ' · '}
                        {unverified > 0 && <span className="text-amber-600">{unverified} unverified</span>}
                        {unverified > 0 && contradicted > 0 && ' · '}
                        {contradicted > 0 && <span className="text-red-600">{contradicted} contradicted</span>}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Badge variant={getReviewStatusVariant(review.status)}>
                      {STATUS_LABEL[review.status] || review.status}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
