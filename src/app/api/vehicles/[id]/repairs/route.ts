import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const repairs = await db.vehicleRepair.findMany({
    where: { vehicleId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(repairs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Detalle requerido' }, { status: 400 })
  const date = parseDateOnly(body.date) ?? new Date()

  const repair = await db.vehicleRepair.create({
    data: {
      vehicleId: params.id,
      date,
      title: body.title,
      status: body.status || 'open',
      mileage: body.mileage ? Number(body.mileage) : null,
      cost: body.cost ? Number(body.cost) : null,
      responsible: body.responsible || null,
      description: body.description || null,
    },
  })
  return NextResponse.json(repair, { status: 201 })
}
