import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: { userId: string; shortcutId: string } }) {
  await db.userShortcut.delete({ where: { id: params.shortcutId, userId: params.userId } })
  return NextResponse.json({ ok: true })
}
