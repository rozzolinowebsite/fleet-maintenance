import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { name, role, pin } = await req.json()
  const user = await db.user.create({
    data: { name, role: role || 'driver', pin: pin || null },
  })
  return NextResponse.json(user, { status: 201 })
}
