import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'
import { createVehicleRepairLog } from '@/lib/repair-log'

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
  await createVehicleRepairLog(req, params.id, {
    date: body.expirationDate,
    title: 'Matafuego',
    source: 'fire-extinguisher',
    description: [`Vencimiento: ${body.expirationDate}`, body.notes || null].filter(Boolean).join(' | '),
  })
  return NextResponse.json(record)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.fireExtinguisher.delete({ where: { vehicleId: params.id } })
  return NextResponse.json({ ok: true })
}
