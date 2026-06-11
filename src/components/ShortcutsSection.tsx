'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, Printer, ClipboardList, Car, Plus,
  Wrench, X, Trash2, RotateCcw, Flame, CheckCircle, ChevronRight, ArrowLeft, Droplets,
} from 'lucide-react'
import { useUser } from './UserProvider'
import { fmtDate } from '@/lib/utils'

/* ── Types ── */
type ShortcutDef = {
  value: string
  label: string
  subtitle: string
  needsVehicle: boolean
  Icon: React.ElementType
  colorIcon: string
  colorBg: string
  colorBorder: string
}

type Shortcut = {
  id: string
  type: string
  vehicleId: string | null
  label: string | null
  vehicle: { id: string; plate: string; brand: string; model: string } | null
}

type VehicleItem = { id: string; plate: string; brand: string; model: string; kmCurrent: number }

/* ── Shortcut type definitions ── */
const SHORTCUT_TYPES: ShortcutDef[] = [
  {
    value: 'register_maintenance',
    label: 'Registrar mantenimiento',
    subtitle: 'Elige vehículo y tipo',
    needsVehicle: false,
    Icon: Wrench,
    colorIcon: 'text-blue-400',
    colorBg: 'bg-blue-500/10',
    colorBorder: 'border-blue-500/20',
  },
  {
    value: 'weekly_review_all',
    label: 'Revisión semanal completa',
    subtitle: 'Todos los vehículos',
    needsVehicle: false,
    Icon: ClipboardList,
    colorIcon: 'text-purple-400',
    colorBg: 'bg-purple-500/10',
    colorBorder: 'border-purple-500/20',
  },
  {
    value: 'weekly_check',
    label: 'Check semanal',
    subtitle: 'Un vehículo específico',
    needsVehicle: true,
    Icon: ClipboardList,
    colorIcon: 'text-indigo-400',
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500/20',
  },
  {
    value: 'daily_check',
    label: 'Check diario',
    subtitle: 'Un vehículo específico',
    needsVehicle: true,
    Icon: CheckCircle,
    colorIcon: 'text-emerald-400',
    colorBg: 'bg-emerald-500/10',
    colorBorder: 'border-emerald-500/20',
  },
  {
    value: 'vehicle_page',
    label: 'Ver vehículo',
    subtitle: 'Acceso directo',
    needsVehicle: true,
    Icon: Car,
    colorIcon: 'text-slate-400',
    colorBg: 'bg-slate-700/50',
    colorBorder: 'border-slate-600',
  },
  {
    value: 'print_weekly',
    label: 'Imprimir reporte',
    subtitle: 'Reporte semanal',
    needsVehicle: false,
    Icon: Printer,
    colorIcon: 'text-amber-400',
    colorBg: 'bg-amber-500/10',
    colorBorder: 'border-amber-500/20',
  },
]

function getTypeDef(type: string): ShortcutDef {
  return SHORTCUT_TYPES.find(t => t.value === type) ?? SHORTCUT_TYPES[0]
}

function cardLabel(s: Shortcut): string {
  if (s.label) return s.label
  const def = getTypeDef(s.type)
  if (s.vehicle) return `${def.label} — ${s.vehicle.plate}`
  return def.label
}

function cardSubtitle(s: Shortcut): string {
  if (s.vehicle) return `${s.vehicle.brand} ${s.vehicle.model}`
  return getTypeDef(s.type).subtitle
}

