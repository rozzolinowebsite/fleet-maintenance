import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const records = await db.trailerMaintenance.findMany({
    where: { trailerId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
  const record = await db.trailerMaintenance.create({
    data: {
      trailerId: params.id,
      type: body.type || 'engrase',
      date: new Date(body.date),
      responsible: body.responsible || null,
      observations: body.observations || null,
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
