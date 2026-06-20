import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; mntId: string } }) {
  await db.trailerMaintenance.delete({ where: { id: params.mntId } })
  return NextResponse.json({ ok: true })
}
