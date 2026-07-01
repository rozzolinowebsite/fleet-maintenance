import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: Request, { params }: { params: { equivalentId: string } }) {
  await db.filterEquivalent.delete({ where: { id: params.equivalentId } })
  return NextResponse.json({ ok: true })
}
