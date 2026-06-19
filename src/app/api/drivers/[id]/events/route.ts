import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const event = await db.driverEvent.create({
    data: {
      driverId: params.id,
      type: body.type,
      date: new Date(body.date),
      description: body.description || null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
