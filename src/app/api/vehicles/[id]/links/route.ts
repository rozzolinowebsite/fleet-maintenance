import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const link = await db.customLink.create({
    data: {
      vehicleId: params.id,
      label: body.label,
      url: body.url,
      icon: body.icon || null,
      order: Number(body.order) || 0,
    },
  })
  return NextResponse.json(link, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { linkId } = await req.json()
  await db.customLink.delete({ where: { id: linkId } })
  return NextResponse.json({ ok: true })
}
