import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const vehicle = await db.vehicle.findUnique({
    where: { id: params.id },
    include: {
      type: true,
      trailers: { orderBy: { domain: 'asc' }, select: { id: true, domain: true, brand: true, model: true, trailerType: true, subtype: true } },
      oilChange: true,
      vtv: true,
      fireExtinguisher: true,
      tirePressure: true,
      alignmentBalance: true,
      tools: { orderBy: { createdAt: 'asc' } },
      fluids: { orderBy: { createdAt: 'asc' } },
      filters: { orderBy: { createdAt: 'asc' }, include: { equivalents: { orderBy: { createdAt: 'asc' } } } },
      dailyReviews: { orderBy: { date: 'desc' }, take: 10, include: { user: true } },
      weeklyReviews: { orderBy: { weekStart: 'desc' }, take: 5, include: { user: true } },
      links: { orderBy: { order: 'asc' } },
      repairs: {
        orderBy: { date: 'desc' },
        include: {
          repairerUser: { select: { id: true, name: true } },
          registeredBy: { select: { id: true, name: true } },
        },
      },
    },
  })
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(vehicle)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const vehicle = await db.vehicle.update({
    where: { id: params.id },
    data: {
      ...(body.plate && { plate: body.plate.toUpperCase() }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.year !== undefined && { year: Number(body.year) }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.kmCurrent !== undefined && { kmCurrent: Number(body.kmCurrent) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.weeklyFluidItems !== undefined && { weeklyFluidItems: body.weeklyFluidItems }),
      ...(body.weeklyInventoryItems !== undefined && { weeklyInventoryItems: body.weeklyInventoryItems }),
      ...(body.typeId !== undefined && { typeId: body.typeId }),
      ...('warrantyExpiry' in body && { warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null }),
      ...('insuranceCompany' in body && { insuranceCompany: body.insuranceCompany || null }),
      ...('policyNumber' in body && { policyNumber: body.policyNumber || null }),
      ...('policyStartDate' in body && { policyStartDate: body.policyStartDate ? new Date(body.policyStartDate) : null }),
      ...('policyExpirationDate' in body && { policyExpirationDate: body.policyExpirationDate ? new Date(body.policyExpirationDate) : null }),
    },
  })
  return NextResponse.json(vehicle)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.vehicle.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
