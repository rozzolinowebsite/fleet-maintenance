import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createVehicleRepairLog } from '@/lib/repair-log'
import { parseDateOnly } from '@/lib/dates'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; fluidId: string } }) {
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description || null
  if (body.expiryMode !== undefined) data.expiryMode = body.expiryMode
  if (body.kmInterval !== undefined) data.kmInterval = body.kmInterval ? Number(body.kmInterval) : null
  if (body.lastKm !== undefined) data.lastKm = body.lastKm ? Number(body.lastKm) : null
  if (body.nextKm !== undefined) data.nextKm = body.nextKm ? Number(body.nextKm) : null
  if (body.lastDate !== undefined) data.lastDate = parseDateOnly(body.lastDate)
  if (body.nextDate !== undefined) data.nextDate = parseDateOnly(body.nextDate)
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.showMaintenanceBtn !== undefined) data.showMaintenanceBtn = Boolean(body.showMaintenanceBtn)
  const previous = await db.fluid.findUnique({ where: { id: params.fluidId } })
  const fluid = await db.fluid.update({ where: { id: params.fluidId }, data })
  if (previous && (body.lastKm !== undefined || body.lastDate !== undefined || body.nextKm !== undefined || body.nextDate !== undefined)) {
    await createVehicleRepairLog(req, params.id, {
      date: body.lastDate || undefined,
      title: `Mantenimiento de ${previous.name}`,
      mileage: body.lastKm ?? null,
      source: 'fluid',
      description: body.notes || null,
    })
  }
  return NextResponse.json(fluid)
}

export async function DELETE(_: NextRequest, { params }: { params: { fluidId: string } }) {
  await db.fluid.delete({ where: { id: params.fluidId } })
  return NextResponse.json({ ok: true })
}
