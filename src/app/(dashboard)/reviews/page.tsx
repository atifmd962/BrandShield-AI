'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Badge, getReviewStatusVariant } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingPage } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

interface ReviewSummary {
  id: string
  campaignName: string
  product: string
  status: string
  createdAt: string
  submittedBy: { name: string }
  findings: { status: string; severity: string }[]
  decisions: { action: string; reviewer: { name: string } }[]
  _count: { revisions: number }
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:             'Draft',
  ANALYZING:         'Analyzing',
  ANALYZED:          'Awaiting Review',
  APPROVED:          'Approved',
  REJECTED:          'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
}

const STATUS_FILTERS = ['All', 'DRAFT', 'ANALYZING', 'ANALYZED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<ReviewSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviews(data.reviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const filtered = filter === 'All' ? reviews : reviews.filter((r) => r.status === filter)

  if (loading) return <LoadingPage message="Loading reviews…" />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">
            {session?.user && ['ADMIN','REVIEWER','MANAGER'].includes(session.user.role)
              ? 'All submitted reviews'
              : 'Your submitted reviews'}
          </p>
        </div>
        {session?.user && ['ADMIN','CREATOR'].includes(session.user.role) && (
          <Link
            href="/reviews/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Review
          </Link>
        )}
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {s === 'All' ? 'All' : STATUS_LABEL[s] || s}
            {s !== 'All' && (
              <span className="ml-1.5 text-slate-400">
                {reviews.filter((r) => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No reviews found"
            description={
              filter !== 'All'
                ? `No reviews with status "${STATUS_LABEL[filter] || filter}".`
                : session?.user && ['ADMIN','CREATOR'].includes(session.user.role)
                  ? 'Submit your first review to get started.'
                  : 'No reviews have been submitted yet.'
            }
            action={
              session?.user && ['ADMIN','CREATOR'].includes(session.user.role) ? (
                <Link
                  href="/reviews/new"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  + New Review
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((review) => {
              const supported    = review.findings.filter((f) => f.status === 'SUPPORTED').length
              const unverified   = review.findings.filter((f) => f.status === 'UNVERIFIED').length
              const contradicted = review.findings.filter((f) => f.status === 'CONTRADICTED').length
              return (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  id={`review-item-${review.id}`}
                  className="flex items-start justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{review.campaignName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {review.product} · {review.submittedBy.name} ·{' '}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {review.findings.length > 0 && (
                      <p className="text-xs mt-1 space-x-1">
                        {supported > 0 && <span className="text-emerald-600">{supported} supported</span>}
                        {unverified > 0 && <span className="text-amber-600">{unverified} unverified</span>}
                        {contradicted > 0 && <span className="text-red-600">{contradicted} contradicted</span>}
                      </p>
                    )}
                    {review.decisions[0] && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Decision by {review.decisions[0].reviewer.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={getReviewStatusVariant(review.status)}>
                      {STATUS_LABEL[review.status] || review.status}
                    </Badge>
                    {review._count.revisions > 0 && (
                      <span className="text-xs text-slate-400">{review._count.revisions} revision{review._count.revisions !== 1 ? 's' : ''}</span>
                    )}
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
