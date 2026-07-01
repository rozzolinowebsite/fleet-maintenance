import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const training = await db.driverTraining.create({
    data: {
      driverId: params.id,
      name: body.name,
      date: parseDateOnly(body.date),
      expiry: parseDateOnly(body.expiry),
      notes: body.notes || null,
    },
  })
  return NextResponse.json(training, { status: 201 })
}
