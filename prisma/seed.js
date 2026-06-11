const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      role: 'admin',
      pin: '1234',
      active: true,
    },
  })

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      plate: 'ABC123',
      brand: 'Ford',
      model: 'Transit',
      year: 2022,
      color: 'Blanco',
      kmCurrent: 45000,
      notes: 'Vehículo de ejemplo',
    },
  })

  // Oil change
  await prisma.oilChange.create({
    data: {
      vehicleId: vehicle.id,
      kmInterval: 10000,
      lastKm: 40000,
      lastDate: new Date('2025-01-15'),
      nextKm: 50000,
      oilType: '10W-40',
    },
  })

  // VTV
  await prisma.vTV.create({
    data: {
      vehicleId: vehicle.id,
      expirationDate: new Date('2026-12-31'),
      lastDate: new Date('2025-06-01'),
    },
  })

  // Fire extinguisher
  await prisma.fireExtinguisher.create({
    data: {
      vehicleId: vehicle.id,
      expirationDate: new Date('2026-06-30'),
    },
  })

  // Tire pressure
  await prisma.tirePressure.create({
    data: {
      vehicleId: vehicle.id,
      frontLeft: 32,
      frontRight: 32,
      rearLeft: 32,
      rearRight: 32,
      spare: 35,
      recommended: 32,
      lastCheck: new Date(),
    },
  })

  // Tools
  await prisma.tool.createMany({
    data: [
      { vehicleId: vehicle.id, name: 'Llave de rueda', quantity: 1, condition: 'good' },
      { vehicleId: vehicle.id, name: 'Gato hidráulico', quantity: 1, condition: 'good' },
      { vehicleId: vehicle.id, name: 'Triángulos de emergencia', quantity: 2, condition: 'good' },
    ],
  })

  console.log('Seed completado: 1 usuario admin, 1 vehículo (Ford Transit ABC123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
