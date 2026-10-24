'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

const demoAccounts = [
  { role: 'Admin',    email: 'admin@novatech.com',    password: 'demo1234', description: 'Manage documents · view all reviews' },
  { role: 'Creator',  email: 'creator@novatech.com',  password: 'demo1234', description: 'Submit & revise promotional content' },
  { role: 'Reviewer', email: 'reviewer@novatech.com', password: 'demo1234', description: 'Approve · reject · request changes' },
  { role: 'Manager',  email: 'manager@novatech.com',  password: 'demo1234', description: 'View dashboard & insights' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      console.log('[Login] signIn result:', JSON.stringify(result))
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      console.error('[Login] signIn exception:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (account: (typeof demoAccounts)[0]) => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      })
      console.log('[Login] quickLogin result:', JSON.stringify(result))
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      console.error('[Login] quickLogin exception:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              B
            </div>
            <span className="text-white font-bold text-xl">BrandShield AI</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Evidence-based brand governance for promotional content.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Review promotional content against your approved brand guidelines, product facts, and approved claims — with AI-powered evidence retrieval and explainable findings.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: '🔍', text: 'Evidence-based claim verification' },
              { icon: '📋', text: 'SUPPORTED · UNVERIFIED · CONTRADICTED' },
              { icon: '👤', text: 'Human reviewer makes the final decision' },
              { icon: '📜', text: 'Full revision history & audit trail' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-slate-300 text-sm">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6">
          <p className="text-slate-500 text-xs leading-relaxed">
            ⚠ BrandShield AI provides decision support and is not legal clearance. All content requires human reviewer approval before publication.
          </p>
          <p className="text-slate-600 text-xs mt-2">NovaTech · Demo Organisation</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
            <span className="font-bold text-slate-900">BrandShield AI</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-slate-500 mt-1 text-sm">Access your BrandShield AI workspace</p>
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@novatech.com"
                required
                autoComplete="email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Demo Accounts — click to sign in instantly
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account)}
                  id={`demo-${account.role.toLowerCase()}-btn`}
                  disabled={loading}
                  className="w-full text-left border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50 hover:border-blue-200 transition-colors disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{account.role}</p>
                      <p className="text-xs text-slate-500">{account.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">demo1234</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
