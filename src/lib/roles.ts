import type { Role } from '@prisma/client'

export const ROLE_PERMISSIONS = {
  uploadDocuments: ['ADMIN'] as Role[],
  viewDocuments: ['ADMIN', 'CREATOR', 'REVIEWER', 'MANAGER'] as Role[],
  submitReview: ['ADMIN', 'CREATOR'] as Role[],
  viewOwnReviews: ['ADMIN', 'CREATOR', 'REVIEWER', 'MANAGER'] as Role[],
  viewAllReviews: ['ADMIN', 'REVIEWER', 'MANAGER'] as Role[],
  makeDecision: ['ADMIN', 'REVIEWER'] as Role[],
  reviseContent: ['ADMIN', 'CREATOR'] as Role[],
  viewInsights: ['ADMIN', 'REVIEWER', 'MANAGER'] as Role[],
} as const

export function can(role: Role, permission: keyof typeof ROLE_PERMISSIONS): boolean {
  return (ROLE_PERMISSIONS[permission] as Role[]).includes(role)
}

export function requireRole(role: Role, permission: keyof typeof ROLE_PERMISSIONS): void {
  if (!can(role, permission)) {
    throw new Error(`Role ${role} does not have permission: ${permission}`)
  }
}
