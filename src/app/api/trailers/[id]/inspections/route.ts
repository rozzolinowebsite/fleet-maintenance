import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const records = await db.trailerInspection.findMany({
    where: { trailerId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

  const checkFields = ['tires', 'lights', 'hitch', 'chains', 'brakes', 'cleaning', 'woodFloor']
  const hasRepair = checkFields.some(f => body[f] === 'repair')
  const hasObs = checkFields.some(f => body[f] === 'observation')
  const generalResult = body.generalResult ?? (hasRepair ? 'repair' : hasObs ? 'observations' : 'ok')

  const record = await db.trailerInspection.create({
    data: {
      trailerId: params.id,
      date: new Date(body.date),
      inspector: body.inspector || null,
      generalResult,
      observations: body.observations || null,
      tires: body.tires || 'ok',
      tiresNote: body.tiresNote || null,
      lights: body.lights || 'ok',
      lightsNote: body.lightsNote || null,
      hitch: body.hitch || 'ok',
      hitchNote: body.hitchNote || null,
      chains: body.chains || 'ok',
      chainsNote: body.chainsNote || null,
      brakes: body.brakes || 'ok',
      brakesNote: body.brakesNote || null,
      cleaning: body.cleaning || 'ok',
      cleaningNote: body.cleaningNote || null,
      woodFloor: body.woodFloor || 'ok',
      woodFloorNote: body.woodFloorNote || null,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
