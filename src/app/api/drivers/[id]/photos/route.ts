import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_FIELDS = ['licensePhotoFront', 'licensePhotoBack', 'dniPhotoFront', 'dniPhotoBack']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const field = form.get('field') as string | null

  if (!file || !field || !ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public', 'uploads', 'drivers', params.id)
  await mkdir(dir, { recursive: true })

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${field}-${Date.now()}.${ext}`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  const url = `/uploads/drivers/${params.id}/${filename}`
  await db.driver.update({ where: { id: params.id }, data: { [field]: url } })

  return NextResponse.json({ url })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { field } = await req.json()
  if (!field || !ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  await db.driver.update({ where: { id: params.id }, data: { [field]: null } })
  return NextResponse.json({ ok: true })
}
