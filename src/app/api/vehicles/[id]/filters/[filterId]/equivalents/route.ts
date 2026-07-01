import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { filterId: string } }) {
  const body = await req.json()
  if (!body.brand || !body.code) return NextResponse.json({ error: 'Marca y codigo requeridos' }, { status: 400 })
  const equivalent = await db.filterEquivalent.create({
    data: {
      filterId: params.filterId,
      brand: body.brand,
      code: body.code,
      description: body.description || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(equivalent, { status: 201 })
}
