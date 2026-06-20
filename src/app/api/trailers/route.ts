import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const trailers = await db.trailerUnit.findMany({
    include: {
      vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      documents: { select: { id: true, type: true, expiryDate: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(trailers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const trailer = await db.trailerUnit.create({
    data: {
      name: body.name,
      companyId: body.companyId || null,
      patent: body.patent ? body.patent.toUpperCase() : null,
      brand: body.brand || null,
      model: body.model || null,
      year: body.year ? Number(body.year) : null,
      serialNumber: body.serialNumber || null,
      description: body.description || null,
      status: body.status || 'ACTIVE',
      vehicleId: body.vehicleId || null,
    },
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
  })
  return NextResponse.json(trailer, { status: 201 })
}
