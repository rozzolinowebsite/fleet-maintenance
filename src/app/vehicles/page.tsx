import { db } from '@/lib/db'
import { getVTVStatus, getOilChangeStatus, getAlignmentStatus, fmtDate, statusDot, statusBg } from '@/lib/utils'
import Link from 'next/link'
import { Car, Plus, ChevronRight } from 'lucide-react'

export const revalidate = 0

export default async function VehiclesPage() {
  const vehicles = await db.vehicle.findMany({
    include: { type: true, vtv: true, oilChange: true, alignmentBalance: true, tirePressure: true, tools: true },
    orderBy: { plate: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} en la flota</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo vehículo</span>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="card text-center py-16">
          <Car size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No hay vehículos registrados</p>
          <p className="text-slate-500 text-sm mt-1">Comenzá agregando el primer vehículo de tu flota.</p>
          <Link href="/vehicles/new" className="btn-primary inline-flex items-center gap-2 mt-6">
            <Plus size={16} />
            Agregar vehículo
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map(v => {
            const vtvS = v.vtv ? getVTVStatus(v.vtv.expirationDate) : 'unknown'
            const oilS = v.oilChange ? getOilChangeStatus(v.kmCurrent, v.oilChange.nextKm, v.oilChange.nextDate) : 'unknown'
            const alignS = v.alignmentBalance ? getAlignmentStatus(v.kmCurrent, v.alignmentBalance.nextKm, v.alignmentBalance.nextDate) : 'unknown'
            const worst = [vtvS, oilS, alignS].includes('danger') ? 'danger'
              : [vtvS, oilS, alignS].includes('warning') ? 'warning'
              : [vtvS, oilS, alignS].every(s => s === 'ok') ? 'ok' : 'unknown'

            return (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className="card flex items-center gap-4 hover:border-slate-700 transition-colors group p-4"
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${statusDot(worst)}`} />

                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 min-w-0">
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">{v.plate}</p>
                    <p className="text-slate-400 text-sm">{v.brand} {v.model}</p>
                    {v.type && (
                      <span className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {v.type.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Año / KM</p>
                    <p className="text-slate-300 text-sm">{v.year} · {v.kmCurrent.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">VTV/RTO</p>
                    {v.vtv ? (
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(vtvS)}`}>
                        {fmtDate(v.vtv.expirationDate)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">Sin registrar</span>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Aceite</p>
                    {v.oilChange ? (
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(oilS)}`}>
                        {v.oilChange.nextKm.toLocaleString()} km
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">Sin registrar</span>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Alineación</p>
                    {v.alignmentBalance ? (
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(alignS)}`}>
                        {v.alignmentBalance.nextKm
                          ? v.alignmentBalance.nextKm.toLocaleString() + ' km'
                          : fmtDate(v.alignmentBalance.lastDate)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">Sin registrar</span>
                    )}
                  </div>
                </div>

                <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
