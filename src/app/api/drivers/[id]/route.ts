import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const driver = await db.driver.findUnique({
    where: { id: params.id },
    include: {
      currentVehicle: { select: { id: true, plate: true, brand: true, model: true, year: true } },
      currentTrailer: { select: { id: true, domain: true, brand: true, model: true, trailerType: true } },
      trainings: { orderBy: { createdAt: 'desc' } },
      history: { orderBy: { assignedAt: 'desc' }, take: 30 },
      events: { orderBy: { date: 'desc' } },
    },
  })
  if (!driver) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(driver)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  // If vehicle or trailer is being reassigned, create a history entry
  if ('currentVehicleId' in body || 'currentTrailerId' in body) {
    const current = await db.driver.findUnique({
      where: { id: params.id },
      include: {
        currentVehicle: { select: { plate: true } },
        currentTrailer: { select: { domain: true } },
      },
    })

    let newVehiclePlate: string | null = null
    let newTrailerDomain: string | null = null

    if ('currentVehicleId' in body && body.currentVehicleId) {
      const v = await db.vehicle.findUnique({ where: { id: body.currentVehicleId }, select: { plate: true } })
      newVehiclePlate = v?.plate ?? null
    }
    if ('currentTrailerId' in body && body.currentTrailerId) {
      const t = await db.trailer.findUnique({ where: { id: body.currentTrailerId }, select: { domain: true } })
      newTrailerDomain = t?.domain ?? null
    }

    const vehicleChanged = 'currentVehicleId' in body && body.currentVehicleId !== current?.currentVehicleId
    const trailerChanged = 'currentTrailerId' in body && body.currentTrailerId !== current?.currentTrailerId

    if (vehicleChanged || trailerChanged) {
      await db.driverVehicleHistory.create({
        data: {
          driverId: params.id,
          vehiclePlate: vehicleChanged
            ? (newVehiclePlate ?? null)
            : (current?.currentVehicle?.plate ?? null),
          trailerDomain: trailerChanged
            ? (newTrailerDomain ?? null)
            : (current?.currentTrailer?.domain ?? null),
          assignedBy: body.assignedBy ?? null,
        },
      })
    }
  }

  const driver = await db.driver.update({
    where: { id: params.id },
    data: {
      ...(body.fullName !== undefined && { fullName: body.fullName }),
      ...(body.dni !== undefined && { dni: body.dni || null }),
      ...(body.cuil !== undefined && { cuil: body.cuil || null }),
      ...(body.birthDate !== undefined && { birthDate: body.birthDate ? new Date(body.birthDate) : null }),
      ...(body.address !== undefined && { address: body.address || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.emergencyContact !== undefined && { emergencyContact: body.emergencyContact || null }),
      ...(body.licenseCategories !== undefined && { licenseCategories: body.licenseCategories }),
      ...(body.licenseExpiry !== undefined && { licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null }),
      ...(body.psychoDate !== undefined && { psychoDate: body.psychoDate ? new Date(body.psychoDate) : null }),
      ...(body.psychoExpiry !== undefined && { psychoExpiry: body.psychoExpiry ? new Date(body.psychoExpiry) : null }),
      ...(body.preOccupDate !== undefined && { preOccupDate: body.preOccupDate ? new Date(body.preOccupDate) : null }),
      ...(body.preOccupResult !== undefined && { preOccupResult: body.preOccupResult || null }),
      ...(body.legajo !== undefined && { legajo: body.legajo || null }),
      ...(body.hireDate !== undefined && { hireDate: body.hireDate ? new Date(body.hireDate) : null }),
      ...(body.position !== undefined && { position: body.position || null }),
      ...(body.agreement !== undefined && { agreement: body.agreement || null }),
      ...(body.operativeBase !== undefined && { operativeBase: body.operativeBase || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...('currentVehicleId' in body && { currentVehicleId: body.currentVehicleId || null }),
      ...('currentTrailerId' in body && { currentTrailerId: body.currentTrailerId || null }),
    },
  })
  return NextResponse.json(driver)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.driver.delete({ where: { id: params.id } })
  revalidatePath('/drivers')
  return NextResponse.json({ ok: true })
}
