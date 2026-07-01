import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { filterId: string } }) {
  const body = await req.json()
  const filter = await db.vehicleFilter.update({
    where: { id: params.filterId },
    data: {
      ...(body.type !== undefined && { type: body.type || 'otro' }),
      ...(body.brand !== undefined && { brand: body.brand || null }),
      ...(body.code !== undefined && { code: body.code }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    },
    include: { equivalents: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json(filter)
}

export async function DELETE(_: NextRequest, { params }: { params: { filterId: string } }) {
  await db.vehicleFilter.delete({ where: { id: params.filterId } })
  return NextResponse.json({ ok: true })
}
