'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

const DEMO_EXAMPLES = [
  {
    label: 'Contradicted example',
    content: 'NovaTech Flow includes a 2-year warranty, making it one of the most protected solutions on the market.',
  },
  {
    label: 'Supported example',
    content: 'NovaTech Flow is available in three configurations to suit different business needs.',
  },
  {
    label: 'Unverified example',
    content: 'NovaTech Flow is the fastest and most reliable solution in the world, guaranteed to eliminate all processing errors.',
  },
]

export default function NewReviewPage() {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState('')
  const [product, setProduct] = useState('NovaTech Flow')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignName.trim() || !product.trim() || !content.trim()) {
      setError('All fields are required.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      // 1. Create review
      const createRes = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, product, content }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create review')

      const reviewId = createData.review.id

      // 2. Trigger analysis
      const analyzeRes = await fetch(`/api/reviews/${reviewId}/analyze`, {
        method: 'POST',
      })
      const analyzeData = await analyzeRes.json()
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analysis failed')

      // 3. Redirect to results
      router.push(`/reviews/${reviewId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          Submit promotional content for AI-powered brand governance analysis
        </p>
      </div>

      {submitting ? (
        <Card>
          <div className="flex flex-col items-center py-12 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-slate-800 font-semibold">Analysing your content…</p>
              <p className="text-slate-500 text-sm mt-1">
                Extracting claims · Searching evidence · Classifying findings
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <Card className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="campaign-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q4 Product Launch"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="product" className="block text-sm font-medium text-slate-700 mb-1">
                  Product / Service <span className="text-red-500">*</span>
                </label>
                <input
                  id="product"
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. NovaTech Flow"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                  Promotional Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type the promotional content to review…"
                  required
                  rows={7}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">{content.length} characters</p>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="submit"
                  id="analyze-content-btn"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Analyze Content
                </button>
                <p className="text-xs text-slate-400">
                  AI will extract claims, retrieve evidence, and classify each finding.
                </p>
              </div>
            </form>
          </Card>

          {/* Demo examples */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Try a demo example</h2>
            <div className="space-y-2">
              {DEMO_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => { setContent(ex.content); setCampaignName(ex.label) }}
                  className="w-full text-left border border-slate-100 rounded-lg px-4 py-3 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                >
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">{ex.label}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{ex.content}</p>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
