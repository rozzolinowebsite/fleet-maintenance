import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const trailer = await db.trailer.findUnique({
    where: { id: params.id },
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true, type: true } } },
  })
  if (!trailer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(trailer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const trailer = await db.trailer.update({
    where: { id: params.id },
    data: {
      ...(body.domain !== undefined && { domain: body.domain.toUpperCase() }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.year !== undefined && { year: Number(body.year) }),
      ...(body.chassisNumber !== undefined && { chassisNumber: body.chassisNumber || null }),
      ...(body.trailerType !== undefined && { trailerType: body.trailerType }),
      ...(body.subtype !== undefined && { subtype: body.subtype }),
      ...(body.axleCount !== undefined && { axleCount: body.axleCount ? Number(body.axleCount) : null }),
      ...(body.axleConfig !== undefined && { axleConfig: body.axleConfig || null }),
      ...(body.grossWeight !== undefined && { grossWeight: body.grossWeight ? Number(body.grossWeight) : null }),
      ...(body.tare !== undefined && { tare: body.tare ? Number(body.tare) : null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...('vehicleId' in body && { vehicleId: body.vehicleId }),
    },
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true, type: true } } },
  })
  return NextResponse.json(trailer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.trailer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
