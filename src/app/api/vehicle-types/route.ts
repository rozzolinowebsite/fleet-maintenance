import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const types = await db.vehicleType.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(types)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }
  const maxOrder = await db.vehicleType.aggregate({ _max: { order: true } })
  const type = await db.vehicleType.create({
    data: {
      name: body.name.trim(),
      order: (maxOrder._max.order ?? 0) + 1,
      features: body.features ?? {},
    },
  })
  return NextResponse.json(type, { status: 201 })
}
