'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Droplets, Package } from 'lucide-react'
import { DEFAULT_FLUID_CHECK_ITEMS, DEFAULT_INVENTORY_ITEMS } from '@/lib/utils'
import { useUser } from '@/components/UserProvider'

export default function WeeklyReviewPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : params.id[0]
  const router = useRouter()
  const { user } = useUser()

  const [vehicle, setVehicle] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [kmReading, setKmReading] = useState('')
  const [insuranceOk, setInsuranceOk] = useState(false)
  const [notes, setNotes] = useState('')
  const [fluidChecks, setFluidChecks] = useState<Record<string, boolean>>({})
  const [inventoryChecks, setInventoryChecks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then(r => r.json())
      .then(v => {
        setVehicle(v)
        const fluidItems: string[] = v.weeklyFluidItems ?? DEFAULT_FLUID_CHECK_ITEMS
        const invItems: string[] = v.weeklyInventoryItems ?? DEFAULT_INVENTORY_ITEMS
        setFluidChecks(Object.fromEntries(fluidItems.map(item => [item, true])))
        setInventoryChecks(Object.fromEntries(invItems.map(item => [item, false])))
      })
  }, [id])

  const fluidItems: string[] = vehicle?.weeklyFluidItems ?? DEFAULT_FLUID_CHECK_ITEMS
  const invItems: string[] = vehicle?.weeklyInventoryItems ?? DEFAULT_INVENTORY_ITEMS

  const allInvSelected = invItems.length > 0 && invItems.every(item => inventoryChecks[item])
  function toggleAllInventory() {
    const next = !allInvSelected
    setInventoryChecks(Object.fromEntries(invItems.map(item => [item, next])))
  }

  const inventoryCount = invItems.filter(item => inventoryChecks[item]).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/vehicles/${id}/reviews/weekly`, {
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
        setError(data.error || `Error ${res.status} al guardar`)
        setSaving(false)
        return
      }
      router.push(`/vehicles/${id}`)
    } catch (err) {
      setError('Error de red. Intentá de nuevo.')
      setSaving(false)
    }
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/vehicles/${id}`} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Revisión semanal</h1>
          <p className="text-slate-400 text-sm">
            {vehicle.plate} — {vehicle.brand} {vehicle.model}
            {user ? ` · ${user.name}` : ''}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* KM + Seguro */}
        <div className="card space-y-4">
          <div>
            <label>Lectura de KM</label>
            <input
              className="input"
              type="number"
              value={kmReading}
              onChange={e => setKmReading(e.target.value)}
              placeholder="Kilometraje actual del vehículo"
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
              <ShieldCheck size={15} className={insuranceOk ? 'text-emerald-400' : 'text-slate-500'} />
              Seguros actualizados
            </span>
          </label>
        </div>

        {/* Niveles de fluidos */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={15} className="text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Niveles de fluidos</h3>
          </div>
          {fluidItems.map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer select-none px-1 py-1.5">
              <input
                type="checkbox"
                checked={fluidChecks[item] ?? true}
                onChange={e => setFluidChecks(prev => ({ ...prev, [item]: e.target.checked }))}
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
              <Package size={15} className="text-amber-400" />
              <h3 className="font-semibold text-white text-sm">Inventario</h3>
            </div>
            <span className="text-xs text-slate-500">{inventoryCount}/{invItems.length} presentes</span>
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
                onChange={e => setInventoryChecks(prev => ({ ...prev, [item]: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-500 shrink-0"
              />
              <span className="text-sm text-slate-200">{item}</span>
            </label>
          ))}
        </div>

        <div className="card">
          <label>Observaciones</label>
          <textarea
            className="input h-24 resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Detallá reparaciones, problemas, recomendaciones..."
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar revisión'}
          </button>
          <Link href={`/vehicles/${id}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
