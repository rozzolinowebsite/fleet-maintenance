import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
  if (!(file.type === 'application/pdf' || file.type.startsWith('image/'))) return NextResponse.json({ error: 'Solo se permiten PDF o imagenes' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 400 })

  const doc = await db.trailerDocument.findUnique({ where: { id: params.docId } })
  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  if (doc.fileUrl) {
    try { await unlink(path.join(process.cwd(), 'public', doc.fileUrl)) } catch {}
  }

  const bytes = await file.arrayBuffer()
  const dir = path.join(process.cwd(), 'public', 'uploads', 'trailers', params.id)
  await mkdir(dir, { recursive: true })

  const ext = (file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')).toLowerCase()
  const filename = `doc-${Date.now()}.${ext}`
  await writeFile(path.join(dir, filename), Buffer.from(bytes))

  const fileUrl = `/uploads/trailers/${params.id}/${filename}`
  const updated = await db.trailerDocument.update({
    where: { id: params.docId },
    data: { fileUrl, fileName: file.name, fileUploadedAt: new Date() },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; docId: string } }) {
  const doc = await db.trailerDocument.findUnique({ where: { id: params.docId } })

  if (doc?.fileUrl) {
    try { await unlink(path.join(process.cwd(), 'public', doc.fileUrl)) } catch {}
  }

  await db.trailerDocument.update({
    where: { id: params.docId },
    data: { fileUrl: null, fileName: null, fileUploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}
