import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function PATCH(req: NextRequest, { params }: { params: { repairId: string } }) {
  const body = await req.json()
  const repair = await db.trailerRepair.update({
    where: { id: params.repairId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...('date' in body && { date: parseDateOnly(body.date) ?? new Date() }),
      ...('materialCost' in body && { materialCost: body.materialCost ? Number(body.materialCost) : null }),
      ...('laborCost' in body && { laborCost: body.laborCost ? Number(body.laborCost) : null }),
      ...('cost' in body && { cost: body.cost ? Number(body.cost) : null }),
      ...('responsible' in body && { responsible: body.responsible || null }),
      ...('repairerUserId' in body && { repairerUserId: body.repairerUserId === 'other' ? null : body.repairerUserId || null }),
      ...('repairerOther' in body && { repairerOther: body.repairerOther || null }),
      ...('description' in body && { description: body.description || null }),
    },
    include: {
      repairerUser: { select: { id: true, name: true } },
      registeredBy: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(repair)
}

export async function DELETE(_: NextRequest, { params }: { params: { repairId: string } }) {
  await db.trailerRepair.delete({ where: { id: params.repairId } })
  return NextResponse.json({ ok: true })
}
