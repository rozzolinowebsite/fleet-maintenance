import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  const body = await req.json()
  const doc = await db.trailerDocument.update({
    where: { id: params.docId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.issueDate !== undefined && { issueDate: body.issueDate ? new Date(body.issueDate) : null }),
      ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    },
  })
  return NextResponse.json(doc)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; docId: string } }) {
  const doc = await db.trailerDocument.findUnique({ where: { id: params.docId } })

  if (doc?.fileUrl) {
    try { await unlink(path.join(process.cwd(), 'public', doc.fileUrl)) } catch {}
  }

  await db.trailerDocument.delete({ where: { id: params.docId } })
  return NextResponse.json({ ok: true })
}
