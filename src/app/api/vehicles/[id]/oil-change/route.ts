import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const lastKm = Number(body.lastKm)
  const kmInterval = Number(body.kmInterval) || 10000
  const nextKm = lastKm + kmInterval

  const oilChange = await db.oilChange.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      kmInterval,
      lastKm,
      lastDate: new Date(body.lastDate),
      nextKm,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      oilType: body.oilType || null,
      airFilterCleaned: body.airFilterCleaned ?? false,
      airFilterChanged: body.airFilterChanged ?? false,
      fuelFilterChanged: body.fuelFilterChanged ?? false,
      notes: body.notes || null,
    },
    update: {
      kmInterval,
      lastKm,
      lastDate: new Date(body.lastDate),
      nextKm,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      oilType: body.oilType || null,
      airFilterCleaned: body.airFilterCleaned ?? false,
      airFilterChanged: body.airFilterChanged ?? false,
      fuelFilterChanged: body.fuelFilterChanged ?? false,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(oilChange)
}
