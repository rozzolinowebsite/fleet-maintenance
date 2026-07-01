import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'
import { currentUserId } from '@/lib/repair-log'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const repairs = await db.trailerRepair.findMany({
    where: { trailerId: params.id },
    include: {
      repairerUser: { select: { id: true, name: true } },
      registeredBy: { select: { id: true, name: true } },
    },
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
      materialCost: body.materialCost ? Number(body.materialCost) : null,
      laborCost: body.laborCost ? Number(body.laborCost) : null,
      cost: body.cost ? Number(body.cost) : (Number(body.materialCost || 0) + Number(body.laborCost || 0) || null),
      responsible: body.responsible || null,
      repairerUserId: body.repairerUserId === 'other' ? null : body.repairerUserId || null,
      repairerOther: body.repairerUserId === 'other' ? body.repairerOther || null : null,
      registeredById: currentUserId(req),
      description: body.description || null,
    },
    include: {
      repairerUser: { select: { id: true, name: true } },
      registeredBy: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(repair, { status: 201 })
}
