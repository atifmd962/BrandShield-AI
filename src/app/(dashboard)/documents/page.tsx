'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/Card'
import { Badge, getDocStatusVariant } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Spinner, LoadingPage } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface BrandDocument {
  id: string
  name: string
  fileType: string
  version: string
  blobUrl: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  uploadedBy: { name: string; email: string }
  passages: { id: string }[]
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<BrandDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0')
  const [file, setFile] = useState<File | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDocuments(data.documents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setUploadError('Please select a file.'); return }
    if (!name.trim()) { setUploadError('Document name is required.'); return }

    setUploadError('')
    setUploadSuccess('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name.trim())
      formData.append('version', version.trim() || '1.0')

      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUploadSuccess(`"${data.document.name}" uploaded and processed successfully.`)
      setName('')
      setVersion('1.0')
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      await fetchDocuments()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, docName: string) => {
    if (!confirm(`Delete "${docName}"? This will also remove all extracted passages.`)) return
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  if (loading) return <LoadingPage message="Loading brand documents..." />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Brand Documents</h1>
        <p className="text-slate-500 text-sm mt-1">
          Approved documents used as evidence sources for content review
        </p>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {/* Upload form — admin only */}
      {isAdmin && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Upload Approved Document</h2>

          {uploadError && <Alert type="error" className="mb-4">{uploadError}</Alert>}
          {uploadSuccess && <Alert type="success" className="mb-4">{uploadSuccess}</Alert>}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doc-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="doc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NovaTech Flow Product Facts"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="doc-version" className="block text-sm font-medium text-slate-700 mb-1">
                  Version
                </label>
                <input
                  id="doc-version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 mb-1">
                File <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1">(PDF or TXT, max 10MB)</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-semibold hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              id="upload-doc-btn"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading && <Spinner size="sm" />}
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
          </form>
        </Card>
      )}

      {/* Documents list */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            Document Library
            <span className="ml-2 text-slate-400 font-normal text-sm">({documents.length})</span>
          </h2>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description={isAdmin ? "Upload your first approved brand document to enable evidence retrieval." : "No approved documents have been uploaded yet. Contact your admin."}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-sm font-bold flex-shrink-0 uppercase">
                    {doc.fileType}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      v{doc.version} · Uploaded by {doc.uploadedBy.name} ·{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.status === 'READY' && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {doc.passages.length} passage{doc.passages.length !== 1 ? 's' : ''} indexed
                      </p>
                    )}
                    {doc.status === 'FAILED' && doc.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">Error: {doc.errorMessage}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={getDocStatusVariant(doc.status)}>
                    {doc.status}
                  </Badge>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      aria-label={`Delete ${doc.name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
