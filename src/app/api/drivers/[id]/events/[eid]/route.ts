import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; eid: string } }) {
  await db.driverEvent.delete({ where: { id: params.eid } })
  return NextResponse.json({ ok: true })
}
