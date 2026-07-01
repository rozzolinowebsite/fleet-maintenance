import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const expirationDate = parseDateOnly(body.expirationDate)
  if (!expirationDate) return NextResponse.json({ error: 'Fecha de vencimiento requerida' }, { status: 400 })

  const record = await db.fireExtinguisher.upsert({
    where: { vehicleId: params.id },
    update: {
      expirationDate,
      notes: body.notes ?? null,
    },
    create: {
      vehicleId: params.id,
      expirationDate,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.fireExtinguisher.delete({ where: { vehicleId: params.id } })
  return NextResponse.json({ ok: true })
}
