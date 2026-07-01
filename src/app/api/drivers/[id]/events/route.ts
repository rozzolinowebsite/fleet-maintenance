import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const event = await db.driverEvent.create({
    data: {
      driverId: params.id,
      type: body.type,
      date: parseDateOnly(body.date) ?? new Date(),
      description: body.description || null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
