import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId, pin } = await req.json()
  const user = await db.user.findUnique({ where: { id: userId, active: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
  if (user.pin && user.pin !== pin) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  const res = NextResponse.json(user)
  res.cookies.set('fleet_user_id', user.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  return res
}
