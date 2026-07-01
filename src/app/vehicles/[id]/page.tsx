'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Car, Wrench, ClipboardList, Link2, Settings,
  Trash2, Plus, Save, ExternalLink, QrCode, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, Droplets, Sliders, Flame, X, RotateCcw, Boxes,
  Shield, FileText, Upload, Download, Eye
} from 'lucide-react'
import {
  getVTVStatus, getOilChangeStatus, getAlignmentStatus, getTirePressureStatus, getFluidStatus,
  getFireExtinguisherStatus, getInsuranceStatus, DEFAULT_FLUID_CHECK_ITEMS, DEFAULT_INVENTORY_ITEMS,
  fmtDate, fmtKm, statusBg, statusColor, statusDot, DAILY_ITEMS, WEEKLY_ITEMS
} from '@/lib/utils'
import { dateInputValue } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'
import QRCodeDisplay from '@/components/QRCodeDisplay'

type Tab = 'overview' | 'insurance' | 'maintenance' | 'fluids' | 'tools' | 'reviews' | 'links' | 'config'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'General', icon: <Car size={15} /> },
  { id: 'insurance', label: 'Seguro', icon: <Shield size={15} /> },
  { id: 'maintenance', label: 'Mantenimiento', icon: <Settings size={15} /> },
  { id: 'fluids', label: 'Fluidos', icon: <Droplets size={15} /> },
  { id: 'tools', label: 'Herramientas', icon: <Wrench size={15} /> },
  { id: 'reviews', label: 'Revisiones', icon: <ClipboardList size={15} /> },
  { id: 'links', label: 'Links', icon: <Link2 size={15} /> },
  { id: 'config', label: 'Config', icon: <Sliders size={15} /> },
]

const CONDITIONS = [
  { value: 'good', label: 'Buena', cls: 'text-emerald-400' },
  { value: 'fair', label: 'Regular', cls: 'text-amber-400' },
  { value: 'poor', label: 'Mala', cls: 'text-red-400' },
  { value: 'missing', label: 'Faltante', cls: 'text-slate-500' },
]

