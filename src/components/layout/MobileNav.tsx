'use client'
import { useState } from 'react'
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

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            B
          </div>
          <span className="text-white font-bold text-sm">BrandShield AI</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          id="mobile-menu-toggle"
          className="text-slate-400 hover:text-white p-1 text-lg"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </header>

      {/* Overlay + Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="relative bg-slate-900 w-64 min-h-screen pt-16 px-3 py-4 flex flex-col z-10">
            <div className="space-y-0.5 flex-1">
              {navItems.map((item) => {
                if (item.permission && role && !can(role, item.permission)) return null
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
            {session?.user && (
              <div className="border-t border-slate-800 pt-4">
                <p className="text-white text-sm font-medium">{session.user.name}</p>
                <p className="text-slate-500 text-xs mb-3">{session.user.role}</p>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-slate-400 text-xs hover:text-white transition-colors"
                >
                  Sign out →
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
