import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const record = await db.fireExtinguisher.upsert({
    where: { vehicleId: params.id },
    update: {
      expirationDate: new Date(body.expirationDate),
      notes: body.notes ?? null,
    },
    create: {
      vehicleId: params.id,
      expirationDate: new Date(body.expirationDate),
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.fireExtinguisher.delete({ where: { vehicleId: params.id } })
  return NextResponse.json({ ok: true })
}
