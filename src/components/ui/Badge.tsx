import React from 'react'

type BadgeVariant =
  | 'supported' | 'unverified' | 'contradicted'
  | 'approved' | 'rejected' | 'changes' | 'analyzing' | 'draft'
  | 'ready' | 'processing' | 'failed' | 'uploading'
  | 'high' | 'medium' | 'low'
  | 'admin' | 'creator' | 'reviewer' | 'manager'
  | 'default'

const variantStyles: Record<BadgeVariant, string> = {
  supported:   'bg-emerald-100 text-emerald-800 border border-emerald-200',
  unverified:  'bg-amber-100  text-amber-800  border border-amber-200',
  contradicted:'bg-red-100    text-red-800    border border-red-200',
  approved:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected:    'bg-red-100    text-red-800    border border-red-200',
  changes:     'bg-amber-100  text-amber-800  border border-amber-200',
  analyzing:   'bg-blue-100   text-blue-800   border border-blue-200',
  draft:       'bg-slate-100  text-slate-700  border border-slate-200',
  ready:       'bg-emerald-100 text-emerald-800 border border-emerald-200',
  processing:  'bg-blue-100   text-blue-800   border border-blue-200',
  failed:      'bg-red-100    text-red-800    border border-red-200',
  uploading:   'bg-slate-100  text-slate-700  border border-slate-200',
  high:        'bg-red-100    text-red-700    border border-red-200',
  medium:      'bg-amber-100  text-amber-700  border border-amber-200',
  low:         'bg-slate-100  text-slate-700  border border-slate-200',
  admin:       'bg-purple-100 text-purple-800 border border-purple-200',
  creator:     'bg-blue-100   text-blue-800   border border-blue-200',
  reviewer:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  manager:     'bg-indigo-100 text-indigo-800 border border-indigo-200',
  default:     'bg-slate-100  text-slate-700  border border-slate-200',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function getClaimStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'SUPPORTED':    return 'supported'
    case 'UNVERIFIED':   return 'unverified'
    case 'CONTRADICTED': return 'contradicted'
    default:             return 'default'
  }
}

export function getReviewStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'APPROVED':           return 'approved'
    case 'REJECTED':           return 'rejected'
    case 'CHANGES_REQUESTED':  return 'changes'
    case 'ANALYZING':          return 'analyzing'
    case 'ANALYZED':           return 'draft'
    case 'DRAFT':              return 'draft'
    default:                   return 'default'
  }
}

export function getDocStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'READY':      return 'ready'
    case 'PROCESSING': return 'processing'
    case 'FAILED':     return 'failed'
    case 'UPLOADING':  return 'uploading'
    default:           return 'default'
  }
}

export function getSeverityVariant(severity: string): BadgeVariant {
  switch (severity) {
    case 'HIGH':   return 'high'
    case 'MEDIUM': return 'medium'
    case 'LOW':    return 'low'
    default:       return 'default'
  }
}

export function getRoleVariant(role: string): BadgeVariant {
  switch (role) {
    case 'ADMIN':    return 'admin'
    case 'CREATOR':  return 'creator'
    case 'REVIEWER': return 'reviewer'
    case 'MANAGER':  return 'manager'
    default:         return 'default'
  }
}
