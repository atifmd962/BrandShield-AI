import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. AI analysis will not function.')
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

/**
 * The Gemini model to use for all analysis calls.
 * Can be overridden via the GEMINI_MODEL environment variable.
 * Defaults to gemini-3.5-flash which is confirmed available for this API key.
 * Other confirmed-working options: gemini-3.8-flash
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'

export async function extractClaims(content: string): Promise<string[]> {
  if (!genAI) throw new Error('GEMINI_API_KEY is not configured')

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `You are a brand governance assistant. Extract all meaningful factual and promotional claims from the following marketing/promotional content.

A claim is a specific, verifiable statement about:
- Product features or capabilities
- Performance metrics or statistics
- Warranties or guarantees
- Availability, configurations, or pricing
- Certifications or awards
- Comparisons or superlatives

Return ONLY a valid JSON array of strings. Each string is one distinct claim. No markdown formatting.

Content:
${content}

Example output: ["Claim one here", "Claim two here"]`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed.filter((c) => typeof c === 'string')
    return []
  } catch {
    // Fallback: split by lines
    return text.split('\n').filter((l) => l.trim().length > 10).slice(0, 10)
  }
}

export interface ClaimAnalysis {
  status: 'SUPPORTED' | 'UNVERIFIED' | 'CONTRADICTED'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  issueCategory: string
  explanation: string
  suggestedCorrection: string
}

export async function analyzeClaim(
  claim: string,
  evidence: Array<{ content: string; documentName: string; pageNumber?: number | null }>
): Promise<ClaimAnalysis> {
  if (!genAI) throw new Error('GEMINI_API_KEY is not configured')

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const evidenceText =
    evidence.length > 0
      ? evidence
          .map(
            (e, i) =>
              `[Evidence ${i + 1}] From "${e.documentName}"${e.pageNumber ? ` (Page ${e.pageNumber})` : ''}:\n${e.content}`
          )
          .join('\n\n')
      : 'No approved evidence found in the brand document library.'

  const prompt = `You are a brand governance AI. Your job is to verify whether a promotional claim is supported by the organisation's approved brand documents.

IMPORTANT RULES:
- SUPPORTED: The approved evidence clearly supports the claim.
- CONTRADICTED: The claim conflicts with or overstates what the approved evidence says.
- UNVERIFIED: There is insufficient approved evidence to verify the claim. UNVERIFIED does not mean false — it means no approved source exists.
- Do NOT use general knowledge as evidence. Only use the provided passages.
- Do NOT invent evidence or citations.

Claim to verify:
"${claim}"

Approved Brand Evidence:
${evidenceText}

Respond with a valid JSON object (no markdown) with these exact fields:
{
  "status": "SUPPORTED" | "CONTRADICTED" | "UNVERIFIED",
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "issueCategory": "string (e.g. Performance Claim, Warranty, Product Availability, Unsupported Superlative, Tone, Terminology)",
  "explanation": "string explaining the finding in 1-3 sentences",
  "suggestedCorrection": "string with safer/corrected wording or 'No correction needed'"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const cleaned = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return {
      status: parsed.status || 'UNVERIFIED',
      severity: parsed.severity || 'MEDIUM',
      issueCategory: parsed.issueCategory || 'General',
      explanation: parsed.explanation || 'Unable to determine.',
      suggestedCorrection: parsed.suggestedCorrection || 'Review manually.',
    }
  } catch {
    return {
      status: 'UNVERIFIED',
      severity: 'MEDIUM',
      issueCategory: 'Parse Error',
      explanation: 'AI returned an unexpected response format. Manual review required.',
      suggestedCorrection: 'Please review this claim manually.',
    }
  }
}

export async function analyzeBrandIssues(
  content: string,
  evidence: Array<{ content: string; documentName: string }>
): Promise<Array<{
  claim: string
  issueCategory: string
  status: 'SUPPORTED' | 'UNVERIFIED' | 'CONTRADICTED'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
  suggestedCorrection: string
}>> {
  if (!genAI) throw new Error('GEMINI_API_KEY is not configured')

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const evidenceText =
    evidence.length > 0
      ? evidence.map((e) => `From "${e.documentName}": ${e.content}`).join('\n')
      : 'No approved evidence found.'

  const prompt = `You are a brand governance AI. Analyse the following promotional content for brand issues BEYOND factual claims — such as tone problems, unsupported superlatives, vague guarantees, or terminology inconsistencies.

Promotional content:
${content}

Approved brand context:
${evidenceText}

Identify up to 3 significant brand/tone/messaging issues. Return a valid JSON array (no markdown):
[
  {
    "claim": "the specific phrase or sentence that has an issue",
    "issueCategory": "Tone | Messaging | Unsupported Superlative | Vague Guarantee | Terminology | Other",
    "status": "UNVERIFIED" | "CONTRADICTED",
    "severity": "HIGH" | "MEDIUM" | "LOW",
    "explanation": "why this is an issue",
    "suggestedCorrection": "safer alternative wording"
  }
]

If no issues found, return an empty array: []`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const cleaned = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