/* ── Main component ── */
export default function ShortcutsSection() {
  const { user } = useUser()
  const router = useRouter()
  const [shortcuts, setShortcuts] = useState<Shortcut[] | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [maintModal, setMaintModal] = useState<MaintStep | null>(null)

  useEffect(() => {
    if (!user) return
    fetch(`/api/users/${user.id}/shortcuts`)
      .then(r => r.json())
      .then(setShortcuts)
  }, [user])

  async function removeShortcut(id: string) {
    if (!user) return
    await fetch(`/api/users/${user.id}/shortcuts/${id}`, { method: 'DELETE' })
    setShortcuts(prev => prev ? prev.filter(s => s.id !== id) : prev)
  }

  async function addShortcut(type: string, vehicleId: string | null, label: string | null) {
    if (!user) return
    const res = await fetch(`/api/users/${user.id}/shortcuts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, vehicleId, label }),
    })
    if (res.ok) {
      const updated = await fetch(`/api/users/${user.id}/shortcuts`).then(r => r.json())
      setShortcuts(updated)
    }
    setShowAdd(false)
  }

  function handleShortcutClick(s: Shortcut) {
    switch (s.type) {
      case 'register_maintenance':
        setMaintModal({ step: 'vehicle' })
        break
      case 'weekly_review_all':
        router.push('/weekly-review-all')
        break
      case 'weekly_check':
        if (s.vehicleId) router.push(`/vehicles/${s.vehicleId}/weekly-review`)
        break
      case 'daily_check':
        if (s.vehicleId) router.push(`/vehicles/${s.vehicleId}/daily-review`)
        break
      case 'vehicle_page':
        if (s.vehicleId) router.push(`/vehicles/${s.vehicleId}`)
        break
      case 'print_weekly':
        window.open('/reports/weekly-review?autoprint=1', '_blank')
        break
    }
  }

  if (!user || shortcuts === null) return null
  if (shortcuts.length === 0 && !showAdd) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <p className="text-slate-500 text-sm">Sin accesos rápidos</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <Plus size={12} />Agregar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <h2 className="text-sm font-medium text-slate-400">Accesos rápidos</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Plus size={12} />Agregar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {shortcuts.map(s => {
          const def = getTypeDef(s.type)
          const { Icon } = def
          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => handleShortcutClick(s)}
                className={`w-full text-left p-3 rounded-xl border ${def.colorBorder} ${def.colorBg} hover:brightness-110 transition-all`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${def.colorBg} border ${def.colorBorder}`}>
                  <Icon size={16} className={def.colorIcon} />
                </div>
                <p className="text-white text-sm font-medium leading-tight">{cardLabel(s)}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{cardSubtitle(s)}</p>
              </button>
              <button
                onClick={() => removeShortcut(s.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5 rounded"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <AddShortcutModal
          onAdd={addShortcut}
          onClose={() => setShowAdd(false)}
        />
      )}

      {maintModal && (
        <RegisterMaintenanceModal
          step={maintModal}
          onStep={setMaintModal}
          onClose={() => setMaintModal(null)}
        />
      )}
    </div>
  )
}

