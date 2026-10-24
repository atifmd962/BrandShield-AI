'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingPage } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

interface Revision {
  id: string
  reviewId: string
  versionNumber: number
  content: string
  findingsSnapshot: unknown
  decisionAction: string | null
  decisionComment: string | null
  reviewerName: string | null
  createdAt: string
}

interface ReviewWithRevisions {
  id: string
  campaignName: string
  product: string
  revisions: Revision[]
}

function decisionVariant(action: string | null): 'approved' | 'rejected' | 'changes' | 'default' {
  switch (action) {
    case 'APPROVE':         return 'approved'
    case 'REJECT':          return 'rejected'
    case 'REQUEST_CHANGES': return 'changes'
    default:                return 'default'
  }
}

function decisionLabel(action: string | null): string {
  switch (action) {
    case 'APPROVE':         return '✓ Approved'
    case 'REJECT':          return '✕ Rejected'
    case 'REQUEST_CHANGES': return '↩ Changes Requested'
    default:                return 'Pending Decision'
  }
}

export default function HistoryContent() {
  const searchParams = useSearchParams()
  const filterReviewId = searchParams.get('reviewId')
  const [reviews, setReviews] = useState<ReviewWithRevisions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const reviewsToFetch = filterReviewId
        ? data.reviews.filter((r: { id: string }) => r.id === filterReviewId)
        : data.reviews.filter((r: { _count?: { revisions: number } }) => (r as any)._count?.revisions > 0)

      const reviewsWithRevisions: ReviewWithRevisions[] = []

      for (const review of reviewsToFetch) {
        const detailRes = await fetch(`/api/reviews/${review.id}`)
        const detailData = await detailRes.json()
        if (detailRes.ok && detailData.review?.revisions?.length > 0) {
          reviewsWithRevisions.push(detailData.review)
        }
      }

      setReviews(reviewsWithRevisions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [filterReviewId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingPage message="Loading revision history…" />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Revision History</h1>
        <p className="text-slate-500 text-sm mt-1">
          Timeline of all content versions, decisions, and reviewer comments
        </p>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {reviews.length === 0 ? (
        <EmptyState
          title="No revision history yet"
          description="Revision history is created when a reviewer requests changes and the creator submits a revised version."
          action={
            <Link href="/reviews" className="text-blue-600 text-sm hover:underline">
              Go to Reviews →
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <Card key={review.id} padding={false}>
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">{review.campaignName}</h2>
                    <p className="text-xs text-slate-500">{review.product}</p>
                  </div>
                  <Link href={`/reviews/${review.id}`} className="text-xs text-blue-600 hover:text-blue-700">
                    View Review →
                  </Link>
                </div>
              </div>

              {/* Timeline */}
              <div className="px-6 py-4">
                <div className="relative">
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />

                  <div className="space-y-6">
                    {review.revisions.map((revision) => (
                      <div key={revision.id} className="relative pl-10">
                        {/* Version dot */}
                        <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          revision.decisionAction === 'APPROVE'
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                            : revision.decisionAction === 'REJECT'
                            ? 'bg-red-100 border-red-400 text-red-700'
                            : revision.decisionAction === 'REQUEST_CHANGES'
                            ? 'bg-amber-100 border-amber-400 text-amber-700'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}>
                          {revision.versionNumber}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                Version {revision.versionNumber}
                              </span>
                              {revision.decisionAction && (
                                <Badge variant={decisionVariant(revision.decisionAction)}>
                                  {decisionLabel(revision.decisionAction)}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                {new Date(revision.createdAt).toLocaleDateString()}{' '}
                                {new Date(revision.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {revision.reviewerName && (
                                <p className="text-xs text-slate-400">Reviewed by {revision.reviewerName}</p>
                              )}
                            </div>
                          </div>

                          {revision.decisionComment && (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Reviewer Comment</p>
                              <p className="text-sm text-slate-700">"{revision.decisionComment}"</p>
                            </div>
                          )}

                          <button
                            onClick={() => setExpandedRevision(
                              expandedRevision === revision.id ? null : revision.id
                            )}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {expandedRevision === revision.id ? 'Hide content ▲' : 'Show content ▼'}
                          </button>

                          {expandedRevision === revision.id && (
                            <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Content at this version</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{revision.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
