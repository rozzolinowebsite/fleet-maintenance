import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const fluids = await db.fluid.findMany({
    where: { vehicleId: params.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(fluids)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const fluid = await db.fluid.create({
    data: {
      vehicleId: params.id,
      name: body.name,
      description: body.description || null,
      expiryMode: body.expiryMode || 'date',
      kmInterval: body.kmInterval ? Number(body.kmInterval) : null,
      lastKm: body.lastKm ? Number(body.lastKm) : null,
      nextKm: body.nextKm ? Number(body.nextKm) : null,
      lastDate: body.lastDate ? new Date(body.lastDate) : null,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      notes: body.notes || null,
      showMaintenanceBtn: body.showMaintenanceBtn !== undefined ? Boolean(body.showMaintenanceBtn) : true,
    },
  })
  return NextResponse.json(fluid, { status: 201 })
}
