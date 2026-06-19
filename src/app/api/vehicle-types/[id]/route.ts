import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const type = await db.vehicleType.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.features !== undefined && { features: body.features }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(type)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const count = await db.vehicle.count({ where: { typeId: params.id } })
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${count} vehículo(s) con este tipo` },
      { status: 409 }
    )
  }
  await db.vehicleType.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
