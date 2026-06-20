import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const MAX_SIZE = 10 * 1024 * 1024

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const docs = await db.trailerDocument.findMany({
    where: { trailerId: params.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData()

  const name = form.get('name') as string
  const type = form.get('type') as string
  const issueDateStr = form.get('issueDate') as string | null
  const expiryDateStr = form.get('expiryDate') as string | null
  const notes = form.get('notes') as string | null
  const file = form.get('file') as File | null

  if (!name || !type) return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 })

  const trailer = await db.trailerUnit.findUnique({ where: { id: params.id } })
  if (!trailer) return NextResponse.json({ error: 'Trailer no encontrado' }, { status: 404 })

  let fileUrl: string | null = null
  let fileName: string | null = null
  let fileUploadedAt: Date | null = null

  if (file && file.size > 0) {
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const dir = path.join(process.cwd(), 'public', 'uploads', 'trailers', params.id)
    await mkdir(dir, { recursive: true })

    const filename = `doc-${Date.now()}.pdf`
    await writeFile(path.join(dir, filename), Buffer.from(bytes))

    fileUrl = `/uploads/trailers/${params.id}/${filename}`
    fileName = file.name
    fileUploadedAt = new Date()
  }

  const doc = await db.trailerDocument.create({
    data: {
      trailerId: params.id,
      name,
      type,
      issueDate: issueDateStr ? new Date(issueDateStr) : null,
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      notes: notes || null,
      fileUrl,
      fileName,
      fileUploadedAt,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
