import { prisma } from '@/lib/db'
import { retrieveTopPassages } from '@/lib/rag'
import { extractClaims, analyzeClaim, analyzeBrandIssues } from '@/lib/gemini'
import type { ClaimStatus, Severity } from '@prisma/client'

export async function runAnalysis(reviewId: string): Promise<void> {
  // Mark as analyzing
  await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'ANALYZING' },
  })

  try {
    const review = await prisma.review.findUniqueOrThrow({
      where: { id: reviewId },
    })

    // Load all passages from ready documents
    const passages = await prisma.passage.findMany({
      include: {
        document: {
          select: { name: true, id: true, status: true },
        },
      },
      where: {
        document: { status: 'READY' },
      },
    })

    // 1. Extract factual claims
    const claims = await extractClaims(review.content)

    // 2. For each claim: retrieve evidence + analyze
    const findings: Array<{
      claim: string
      issueCategory: string
      status: ClaimStatus
      severity: Severity
      explanation: string
      evidence: string | null
      sourceDocument: string | null
      sourcePage: string | null
      suggestedCorrection: string | null
    }> = []

    for (const claim of claims) {
      const topPassages = retrieveTopPassages(claim, passages, 3)

      const evidenceForPrompt = topPassages.map((p) => ({
        content: p.content,
        documentName: p.documentName,
        pageNumber: p.pageNumber,
      }))

      const analysis = await analyzeClaim(claim, evidenceForPrompt)

      const topPassage = topPassages[0]
      findings.push({
        claim,
        issueCategory: analysis.issueCategory,
        status: analysis.status as ClaimStatus,
        severity: analysis.severity as Severity,
        explanation: analysis.explanation,
        evidence: topPassage?.content || null,
        sourceDocument: topPassage?.documentName || null,
        sourcePage: topPassage?.pageNumber != null ? `Page ${topPassage.pageNumber}` : null,
        suggestedCorrection: analysis.suggestedCorrection,
      })

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300))
    }

    // 3. Brand/tone issues (separate pass)
    const allEvidence = passages.slice(0, 10).map((p) => ({
      content: p.content,
      documentName: p.document?.name || 'Unknown',
    }))

    const brandIssues = await analyzeBrandIssues(review.content, allEvidence)

    for (const issue of brandIssues) {
      // Avoid duplicating if already caught as a claim
      const alreadyCovered = findings.some(
        (f) =>
          f.claim.toLowerCase().includes(issue.claim.toLowerCase().slice(0, 20))
      )
      if (!alreadyCovered) {
        findings.push({
          claim: issue.claim,
          issueCategory: issue.issueCategory,
          status: issue.status as ClaimStatus,
          severity: issue.severity as Severity,
          explanation: issue.explanation,
          evidence: null,
          sourceDocument: null,
          sourcePage: null,
          suggestedCorrection: issue.suggestedCorrection,
        })
      }
    }

    // 4. Save findings
    if (findings.length > 0) {
      await prisma.finding.createMany({
        data: findings.map((f) => ({ ...f, reviewId })),
      })
    }

    // 5. Mark as analyzed
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'ANALYZED' },
    })
  } catch (error) {
    console.error('Analysis failed:', error)
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'DRAFT' },
    })
    throw error
  }
}
