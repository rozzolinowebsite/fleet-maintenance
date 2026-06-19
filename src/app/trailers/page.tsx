import { db } from '@/lib/db'
import Link from 'next/link'
import { Boxes, Plus, ChevronRight, Link2, Unlink } from 'lucide-react'

export const revalidate = 0

const TRAILER_TYPE_LABELS: Record<string, string> = {
  acoplado: 'Acoplado',
  semiremolque: 'Semiremolque',
}

export default async function TrailersPage() {
  const trailers = await db.trailer.findMany({
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
    orderBy: { domain: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acoplados</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {trailers.length} acoplado{trailers.length !== 1 ? 's' : ''} registrado{trailers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/trailers/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo acoplado</span>
        </Link>
      </div>

      {trailers.length === 0 ? (
        <div className="card text-center py-16">
          <Boxes size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No hay acoplados registrados</p>
          <p className="text-slate-500 text-sm mt-1">Comenzá agregando el primer acoplado de tu flota.</p>
          <Link href="/trailers/new" className="btn-primary inline-flex items-center gap-2 mt-6">
            <Plus size={16} />
            Agregar acoplado
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {trailers.map(t => (
            <Link
              key={t.id}
              href={`/trailers/${t.id}`}
              className="card flex items-center gap-4 hover:border-slate-700 transition-colors group p-4"
            >
              <Boxes size={20} className="text-slate-500 shrink-0" />

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
                <div>
                  <p className="font-bold text-white text-lg leading-tight">{t.domain}</p>
                  <p className="text-slate-400 text-sm">{t.brand} {t.model} · {t.year}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Tipo</p>
                  <p className="text-slate-300 text-sm">{TRAILER_TYPE_LABELS[t.trailerType] ?? t.trailerType}</p>
                  <p className="text-slate-500 text-xs">{t.subtype}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Ejes</p>
                  <p className="text-slate-300 text-sm">
                    {t.axleCount ? `${t.axleCount} ejes` : '—'}
                    {t.axleConfig ? ` · ${t.axleConfig}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Asociado a</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
