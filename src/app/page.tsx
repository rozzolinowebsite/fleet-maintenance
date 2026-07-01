import { db } from '@/lib/db'
import { getVTVStatus, getOilChangeStatus, getAlignmentStatus, getInsuranceStatus, getDocumentStatus, fmtDate, statusDot, statusBg } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import Link from 'next/link'
import { Car, AlertTriangle, Clock, CheckCircle2, Plus, Shield, Package2, UserCog } from 'lucide-react'
import ShortcutsSection from '@/components/ShortcutsSection'

export const revalidate = 0

export default async function DashboardPage() {
  const vehicles = await db.vehicle.findMany({
    include: { vtv: true, oilChange: true, alignmentBalance: true, tirePressure: true },
    orderBy: { createdAt: 'desc' },
  })

  const trailerUnits = await db.trailerUnit.findMany({
    include: { documents: true },
    orderBy: { name: 'asc' },
  })

  const drivers = await db.driver.findMany({
    orderBy: { fullName: 'asc' },
  })

  type Alert = {
    vehicleId?: string
    href?: string
    plate: string
    label: string
    message: string
    level: 'danger' | 'warning'
  }

  const alerts: Alert[] = []

  for (const v of vehicles) {
    if (v.vtv) {
      const s = getVTVStatus(v.vtv.expirationDate)
      if (s === 'danger') {
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `VTV/RTO vencida el ${fmtDate(v.vtv.expirationDate)}`, level: 'danger' })
      } else if (s === 'warning') {
        const days = differenceInDays(new Date(v.vtv.expirationDate), new Date())
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `VTV/RTO vence en ${days} días (${fmtDate(v.vtv.expirationDate)})`, level: 'warning' })
      }
    }
    if (v.oilChange) {
      const s = getOilChangeStatus(v.kmCurrent, v.oilChange.nextKm, v.oilChange.nextDate)
      if (s === 'danger') {
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Cambio de aceite vencido — actual ${v.kmCurrent.toLocaleString()} km / próximo ${v.oilChange.nextKm.toLocaleString()} km`, level: 'danger' })
      } else if (s === 'warning') {
        const left = v.oilChange.nextKm - v.kmCurrent
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Cambio de aceite en ${left.toLocaleString()} km`, level: 'warning' })
      }
    }
    if (v.alignmentBalance) {
      const s = getAlignmentStatus(v.kmCurrent, v.alignmentBalance.nextKm, v.alignmentBalance.nextDate)
      if (s === 'danger') {
        const left = v.alignmentBalance.nextKm ? v.kmCurrent - v.alignmentBalance.nextKm : null
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Alineación y balanceo vencido${left !== null ? ` — ${left.toLocaleString()} km de exceso` : ''}`, level: 'danger' })
      } else if (s === 'warning') {
        const left = v.alignmentBalance.nextKm ? v.alignmentBalance.nextKm - v.kmCurrent : null
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Alineación y balanceo${left !== null ? ` en ${left.toLocaleString()} km` : ' próxima'}`, level: 'warning' })
      }
    }
    if (v.policyExpirationDate) {
      const s = getInsuranceStatus(v.policyExpirationDate)
      if (s === 'danger') {
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Seguro vencido el ${fmtDate(v.policyExpirationDate)}`, level: 'danger' })
      } else if (s === 'warning') {
        const days = differenceInDays(new Date(v.policyExpirationDate), new Date())
        alerts.push({ vehicleId: v.id, plate: v.plate, label: `${v.brand} ${v.model}`, message: `Seguro vence en ${days} días (${fmtDate(v.policyExpirationDate)})`, level: 'warning' })
      }
    }
  }

  for (const d of drivers) {
    if (!d.licenseExpiry) continue
    const days = differenceInDays(new Date(d.licenseExpiry), new Date())
    if (days < 0) {
      alerts.push({ href: `/drivers/${d.id}`, plate: 'Licencia', label: d.fullName, message: `Licencia vencida el ${fmtDate(d.licenseExpiry)}`, level: 'danger' })
    } else if (days <= 30) {
      alerts.push({ href: `/drivers/${d.id}`, plate: 'Licencia', label: d.fullName, message: `Licencia vence en ${days} dÃ­as (${fmtDate(d.licenseExpiry)})`, level: 'warning' })
    }
  }

  const expiringPolicies = vehicles
    .filter(v => v.policyExpirationDate)
    .map(v => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      expirationDate: v.policyExpirationDate!,
      daysLeft: differenceInDays(new Date(v.policyExpirationDate!), new Date()),
    }))
    .filter(v => v.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  type ExpiringDoc = { trailerId: string; trailerName: string; docId: string; docName: string; docType: string; expiryDate: Date; daysLeft: number }
  const expiringTrailerDocs: ExpiringDoc[] = []
  for (const t of trailerUnits) {
    for (const doc of t.documents) {
      if (!doc.expiryDate) continue
      const daysLeft = differenceInDays(new Date(doc.expiryDate), new Date())
      if (daysLeft <= 60) {
        expiringTrailerDocs.push({
          trailerId: t.id, trailerName: t.name,
          docId: doc.id, docName: doc.name, docType: doc.type,
          expiryDate: doc.expiryDate, daysLeft,
        })
      }
    }
  }
  expiringTrailerDocs.sort((a, b) => a.daysLeft - b.daysLeft)

  const dangerCount = alerts.filter(a => a.level === 'danger').length
  const warningCount = alerts.filter(a => a.level === 'warning').length
  const okCount = vehicles.length - new Set(alerts.filter(a => a.level === 'danger' && a.vehicleId).map(a => a.vehicleId)).size

  return (
    <div className="space-y-6">
      <ShortcutsSection />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resumen general de la flota</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo vehículo</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Vehículos</p>
            <Car size={18} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{vehicles.length}</p>
          <p className="text-slate-500 text-xs mt-1">en flota</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Trailers</p>
            <Package2 size={18} className="text-violet-400" />
          </div>
          <p className="text-3xl font-bold text-white">{trailerUnits.length}</p>
          <p className="text-slate-500 text-xs mt-1">{trailerUnits.filter(t => t.status === 'ACTIVE').length} activos</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Conductores</p>
            <UserCog size={18} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white">{drivers.length}</p>
          <p className="text-slate-500 text-xs mt-1">licencias controladas</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Alertas críticas</p>
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{dangerCount}</p>
          <p className="text-slate-500 text-xs mt-1">requieren acción</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Advertencias</p>
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">{warningCount}</p>
          <p className="text-slate-500 text-xs mt-1">próximos a vencer</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Alertas activas
          </h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <Link
                key={i}
                href={a.href ?? `/vehicles/${a.vehicleId}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.level === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
                    {a.plate} — {a.label}
                  </p>
                  <p className="text-slate-400 text-sm">{a.message}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pólizas por vencer */}
      {expiringPolicies.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            Pólizas por vencer
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Vehículo</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Dominio</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Vencimiento</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2">Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {expiringPolicies.map(p => {
                  const insS = p.daysLeft < 0 ? 'danger' : p.daysLeft <= 30 ? 'warning' : 'ok'
                  return (
                    <tr key={p.id} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link href={`/vehicles/${p.id}`} className="text-white hover:text-blue-400 transition-colors font-medium">
                          {p.brand} {p.model}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{p.plate}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{fmtDate(p.expirationDate)}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(insS)}`}>
                          {p.daysLeft < 0 ? `Vencida hace ${Math.abs(p.daysLeft)} días` : p.daysLeft === 0 ? 'Vence hoy' : `${p.daysLeft} días`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trailer expiring documents */}
      {expiringTrailerDocs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Package2 size={16} className="text-violet-400" />
            Documentos de trailers por vencer
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Trailer</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Documento</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2 pr-4">Vencimiento</th>
                  <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-2">Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {expiringTrailerDocs.map(d => {
                  const s = getDocumentStatus(d.expiryDate)
                  return (
                    <tr key={d.docId} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link href={`/trailers/${d.trailerId}`} className="text-white hover:text-blue-400 transition-colors font-medium">
                          {d.trailerName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{d.docName}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{fmtDate(d.expiryDate)}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(s)}`}>
                          {d.daysLeft < 0 ? `Vencido hace ${Math.abs(d.daysLeft)} días` : d.daysLeft === 0 ? 'Vence hoy' : `${d.daysLeft} días`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fleet grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Flota</h2>
          <Link href="/vehicles" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            Ver todos →
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay vehículos registrados.</p>
            <Link href="/vehicles/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={16} />
              Agregar primer vehículo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {vehicles.map(v => {
              const vtvS = v.vtv ? getVTVStatus(v.vtv.expirationDate) : 'unknown'
              const oilS = v.oilChange ? getOilChangeStatus(v.kmCurrent, v.oilChange.nextKm, v.oilChange.nextDate) : 'unknown'
              const alignS = v.alignmentBalance ? getAlignmentStatus(v.kmCurrent, v.alignmentBalance.nextKm, v.alignmentBalance.nextDate) : 'unknown'
              const insS = getInsuranceStatus(v.policyExpirationDate ?? null)
              const worst = [vtvS, oilS, alignS, insS].includes('danger') ? 'danger'
                : [vtvS, oilS, alignS, insS].includes('warning') ? 'warning'
                : [vtvS, oilS, alignS, insS].every(s => s === 'ok') ? 'ok' : 'unknown'
              return (
                <Link
                  key={v.id}
                  href={`/vehicles/${v.id}`}
                  className="border border-slate-800 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-lg leading-tight">{v.plate}</p>
                      <p className="text-slate-400 text-sm">{v.brand} {v.model} {v.year}</p>
                      <p className="text-slate-500 text-xs mt-1">{v.kmCurrent.toLocaleString()} km</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${statusDot(worst)}`} />
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {v.vtv && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        vtvS === 'danger' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : vtvS === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>VTV {fmtDate(v.vtv.expirationDate)}</span>
                    )}
                    {v.oilChange && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        oilS === 'danger' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : oilS === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>Aceite {v.oilChange.nextKm.toLocaleString()} km</span>
                    )}
                    {v.alignmentBalance && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        alignS === 'danger' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : alignS === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>Alineación {v.alignmentBalance.nextKm ? v.alignmentBalance.nextKm.toLocaleString() + ' km' : fmtDate(v.alignmentBalance.lastDate)}</span>
                    )}
                    {v.policyExpirationDate && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(insS)}`}>
                        Seguro {insS === 'danger' ? 'vencido' : insS === 'warning' ? 'por vencer' : fmtDate(v.policyExpirationDate)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
