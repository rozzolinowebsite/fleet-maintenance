import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const repairs = await db.trailerRepair.findMany({
    where: { trailerId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(repairs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Detalle requerido' }, { status: 400 })
  const date = parseDateOnly(body.date) ?? new Date()

  const repair = await db.trailerRepair.create({
    data: {
      trailerId: params.id,
      date,
      title: body.title,
      status: body.status || 'open',
      cost: body.cost ? Number(body.cost) : null,
      responsible: body.responsible || null,
      description: body.description || null,
    },
  })
  return NextResponse.json(repair, { status: 201 })
}
