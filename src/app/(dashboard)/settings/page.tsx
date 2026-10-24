import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { Badge, getRoleVariant } from '@/components/ui/Badge'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN:    ['Upload brand documents', 'View all reviews', 'Approve / Reject / Request changes', 'Submit new reviews', 'View insights', 'Manage documents'],
  CREATOR:  ['Submit new reviews', 'View own reviews', 'Revise content after changes requested', 'View brand documents'],
  REVIEWER: ['View all reviews', 'Approve / Reject / Request changes', 'View brand documents', 'View insights'],
  MANAGER:  ['View dashboard', 'View all reviews (read-only)', 'View brand documents', 'View insights'],
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const { name, email, role } = session.user
  const permissions = ROLE_PERMISSIONS[role] || []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Your account information and role permissions</p>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <div className="mt-1">
              <Badge variant={getRoleVariant(role)}>{role}</Badge>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1">Demo credentials</p>
          <p>Email: <span className="font-mono text-slate-700">{email}</span></p>
          <p>Password: <span className="font-mono text-slate-700">demo1234</span></p>
        </div>
      </Card>

      {/* Role permissions */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Role Permissions — <span className="text-blue-600">{role}</span>
        </h2>
        <ul className="space-y-2">
          {permissions.map((perm) => (
            <li key={perm} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-emerald-500 font-bold">✓</span>
              {perm}
            </li>
          ))}
        </ul>
      </Card>

      {/* Disclaimer */}
      <Card>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Important Notice</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium mb-1">Decision Support Only</p>
          <p className="text-sm text-amber-700">
            BrandShield AI provides decision support and is not legal clearance. All content must receive human reviewer approval before publication. AI findings should be used as guidance, not as definitive determinations.
          </p>
        </div>
        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <p>Organisation: NovaTech · Demo Environment</p>
          <p>BrandShield AI — Round 2 MVP · Team: Infinite Loop · Adamas University</p>
        </div>
      </Card>
    </div>
  )
}
