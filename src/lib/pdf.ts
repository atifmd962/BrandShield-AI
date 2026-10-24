import type { Passage } from '@prisma/client'

interface ParsedDocument {
  passages: Array<{
    content: string
    pageNumber: number
    chunkIndex: number
  }>
  totalPages: number
}

const CHUNK_SIZE = 500 // characters per chunk
const CHUNK_OVERLAP = 50

function chunkText(
  text: string,
  pageNumber: number,
  startChunkIndex: number
): Array<{ content: string; pageNumber: number; chunkIndex: number }> {
  const chunks: Array<{ content: string; pageNumber: number; chunkIndex: number }> = []
  let i = 0
  let chunkIdx = startChunkIndex

  while (i < text.length) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim()
    if (chunk.length > 30) {
      chunks.push({ content: chunk, pageNumber, chunkIndex: chunkIdx++ })
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks
}

export async function extractPdf(buffer: Buffer): Promise<ParsedDocument> {
  // pdf-parse is CommonJS; use require to avoid .default issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer)

  const passages: ParsedDocument['passages'] = []
  let chunkIndex = 0

  // Split by pages if page info available
  if (data.text) {
    // pdf-parse gives us full text; we'll split by form-feed \f for pages
    const pages = data.text.split(/\f/).filter((p: string) => p.trim().length > 0)

    if (pages.length > 1) {
      pages.forEach((pageText: string, pageIdx: number) => {
        const chunks = chunkText(pageText, pageIdx + 1, chunkIndex)
        passages.push(...chunks)
        chunkIndex += chunks.length
      })
    } else {
      // No page breaks, chunk the whole thing
      const chunks = chunkText(data.text, 1, 0)
      passages.push(...chunks)
    }
  }

  return { passages, totalPages: data.numpages || 1 }
}

export function extractTxt(buffer: Buffer): ParsedDocument {
  const text = buffer.toString('utf-8')
  const lines = text.split('\n')
  const passages: ParsedDocument['passages'] = []
  let chunkIndex = 0

  // Group lines into chunks
  let currentChunk = ''
  for (const line of lines) {
    currentChunk += line + ' '
    if (currentChunk.length >= CHUNK_SIZE) {
      if (currentChunk.trim().length > 30) {
        passages.push({
          content: currentChunk.trim(),
          pageNumber: 1,
          chunkIndex: chunkIndex++,
        })
      }
      currentChunk = ''
    }
  }

  if (currentChunk.trim().length > 30) {
    passages.push({
      content: currentChunk.trim(),
      pageNumber: 1,
      chunkIndex: chunkIndex++,
    })
  }

  return { passages, totalPages: 1 }
}
