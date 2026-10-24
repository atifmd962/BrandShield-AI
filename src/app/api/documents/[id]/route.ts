import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { can } from '@/lib/roles'
import { del } from '@vercel/blob'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doc = await prisma.brandDocument.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        passages: true,
      },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: doc })
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error)
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role, 'uploadDocuments')) {
      return NextResponse.json({ error: 'Only admins can delete brand documents' }, { status: 403 })
    }

    const doc = await prisma.brandDocument.findUnique({ where: { id } })
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete from Vercel Blob (non-fatal if it fails)
    if (doc.blobUrl) {
      try {
        await del(doc.blobUrl)
      } catch {
        // Non-fatal: continue with DB deletion
      }
    }

    await prisma.brandDocument.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
