import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const data = {
    lastKm: Number(body.lastKm),
    lastDate: new Date(body.lastDate),
    kmInterval: body.kmInterval ? Number(body.kmInterval) : 20000,
    nextKm: body.nextKm ? Number(body.nextKm) : null,
    nextDate: body.nextDate ? new Date(body.nextDate) : null,
    notes: body.notes || null,
  }
  const result = await db.alignmentBalance.upsert({
    where: { vehicleId: params.id },
    update: data,
    create: { vehicleId: params.id, ...data },
  })
  return NextResponse.json(result)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.alignmentBalance.delete({ where: { vehicleId: params.id } })
  return NextResponse.json({ ok: true })
}
