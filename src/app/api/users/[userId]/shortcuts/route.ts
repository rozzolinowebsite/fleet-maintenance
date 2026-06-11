import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { userId: string } }) {
  const shortcuts = await db.userShortcut.findMany({
    where: { userId: params.userId },
    orderBy: { order: 'asc' },
  })
  // Attach vehicle info
  const vehicleIds = shortcuts.map(s => s.vehicleId).filter(Boolean) as string[]
  const vehicles = vehicleIds.length
    ? await db.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, plate: true, brand: true, model: true } })
    : []
  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]))
  return NextResponse.json(shortcuts.map(s => ({ ...s, vehicle: s.vehicleId ? vMap[s.vehicleId] : null })))
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const body = await req.json()
  const count = await db.userShortcut.count({ where: { userId: params.userId } })
  const shortcut = await db.userShortcut.create({
    data: {
      userId: params.userId,
      type: body.type,
      vehicleId: body.vehicleId || null,
      label: body.label || null,
      order: count,
    },
  })
  return NextResponse.json(shortcut, { status: 201 })
}
