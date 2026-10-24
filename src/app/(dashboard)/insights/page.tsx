'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { LoadingPage } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface InsightsData {
  reviewStats:         { status: string; _count: { status: number } }[]
  findingStats:        { status: string; _count: { status: number } }[]
  issueCategoryStats:  { issueCategory: string; _count: { issueCategory: number } }[]
  recentDecisions:     {
    id: string
    action: string
    comment: string | null
    createdAt: string
    reviewer: { name: string; role: string }
    review:   { campaignName: string; product: string }
  }[]
  totalDocuments: number
  totalPassages:  number
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-800 w-8 text-right">{value}</span>
    </div>
  )
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage message="Loading insights…" />

  if (error) return (
    <div className="p-6">
      <Alert type="error">{error}</Alert>
    </div>
  )
  if (!data) return null

  const getR = (s: string) => data.reviewStats.find((x) => x.status === s)?._count?.status ?? 0
  const getF = (s: string) => data.findingStats.find((x) => x.status === s)?._count?.status ?? 0

  const totalReviews  = data.reviewStats.reduce((s, x) => s + x._count.status, 0)
  const totalFindings = data.findingStats.reduce((s, x) => s + x._count.status, 0)

  const decisionLabel: Record<string, string> = {
    APPROVE:         '✓ Approved',
    REJECT:          '✕ Rejected',
    REQUEST_CHANGES: '↩ Changes Requested',
  }

  const decisionColor: Record<string, string> = {
    APPROVE:         'text-emerald-700',
    REJECT:          'text-red-700',
    REQUEST_CHANGES: 'text-amber-700',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time analytics from your brand governance activity</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Brand Documents',  value: data.totalDocuments,  color: 'text-slate-700',   bg: 'bg-slate-50'   },
          { label: 'Passages Indexed', value: data.totalPassages,   color: 'text-blue-700',    bg: 'bg-blue-50'    },
          { label: 'Total Reviews',    value: totalReviews,          color: 'text-slate-700',   bg: 'bg-slate-50'   },
          { label: 'Total Findings',   value: totalFindings,         color: 'text-slate-700',   bg: 'bg-slate-50'   },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-slate-200 rounded-xl p-5`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Claim status */}
        <Card>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Claim Status Distribution</h2>
          {totalFindings === 0 ? (
            <p className="text-sm text-slate-500">No findings recorded yet.</p>
          ) : (
            <div className="space-y-3">
              <StatBar label="Supported"    value={getF('SUPPORTED')}    max={totalFindings} color="bg-emerald-500" />
              <StatBar label="Unverified"   value={getF('UNVERIFIED')}   max={totalFindings} color="bg-amber-400"   />
              <StatBar label="Contradicted" value={getF('CONTRADICTED')} max={totalFindings} color="bg-red-500"     />
            </div>
          )}
        </Card>

        {/* Review outcomes */}
        <Card>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Review Outcomes</h2>
          {totalReviews === 0 ? (
            <p className="text-sm text-slate-500">No reviews recorded yet.</p>
          ) : (
            <div className="space-y-3">
              <StatBar label="Approved"          value={getR('APPROVED')}           max={totalReviews} color="bg-emerald-500" />
              <StatBar label="Changes Requested" value={getR('CHANGES_REQUESTED')}  max={totalReviews} color="bg-amber-400"   />
              <StatBar label="Rejected"          value={getR('REJECTED')}           max={totalReviews} color="bg-red-500"     />
              <StatBar label="Pending"           value={getR('DRAFT') + getR('ANALYZED')} max={totalReviews} color="bg-slate-400" />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top issue categories */}
        <Card>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Most Common Issue Categories</h2>
          {data.issueCategoryStats.length === 0 ? (
            <p className="text-sm text-slate-500">No issues recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.issueCategoryStats.map((cat) => (
                <StatBar
                  key={cat.issueCategory}
                  label={cat.issueCategory}
                  value={cat._count.issueCategory}
                  max={data.issueCategoryStats[0]._count.issueCategory}
                  color="bg-indigo-400"
                />
              ))}
            </div>
          )}
        </Card>

        {/* Recent decisions */}
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Recent Decisions</h2>
          </div>
          {data.recentDecisions.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">No decisions recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentDecisions.map((dec) => (
                <div key={dec.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{dec.review.campaignName}</p>
                      <p className="text-xs text-slate-500">by {dec.reviewer.name} · {new Date(dec.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-xs font-semibold flex-shrink-0 ${decisionColor[dec.action] || 'text-slate-600'}`}>
                      {decisionLabel[dec.action] || dec.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
