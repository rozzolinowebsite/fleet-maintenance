import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const review = await db.dailyReview.create({
    data: {
      vehicleId: params.id,
      date: new Date(),
      userId: body.userId || null,
      reviewer: body.reviewer || null,
      items: body.items,
      kmReading: body.kmReading ? Number(body.kmReading) : null,
      notes: body.notes || null,
    },
  })
  if (body.kmReading) {
    await db.vehicle.update({
      where: { id: params.id },
      data: { kmCurrent: Number(body.kmReading) },
    })
  }
  return NextResponse.json(review, { status: 201 })
}
