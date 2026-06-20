import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const trailers = await db.trailer.findMany({
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
    orderBy: { domain: 'asc' },
  })
  return NextResponse.json(trailers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const trailer = await db.trailer.create({
    data: {
      domain: body.domain.toUpperCase(),
      brand: body.brand,
      model: body.model,
      year: Number(body.year),
      chassisNumber: body.chassisNumber || null,
      trailerType: body.trailerType,
      subtype: body.subtype,
      axleCount: body.axleCount ? Number(body.axleCount) : null,
      axleConfig: body.axleConfig || null,
      grossWeight: body.grossWeight ? Number(body.grossWeight) : null,
      tare: body.tare ? Number(body.tare) : null,
      notes: body.notes || null,
      vehicleId: body.vehicleId || null,
    },
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
  })
  return NextResponse.json(trailer, { status: 201 })
}
