import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addOneYear, parseDateOnly } from '@/lib/dates'

const OIL_CHANGE_INTERVAL_KM = 10000

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const lastKm = Number(body.lastKm)
  const lastDate = parseDateOnly(body.lastDate)
  if (!Number.isFinite(lastKm)) return NextResponse.json({ error: 'Km del servicio requerido' }, { status: 400 })
  if (!lastDate) return NextResponse.json({ error: 'Fecha del servicio requerida' }, { status: 400 })

  const kmInterval = OIL_CHANGE_INTERVAL_KM
  const nextKm = lastKm + kmInterval
  const nextDate = addOneYear(lastDate)

  const oilChange = await db.oilChange.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      kmInterval,
      lastKm,
      lastDate,
      nextKm,
      nextDate,
      oilType: body.oilType || null,
      airFilterCleaned: body.airFilterCleaned ?? false,
      airFilterChanged: body.airFilterChanged ?? false,
      fuelFilterChanged: body.fuelFilterChanged ?? false,
      notes: body.notes || null,
    },
    update: {
      kmInterval,
      lastKm,
      lastDate,
      nextKm,
      nextDate,
      oilType: body.oilType || null,
      airFilterCleaned: body.airFilterCleaned ?? false,
      airFilterChanged: body.airFilterChanged ?? false,
      fuelFilterChanged: body.fuelFilterChanged ?? false,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(oilChange)
}
