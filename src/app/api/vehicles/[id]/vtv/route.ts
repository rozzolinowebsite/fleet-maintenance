import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const vtv = await db.vTV.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      expirationDate: new Date(body.expirationDate),
      lastDate: body.lastDate ? new Date(body.lastDate) : null,
      notes: body.notes || null,
    },
    update: {
      expirationDate: new Date(body.expirationDate),
      lastDate: body.lastDate ? new Date(body.lastDate) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(vtv)
}
