import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.role !== undefined) data.role = body.role
  if (body.pin !== undefined) data.pin = body.pin || null
  const user = await db.user.update({ where: { id: params.userId }, data })
  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: { params: { userId: string } }) {
  await db.user.update({ where: { id: params.userId }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
