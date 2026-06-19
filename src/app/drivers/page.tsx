import Link from 'next/link'
import { Plus, UserCog, Car, Boxes, AlertTriangle } from 'lucide-react'
import { db } from '@/lib/db'

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', leave: 'Licencia', vacation: 'Vacaciones',
  suspended: 'Suspendido', terminated: 'Baja',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  leave: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vacation: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  suspended: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  terminated: 'bg-red-500/15 text-red-400 border-red-500/20',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function licenseStatus(expiry: Date | null) {
  if (!expiry) return null
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Vencida', cls: 'text-red-400' }
  if (days <= 30) return { label: `${days}d`, cls: 'text-yellow-400' }
  return { label: `${days}d`, cls: 'text-emerald-400' }
}

export default async function DriversPage() {
  const drivers = await db.driver.findMany({
    include: {
      currentVehicle: { select: { plate: true } },
      currentTrailer: { select: { domain: true } },
      events: { orderBy: { date: 'desc' }, take: 2 },
      trainings: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { fullName: 'asc' },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conductores</h1>
          <p className="text-slate-400 text-sm mt-0.5">{drivers.length} registrados</p>
        </div>
        <Link href="/drivers/new" className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Nuevo conductor
        </Link>
      </div>

      {drivers.length === 0 ? (
        <div className="card text-center py-16">
          <UserCog size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No hay conductores registrados.</p>
          <Link href="/drivers/new" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition-colors">
            Agregar el primero →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map(d => {
            const lic = licenseStatus(d.licenseExpiry)
            const lastInfraction = d.events.find(e => e.type === 'infraction')
            const lastAccident = d.events.find(e => e.type === 'accident')
            return (
              <Link
                key={d.id}
                href={`/drivers/${d.id}`}
                className="card hover:border-slate-600 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-white font-bold text-sm group-hover:border-blue-500/50 transition-colors">
                    {initials(d.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">{d.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[d.status] ?? STATUS_COLORS.terminated}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </div>
                    {d.legajo && <p className="text-slate-500 text-xs mt-0.5">Legajo {d.legajo}</p>}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  {d.currentVehicle ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Car size={11} className="shrink-0" />
                      <span className="truncate">{d.currentVehicle.plate}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Car size={11} className="shrink-0" />
                      <span>Sin vehículo asignado</span>
                    </div>
                  )}
                  {d.currentTrailer && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Boxes size={11} className="shrink-0" />
                      <span>{d.currentTrailer.domain}</span>
                    </div>
                  )}
                  {lic && (
                    <div className={`flex items-center gap-2 ${lic.cls}`}>
                      <AlertTriangle size={11} className="shrink-0" />
                      <span>Licencia vence en {lic.label}</span>
                    </div>
                  )}
                  {(lastInfraction || lastAccident) && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <AlertTriangle size={11} className="shrink-0" />
                      <span>
                        {lastAccident ? `Accidente ${new Date(lastAccident.date).toLocaleDateString('es-AR')}` :
                         lastInfraction ? `Infracción ${new Date(lastInfraction.date).toLocaleDateString('es-AR')}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
