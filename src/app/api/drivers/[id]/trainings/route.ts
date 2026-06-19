import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const training = await db.driverTraining.create({
    data: {
      driverId: params.id,
      name: body.name,
      date: body.date ? new Date(body.date) : null,
      expiry: body.expiry ? new Date(body.expiry) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(training, { status: 201 })
}
