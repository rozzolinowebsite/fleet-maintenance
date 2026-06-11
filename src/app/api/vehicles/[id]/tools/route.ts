import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const tool = await db.tool.create({
    data: {
      vehicleId: params.id,
      name: body.name,
      quantity: Number(body.quantity) || 1,
      condition: body.condition || 'good',
      notes: body.notes || null,
    },
  })
  return NextResponse.json(tool, { status: 201 })
}
