import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfWeek } from 'date-fns'

export async function GET() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const vehicles = await db.vehicle.findMany({
    include: {
      type: true,
      vtv: true,
      oilChange: true,
      tirePressure: true,
      weeklyReviews: {
        where: { weekStart: { gte: weekStart } },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { plate: 'asc' },
  })
  return NextResponse.json(vehicles)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const vehicle = await db.vehicle.create({
    data: {
      plate: body.plate.toUpperCase(),
      brand: body.brand,
      model: body.model,
      year: Number(body.year),
      color: body.color || null,
      kmCurrent: Number(body.kmCurrent) || 0,
      notes: body.notes || null,
      typeId: body.typeId || null,
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
    },
    include: { type: true },
  })
  return NextResponse.json(vehicle, { status: 201 })
}
