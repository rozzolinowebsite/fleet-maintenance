import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const expirationDate = parseDateOnly(body.expirationDate)
  if (!expirationDate) return NextResponse.json({ error: 'Fecha de vencimiento requerida' }, { status: 400 })
  const lastDate = parseDateOnly(body.lastDate)

  const vtv = await db.vTV.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      expirationDate,
      lastDate,
      notes: body.notes || null,
    },
    update: {
      expirationDate,
      lastDate,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(vtv)
}
