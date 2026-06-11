import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { toolId: string } }) {
  const body = await req.json()
  const tool = await db.tool.update({
    where: { id: params.toolId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(tool)
}

export async function DELETE(_: NextRequest, { params }: { params: { toolId: string } }) {
  await db.tool.delete({ where: { id: params.toolId } })
  return NextResponse.json({ ok: true })
}
