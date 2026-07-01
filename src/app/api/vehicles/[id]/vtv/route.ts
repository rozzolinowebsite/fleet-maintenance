import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'
import { createVehicleRepairLog } from '@/lib/repair-log'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const expirationDate = parseDateOnly(body.expirationDate)
  if (!expirationDate) return NextResponse.json({ error: 'Fecha de vencimiento requerida' }, { status: 400 })
  const lastDate = parseDateOnly(body.lastDate)

  const vtv = await db.vTV.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      expirationDate,
      lastDate,
      notes: body.notes || null,
    },
    update: {
      expirationDate,
      lastDate,
      notes: body.notes || null,
    },
  })
  await createVehicleRepairLog(req, params.id, {
    date: body.lastDate || body.expirationDate,
    title: 'VTV / RTO',
    source: 'vtv',
    description: [`Vencimiento: ${body.expirationDate}`, body.notes || null].filter(Boolean).join(' | '),
  })
  return NextResponse.json(vtv)
}
