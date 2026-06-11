import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('fleet_user_id')?.value
  if (!userId) return NextResponse.json(null)
  const user = await db.user.findUnique({ where: { id: userId, active: true } })
  return NextResponse.json(user ?? null)
}
