import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { parseDateOnly } from '@/lib/dates'

export async function GET() {
  const drivers = await db.driver.findMany({
    include: {
      currentVehicle: { select: { id: true, plate: true, brand: true, model: true } },
      currentTrailer: { select: { id: true, domain: true, brand: true, model: true } },
      events: { orderBy: { date: 'desc' }, take: 2 },
      trainings: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { fullName: 'asc' },
  })
  return NextResponse.json(drivers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const driver = await db.driver.create({
    data: {
      fullName: body.fullName,
      dni: body.dni || null,
      cuil: body.cuil || null,
      birthDate: parseDateOnly(body.birthDate),
      address: body.address || null,
      phone: body.phone || null,
      emergencyContact: body.emergencyContact || null,
      licenseCategories: body.licenseCategories ?? [],
      licenseExpiry: parseDateOnly(body.licenseExpiry),
      psychoDate: parseDateOnly(body.psychoDate),
      psychoExpiry: parseDateOnly(body.psychoExpiry),
      preOccupDate: parseDateOnly(body.preOccupDate),
      preOccupResult: body.preOccupResult || null,
      legajo: body.legajo || null,
      hireDate: parseDateOnly(body.hireDate),
      position: body.position || null,
      agreement: body.agreement || null,
      operativeBase: body.operativeBase || null,
      status: body.status || 'active',
    },
  })
  revalidatePath('/drivers')
  return NextResponse.json(driver, { status: 201 })
}
