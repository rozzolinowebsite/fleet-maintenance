import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const filters = await db.vehicleFilter.findMany({
    where: { vehicleId: params.id },
    include: { equivalents: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(filters)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.code) return NextResponse.json({ error: 'Codigo requerido' }, { status: 400 })
  const filter = await db.vehicleFilter.create({
    data: {
      vehicleId: params.id,
      type: body.type || 'otro',
      brand: body.brand || null,
      code: body.code,
      description: body.description || null,
      notes: body.notes || null,
    },
    include: { equivalents: true },
  })
  return NextResponse.json(filter, { status: 201 })
}
