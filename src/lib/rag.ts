/**
 * Simple TF-IDF based passage retrieval for evidence search.
 * Real retrieval - not hardcoded. Searches passages stored in DB.
 */

interface Passage {
  id: string
  content: string
  pageNumber?: number | null
  chunkIndex: number
  document?: {
    name: string
    id: string
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

function computeTF(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {}
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1
  }
  const total = tokens.length
  for (const key in tf) {
    tf[key] /= total
  }
  return tf
}

function computeIDF(
  term: string,
  passages: Passage[]
): number {
  const docsWithTerm = passages.filter((p) =>
    tokenize(p.content).includes(term)
  ).length
  if (docsWithTerm === 0) return 0
  return Math.log(passages.length / docsWithTerm)
}

function cosineSimilarity(
  vec1: Record<string, number>,
  vec2: Record<string, number>
): number {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)])
  let dot = 0
  let mag1 = 0
  let mag2 = 0

  for (const k of keys) {
    const a = vec1[k] || 0
    const b = vec2[k] || 0
    dot += a * b
    mag1 += a * a
    mag2 += b * b
  }

  if (mag1 === 0 || mag2 === 0) return 0
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2))
}

export interface RetrievedPassage {
  id: string
  content: string
  pageNumber?: number | null
  chunkIndex: number
  documentName: string
  documentId: string
  score: number
}

export function retrieveTopPassages(
  query: string,
  passages: Passage[],
  topK = 3
): RetrievedPassage[] {
  if (passages.length === 0) return []

  const queryTokens = tokenize(query)
  const allTokens = new Set<string>()

  passages.forEach((p) => tokenize(p.content).forEach((t) => allTokens.add(t)))
  queryTokens.forEach((t) => allTokens.add(t))

  const terms = Array.from(allTokens)

  // Compute TF-IDF vectors
  const queryTF = computeTF(queryTokens)
  const queryVec: Record<string, number> = {}
  for (const term of terms) {
    const idf = computeIDF(term, passages)
    queryVec[term] = (queryTF[term] || 0) * idf
  }

  const scoredPassages = passages.map((passage) => {
    const pTokens = tokenize(passage.content)
    const pTF = computeTF(pTokens)
    const pVec: Record<string, number> = {}
    for (const term of terms) {
      const idf = computeIDF(term, passages)
      pVec[term] = (pTF[term] || 0) * idf
    }
    const score = cosineSimilarity(queryVec, pVec)
    return {
      id: passage.id,
      content: passage.content,
      pageNumber: passage.pageNumber,
      chunkIndex: passage.chunkIndex,
      documentName: passage.document?.name || 'Unknown Document',
      documentId: passage.document?.id || '',
      score,
    }
  })

  return scoredPassages
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
