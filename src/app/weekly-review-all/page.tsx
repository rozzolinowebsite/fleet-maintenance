'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, ClipboardList,
  ShieldCheck, Droplets, Package, X,
} from 'lucide-react'
import { useUser } from '@/components/UserProvider'
import { DEFAULT_FLUID_CHECK_ITEMS, DEFAULT_INVENTORY_ITEMS } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Vehicle = {
  id: string
  plate: string
  brand: string
  model: string
  kmCurrent: number
  weeklyFluidItems: string[] | null
  weeklyInventoryItems: string[] | null
  weeklyReviews: { id: string }[]
}

export default function WeeklyReviewAllPage() {
  const router = useRouter()
  const { user } = useUser()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((data: Vehicle[]) => {
        setVehicles(data)
        setDoneIds(new Set(data.filter(v => v.weeklyReviews.length > 0).map(v => v.id)))
        setLoading(false)
      })
  }, [])

  function handleSaved(vehicleId: string) {
    setDoneIds(prev => {
      const next = new Set(prev)
      next.add(vehicleId)
      return next
    })
    setActiveVehicle(null)
  }

  const today = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })
  const doneCount = doneIds.size
  const allDone = vehicles.length > 0 && doneCount >= vehicles.length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">Cargando vehículos...</p>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">Revisión semanal completa</h1>
          <p className="text-slate-400 text-sm capitalize">{today}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-white">{doneCount}<span className="text-slate-500 text-lg">/{vehicles.length}</span></p>
          <p className="text-slate-500 text-xs">vehículos</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
          style={{ width: vehicles.length > 0 ? `${(doneCount / vehicles.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Vehicle list */}
      <div className="space-y-2">
        {vehicles.map(v => {
          const done = doneIds.has(v.id)
          return (
            <div
              key={v.id}
              className={`card flex items-center gap-4 transition-all duration-300 ${done ? 'opacity-60' : ''}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                done ? 'bg-emerald-500/20' : 'bg-slate-800'
              }`}>
                {done
                  ? <CheckCircle size={18} className="text-emerald-400" />
                  : <ClipboardList size={16} className="text-slate-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{v.plate}</p>
                <p className="text-slate-400 text-sm">{v.brand} {v.model} · {v.kmCurrent.toLocaleString()} km</p>
              </div>
              <button
                onClick={() => setActiveVehicle(v)}
                className={done
                  ? 'text-xs text-slate-500 hover:text-slate-300 transition-colors px-2'
                  : 'btn-primary text-xs py-1.5 px-4 shrink-0'
                }
              >
                {done ? 'Re-revisar' : 'Revisar →'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Completion banner */}
      {allDone && (
        <div className="card bg-emerald-500/10 border-emerald-500/30 text-center py-8 space-y-3">
          <CheckCircle size={36} className="text-emerald-400 mx-auto" />
          <div>
            <p className="text-emerald-300 font-semibold text-lg">¡Revisión semanal completada!</p>
            <p className="text-emerald-500/70 text-sm mt-1">Todos los vehículos fueron revisados esta semana.</p>
          </div>
          <button onClick={() => router.push('/')} className="btn-primary mx-auto">
            Volver al dashboard
          </button>
        </div>
      )}

      {/* Slide-over panel */}
      {activeVehicle && (
        <WeeklyReviewPanel
          vehicle={activeVehicle}
          user={user}
          onDone={() => handleSaved(activeVehicle.id)}
          onClose={() => setActiveVehicle(null)}
        />
      )}
    </div>
  )
}

/* ── Per-vehicle review panel ── */
function WeeklyReviewPanel({ vehicle, user, onDone, onClose }: {
  vehicle: Vehicle
  user: any
  onDone: () => void
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [kmReading, setKmReading] = useState('')
  const [insuranceOk, setInsuranceOk] = useState(false)
  const [notes, setNotes] = useState('')

  const fluidItems = vehicle.weeklyFluidItems ?? DEFAULT_FLUID_CHECK_ITEMS
  const invItems = vehicle.weeklyInventoryItems ?? DEFAULT_INVENTORY_ITEMS

  const [fluidChecks, setFluidChecks] = useState<Record<string, boolean>>(
    () => Object.fromEntries(fluidItems.map(item => [item, true]))
  )
  const [inventoryChecks, setInventoryChecks] = useState<Record<string, boolean>>(
    () => Object.fromEntries(invItems.map(item => [item, false]))
  )

  const allInvSelected = invItems.every(item => inventoryChecks[item])
  function toggleAllInventory() {
    const next = !allInvSelected
    setInventoryChecks(Object.fromEntries(invItems.map(item => [item, next])))
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/reviews/weekly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id ?? null,
          reviewer: user?.name ?? null,
          kmReading: kmReading || null,
          insuranceOk,
          items: [],
          fluidChecks: fluidItems.map(item => ({ item, ok: fluidChecks[item] ?? true })),
          inventoryChecks: invItems.map(item => ({ item, ok: inventoryChecks[item] ?? false })),
          notes,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}`)
        setSaving(false)
        return
      }
      onDone()
    } catch {
      setError('Error de red. Intentá de nuevo.')
      setSaving(false)
    }
  }

  return (
    /* Desktop: right side-panel. Mobile: full screen */
    <div className="fixed inset-0 z-50 md:flex md:justify-end overflow-hidden bg-black/60 md:backdrop-blur-sm">
      <div className="h-full w-full md:w-[480px] bg-slate-950 md:border-l border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div>
            <p className="font-bold text-white text-lg">{vehicle.plate}</p>
            <p className="text-slate-400 text-sm">{vehicle.brand} {vehicle.model} · {vehicle.kmCurrent.toLocaleString()} km</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* KM + Seguro */}
          <div className="card space-y-4">
            <div>
              <label>Lectura de KM</label>
              <input
                className="input"
                type="number"
                value={kmReading}
                onChange={e => setKmReading(e.target.value)}
                placeholder="Kilometraje actual"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={insuranceOk}
                onChange={e => setInsuranceOk(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck size={14} className={insuranceOk ? 'text-emerald-400' : 'text-slate-500'} />
                Seguros actualizados
              </span>
            </label>
          </div>

          {/* Fluidos */}
          <div className="card space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-blue-400" />
              <h3 className="font-semibold text-white text-sm">Niveles de fluidos</h3>
            </div>
            {fluidItems.map(item => (
              <label key={item} className="flex items-center gap-3 cursor-pointer select-none px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={fluidChecks[item] ?? true}
                  onChange={e => setFluidChecks(p => ({ ...p, [item]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-500 shrink-0"
                />
                <span className="text-sm text-slate-200">{item}</span>
              </label>
            ))}
          </div>

          {/* Inventario */}
          <div className="card space-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Inventario</h3>
              </div>
              <span className="text-xs text-slate-500">
                {invItems.filter(i => inventoryChecks[i]).length}/{invItems.length} presentes
              </span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none px-1 py-1.5 border-b border-slate-800 mb-1">
              <input
                type="checkbox"
                checked={allInvSelected}
                onChange={toggleAllInventory}
                className="w-4 h-4 rounded accent-blue-500 shrink-0"
              />
              <span className="text-sm font-medium text-slate-300">Seleccionar todo</span>
            </label>
            {invItems.map(item => (
              <label key={item} className="flex items-center gap-3 cursor-pointer select-none px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={inventoryChecks[item] ?? false}
                  onChange={e => setInventoryChecks(p => ({ ...p, [item]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-500 shrink-0"
                />
                <span className="text-sm text-slate-200">{item}</span>
              </label>
            ))}
          </div>

          {/* Observaciones */}
          <div className="card">
            <label>Observaciones</label>
            <textarea
              className="input h-20 resize-none"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reparaciones, problemas, recomendaciones..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {saving
              ? 'Guardando...'
              : <><CheckCircle size={16} /> Guardar revisión de {vehicle.plate}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
