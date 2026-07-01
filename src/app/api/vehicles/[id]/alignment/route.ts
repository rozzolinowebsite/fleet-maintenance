import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'
import { createVehicleRepairLog } from '@/lib/repair-log'

const ALIGNMENT_INTERVAL_KM = 10000

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const lastKm = Number(body.lastKm)
  const lastDate = parseDateOnly(body.lastDate)
  if (!Number.isFinite(lastKm)) return NextResponse.json({ error: 'Km del último servicio requerido' }, { status: 400 })
  if (!lastDate) return NextResponse.json({ error: 'Fecha del último servicio requerida' }, { status: 400 })

  const data = {
    lastKm,
    lastDate,
    kmInterval: ALIGNMENT_INTERVAL_KM,
    nextKm: lastKm + ALIGNMENT_INTERVAL_KM,
    nextDate: null,
    notes: body.notes || null,
  }
  const result = await db.alignmentBalance.upsert({
    where: { vehicleId: params.id },
    update: data,
    create: { vehicleId: params.id, ...data },
  })
  await createVehicleRepairLog(req, params.id, {
    date: body.lastDate,
    title: 'Alineacion y balanceo',
    mileage: lastKm,
    source: 'alignment',
    description: body.notes || null,
  })
  return NextResponse.json(result)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.alignmentBalance.delete({ where: { vehicleId: params.id } })
  return NextResponse.json({ ok: true })
}
