'use client'
import { use,useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge, getClaimStatusVariant, getSeverityVariant, getReviewStatusVariant } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Spinner, LoadingPage } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

interface Finding {
  id: string
  claim: string
  issueCategory: string
  status: string
  severity: string
  explanation: string
  evidence: string | null
  sourceDocument: string | null
  sourcePage: string | null
  suggestedCorrection: string | null
}

interface Decision {
  id: string
  action: string
  comment: string | null
  createdAt: string
  reviewer: { name: string; role: string }
}

interface Review {
  id: string
  campaignName: string
  product: string
  content: string
  status: string
  createdAt: string
  submittedBy: { name: string; email: string; role: string }
  findings: Finding[]
  decisions: Decision[]
  revisions: { id: string; versionNumber: number; createdAt: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:             'Draft',
  ANALYZING:         'Analyzing',
  ANALYZED:          'Awaiting Review',
  APPROVED:          'Approved',
  REJECTED:          'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [expanded, setExpanded] = useState(true)

  const borderColor: Record<string, string> = {
    SUPPORTED:    'border-l-emerald-500',
    UNVERIFIED:   'border-l-amber-500',
    CONTRADICTED: 'border-l-red-500',
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 ${borderColor[finding.status] || 'border-l-slate-300'} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
        aria-expanded={expanded}
        id={`finding-${finding.id}-toggle`}
      >
        <span className="text-sm font-bold text-slate-400 flex-shrink-0 mt-0.5">#{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant={getClaimStatusVariant(finding.status)}>{finding.status}</Badge>
            <Badge variant={getSeverityVariant(finding.severity)}>{finding.severity}</Badge>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{finding.issueCategory}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 line-clamp-2">"{finding.claim}"</p>
        </div>
        <span className="text-slate-400 text-xs ml-2 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Claim</h4>
            <p className="text-sm text-slate-800">"{finding.claim}"</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Explanation</h4>
            <p className="text-sm text-slate-700">{finding.explanation}</p>
          </div>
          {finding.evidence ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Approved Evidence</h4>
              <p className="text-sm text-slate-700 italic">"{finding.evidence}"</p>
              {(finding.sourceDocument || finding.sourcePage) && (
                <p className="text-xs text-slate-500 mt-2">
                  <span className="font-semibold">Source:</span>{' '}
                  {finding.sourceDocument}{finding.sourcePage && ` — ${finding.sourcePage}`}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Evidence</h4>
              <p className="text-sm text-slate-500 italic">No approved source found in the brand document library.</p>
            </div>
          )}
          {finding.suggestedCorrection && finding.suggestedCorrection !== 'No correction needed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Suggested Correction</h4>
              <p className="text-sm text-blue-800">{finding.suggestedCorrection}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DecisionPanel({ reviewId, reviewStatus, onDecisionMade }: { reviewId: string; reviewStatus: string; onDecisionMade: () => void }) {
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | ''>('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canDecide = ['ANALYZED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(reviewStatus)

  const handleSubmit = async () => {
    if (!action) { setError('Please select an action.'); return }
    if ((action === 'REJECT' || action === 'REQUEST_CHANGES') && !comment.trim()) {
      setError('A comment is required for this action.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save decision')
      setSuccess(`Decision recorded: ${action.replace(/_/g, ' ')}`)
      setComment('')
      setAction('')
      onDecisionMade()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!canDecide) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-2">Reviewer Decision</h3>
        <p className="text-sm text-slate-500">The review must be fully analyzed before a decision can be made.</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-800 mb-4">Reviewer Decision</h3>
      {success && <Alert type="success" className="mb-4">{success}</Alert>}
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['APPROVE', 'REQUEST_CHANGES', 'REJECT'] as const).map((act) => (
          <button
            key={act}
            onClick={() => setAction(act)}
            id={`decision-${act.toLowerCase().replace(/_/g,'-')}-btn`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              action === act
                ? act === 'APPROVE'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : act === 'REJECT'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-amber-500 border-amber-500 text-white'
                : act === 'APPROVE'
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : act === 'REJECT'
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            {act === 'APPROVE' ? '✓ Approve' : act === 'REJECT' ? '✕ Reject' : '↩ Request Changes'}
          </button>
        ))}
      </div>
      <textarea
        id="reviewer-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={action === 'APPROVE' ? 'Optional comment…' : 'Comment required…'}
        rows={3}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !action}
        id="decision-submit-btn"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving…' : 'Submit Decision'}
      </button>
    </Card>
  )
}

function RevisionPanel({ reviewId, currentContent, onRevisionSubmitted }: { reviewId: string; currentContent: string; onRevisionSubmitted: () => void }) {
  const [content, setContent] = useState(currentContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (content.trim().length < 10) { setError('Content must be at least 10 characters.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save revision')
      onRevisionSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-amber-900 mb-1">Revision Required</h3>
      <p className="text-sm text-amber-700 mb-4">Changes have been requested. Revise the content below and re-submit for AI analysis.</p>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      <textarea
        id="revision-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-4 bg-white"
      />
      <div className="flex gap-3 items-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          id="revision-submit-btn"
          className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Submit Revised Content'}
        </button>
        <p className="text-xs text-amber-700">Content will go through AI analysis again after submission.</p>
      </div>
    </div>
  )
}

export default function ReviewDetailPage({ params }: { params:Promise<{ id: string }> }) {
  const {id}=use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReview(data.review)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchReview() }, [fetchReview])

  const handleReanalyze = async () => {
    setReanalyzing(true)
    try {
      const res = await fetch(`/api/reviews/${id}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchReview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setReanalyzing(false)
    }
  }

  const handleRevisionSubmitted = async () => {
    setLoading(true)
    setReanalyzing(true)
    try {
      const res = await fetch(`/api/reviews/${id}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      await fetchReview()
      setReanalyzing(false)
    }
  }

  if (loading || reanalyzing) return (
    <LoadingPage message={reanalyzing ? 'Analysing revised content…' : 'Loading review…'} />
  )
  if (error) return (
    <div className="p-6"><Alert type="error">{error}</Alert></div>
  )
  if (!review) return null

  const role = session?.user?.role || ''
  const isReviewer = ['ADMIN', 'REVIEWER'].includes(role)
  const isCreator  = ['ADMIN', 'CREATOR'].includes(role)

  const supported    = review.findings.filter((f) => f.status === 'SUPPORTED').length
  const unverified   = review.findings.filter((f) => f.status === 'UNVERIFIED').length
  const contradicted = review.findings.filter((f) => f.status === 'CONTRADICTED').length

  const latestDecision = review.decisions[0]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-slate-500">
        <Link href="/reviews" className="hover:text-blue-600">Reviews</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">{review.campaignName}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{review.campaignName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {review.product} · Submitted by {review.submittedBy.name} ·{' '}
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getReviewStatusVariant(review.status)}>
              {STATUS_LABEL[review.status] || review.status}
            </Badge>
            {isCreator && review.status === 'ANALYZED' && (
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {reanalyzing ? 'Re-analysing…' : 'Re-analyse'}
              </button>
            )}
          </div>
        </div>

        {/* Original content */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Submitted Content</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.content}</p>
          </div>
        </div>

        {/* Latest decision */}
        {latestDecision && (
          <div className={`mt-4 rounded-lg p-4 border ${
            latestDecision.action === 'APPROVE'
              ? 'bg-emerald-50 border-emerald-200'
              : latestDecision.action === 'REJECT'
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-600">
              Reviewer Decision — {latestDecision.reviewer.name} · {new Date(latestDecision.createdAt).toLocaleDateString()}
            </p>
            <p className={`text-sm font-semibold ${
              latestDecision.action === 'APPROVE' ? 'text-emerald-800'
              : latestDecision.action === 'REJECT' ? 'text-red-800'
              : 'text-amber-800'
            }`}>
              {latestDecision.action === 'APPROVE' ? '✓ Approved'
               : latestDecision.action === 'REJECT' ? '✕ Rejected'
               : '↩ Changes Requested'}
            </p>
            {latestDecision.comment && (
              <p className="text-sm text-slate-700 mt-1">"{latestDecision.comment}"</p>
            )}
          </div>
        )}
      </div>

      {/* Analysis summary */}
      {review.status === 'ANALYZING' ? (
        <Card className="mb-6">
          <div className="flex items-center gap-4 py-4">
            <Spinner />
            <div>
              <p className="text-sm font-semibold text-slate-800">AI analysis in progress…</p>
              <p className="text-xs text-slate-500">Extracting claims, searching evidence, classifying findings.</p>
            </div>
          </div>
        </Card>
      ) : review.findings.length > 0 ? (
        <>
          {/* Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{supported}</p>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mt-1">Supported</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{unverified}</p>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mt-1">Unverified</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{contradicted}</p>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mt-1">Contradicted</p>
            </div>
          </div>

          {/* Findings */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              Findings ({review.findings.length})
            </h2>
            <div className="space-y-3">
              {review.findings.map((finding, i) => (
                <FindingCard key={finding.id} finding={finding} index={i} />
              ))}
            </div>
          </div>
        </>
      ) : review.status === 'DRAFT' ? (
        <div className="mb-6">
          {isCreator && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ready to analyze</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click to run AI analysis on this content.</p>
                </div>
                <button
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  id="run-analysis-btn"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {reanalyzing ? 'Analysing…' : 'Run Analysis'}
                </button>
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {/* Revision panel */}
      {review.status === 'CHANGES_REQUESTED' && isCreator && (
        <div className="mb-6">
          <RevisionPanel
            reviewId={review.id}
            currentContent={review.content}
            onRevisionSubmitted={handleRevisionSubmitted}
          />
        </div>
      )}

      {/* Reviewer decision panel */}
      {isReviewer && (
        <div className="mb-6">
          <DecisionPanel
            reviewId={review.id}
            reviewStatus={review.status}
            onDecisionMade={fetchReview}
          />
        </div>
      )}

      {/* Revision history link */}
      {review.revisions.length > 0 && (
        <div className="text-center">
          <Link
            href={`/history?reviewId=${review.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View revision history ({review.revisions.length} version{review.revisions.length !== 1 ? 's' : ''}) →
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-400 mt-6">
        ⚠ BrandShield AI provides decision support and is not legal clearance.
      </p>
    </div>
  )
}
