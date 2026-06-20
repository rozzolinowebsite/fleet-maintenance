import { db } from '@/lib/db'
import { getDocumentStatus, fmtDate, statusBg } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import Link from 'next/link'
import { Package2, Plus, ChevronRight, Link2, Unlink, AlertTriangle } from 'lucide-react'

export const revalidate = 0

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  MAINTENANCE: 'En mantenimiento',
}

export default async function TrailersPage() {
  const trailers = await db.trailerUnit.findMany({
    include: {
      vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      documents: { select: { id: true, type: true, expiryDate: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trailers</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {trailers.length} trailer{trailers.length !== 1 ? 's' : ''} registrado{trailers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/trailers/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo trailer</span>
        </Link>
      </div>

      {trailers.length === 0 ? (
        <div className="card text-center py-16">
          <Package2 size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No hay trailers registrados</p>
          <p className="text-slate-500 text-sm mt-1">Comenzá agregando el primer trailer de tu flota.</p>
          <Link href="/trailers/new" className="btn-primary inline-flex items-center gap-2 mt-6">
            <Plus size={16} />
            Agregar trailer
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {trailers.map(t => {
            const expiringDocs = t.documents.filter(d => {
              if (!d.expiryDate) return false
              const days = differenceInDays(new Date(d.expiryDate), new Date())
              return days <= 30
            })
            const worstDocStatus = t.documents.reduce((worst, d) => {
              if (!d.expiryDate) return worst
              const s = getDocumentStatus(d.expiryDate)
              if (s === 'danger') return 'danger'
              if (s === 'warning' && worst !== 'danger') return 'warning'
              return worst
            }, 'ok' as string)

            return (
              <Link
                key={t.id}
                href={`/trailers/${t.id}`}
                className="card flex items-center gap-4 hover:border-slate-700 transition-colors group p-4"
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  worstDocStatus === 'danger' ? 'bg-red-500'
                  : worstDocStatus === 'warning' ? 'bg-amber-500'
                  : t.documents.length > 0 ? 'bg-emerald-500' : 'bg-slate-600'
                }`} />

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">{t.name}</p>
                    {t.patent && <p className="text-slate-400 text-sm">{t.patent}</p>}
                    {(t.brand || t.model) && (
                      <p className="text-slate-500 text-xs">{[t.brand, t.model].filter(Boolean).join(' ')}{t.year ? ` · ${t.year}` : ''}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Estado</p>
                    <p className="text-slate-300 text-sm">{STATUS_LABELS[t.status] ?? t.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Documentos</p>
                    <p className="text-slate-300 text-sm">
                      {t.documents.length} doc{t.documents.length !== 1 ? 's' : ''}
                      {expiringDocs.length > 0 && (
                        <span className="ml-1.5 text-amber-400 text-xs">
                          <AlertTriangle size={11} className="inline mr-0.5 -mt-0.5" />
                          {expiringDocs.length} por vencer
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Vehículo</p>
                    {t.vehicle ? (
                      <div className="flex items-center gap-1.5">
                        <Link2 size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 text-sm font-medium">{t.vehicle.plate}</span>
                        <span className="text-slate-500 text-xs">{t.vehicle.brand}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Unlink size={12} className="text-slate-600 shrink-0" />
                        <span className="text-slate-600 text-sm">Sin asignar</span>
                      </div>
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
