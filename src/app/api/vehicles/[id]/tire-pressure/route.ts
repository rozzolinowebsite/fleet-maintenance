import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const f = (v: unknown) => (v !== '' && v !== null && v !== undefined ? Number(v) : null)
  const tire = await db.tirePressure.upsert({
    where: { vehicleId: params.id },
    create: {
      vehicleId: params.id,
      frontLeft: f(body.frontLeft),
      frontRight: f(body.frontRight),
      rearLeft: f(body.rearLeft),
      rearRight: f(body.rearRight),
      spare: f(body.spare),
      recommended: Number(body.recommended) || 32,
      lastCheck: new Date(),
      notes: body.notes || null,
    },
    update: {
      frontLeft: f(body.frontLeft),
      frontRight: f(body.frontRight),
      rearLeft: f(body.rearLeft),
      rearRight: f(body.rearRight),
      spare: f(body.spare),
      recommended: Number(body.recommended) || 32,
      lastCheck: new Date(),
      notes: body.notes || null,
    },
  })
  return NextResponse.json(tire)
}
