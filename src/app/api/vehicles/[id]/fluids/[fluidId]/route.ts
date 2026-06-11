import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; fluidId: string } }) {
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description || null
  if (body.expiryMode !== undefined) data.expiryMode = body.expiryMode
  if (body.kmInterval !== undefined) data.kmInterval = body.kmInterval ? Number(body.kmInterval) : null
  if (body.lastKm !== undefined) data.lastKm = body.lastKm ? Number(body.lastKm) : null
  if (body.nextKm !== undefined) data.nextKm = body.nextKm ? Number(body.nextKm) : null
  if (body.lastDate !== undefined) data.lastDate = body.lastDate ? new Date(body.lastDate) : null
  if (body.nextDate !== undefined) data.nextDate = body.nextDate ? new Date(body.nextDate) : null
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.showMaintenanceBtn !== undefined) data.showMaintenanceBtn = Boolean(body.showMaintenanceBtn)
  const fluid = await db.fluid.update({ where: { id: params.fluidId }, data })
  return NextResponse.json(fluid)
}

export async function DELETE(_: NextRequest, { params }: { params: { fluidId: string } }) {
  await db.fluid.delete({ where: { id: params.fluidId } })
  return NextResponse.json({ ok: true })
}
