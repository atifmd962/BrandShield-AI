import type { Role, ReviewStatus, ClaimStatus, Severity, DocumentStatus, DecisionAction } from '@prisma/client'

export type { Role, ReviewStatus, ClaimStatus, Severity, DocumentStatus, DecisionAction }

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  role: Role
}

export interface ReviewWithRelations {
  id: string
  campaignName: string
  product: string
  content: string
  status: ReviewStatus
  submittedById: string
  createdAt: Date
  updatedAt: Date
  submittedBy: {
    id: string
    name: string
    email: string
    role: Role
  }
  findings: FindingData[]
  decisions: DecisionData[]
  revisions: RevisionData[]
}

export interface FindingData {
  id: string
  reviewId: string
  claim: string
  issueCategory: string
  status: ClaimStatus
  severity: Severity
  explanation: string
  evidence: string | null
  sourceDocument: string | null
  sourcePage: string | null
  suggestedCorrection: string | null
  createdAt: Date
}

export interface DecisionData {
  id: string
  reviewId: string
  reviewerId: string
  action: DecisionAction
  comment: string | null
  createdAt: Date
  reviewer: {
    name: string
    email: string
    role: Role
  }
}

export interface RevisionData {
  id: string
  reviewId: string
  versionNumber: number
  content: string
  findingsSnapshot: unknown
  decisionAction: string | null
  decisionComment: string | null
  reviewerName: string | null
  createdAt: Date
}

export interface DocumentData {
  id: string
  name: string
  fileType: string
  version: string
  blobUrl: string | null
  status: DocumentStatus
  errorMessage: string | null
  uploadedById: string
  createdAt: Date
  uploadedBy: {
    name: string
    email: string
  }
  passages: { id: string }[]
}
