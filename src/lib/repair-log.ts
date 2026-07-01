import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export function currentUserId(req: NextRequest) {
  return req.cookies.get('fleet_user_id')?.value ?? null
}

export async function createVehicleRepairLog(req: NextRequest, vehicleId: string, data: {
  date?: string | null
  title: string
  mileage?: number | string | null
  description?: string | null
  source?: string
  status?: string
}) {
  return db.vehicleRepair.create({
    data: {
      vehicleId,
      date: parseDateOnly(data.date) ?? new Date(),
      title: data.title,
      status: data.status ?? 'done',
      mileage: data.mileage !== undefined && data.mileage !== null && data.mileage !== '' ? Number(data.mileage) : null,
      description: data.description || null,
      source: data.source ?? null,
      registeredById: currentUserId(req),
    },
  })
}