export default function VehicleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchVehicle = useCallback(async () => {
    const res = await fetch(`/api/vehicles/${id}`)
    if (res.ok) setVehicle(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchVehicle() }, [fetchVehicle])

  async function saveField(field: string, value: unknown) {
    await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    fetchVehicle()
  }

  async function deleteVehicle() {
    if (!confirm(`¿Eliminar el vehículo ${vehicle.plate}? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    router.push('/vehicles')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400">Cargando...</div>
    </div>
  )

  if (!vehicle) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Vehículo no encontrado.</p>
      <Link href="/vehicles" className="text-blue-400 text-sm mt-2 inline-block">← Volver</Link>
    </div>
  )

  const vtvS = vehicle.vtv ? getVTVStatus(vehicle.vtv.expirationDate) : 'unknown'
  const oilS = vehicle.oilChange ? getOilChangeStatus(vehicle.kmCurrent, vehicle.oilChange.nextKm, vehicle.oilChange.nextDate) : 'unknown'
  const alignS = vehicle.alignmentBalance ? getAlignmentStatus(vehicle.kmCurrent, vehicle.alignmentBalance.nextKm, vehicle.alignmentBalance.nextDate) : 'unknown'
  const insuranceS = getInsuranceStatus(vehicle.policyExpirationDate ?? null)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vehicles" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{vehicle.plate}</h1>
              <span className={`w-3 h-3 rounded-full ${statusDot(
                [vtvS, oilS, alignS, insuranceS].includes('danger') ? 'danger'
                : [vtvS, oilS, alignS, insuranceS].includes('warning') ? 'warning'
                : [vtvS, oilS, alignS, insuranceS].every(s => s === 'ok') ? 'ok' : 'unknown'
              )}`} />
            </div>
            <p className="text-slate-400 text-sm">
              {vehicle.brand} {vehicle.model} · {vehicle.year} · {vehicle.color || '—'}
              {vehicle.type && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{vehicle.type.name}</span>}
            </p>
          </div>
        </div>
        <button onClick={deleteVehicle} className="btn-danger flex items-center gap-1.5 shrink-0">
          <Trash2 size={14} />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab vehicle={vehicle} onSave={saveField} onRefresh={fetchVehicle} />}
      {tab === 'insurance' && <InsuranceTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'maintenance' && <MaintenanceTab vehicle={vehicle} vtvS={vtvS} oilS={oilS} alignS={alignS} onRefresh={fetchVehicle} />}
      {tab === 'fluids' && <FluidsTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'tools' && <ToolsTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'reviews' && <ReviewsTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'links' && <LinksTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'config' && <ConfigTab vehicle={vehicle} onRefresh={fetchVehicle} />}
    </div>
  )
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ vehicle, onSave, onRefresh }: any) {
  const [editKm, setEditKm] = useState(false)
  const [km, setKm] = useState(vehicle.kmCurrent.toString())
  const [editWarranty, setEditWarranty] = useState(false)
  const [warrantyDate, setWarrantyDate] = useState(
    vehicle.warrantyExpiry ? new Date(vehicle.warrantyExpiry).toISOString().split('T')[0] : ''
  )

  async function saveKm() {
    await onSave('kmCurrent', Number(km))
    setEditKm(false)
    onRefresh()
  }

  async function saveWarranty(dateStr: string | null) {
    await onSave('warrantyExpiry', dateStr)
    setEditWarranty(false)
    onRefresh()
  }

  const warrantyExpiry = vehicle.warrantyExpiry ? new Date(vehicle.warrantyExpiry) : null
  const warrantyStatus = !warrantyExpiry ? 'none'
    : warrantyExpiry < new Date() ? 'expired'
    : warrantyExpiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warning'
    : 'ok'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Vehicle info */}
        <div className="card">
          <h3 className="section-title">Datos del vehículo</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row label="Patente" value={vehicle.plate} />
            {vehicle.type && <Row label="Tipo" value={vehicle.type.name} />}
            <Row label="Marca" value={vehicle.brand} />
            <Row label="Modelo" value={vehicle.model} />
            <Row label="Año" value={vehicle.year} />
            <Row label="Color" value={vehicle.color || '—'} />
            <div>
              <p className="text-slate-500 text-xs">Kilometraje actual</p>
              {editKm ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    className="input w-32 text-sm py-1"
                    type="number"
                    value={km}
                    onChange={e => setKm(e.target.value)}
                    autoFocus
                  />
                  <button onClick={saveKm} className="text-xs text-emerald-400 hover:text-emerald-300">Guardar</button>
                  <button onClick={() => { setEditKm(false); setKm(vehicle.kmCurrent.toString()) }} className="text-xs text-slate-500 hover:text-slate-300">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setEditKm(true)} className="flex items-center gap-1.5 mt-1 group">
                  <span className="text-white font-medium">{vehicle.kmCurrent.toLocaleString()} km</span>
                  <span className="text-slate-600 text-xs group-hover:text-slate-400 transition-colors">(editar)</span>
                </button>
              )}
            </div>
          </div>
          {vehicle.notes && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-xs mb-1">Notas</p>
              <p className="text-slate-300 text-sm">{vehicle.notes}</p>
            </div>
          )}
        </div>

        {/* Garantía */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Garantía</h3>
            {!editWarranty && (
              <button
                onClick={() => setEditWarranty(true)}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                {warrantyStatus === 'none' ? '+ Agregar' : 'Editar'}
              </button>
            )}
          </div>

          {editWarranty ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Fecha de vencimiento</label>
                <input
                  className="input"
                  type="date"
                  value={warrantyDate}
                  onChange={e => setWarrantyDate(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => warrantyDate && saveWarranty(warrantyDate)}
                  disabled={!warrantyDate}
                  className="btn-primary text-sm py-1.5 flex-1"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditWarranty(false); setWarrantyDate(vehicle.warrantyExpiry ? new Date(vehicle.warrantyExpiry).toISOString().split('T')[0] : '') }}
                  className="btn-secondary text-sm py-1.5"
                >
                  Cancelar
                </button>
                {warrantyStatus !== 'none' && (
                  <button
                    onClick={() => saveWarranty(null)}
                    className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ) : warrantyStatus === 'none' ? (
            <p className="text-slate-600 text-sm">Sin garantía registrada</p>
          ) : (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              warrantyStatus === 'expired' ? 'bg-red-500/10 border-red-500/20' :
              warrantyStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
              'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                warrantyStatus === 'expired' ? 'bg-red-400' :
                warrantyStatus === 'warning' ? 'bg-yellow-400' :
                'bg-emerald-400'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  warrantyStatus === 'expired' ? 'text-red-300' :
                  warrantyStatus === 'warning' ? 'text-yellow-300' :
                  'text-emerald-300'
                }`}>
                  {warrantyStatus === 'expired' ? 'Garantía vencida' :
                   warrantyStatus === 'warning' ? 'Garantía por vencer' :
                   'En garantía'}
                </p>
                <p className="text-slate-400 text-xs">
                  Vence el {warrantyExpiry!.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acoplados asociados */}
        {(vehicle.trailers?.length > 0 || vehicle.type?.features?.acoplado === 'required') && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Boxes size={15} className="text-slate-400" />
              <h3 className="section-title">Acoplados asociados</h3>
            </div>
            {vehicle.type?.features?.acoplado === 'required' && vehicle.trailers?.length === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm font-medium">Acoplado requerido</p>
                  <p className="text-red-400/70 text-xs">Este tipo de vehículo debe tener un acoplado asociado.</p>
                </div>
                <Link href="/acoplados" className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">
                  Ir a acoplados →
                </Link>
              </div>
            )}
            {vehicle.trailers?.length > 0 && (
              <div className="space-y-2">
                {vehicle.trailers.map((t: any) => (
                  <Link key={t.id} href={`/acoplados/${t.id}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group">
                    <Boxes size={14} className="text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium text-sm">{t.domain}</span>
                      <span className="text-slate-500 text-xs ml-2">{t.brand} {t.model} · {t.subtype}</span>
                    </div>
                    <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Ver →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status summary */}
        <MaintenanceStatusCard vehicle={vehicle} />
      </div>

      {/* QR code */}
      <div className="card flex flex-col items-center justify-start gap-4">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-slate-400" />
          <h3 className="font-semibold text-white text-sm">Código QR</h3>
        </div>
        <QRCodeDisplay vehicleId={vehicle.id} plate={vehicle.plate} />
        <p className="text-slate-500 text-xs text-center">Escanear para acceder directamente a este vehículo</p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-white font-medium mt-0.5">{String(value)}</p>
    </div>
  )
}

function StatusRow({ label, status, detail }: { label: string; status: any; detail: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-300 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-xs">{detail}</span>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

function MaintenanceStatusCard({ vehicle }: { vehicle: any }) {
  const oilS = vehicle.oilChange ? getOilChangeStatus(vehicle.kmCurrent, vehicle.oilChange.nextKm, vehicle.oilChange.nextDate) : 'unknown'
  const alignS = vehicle.alignmentBalance ? getAlignmentStatus(vehicle.kmCurrent, vehicle.alignmentBalance.nextKm, vehicle.alignmentBalance.nextDate) : 'unknown'
  const vtvS = vehicle.vtv ? getVTVStatus(vehicle.vtv.expirationDate) : 'unknown'
  const feS = getFireExtinguisherStatus(vehicle.fireExtinguisher?.expirationDate ?? null)
  const insS = getInsuranceStatus(vehicle.policyExpirationDate ?? null)

  const lastWeekly = vehicle.weeklyReviews?.[0]
  const fluidChecks: { item: string; ok: boolean }[] = Array.isArray(lastWeekly?.fluidChecks) ? lastWeekly.fluidChecks : []
  const fluidMap = Object.fromEntries(fluidChecks.map((f: any) => [f.item, f.ok]))
  const fluidItems: string[] = vehicle.weeklyFluidItems ?? DEFAULT_FLUID_CHECK_ITEMS

  const oilKmLeft = vehicle.oilChange ? vehicle.oilChange.nextKm - vehicle.kmCurrent : null
  const alignKmLeft = vehicle.alignmentBalance?.nextKm ? vehicle.alignmentBalance.nextKm - vehicle.kmCurrent : null

  return (
    <div className="card">
      <h3 className="section-title mb-3">Estado de mantenimiento</h3>

      {/* Mantenimiento */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Mantenimiento</p>
          {lastWeekly && (
            <p className="text-slate-600 text-xs">Últ. revisión {fmtDate(lastWeekly.weekStart)}</p>
          )}
        </div>
        <StatusRow
          label="Cambio de aceite"
          status={oilS}
          detail={vehicle.oilChange
            ? `Próx: ${vehicle.oilChange.nextKm.toLocaleString()} km${oilKmLeft !== null ? ` · ${oilKmLeft > 0 ? oilKmLeft.toLocaleString() + ' rest.' : Math.abs(oilKmLeft).toLocaleString() + ' exceso'}` : ''}`
            : 'Sin registrar'}
        />
        <StatusRow
          label="Alineación y balanceo"
          status={alignS}
          detail={vehicle.alignmentBalance
            ? vehicle.alignmentBalance.nextKm
              ? `Próx: ${vehicle.alignmentBalance.nextKm.toLocaleString()} km${alignKmLeft !== null ? ` · ${alignKmLeft > 0 ? alignKmLeft.toLocaleString() + ' rest.' : Math.abs(alignKmLeft).toLocaleString() + ' exceso'}` : ''}`
              : vehicle.alignmentBalance.nextDate ? `Próx: ${fmtDate(vehicle.alignmentBalance.nextDate)}` : `Últ: ${fmtDate(vehicle.alignmentBalance.lastDate)}`
            : 'Sin registrar'}
        />
        <StatusRow
          label="VTV / RTO"
          status={vtvS}
          detail={vehicle.vtv ? `Vence ${fmtDate(vehicle.vtv.expirationDate)}` : 'Sin registrar'}
        />
        <StatusRow
          label="Matafuego"
          status={feS}
          detail={vehicle.fireExtinguisher ? `Vence ${fmtDate(vehicle.fireExtinguisher.expirationDate)}` : 'Sin registrar'}
        />
        <StatusRow
          label="Seguro"
          status={insS}
          detail={vehicle.policyExpirationDate ? `Vence ${fmtDate(vehicle.policyExpirationDate)}` : 'Sin registrar'}
        />
      </div>

      {/* Fluidos y neumáticos */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Fluidos y neumáticos</p>
          {lastWeekly && fluidChecks.length > 0 && (
            <p className="text-slate-600 text-xs">{fmtDate(lastWeekly.weekStart)}</p>
          )}
        </div>
        {fluidChecks.length === 0 ? (
          <p className="text-slate-600 text-xs py-1.5">Sin datos de última revisión semanal</p>
        ) : (
          fluidItems.map(item => {
            const ok: boolean | undefined = fluidMap[item]
            return (
              <div key={item} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-slate-300 text-xs">{item}</span>
                {ok === undefined ? (
                  <span className="text-slate-600 text-xs">—</span>
                ) : ok ? (
                  <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={11} />OK</span>
                ) : (
                  <span className="text-red-400 text-xs flex items-center gap-1"><XCircle size={11} />Falla</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─── MODAL ─── */
function Modal({ subtitle, onClose, children }: { subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-white">Registrar mantenimiento</h2>
            <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── MAINTENANCE TAB ─── */
function MaintenanceTab({ vehicle, vtvS, oilS, alignS, onRefresh }: any) {
  const feS = getFireExtinguisherStatus(vehicle.fireExtinguisher?.expirationDate ?? null)
  const [modal, setModal] = useState<'oil' | 'alignment' | 'fe' | 'vtv' | null>(null)
  const [fluidModal, setFluidModal] = useState<any>(null)

  const oc = vehicle.oilChange
  const ab = vehicle.alignmentBalance
  const vtv = vehicle.vtv
  const fe = vehicle.fireExtinguisher
  const fluids = (vehicle.fluids ?? []).filter((f: any) => f.showMaintenanceBtn !== false)
  const oilKmLeft = oc ? oc.nextKm - vehicle.kmCurrent : null
  const alignKmLeft = ab?.nextKm ? ab.nextKm - vehicle.kmCurrent : null

  function close() { setModal(null); setFluidModal(null); onRefresh() }

  return (
    <div className="space-y-5">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench size={14} className={statusColor(oilS)} />
              <p className="font-semibold text-white text-sm">Cambio de aceite</p>
            </div>
            <StatusBadge status={oilS} />
          </div>
          {oc ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Último</span>
                <span className="text-slate-300 text-right">{oc.lastKm.toLocaleString()} km · {fmtDate(oc.lastDate)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Próximo</span>
                <span className="text-slate-300">{oc.nextKm.toLocaleString()} km</span>
              </div>
              {oilKmLeft !== null && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Restantes</span>
                  <span className={oilKmLeft >= 0 ? 'text-slate-300' : 'text-red-400'}>
                    {oilKmLeft >= 0 ? oilKmLeft.toLocaleString() + ' km' : Math.abs(oilKmLeft).toLocaleString() + ' km exceso'}
                  </span>
                </div>
              )}
              {oc.oilType && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Aceite</span>
                  <span className="text-slate-300 truncate">{oc.oilType}</span>
                </div>
              )}
              {((oc as any).airFilterCleaned || (oc as any).airFilterChanged) && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Filtro aire</span>
                  <span className="text-slate-300">{(oc as any).airFilterChanged ? 'Cambiado' : 'Limpiado'}</span>
                </div>
              )}
              {(oc as any).fuelFilterChanged && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Filtro comb.</span>
                  <span className="text-slate-300">Cambiado</span>
                </div>
              )}
            </div>
          ) : <p className="text-slate-600 text-xs">Sin registrar</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className={statusColor(alignS)} />
              <p className="font-semibold text-white text-sm">Alineación y balanceo</p>
            </div>
            <StatusBadge status={alignS} />
          </div>
          {ab ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Último</span>
                <span className="text-slate-300 text-right">{ab.lastKm.toLocaleString()} km · {fmtDate(ab.lastDate)}</span>
              </div>
              {ab.nextKm && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Próximo</span>
                  <span className="text-slate-300">{ab.nextKm.toLocaleString()} km</span>
                </div>
              )}
              {alignKmLeft !== null && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Restantes</span>
                  <span className={alignKmLeft >= 0 ? 'text-slate-300' : 'text-red-400'}>
                    {alignKmLeft >= 0 ? alignKmLeft.toLocaleString() + ' km' : Math.abs(alignKmLeft).toLocaleString() + ' km exceso'}
                  </span>
                </div>
              )}
              {ab.nextDate && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Próx. fecha</span>
                  <span className="text-slate-300">{fmtDate(ab.nextDate)}</span>
                </div>
              )}
            </div>
          ) : <p className="text-slate-600 text-xs">Sin registrar</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={14} className={statusColor(feS)} />
              <p className="font-semibold text-white text-sm">Matafuego</p>
            </div>
            <StatusBadge status={feS} />
          </div>
          {fe ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Vencimiento</span>
                <span className="text-slate-300">{fmtDate(fe.expirationDate)}</span>
              </div>
              {fe.notes && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Notas</span>
                  <span className="text-slate-300 truncate">{fe.notes}</span>
                </div>
              )}
            </div>
          ) : <p className="text-slate-600 text-xs">Sin registrar</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={14} className={statusColor(vtvS)} />
              <p className="font-semibold text-white text-sm">VTV / RTO</p>
            </div>
            <StatusBadge status={vtvS} />
          </div>
          {vtv ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Vencimiento</span>
                <span className="text-slate-300">{fmtDate(vtv.expirationDate)}</span>
              </div>
              {vtv.lastDate && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Última insp.</span>
                  <span className="text-slate-300">{fmtDate(vtv.lastDate)}</span>
                </div>
              )}
            </div>
          ) : <p className="text-slate-600 text-xs">Sin registrar</p>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="card space-y-4">
        <h3 className="section-title mb-0">Registrar mantenimiento</h3>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mantenimientos</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModal('oil')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Wrench size={15} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Nuevo service</p>
                <p className="text-slate-500 text-xs">Filtros y aceite de motor</p>
              </div>
            </button>
            <button
              onClick={() => setModal('alignment')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                <RotateCcw size={15} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Nueva alineación</p>
                <p className="text-slate-500 text-xs">Alineación y balanceo</p>
              </div>
            </button>
            <button
              onClick={() => setModal('fe')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                <Flame size={15} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Nuevo matafuego</p>
                <p className="text-slate-500 text-xs">Registro de vencimiento</p>
              </div>
            </button>
            <button
              onClick={() => setModal('vtv')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <ClipboardList size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Nueva VTV / RTO</p>
                <p className="text-slate-500 text-xs">Inspección técnica vehicular</p>
              </div>
            </button>
          </div>
        </div>
        {fluids.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fluidos</p>
            <div className="grid grid-cols-2 gap-3">
              {fluids.map((fluid: any) => (
                <button
                  key={fluid.id}
                  onClick={() => setFluidModal(fluid)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                    <Droplets size={15} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{fluid.name}</p>
                    <p className="text-slate-500 text-xs">
                      {fluid.expiryMode === 'km' ? 'Por kilómetros' : fluid.expiryMode === 'both' ? 'Km y fecha' : 'Por fecha'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal === 'oil' && (
        <Modal subtitle="Filtros y aceite de motor" onClose={() => setModal(null)}>
          <OilChangeForm vehicle={vehicle} onDone={close} />
        </Modal>
      )}
      {modal === 'alignment' && (
        <Modal subtitle="Alineación y balanceo" onClose={() => setModal(null)}>
          <AlignmentForm vehicle={vehicle} onDone={close} />
        </Modal>
      )}
      {modal === 'fe' && (
        <Modal subtitle="Matafuego" onClose={() => setModal(null)}>
          <FireExtinguisherForm vehicle={vehicle} onDone={close} />
        </Modal>
      )}
      {modal === 'vtv' && (
        <Modal subtitle="VTV / RTO" onClose={() => setModal(null)}>
          <VTVForm vehicle={vehicle} onDone={close} />
        </Modal>
      )}
      {fluidModal && (
        <Modal subtitle={fluidModal.name} onClose={() => setFluidModal(null)}>
          <FluidMaintForm vehicle={vehicle} fluid={fluidModal} onDone={close} />
        </Modal>
      )}
    </div>
  )
}

function OilChangeForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const oc = vehicle.oilChange
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    lastKm: oc?.lastKm?.toString() || vehicle.kmCurrent.toString(),
    lastDate: oc?.lastDate ? new Date(oc.lastDate).toISOString().slice(0, 10) : today,
    kmInterval: oc?.kmInterval?.toString() || '10000',
    nextDate: oc?.nextDate ? new Date(oc.nextDate).toISOString().slice(0, 10) : '',
    oilType: oc?.oilType || '',
    airFilterCleaned: (oc as any)?.airFilterCleaned ?? false,
    airFilterChanged: (oc as any)?.airFilterChanged ?? false,
    fuelFilterChanged: (oc as any)?.fuelFilterChanged ?? false,
    notes: oc?.notes || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/oil-change`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onDone()
  }

  async function remove() {
    if (!confirm('¿Eliminar el registro de cambio de aceite?')) return
    await fetch(`/api/vehicles/${vehicle.id}/oil-change`, { method: 'DELETE' })
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Km del último cambio *</label>
          <input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} required />
        </div>
        <div>
          <label>Fecha del último cambio *</label>
          <input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} required />
        </div>
        <div>
          <label>Intervalo entre cambios (km)</label>
          <input className="input" type="number" value={form.kmInterval} onChange={e => setForm(f => ({ ...f, kmInterval: e.target.value }))} />
        </div>
        <div>
          <label>Próximo cambio (fecha estimada)</label>
          <input className="input" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} />
        </div>
        <div>
          <label>Tipo de aceite</label>
          <input className="input" value={form.oilType} onChange={e => setForm(f => ({ ...f, oilType: e.target.value }))} placeholder="ej: 5W-40 sintético" />
        </div>
        <div className="col-span-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Filtro de aire</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.airFilterCleaned} onChange={e => setForm(f => ({ ...f, airFilterCleaned: e.target.checked }))} className="w-4 h-4" />
              <span className="text-slate-300 text-sm">Limpiado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.airFilterChanged} onChange={e => setForm(f => ({ ...f, airFilterChanged: e.target.checked }))} className="w-4 h-4" />
              <span className="text-slate-300 text-sm">Cambiado</span>
            </label>
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Filtro de combustible</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.fuelFilterChanged} onChange={e => setForm(f => ({ ...f, fuelFilterChanged: e.target.checked }))} className="w-4 h-4" />
            <span className="text-slate-300 text-sm">Cambiado</span>
          </label>
        </div>
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
        </div>
        {oc && (
          <button type="button" onClick={remove} className="text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm">
            <Trash2 size={14} />Eliminar
          </button>
        )}
      </div>
    </form>
  )
}

function AlignmentForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const ab = vehicle.alignmentBalance
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    lastKm: ab?.lastKm?.toString() || vehicle.kmCurrent.toString(),
    lastDate: dateInputValue(ab?.lastDate) || today,
    notes: ab?.notes || '',
  })
  const nextKm = Number(form.lastKm || 0) + 10000

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/alignment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onDone()
  }

  async function remove() {
    if (!confirm('¿Eliminar el registro de alineación y balanceo?')) return
    await fetch(`/api/vehicles/${vehicle.id}/alignment`, { method: 'DELETE' })
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Fecha del último servicio *</label>
          <input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} required />
        </div>
        <div>
          <label>Km del último servicio *</label>
          <input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} required />
        </div>
        <div>
          <label>Próximo servicio (km)</label>
          <input className="input" type="text" value={Number.isFinite(nextKm) ? nextKm.toLocaleString('es-AR') : ''} readOnly />
        </div>
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
        </div>
        {ab && (
          <button type="button" onClick={remove} className="text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm">
            <Trash2 size={14} />Eliminar
          </button>
        )}
      </div>
    </form>
  )
}

function VTVForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const vtv = vehicle.vtv
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    expirationDate: dateInputValue(vtv?.expirationDate),
    lastDate: dateInputValue(vtv?.lastDate) || today,
    notes: vtv?.notes || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/vtv`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Fecha de vencimiento *</label>
          <input className="input" type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} required />
        </div>
        <div>
          <label>Fecha de última inspección</label>
          <input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function FireExtinguisherForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const fe = vehicle.fireExtinguisher
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    expirationDate: dateInputValue(fe?.expirationDate),
    notes: fe?.notes || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fire-extinguisher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onDone()
  }

  async function remove() {
    if (!confirm('¿Eliminar el registro de matafuego?')) return
    await fetch(`/api/vehicles/${vehicle.id}/fire-extinguisher`, { method: 'DELETE' })
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Fecha de vencimiento *</label>
          <input className="input" type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} required />
        </div>
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Marca, ubicación, etc." />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
        </div>
        {fe && (
          <button type="button" onClick={remove} className="text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm">
            <Trash2 size={14} />Eliminar
          </button>
        )}
      </div>
    </form>
  )
}

function FluidMaintForm({ vehicle, fluid, onDone }: { vehicle: any; fluid: any; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const byKm = fluid.expiryMode === 'km' || fluid.expiryMode === 'both'
  const byDate = fluid.expiryMode === 'date' || fluid.expiryMode === 'both'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    lastKm: fluid.lastKm?.toString() || vehicle.kmCurrent.toString(),
    kmInterval: fluid.kmInterval?.toString() || '',
    nextKm: fluid.nextKm?.toString() || '',
    lastDate: fluid.lastDate ? new Date(fluid.lastDate).toISOString().slice(0, 10) : today,
    nextDate: fluid.nextDate ? new Date(fluid.nextDate).toISOString().slice(0, 10) : '',
    notes: fluid.notes || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fluids/${fluid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastKm: byKm && form.lastKm ? Number(form.lastKm) : undefined,
        kmInterval: byKm && form.kmInterval ? Number(form.kmInterval) : undefined,
        nextKm: byKm && form.nextKm ? Number(form.nextKm) : undefined,
        lastDate: byDate ? form.lastDate || null : undefined,
        nextDate: byDate ? form.nextDate || null : undefined,
        notes: form.notes || null,
      }),
    })
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {byKm && (
          <>
            <div>
              <label>Km del último cambio</label>
              <input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} />
            </div>
            <div>
              <label>Intervalo (km)</label>
              <input className="input" type="number" value={form.kmInterval} onChange={e => setForm(f => ({ ...f, kmInterval: e.target.value }))} placeholder="ej: 20000" />
            </div>
            <div className="col-span-2">
              <label>Próximo cambio (km)</label>
              <input className="input" type="number" value={form.nextKm} onChange={e => setForm(f => ({ ...f, nextKm: e.target.value }))} />
            </div>
          </>
        )}
        {byDate && (
          <>
            <div>
              <label>Fecha del último cambio</label>
              <input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} />
            </div>
            <div>
              <label>Próximo vencimiento</label>
              <input className="input" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} />
            </div>
          </>
        )}
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function TirePressureSection({ vehicle, onRefresh }: any) {
  const tp = vehicle.tirePressure
  const [open, setOpen] = useState(!tp)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    frontLeft: tp?.frontLeft?.toString() || '',
    frontRight: tp?.frontRight?.toString() || '',
    rearLeft: tp?.rearLeft?.toString() || '',
    rearRight: tp?.rearRight?.toString() || '',
    spare: tp?.spare?.toString() || '',
    recommended: tp?.recommended?.toString() || '32',
    notes: tp?.notes || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/tire-pressure`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setOpen(false)
    onRefresh()
  }

  const rec = tp ? tp.recommended : 32

  function TireCell({ label, value }: { label: string; value: number | null }) {
    const s = getTirePressureStatus(value, rec)
    return (
      <div className={`p-3 rounded-lg border text-center ${statusBg(s)}`}>
        <p className="text-xs mb-1 opacity-70">{label}</p>
        <p className="font-bold text-lg">{value ?? '—'}</p>
        <p className="text-xs opacity-70">psi</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Presión de neumáticos</h3>
          {tp && <p className="text-slate-500 text-xs mt-0.5">Última revisión {fmtDate(tp.lastCheck)} · Recomendada: {tp.recommended} psi</p>}
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          {open ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {tp && !open && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <TireCell label="Del. Izq." value={tp.frontLeft} />
            <TireCell label="Del. Der." value={tp.frontRight} />
            <TireCell label="Tras. Izq." value={tp.rearLeft} />
            <TireCell label="Tras. Der." value={tp.rearRight} />
          </div>
          {tp.spare !== null && tp.spare !== undefined && (
            <div className="max-w-xs mx-auto">
              <TireCell label="Auxilio" value={tp.spare} />
            </div>
          )}
        </div>
      )}

      {open && (
        <form onSubmit={save} className="space-y-3">
          <div>
            <label>Presión recomendada (psi)</label>
            <input className="input w-32" type="number" step="0.5" value={form.recommended} onChange={e => setForm(f => ({ ...f, recommended: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <label>Del. Izquierdo</label>
              <input className="input" type="number" step="0.5" placeholder={form.recommended} value={form.frontLeft} onChange={e => setForm(f => ({ ...f, frontLeft: e.target.value }))} />
            </div>
            <div>
              <label>Del. Derecho</label>
              <input className="input" type="number" step="0.5" placeholder={form.recommended} value={form.frontRight} onChange={e => setForm(f => ({ ...f, frontRight: e.target.value }))} />
            </div>
            <div>
              <label>Tras. Izquierdo</label>
              <input className="input" type="number" step="0.5" placeholder={form.recommended} value={form.rearLeft} onChange={e => setForm(f => ({ ...f, rearLeft: e.target.value }))} />
            </div>
            <div>
              <label>Tras. Derecho</label>
              <input className="input" type="number" step="0.5" placeholder={form.recommended} value={form.rearRight} onChange={e => setForm(f => ({ ...f, rearRight: e.target.value }))} />
            </div>
            <div>
              <label>Auxilio</label>
              <input className="input" type="number" step="0.5" value={form.spare} onChange={e => setForm(f => ({ ...f, spare: e.target.value }))} />
            </div>
          </div>
          <div>
            <label>Notas</label>
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}

/* ─── TOOLS TAB ─── */
function ToolsTab({ vehicle, onRefresh }: any) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '1', condition: 'good', notes: '' })

  async function addTool(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', quantity: '1', condition: 'good', notes: '' })
    onRefresh()
  }

  async function deleteTool(toolId: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    await fetch(`/api/vehicles/${vehicle.id}/tools/${toolId}`, { method: 'DELETE' })
    onRefresh()
  }

  const condMap: Record<string, { label: string; cls: string }> = {
    good: { label: 'Buena', cls: 'text-emerald-400' },
    fair: { label: 'Regular', cls: 'text-amber-400' },
    poor: { label: 'Mala', cls: 'text-red-400' },
    missing: { label: 'Faltante', cls: 'text-slate-500' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Herramientas <span className="text-slate-500 font-normal text-sm">({vehicle.tools.length})</span>
        </h2>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Agregar
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="section-title">Nueva herramienta</h3>
          <form onSubmit={addTool} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label>Nombre *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ej: Gato hidráulico" required autoFocus />
              </div>
              <div>
                <label>Cantidad</label>
                <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label>Condición</label>
                <select className="input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label>Notas</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {vehicle.tools.length === 0 ? (
        <div className="card text-center py-10">
          <Wrench size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay herramientas registradas.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Herramienta</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Cant.</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Condición</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Notas</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicle.tools.map((t: any) => (
                <tr key={t.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-white text-sm font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{t.quantity}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${condMap[t.condition]?.cls || 'text-slate-400'}`}>
                      {condMap[t.condition]?.label || t.condition}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-sm">{t.notes || '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => deleteTool(t.id, t.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── REVIEWS TAB ─── */
function ReviewsTab({ vehicle, onRefresh }: any) {
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/vehicles/${vehicle.id}/daily-review`}
          className="card hover:border-slate-700 transition-colors text-center py-8"
        >
          <ClipboardList size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="font-semibold text-white">Revisión diaria</p>
          <p className="text-slate-400 text-sm mt-1">Control rápido del vehículo</p>
        </Link>
        <Link
          href={`/vehicles/${vehicle.id}/weekly-review`}
          className="card hover:border-slate-700 transition-colors text-center py-8"
        >
          <ClipboardList size={32} className="text-purple-400 mx-auto mb-2" />
          <p className="font-semibold text-white">Revisión semanal</p>
          <p className="text-slate-400 text-sm mt-1">Inspección completa</p>
        </Link>
      </div>

      {/* Recent reviews */}
      {vehicle.dailyReviews.length > 0 && (
        <div className="card">
          <h3 className="section-title">Revisiones diarias recientes</h3>
          <div className="space-y-2">
            {vehicle.dailyReviews.map((r: any) => {
              const items = r.items as any[]
              const ok = items.filter(i => i.status === 'ok').length
              const fail = items.filter(i => i.status === 'fail').length
              const expanded = expandedReview === r.id
              return (
                <div key={r.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedReview(expanded ? null : r.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium">{fmtDate(r.date)}</span>
                      {r.reviewer && <span className="text-slate-500 text-xs">por {r.reviewer}</span>}
                      {r.kmReading && <span className="text-slate-500 text-xs">{r.kmReading.toLocaleString()} km</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={12} />{ok}</span>
                      {fail > 0 && <span className="text-red-400 text-xs flex items-center gap-1"><XCircle size={12} />{fail}</span>}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-3 border-t border-slate-800 pt-3 space-y-1.5">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          {item.status === 'ok' && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                          {item.status === 'fail' && <XCircle size={14} className="text-red-400 shrink-0" />}
                          {item.status === 'na' && <MinusCircle size={14} className="text-slate-600 shrink-0" />}
                          <span className={item.status === 'fail' ? 'text-red-300' : item.status === 'na' ? 'text-slate-600' : 'text-slate-300'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                      {r.notes && <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-800">Notas: {r.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {vehicle.weeklyReviews.length > 0 && (
        <div className="card">
          <h3 className="section-title">Revisiones semanales recientes</h3>
          <div className="space-y-2">
            {vehicle.weeklyReviews.map((r: any) => {
              const fluids: { item: string; ok: boolean }[] = Array.isArray(r.fluidChecks) ? r.fluidChecks : []
              const inv: { item: string; ok: boolean }[] = Array.isArray(r.inventoryChecks) ? r.inventoryChecks : []
              const fluidsOk = fluids.filter(f => f.ok).length
              const invOk = inv.filter(i => i.ok).length
              const expanded = expandedReview === r.id + '-w'
              return (
                <div key={r.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedReview(expanded ? null : r.id + '-w')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-white text-sm font-medium shrink-0">Semana del {fmtDate(r.weekStart)}</span>
                      {r.reviewer && <span className="text-slate-500 text-xs truncate">por {r.reviewer}</span>}
                      {r.kmReading && <span className="text-slate-500 text-xs shrink-0">{r.kmReading.toLocaleString()} km</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {r.insuranceOk !== null && (
                        <span className={`text-xs ${r.insuranceOk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.insuranceOk ? '✓ Seg.' : '✗ Seg.'}
                        </span>
                      )}
                      {fluids.length > 0 && (
                        <span className="text-blue-400 text-xs">{fluidsOk}/{fluids.length} fluidos</span>
                      )}
                      {inv.length > 0 && (
                        <span className="text-amber-400 text-xs">{invOk}/{inv.length} inv.</span>
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-3 border-t border-slate-800 pt-3 space-y-3">
                      {fluids.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1.5">Fluidos</p>
                          <div className="space-y-1">
                            {fluids.map((f) => (
                              <div key={f.item} className="flex items-center gap-2 text-sm">
                                {f.ok
                                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                                  : <XCircle size={13} className="text-red-400 shrink-0" />}
                                <span className={f.ok ? 'text-slate-300' : 'text-red-300'}>{f.item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {inv.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1.5">Inventario</p>
                          <div className="grid grid-cols-2 gap-1">
                            {inv.map((i) => (
                              <div key={i.item} className="flex items-center gap-2 text-sm">
                                {i.ok
                                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                                  : <MinusCircle size={13} className="text-slate-600 shrink-0" />}
                                <span className={i.ok ? 'text-slate-300' : 'text-slate-600'}>{i.item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.notes && <p className="text-slate-500 text-xs pt-2 border-t border-slate-800">Notas: {r.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── FLUIDS TAB ─── */
const EXPIRY_MODES = [
  { value: 'date', label: 'Por fecha' },
  { value: 'km', label: 'Por kilometraje' },
  { value: 'both', label: 'Fecha y kilometraje' },
]

type FluidFormData = {
  name: string; description: string; expiryMode: string
  kmInterval: string; lastKm: string; nextKm: string
  lastDate: string; nextDate: string; notes: string
  showMaintenanceBtn: boolean
}

function FluidForm({
  form, onChange, onToggleShowBtn, onSubmit, onCancel, saving, label,
}: {
  form: FluidFormData
  onChange: (field: string, value: string) => void
  onToggleShowBtn: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  saving: boolean
  label: string
}) {
  const showKm = form.expiryMode === 'km' || form.expiryMode === 'both'
  const showDate = form.expiryMode === 'date' || form.expiryMode === 'both'
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label>Nombre del fluido *</label>
          <input className="input" value={form.name} onChange={e => onChange('name', e.target.value)}
            placeholder="ej: Líquido de frenos, Refrigerante..." required />
        </div>
        <div className="col-span-2">
          <label>Descripción</label>
          <input className="input" value={form.description} onChange={e => onChange('description', e.target.value)}
            placeholder="Especificaciones, marca, etc." />
        </div>
        <div className="col-span-2">
          <label>Tipo de vencimiento</label>
          <select className="input" value={form.expiryMode} onChange={e => onChange('expiryMode', e.target.value)}>
            {EXPIRY_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {showKm && (
          <>
            <div>
              <label>Km del último reemplazo</label>
              <input className="input" type="number" value={form.lastKm} onChange={e => onChange('lastKm', e.target.value)} />
            </div>
            <div>
              <label>Intervalo entre cambios (km)</label>
              <input className="input" type="number" value={form.kmInterval} onChange={e => onChange('kmInterval', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label>Próximo cambio (km)</label>
              <input className="input" type="number" value={form.nextKm} onChange={e => onChange('nextKm', e.target.value)} />
            </div>
          </>
        )}
        {showDate && (
          <>
            <div>
              <label>Fecha del último reemplazo</label>
              <input className="input" type="date" value={form.lastDate} onChange={e => onChange('lastDate', e.target.value)} />
            </div>
            <div>
              <label>Próximo vencimiento (fecha)</label>
              <input className="input" type="date" value={form.nextDate} onChange={e => onChange('nextDate', e.target.value)} />
            </div>
          </>
        )}
        <div className="col-span-2">
          <label>Notas</label>
          <input className="input" value={form.notes} onChange={e => onChange('notes', e.target.value)} />
        </div>
        <div className="col-span-2 pt-1 border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer mb-0">
            <input
              type="checkbox"
              checked={form.showMaintenanceBtn}
              onChange={e => onToggleShowBtn(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-slate-300 text-sm">Crear botón para registrar mantenimiento</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : label}</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function makeEmptyFluidForm(today: string): FluidFormData {
  return { name: '', description: '', expiryMode: 'date', kmInterval: '', lastKm: '', nextKm: '', lastDate: today, nextDate: '', notes: '', showMaintenanceBtn: true }
}

function FluidsTab({ vehicle, onRefresh }: any) {
  const today = new Date().toISOString().slice(0, 10)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FluidFormData>(() => makeEmptyFluidForm(today))

  function onChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function onToggleShowBtn(v: boolean) {
    setForm(f => ({ ...f, showMaintenanceBtn: v }))
  }

  function cancel() {
    setShowForm(false)
    setEditId(null)
    setForm(makeEmptyFluidForm(today))
  }

  async function addFluid(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fluids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, showMaintenanceBtn: form.showMaintenanceBtn }),
    })
    setSaving(false)
    cancel()
    onRefresh()
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fluids/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    cancel()
    onRefresh()
  }

  async function deleteFluid(fluidId: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    await fetch(`/api/vehicles/${vehicle.id}/fluids/${fluidId}`, { method: 'DELETE' })
    onRefresh()
  }

  function startEdit(fluid: any) {
    setEditId(fluid.id)
    setShowForm(false)
    setForm({
      name: fluid.name,
      description: fluid.description || '',
      expiryMode: fluid.expiryMode,
      kmInterval: fluid.kmInterval?.toString() || '',
      lastKm: fluid.lastKm?.toString() || '',
      nextKm: fluid.nextKm?.toString() || '',
      lastDate: fluid.lastDate ? new Date(fluid.lastDate).toISOString().slice(0, 10) : today,
      nextDate: fluid.nextDate ? new Date(fluid.nextDate).toISOString().slice(0, 10) : '',
      notes: fluid.notes || '',
      showMaintenanceBtn: fluid.showMaintenanceBtn ?? true,
    })
  }

  const fluids = vehicle.fluids ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Fluidos y vencimientos <span className="text-slate-500 font-normal text-sm">({fluids.length})</span>
        </h2>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm(makeEmptyFluidForm(today)) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Agregar fluido
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="section-title">Nuevo fluido</h3>
          <FluidForm form={form} onChange={onChange} onToggleShowBtn={onToggleShowBtn} onSubmit={addFluid} onCancel={cancel} saving={saving} label="Agregar" />
        </div>
      )}

      {fluids.length === 0 && !showForm ? (
        <div className="card text-center py-10">
          <Droplets size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay fluidos registrados.</p>
          <p className="text-slate-500 text-xs mt-1">Agregá aceite de transmisión, refrigerante, líquido de frenos, etc.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fluids.map((f: any) => {
            const s = getFluidStatus(vehicle.kmCurrent, f)
            const isEditing = editId === f.id
            const modeLabel = EXPIRY_MODES.find(m => m.value === f.expiryMode)?.label || f.expiryMode
            return (
              <div key={f.id} className="card">
                {isEditing ? (
                  <>
                    <h3 className="section-title">Editando: {f.name}</h3>
                    <FluidForm form={form} onChange={onChange} onToggleShowBtn={onToggleShowBtn} onSubmit={saveEdit} onCancel={cancel} saving={saving} label="Guardar cambios" />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-white">{f.name}</p>
                        <StatusBadge status={s} />
                        <span className="text-slate-600 text-xs">{modeLabel}</span>
                      </div>
                      {f.description && <p className="text-slate-400 text-sm mb-2">{f.description}</p>}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                        {f.lastDate && <span>Último: {fmtDate(f.lastDate)}</span>}
                        {f.nextDate && <span className={s !== 'ok' ? statusColor(s) : ''}>Vence: {fmtDate(f.nextDate)}</span>}
                        {f.lastKm && <span>Último: {f.lastKm.toLocaleString()} km</span>}
                        {f.nextKm && <span className={s !== 'ok' ? statusColor(s) : ''}>Próximo: {f.nextKm.toLocaleString()} km</span>}
                        {f.kmInterval && <span>Intervalo: {f.kmInterval.toLocaleString()} km</span>}
                      </div>
                      {f.notes && <p className="text-slate-500 text-xs mt-2">{f.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-slate-500 hover:text-blue-400 text-xs transition-colors">Editar</button>
                      <button onClick={() => deleteFluid(f.id, f.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── CONFIG TAB ─── */
function ConfigTab({ vehicle, onRefresh }: any) {
  const [saving, setSaving] = useState(false)

  const defaultFluid = DEFAULT_FLUID_CHECK_ITEMS
  const defaultInv = DEFAULT_INVENTORY_ITEMS

  const [fluidItems, setFluidItems] = useState<string[]>(
    () => (vehicle.weeklyFluidItems as string[] | null) ?? defaultFluid
  )
  const [invItems, setInvItems] = useState<string[]>(
    () => (vehicle.weeklyInventoryItems as string[] | null) ?? defaultInv
  )
  const [newFluid, setNewFluid] = useState('')
  const [newInv, setNewInv] = useState('')

  async function save() {
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyFluidItems: fluidItems, weeklyInventoryItems: invItems }),
    })
    setSaving(false)
    onRefresh()
  }

  function addFluidItem(e: React.FormEvent) {
    e.preventDefault()
    const v = newFluid.trim()
    if (v && !fluidItems.includes(v)) setFluidItems(prev => [...prev, v])
    setNewFluid('')
  }

  function addInvItem(e: React.FormEvent) {
    e.preventDefault()
    const v = newInv.trim()
    if (v && !invItems.includes(v)) setInvItems(prev => [...prev, v])
    setNewInv('')
  }

  return (
    <div className="space-y-5">
      {/* Fluid items */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Droplets size={15} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Items de control de fluidos</h3>
        </div>
        <p className="text-slate-500 text-xs">Lista que aparece en el formulario de revisión semanal.</p>
        <div className="space-y-1.5">
          {fluidItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
              <span className="flex-1 text-sm text-slate-200">{item}</span>
              <button
                onClick={() => setFluidItems(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addFluidItem} className="flex gap-2">
          <input
            className="input flex-1"
            value={newFluid}
            onChange={e => setNewFluid(e.target.value)}
            placeholder="Nuevo item de fluido..."
          />
          <button type="submit" className="btn-secondary px-3" disabled={!newFluid.trim()}>
            <Plus size={15} />
          </button>
        </form>
      </div>

      {/* Inventory items */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={15} className="text-amber-400" />
          <h3 className="font-semibold text-white text-sm">Items de inventario</h3>
        </div>
        <p className="text-slate-500 text-xs">Lista de elementos a verificar en el inventario del vehículo.</p>
        <div className="space-y-1.5">
          {invItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
              <span className="flex-1 text-sm text-slate-200">{item}</span>
              <button
                onClick={() => setInvItems(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addInvItem} className="flex gap-2">
          <input
            className="input flex-1"
            value={newInv}
            onChange={e => setNewInv(e.target.value)}
            placeholder="Nuevo item de inventario..."
          />
          <button type="submit" className="btn-secondary px-3" disabled={!newInv.trim()}>
            <Plus size={15} />
          </button>
        </form>
      </div>

      <button onClick={save} className="btn-primary flex items-center gap-2" disabled={saving}>
        <Save size={15} />
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>

      <TirePressureSection vehicle={vehicle} onRefresh={onRefresh} />
    </div>
  )
}

/* ─── INSURANCE TAB ─── */
function InsuranceTab({ vehicle, onRefresh }: any) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ insuranceCompany: '', policyNumber: '', policyStartDate: '', policyExpirationDate: '' })

  const insuranceS = getInsuranceStatus(vehicle.policyExpirationDate ?? null)
  const hasInsurance = vehicle.insuranceCompany || vehicle.policyNumber || vehicle.policyExpirationDate
  const hasPdf = !!vehicle.policyPdfUrl

  const STATUS_LABELS: Record<string, string> = {
    ok: 'Vigente',
    warning: 'Próxima a vencer',
    danger: 'Vencida',
    unknown: 'Sin registrar',
  }

  function openEdit() {
    setForm({
      insuranceCompany: vehicle.insuranceCompany || '',
      policyNumber: vehicle.policyNumber || '',
      policyStartDate: vehicle.policyStartDate ? new Date(vehicle.policyStartDate).toISOString().slice(0, 10) : '',
      policyExpirationDate: vehicle.policyExpirationDate ? new Date(vehicle.policyExpirationDate).toISOString().slice(0, 10) : '',
    })
    setEditing(true)
  }

  async function saveInsurance(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insuranceCompany: form.insuranceCompany || null,
        policyNumber: form.policyNumber || null,
        policyStartDate: form.policyStartDate || null,
        policyExpirationDate: form.policyExpirationDate || null,
      }),
    })
    setSaving(false)
    setEditing(false)
    onRefresh()
  }

  async function uploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return }
    if (file.size > 10 * 1024 * 1024) { alert('El archivo no puede superar los 10 MB'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/vehicles/${vehicle.id}/insurance/pdf`, { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Error al subir el archivo')
    }
    e.target.value = ''
    setUploading(false)
    onRefresh()
  }

  async function deletePdf() {
    if (!confirm('¿Eliminar la póliza adjunta?')) return
    await fetch(`/api/vehicles/${vehicle.id}/insurance/pdf`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {vehicle.policyExpirationDate && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          insuranceS === 'danger' ? 'bg-red-500/10 border-red-500/30' :
          insuranceS === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <Shield size={20} className={
            insuranceS === 'danger' ? 'text-red-400' :
            insuranceS === 'warning' ? 'text-amber-400' : 'text-emerald-400'
          } />
          <div>
            <p className={`font-semibold ${
              insuranceS === 'danger' ? 'text-red-300' :
              insuranceS === 'warning' ? 'text-amber-300' : 'text-emerald-300'
            }`}>{STATUS_LABELS[insuranceS]}</p>
            <p className="text-slate-400 text-sm">
              Vence el {new Date(vehicle.policyExpirationDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              {insuranceS === 'warning' && ` · ${Math.ceil((new Date(vehicle.policyExpirationDate).getTime() - Date.now()) / 86400000)} días restantes`}
              {insuranceS === 'danger' && ` · Vencida hace ${Math.abs(Math.ceil((new Date(vehicle.policyExpirationDate).getTime() - Date.now()) / 86400000))} días`}
            </p>
          </div>
        </div>
      )}

      {/* Insurance data */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Datos del seguro</h3>
          {!editing && (
            <button onClick={openEdit} className="text-xs text-slate-500 hover:text-white transition-colors">
              {hasInsurance ? 'Editar' : '+ Agregar'}
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveInsurance} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Compañía aseguradora</label>
                <input className="input" value={form.insuranceCompany} onChange={e => setForm(f => ({ ...f, insuranceCompany: e.target.value }))} placeholder="ej: Zurich, San Cristóbal..." autoFocus />
              </div>
              <div>
                <label>Número de póliza</label>
                <input className="input" value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} placeholder="ej: 12345678" />
              </div>
              <div>
                <label>Fecha de inicio de cobertura</label>
                <input className="input" type="date" value={form.policyStartDate} onChange={e => setForm(f => ({ ...f, policyStartDate: e.target.value }))} />
              </div>
              <div>
                <label>Fecha de vencimiento</label>
                <input className="input" type="date" value={form.policyExpirationDate} onChange={e => setForm(f => ({ ...f, policyExpirationDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        ) : hasInsurance ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {vehicle.insuranceCompany && <Row label="Compañía" value={vehicle.insuranceCompany} />}
            {vehicle.policyNumber && <Row label="N° de póliza" value={vehicle.policyNumber} />}
            {vehicle.policyStartDate && <Row label="Inicio de cobertura" value={fmtDate(vehicle.policyStartDate)} />}
            {vehicle.policyExpirationDate && <Row label="Vencimiento" value={fmtDate(vehicle.policyExpirationDate)} />}
          </div>
        ) : (
          <p className="text-slate-600 text-sm">Sin información de seguro registrada</p>
        )}
      </div>

      {/* PDF */}
      <div className="card">
        <h3 className="section-title mb-4">Póliza digital (PDF)</h3>
        {hasPdf ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <FileText size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{vehicle.policyPdfName || 'poliza.pdf'}</p>
                {vehicle.policyPdfUploadedAt && (
                  <p className="text-slate-500 text-xs mt-0.5">Cargado el {fmtDate(vehicle.policyPdfUploadedAt)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={vehicle.policyPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex items-center gap-2">
                <Eye size={14} />
                Ver póliza
              </a>
              <a href={vehicle.policyPdfUrl} download={vehicle.policyPdfName || 'poliza.pdf'} className="btn-secondary text-sm flex items-center gap-2">
                <Download size={14} />
                Descargar
              </a>
              <label className="btn-secondary text-sm flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                {uploading ? 'Subiendo...' : 'Reemplazar'}
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={uploadPdf} disabled={uploading} />
              </label>
              <button onClick={deletePdf} className="text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">No hay póliza adjunta</p>
            <label className="btn-primary text-sm inline-flex items-center gap-2 cursor-pointer">
              <Upload size={14} />
              {uploading ? 'Subiendo...' : 'Subir póliza PDF'}
              <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={uploadPdf} disabled={uploading} />
            </label>
            <p className="text-slate-600 text-xs mt-3">Máximo 10 MB · Solo PDF</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── LINKS TAB ─── */
function LinksTab({ vehicle, onRefresh }: any) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: '', url: '' })

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ label: '', url: '' })
    onRefresh()
  }

  async function deleteLink(linkId: string, label: string) {
    if (!confirm(`¿Eliminar "${label}"?`)) return
    await fetch(`/api/vehicles/${vehicle.id}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Links personalizados <span className="text-slate-500 font-normal text-sm">({vehicle.links.length})</span>
        </h2>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Agregar link
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="section-title">Nuevo link</h3>
          <form onSubmit={addLink} className="space-y-3">
            <div>
              <label>Etiqueta *</label>
              <input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="ej: Manual del vehículo" required autoFocus />
            </div>
            <div>
              <label>URL *</label>
              <input className="input" type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {vehicle.links.length === 0 && !showForm ? (
        <div className="card text-center py-10">
          <Link2 size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay links registrados.</p>
          <p className="text-slate-500 text-xs mt-1">Agregá links a manuales, seguros, documentos, etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicle.links.map((l: any) => (
            <div key={l.id} className="card flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Link2 size={16} className="text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{l.label}</p>
                  <p className="text-slate-500 text-xs truncate">{l.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => deleteLink(l.id, l.label)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
