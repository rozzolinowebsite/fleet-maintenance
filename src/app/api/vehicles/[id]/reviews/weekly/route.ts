import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfWeek } from 'date-fns'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const km = body.kmReading ? Number(body.kmReading) : null
    const [review] = await db.$transaction([
      db.weeklyReview.create({
        data: {
          vehicleId: params.id,
          weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
          userId: body.userId || null,
          reviewer: body.reviewer || null,
          kmReading: km,
          insuranceOk: body.insuranceOk ?? null,
          items: body.items ?? [],
          fluidChecks: body.fluidChecks ?? null,
          inventoryChecks: body.inventoryChecks ?? null,
          notes: body.notes || null,
        },
      }),
      ...(km ? [db.vehicle.update({ where: { id: params.id }, data: { kmCurrent: km } })] : []),
    ])
    return NextResponse.json(review, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error al guardar' }, { status: 500 })
  }
}
