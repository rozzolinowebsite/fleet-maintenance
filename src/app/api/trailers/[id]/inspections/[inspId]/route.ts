import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; inspId: string } }) {
  await db.trailerInspection.delete({ where: { id: params.inspId } })
  return NextResponse.json({ ok: true })
}