/* ── Add shortcut modal ── */
function AddShortcutModal({ onAdd, onClose }: {
  onAdd: (type: string, vehicleId: string | null, label: string | null) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<ShortcutDef | null>(null)
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (selected?.needsVehicle) {
      fetch('/api/vehicles').then(r => r.json()).then(setVehicles)
    }
  }, [selected])

  async function confirm() {
    if (!selected) return
    if (selected.needsVehicle && !vehicleId) return
    setAdding(true)
    await onAdd(selected.value, selected.needsVehicle ? vehicleId : null, null)
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-white">Agregar acceso directo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {SHORTCUT_TYPES.map(def => {
              const { Icon } = def
              const active = selected?.value === def.value
              return (
                <button
                  key={def.value}
                  onClick={() => { setSelected(def); setVehicleId('') }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    active
                      ? `${def.colorBg} ${def.colorBorder} ring-1 ring-offset-0 ring-offset-slate-900`
                      : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${def.colorBg} border ${def.colorBorder}`}>
                    <Icon size={14} className={def.colorIcon} />
                  </div>
                  <p className="text-white text-xs font-medium leading-tight">{def.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{def.subtitle}</p>
                </button>
              )
            })}
          </div>

          {selected?.needsVehicle && (
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Vehículo</label>
              <select
                className="input"
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
              >
                <option value="">Seleccioná un vehículo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={confirm}
              disabled={!selected || adding || (selected.needsVehicle && !vehicleId)}
              className="btn-primary flex-1"
            >
              {adding ? 'Agregando...' : 'Agregar acceso'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Register Maintenance modal (multi-step) ── */
type MaintStep =
  | { step: 'vehicle' }
  | { step: 'type'; vehicle: any }
  | { step: 'form'; vehicle: any; formType: 'oil' | 'alignment' | 'fe' | 'vtv' }
  | { step: 'form'; vehicle: any; formType: 'fluid'; fluid: any }

const MAINT_TYPES = [
  { key: 'oil' as const, label: 'Nuevo service', subtitle: 'Filtros y aceite de motor', Icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/50' },
  { key: 'alignment' as const, label: 'Nueva alineación', subtitle: 'Alineación y balanceo', Icon: RotateCcw, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/50' },
  { key: 'fe' as const, label: 'Nuevo matafuego', subtitle: 'Registro de vencimiento', Icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hoverBorder: 'hover:border-orange-500/50' },
  { key: 'vtv' as const, label: 'Nueva VTV / RTO', subtitle: 'Inspección técnica vehicular', Icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50' },
]

function RegisterMaintenanceModal({ step, onStep, onClose }: {
  step: MaintStep
  onStep: (s: MaintStep | null) => void
  onClose: () => void
}) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [loadingVehicle, setLoadingVehicle] = useState(false)

  useEffect(() => {
    if (step.step === 'vehicle') {
      fetch('/api/vehicles').then(r => r.json()).then(setVehicles)
    }
  }, [step.step])

  async function selectVehicle(v: VehicleItem) {
    setLoadingVehicle(true)
    const full = await fetch(`/api/vehicles/${v.id}`).then(r => r.json())
    setLoadingVehicle(false)
    onStep({ step: 'type', vehicle: full })
  }

  const subtitle =
    step.step === 'vehicle' ? '¿Para qué vehículo?' :
    step.step === 'type' ? `${(step as any).vehicle.plate} — ${(step as any).vehicle.brand} ${(step as any).vehicle.model}` :
    (() => {
      const s = step as { step: 'form'; vehicle: any; formType: string; fluid?: any }
      if (s.formType === 'fluid') return `${s.vehicle.plate} · ${s.fluid?.name ?? 'Fluido'}`
      const t = MAINT_TYPES.find(m => m.key === s.formType)
      return `${s.vehicle.plate} · ${t?.subtitle ?? ''}`
    })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
          <div className="flex items-center gap-3">
            {step.step !== 'vehicle' && (
              <button
                onClick={() => onStep(step.step === 'form' ? { step: 'type', vehicle: (step as any).vehicle } : { step: 'vehicle' })}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-white">Registrar mantenimiento</h2>
              <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {step.step === 'vehicle' && (
            <div className="space-y-2">
              {vehicles.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Cargando vehículos...</p>
              ) : vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVehicle(v)}
                  disabled={loadingVehicle}
                  className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all text-left"
                >
                  <div>
                    <p className="text-white font-medium">{v.plate}</p>
                    <p className="text-slate-400 text-sm">{v.brand} {v.model} · {v.kmCurrent.toLocaleString()} km</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {step.step === 'type' && (() => {
            const vehicle = (step as any).vehicle
            const fluids: any[] = (vehicle.fluids ?? []).filter((f: any) => f.showMaintenanceBtn !== false)
            return (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mantenimientos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {MAINT_TYPES.map(t => {
                      const { Icon } = t
                      return (
                        <button
                          key={t.key}
                          onClick={() => onStep({ step: 'form', vehicle, formType: t.key })}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border border-slate-700 ${t.hoverBorder} hover:bg-slate-800/30 transition-all text-left`}
                        >
                          <div className={`w-9 h-9 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center shrink-0`}>
                            <Icon size={16} className={t.color} />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{t.label}</p>
                            <p className="text-slate-500 text-xs">{t.subtitle}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {fluids.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fluidos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {fluids.map(fluid => (
                        <button
                          key={fluid.id}
                          onClick={() => onStep({ step: 'form', vehicle, formType: 'fluid', fluid })}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                            <Droplets size={16} className="text-cyan-400" />
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
            )
          })()}

          {step.step === 'form' && (() => {
            const s = step as { step: 'form'; vehicle: any; formType: string; fluid?: any }
            const done = () => onClose()
            if (s.formType === 'oil') return <MaintOilForm vehicle={s.vehicle} onDone={done} />
            if (s.formType === 'alignment') return <MaintAlignForm vehicle={s.vehicle} onDone={done} />
            if (s.formType === 'fe') return <MaintFEForm vehicle={s.vehicle} onDone={done} />
            if (s.formType === 'vtv') return <MaintVTVForm vehicle={s.vehicle} onDone={done} />
            if (s.formType === 'fluid' && s.fluid) return <MaintFluidForm vehicle={s.vehicle} fluid={s.fluid} onDone={done} />
          })()}
        </div>
      </div>
    </div>
  )
}

