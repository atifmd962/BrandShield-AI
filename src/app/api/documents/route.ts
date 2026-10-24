import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'
import { put } from '@vercel/blob'
import { extractPdf, extractTxt } from '@/lib/pdf'

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/txt']
const ALLOWED_EXTS = ['.pdf', '.txt']

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await prisma.brandDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        passages: { select: { id: true } },
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role, 'uploadDocuments')) {
      return NextResponse.json({ error: 'Only admins can upload brand documents' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const version = formData.get('version') as string || '1.0'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: 'Only PDF and TXT files are supported' },
        { status: 400 }
      )
    }

    // Create document record first
    const doc = await prisma.brandDocument.create({
      data: {
        name: name.trim(),
        fileType: ext.replace('.', ''),
        version,
        status: 'UPLOADING',
        uploadedById: session.user.id,
      },
    })

    try {
      // Upload to Vercel Blob
      const buffer = Buffer.from(await file.arrayBuffer())
      const blobResult = await put(`documents/${doc.id}/${file.name}`, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      })

      // Update status to processing
      await prisma.brandDocument.update({
        where: { id: doc.id },
        data: { blobUrl: blobResult.url, status: 'PROCESSING' },
      })

      // Extract text
      let passages: Array<{ content: string; pageNumber: number; chunkIndex: number }> = []

      if (ext === '.pdf') {
        const result = await extractPdf(buffer)
        passages = result.passages
      } else if (ext === '.txt') {
        const result = extractTxt(buffer)
        passages = result.passages
      }

      if (passages.length === 0) {
        throw new Error('No readable text could be extracted from this document')
      }

      // Store passages
      await prisma.passage.createMany({
        data: passages.map((p) => ({ ...p, documentId: doc.id })),
      })

      // Mark as ready
      await prisma.brandDocument.update({
        where: { id: doc.id },
        data: { status: 'READY' },
      })

      return NextResponse.json({ document: { id: doc.id, name: doc.name, status: 'READY' } }, { status: 201 })
    } catch (processingError) {
      const errorMessage = processingError instanceof Error ? processingError.message : 'Processing failed'
      await prisma.brandDocument.update({
        where: { id: doc.id },
        data: { status: 'FAILED', errorMessage },
      })
      return NextResponse.json(
        { error: `Document processing failed: ${errorMessage}` },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
