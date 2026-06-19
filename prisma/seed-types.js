const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const types = [
    { name: 'Moto', order: 1, features: { acoplado: 'none' } },
    { name: 'Auto / Camioneta', order: 2, features: { acoplado: 'none' } },
    { name: 'Camión Chasis', order: 3, features: { acoplado: 'optional' } },
    { name: 'Camión Semi', order: 4, features: { acoplado: 'required' } },
  ]

  for (const t of types) {
    await prisma.vehicleType.upsert({
      where: { name: t.name },
      update: { order: t.order, features: t.features },
      create: t,
    })
  }

  // Migrate existing vehicles without type to "Auto / Camioneta"
  const autoCamioneta = await prisma.vehicleType.findUnique({ where: { name: 'Auto / Camioneta' } })
  const updated = await prisma.vehicle.updateMany({
    where: { typeId: null },
    data: { typeId: autoCamioneta.id },
  })

  console.log(`Tipos creados/actualizados: ${types.length}`)
  console.log(`Vehículos migrados a "Auto / Camioneta": ${updated.count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
