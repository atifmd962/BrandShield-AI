'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { can } from '@/lib/roles'
import type { Role } from '@prisma/client'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',       icon: '⊞', permission: null },
  { href: '/documents',   label: 'Brand Documents',  icon: '📄', permission: null },
  { href: '/reviews/new', label: 'New Review',       icon: '✚', permission: 'submitReview' as const },
  { href: '/reviews',     label: 'Reviews',          icon: '◎', permission: null },
  { href: '/history',     label: 'Revision History', icon: '⏱', permission: null },
  { href: '/insights',    label: 'Insights',         icon: '◈', permission: 'viewInsights' as const },
  { href: '/settings',    label: 'Settings',         icon: '⚙', permission: null },
]

function isActive(pathname: string, href: string) {
  if (href === '/reviews') return pathname === '/reviews' || (pathname.startsWith('/reviews/') && pathname !== '/reviews/new')
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            B
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">BrandShield AI</p>
            <p className="text-slate-500 text-xs">Brand Governance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          if (item.permission && role && !can(role, item.permission)) return null
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      {session?.user && (
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {session.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-slate-500 text-xs">{session.user.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            id="sign-out-btn"
            className="w-full text-left text-slate-400 hover:text-white text-xs px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            Sign out →
          </button>
        </div>
      )}
    </aside>
  )
}