/* ── Inline maintenance forms ── */
function MaintOilForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const oc = vehicle.oilChange
  const today = new Date().toISOString().slice(0, 10)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    lastKm: oc?.lastKm?.toString() || vehicle.kmCurrent.toString(),
    lastDate: oc?.lastDate ? new Date(oc.lastDate).toISOString().slice(0, 10) : today,
    kmInterval: oc?.kmInterval?.toString() || '10000',
    nextDate: oc?.nextDate ? new Date(oc.nextDate).toISOString().slice(0, 10) : '',
    oilType: oc?.oilType || '',
    airFilterCleaned: oc?.airFilterCleaned ?? false,
    airFilterChanged: oc?.airFilterChanged ?? false,
    fuelFilterChanged: oc?.fuelFilterChanged ?? false,
    notes: oc?.notes || '',
  })
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/oil-change`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label>Km del último cambio *</label><input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} required /></div>
        <div><label>Fecha del último cambio *</label><input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} required /></div>
        <div><label>Intervalo (km)</label><input className="input" type="number" value={form.kmInterval} onChange={e => setForm(f => ({ ...f, kmInterval: e.target.value }))} /></div>
        <div><label>Próximo cambio (fecha)</label><input className="input" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} /></div>
        <div className="col-span-2"><label>Tipo de aceite</label><input className="input" value={form.oilType} onChange={e => setForm(f => ({ ...f, oilType: e.target.value }))} placeholder="ej: 5W-40 sintético" /></div>
        <div className="col-span-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Filtro de aire</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.airFilterCleaned} onChange={e => setForm(f => ({ ...f, airFilterCleaned: e.target.checked }))} className="w-4 h-4" /><span className="text-slate-300 text-sm">Limpiado</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.airFilterChanged} onChange={e => setForm(f => ({ ...f, airFilterChanged: e.target.checked }))} className="w-4 h-4" /><span className="text-slate-300 text-sm">Cambiado</span></label>
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Filtro de combustible</p>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.fuelFilterChanged} onChange={e => setForm(f => ({ ...f, fuelFilterChanged: e.target.checked }))} className="w-4 h-4" /><span className="text-slate-300 text-sm">Cambiado</span></label>
        </div>
        <div className="col-span-2"><label>Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function MaintAlignForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const ab = vehicle.alignmentBalance
  const today = new Date().toISOString().slice(0, 10)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    lastKm: ab?.lastKm?.toString() || vehicle.kmCurrent.toString(),
    lastDate: ab?.lastDate ? new Date(ab.lastDate).toISOString().slice(0, 10) : today,
    kmInterval: ab?.kmInterval?.toString() || '20000',
    nextKm: ab?.nextKm?.toString() || '',
    nextDate: ab?.nextDate ? new Date(ab.nextDate).toISOString().slice(0, 10) : '',
    notes: ab?.notes || '',
  })
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/alignment`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label>Km del último servicio *</label><input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} required /></div>
        <div><label>Fecha del último servicio *</label><input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} required /></div>
        <div><label>Intervalo (km)</label><input className="input" type="number" value={form.kmInterval} onChange={e => setForm(f => ({ ...f, kmInterval: e.target.value }))} /></div>
        <div><label>Próximo (km)</label><input className="input" type="number" value={form.nextKm} onChange={e => setForm(f => ({ ...f, nextKm: e.target.value }))} /></div>
        <div><label>Próximo (fecha)</label><input className="input" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} /></div>
        <div className="col-span-2"><label>Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function MaintVTVForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const vtv = vehicle.vtv
  const today = new Date().toISOString().slice(0, 10)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    expirationDate: vtv?.expirationDate ? new Date(vtv.expirationDate).toISOString().slice(0, 10) : '',
    lastDate: vtv?.lastDate ? new Date(vtv.lastDate).toISOString().slice(0, 10) : today,
    notes: vtv?.notes || '',
  })
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/vtv`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label>Fecha de vencimiento *</label><input className="input" type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} required /></div>
        <div><label>Fecha de última inspección</label><input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} /></div>
        <div className="col-span-2"><label>Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function MaintFEForm({ vehicle, onDone }: { vehicle: any; onDone: () => void }) {
  const fe = vehicle.fireExtinguisher
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    expirationDate: fe?.expirationDate ? new Date(fe.expirationDate).toISOString().slice(0, 10) : '',
    notes: fe?.notes || '',
  })
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fire-extinguisher`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label>Fecha de vencimiento *</label><input className="input" type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} required /></div>
        <div className="col-span-2"><label>Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Marca, ubicación, etc." /></div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function MaintFluidForm({ vehicle, fluid, onDone }: { vehicle: any; fluid: any; onDone: () => void }) {
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
    e.preventDefault(); setSaving(true)
    await fetch(`/api/vehicles/${vehicle.id}/fluids/${fluid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastKm: byKm && form.lastKm ? form.lastKm : undefined,
        kmInterval: byKm && form.kmInterval ? form.kmInterval : undefined,
        nextKm: byKm && form.nextKm ? form.nextKm : undefined,
        lastDate: byDate ? form.lastDate || null : undefined,
        nextDate: byDate ? form.nextDate || null : undefined,
        notes: form.notes || null,
      }),
    })
    setSaving(false); onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {byKm && <>
          <div><label>Km del último cambio</label><input className="input" type="number" value={form.lastKm} onChange={e => setForm(f => ({ ...f, lastKm: e.target.value }))} /></div>
          <div><label>Intervalo (km)</label><input className="input" type="number" value={form.kmInterval} onChange={e => setForm(f => ({ ...f, kmInterval: e.target.value }))} /></div>
          <div><label>Próximo cambio (km)</label><input className="input" type="number" value={form.nextKm} onChange={e => setForm(f => ({ ...f, nextKm: e.target.value }))} /></div>
        </>}
        {byDate && <>
          <div><label>Fecha del último cambio</label><input className="input" type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} /></div>
          <div><label>Próximo cambio (fecha)</label><input className="input" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} /></div>
        </>}
        <div className="col-span-2"><label>Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}
