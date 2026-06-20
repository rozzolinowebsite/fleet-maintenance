import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 400 })

  const vehicle = await db.vehicle.findUnique({ where: { id: params.id }, select: { policyPdfUrl: true } })
  if (!vehicle) return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })

  if (vehicle.policyPdfUrl) {
    try { await unlink(path.join(process.cwd(), 'public', vehicle.policyPdfUrl)) } catch {}
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public', 'uploads', 'vehicles', params.id)
  await mkdir(dir, { recursive: true })

  const filename = `policy-${Date.now()}.pdf`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  const url = `/uploads/vehicles/${params.id}/${filename}`
  await db.vehicle.update({
    where: { id: params.id },
    data: { policyPdfUrl: url, policyPdfName: file.name, policyPdfUploadedAt: new Date() },
  })

  return NextResponse.json({ url, name: file.name })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const vehicle = await db.vehicle.findUnique({ where: { id: params.id }, select: { policyPdfUrl: true } })

  if (vehicle?.policyPdfUrl) {
    try { await unlink(path.join(process.cwd(), 'public', vehicle.policyPdfUrl)) } catch {}
  }

  await db.vehicle.update({
    where: { id: params.id },
    data: { policyPdfUrl: null, policyPdfName: null, policyPdfUploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}
