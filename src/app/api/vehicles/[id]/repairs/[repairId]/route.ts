import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function PATCH(req: NextRequest, { params }: { params: { repairId: string } }) {
  const body = await req.json()
  const repair = await db.vehicleRepair.update({
    where: { id: params.repairId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...('date' in body && { date: parseDateOnly(body.date) ?? new Date() }),
      ...('mileage' in body && { mileage: body.mileage ? Number(body.mileage) : null }),
      ...('cost' in body && { cost: body.cost ? Number(body.cost) : null }),
      ...('responsible' in body && { responsible: body.responsible || null }),
      ...('description' in body && { description: body.description || null }),
    },
  })
  return NextResponse.json(repair)
}

export async function DELETE(_: NextRequest, { params }: { params: { repairId: string } }) {
  await db.vehicleRepair.delete({ where: { id: params.repairId } })
  return NextResponse.json({ ok: true })
}
