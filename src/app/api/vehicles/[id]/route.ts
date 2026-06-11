import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const vehicle = await db.vehicle.findUnique({
    where: { id: params.id },
    include: {
      oilChange: true,
      vtv: true,
      fireExtinguisher: true,
      tirePressure: true,
      alignmentBalance: true,
      tools: { orderBy: { createdAt: 'asc' } },
      fluids: { orderBy: { createdAt: 'asc' } },
      dailyReviews: { orderBy: { date: 'desc' }, take: 10, include: { user: true } },
      weeklyReviews: { orderBy: { weekStart: 'desc' }, take: 5, include: { user: true } },
      links: { orderBy: { order: 'asc' } },
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
    },
  })
  return NextResponse.json(vehicle)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.vehicle.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
