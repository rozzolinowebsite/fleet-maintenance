import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; tid: string } }) {
  await db.driverTraining.delete({ where: { id: params.tid } })
  return NextResponse.json({ ok: true })
}
