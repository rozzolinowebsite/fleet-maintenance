'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Zap, Car, ClipboardList, FileText, Wrench } from 'lucide-react'
import { useUser } from '@/components/UserProvider'

type Shortcut = {
  id: string
  type: string
  vehicleId: string | null
  label: string | null
  vehicle: { id: string; plate: string; brand: string; model: string } | null
}

type Vehicle = { id: string; plate: string; brand: string; model: string }

const SHORTCUT_TYPES = [
  { value: 'register_maintenance', label: 'Registrar mantenimiento', needsVehicle: false, icon: Wrench },
  { value: 'weekly_review_all', label: 'Revisión semanal completa', needsVehicle: false, icon: ClipboardList },
  { value: 'print_weekly', label: 'Imprimir reporte semanal', needsVehicle: false, icon: FileText },
  { value: 'weekly_check', label: 'Check semanal de vehículo', needsVehicle: true, icon: ClipboardList },
  { value: 'daily_check', label: 'Check diario de vehículo', needsVehicle: true, icon: ClipboardList },
  { value: 'vehicle_page', label: 'Ver vehículo', needsVehicle: true, icon: Car },
]

function shortcutDefaultLabel(type: string, vehicle: Vehicle | null): string {
  const t = SHORTCUT_TYPES.find(s => s.value === type)
  if (!t) return type
  if (vehicle) return `${t.label} — ${vehicle.plate}`
  return t.label
}

export default function PerfilPage() {
  const { user } = useUser()
  const router = useRouter()

  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [newType, setNewType] = useState('print_weekly')
  const [newVehicleId, setNewVehicleId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch(`/api/users/${user.id}/shortcuts`).then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
    ]).then(([s, v]) => {
      setShortcuts(s)
      setVehicles(v)
      setLoading(false)
    })
  }, [user])

  const selectedType = SHORTCUT_TYPES.find(t => t.value === newType)

  async function addShortcut(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setAdding(true)
    const res = await fetch(`/api/users/${user.id}/shortcuts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newType,
        vehicleId: selectedType?.needsVehicle ? newVehicleId || null : null,
        label: newLabel || null,
      }),
    })
    if (res.ok) {
      const s = await fetch(`/api/users/${user.id}/shortcuts`).then(r => r.json())
      setShortcuts(s)
      setNewLabel('')
      setNewVehicleId('')
    }
    setAdding(false)
  }

  async function removeShortcut(id: string) {
    if (!user) return
    await fetch(`/api/users/${user.id}/shortcuts/${id}`, { method: 'DELETE' })
    setShortcuts(prev => prev.filter(s => s.id !== id))
  }

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">Cargando usuario...</p>
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <p className="text-slate-400 text-sm mt-0.5">{user.name}</p>
      </div>

      {/* Shortcuts */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-400" />
          <h2 className="font-semibold text-white text-sm">Accesos directos en el dashboard</h2>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : shortcuts.length === 0 ? (
          <p className="text-slate-500 text-sm">No tenés accesos directos configurados todavía.</p>
        ) : (
          <div className="space-y-2">
            {shortcuts.map(s => {
              const type = SHORTCUT_TYPES.find(t => t.value === s.type)
              const Icon = type?.icon ?? Zap
              const displayLabel = s.label || shortcutDefaultLabel(s.type, s.vehicle)
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <Icon size={15} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm text-slate-200">{displayLabel}</span>
                  <button
                    onClick={() => removeShortcut(s.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add shortcut form */}
        <form onSubmit={addShortcut} className="space-y-3 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Agregar acceso directo</p>
          <div>
            <label>Tipo</label>
            <select
              className="input"
              value={newType}
              onChange={e => { setNewType(e.target.value); setNewVehicleId('') }}
            >
              {SHORTCUT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {selectedType?.needsVehicle && (
            <div>
              <label>Vehículo</label>
              <select
                className="input"
                value={newVehicleId}
                onChange={e => setNewVehicleId(e.target.value)}
                required
              >
                <option value="">Seleccioná un vehículo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label>Etiqueta personalizada (opcional)</label>
            <input
              className="input"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder={shortcutDefaultLabel(newType, vehicles.find(v => v.id === newVehicleId) ?? null)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={adding || (selectedType?.needsVehicle && !newVehicleId)}
          >
            <Plus size={15} />
            {adding ? 'Agregando...' : 'Agregar acceso'}
          </button>
        </form>
      </div>
    </div>
  )
}
