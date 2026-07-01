import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const INCLUDE = {
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  documents: { orderBy: { createdAt: 'desc' } as const },
  maintenances: { take: 1, orderBy: { date: 'desc' } as const },
  inspections: { take: 1, orderBy: { date: 'desc' } as const },
  repairs: { take: 10, orderBy: { date: 'desc' } as const },
  _count: { select: { maintenances: true, inspections: true, repairs: true } },
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const trailer = await db.trailerUnit.findUnique({ where: { id: params.id }, include: INCLUDE })
  if (!trailer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(trailer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const trailer = await db.trailerUnit.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.companyId !== undefined && { companyId: body.companyId || null }),
      ...(body.patent !== undefined && { patent: body.patent ? body.patent.toUpperCase() : null }),
      ...(body.brand !== undefined && { brand: body.brand || null }),
      ...(body.model !== undefined && { model: body.model || null }),
      ...(body.year !== undefined && { year: body.year ? Number(body.year) : null }),
      ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber || null }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...('vehicleId' in body && { vehicleId: body.vehicleId }),
    },
    include: INCLUDE,
  })
  return NextResponse.json(trailer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.trailerUnit.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
