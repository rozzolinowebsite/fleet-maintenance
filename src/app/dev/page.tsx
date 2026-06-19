'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { VEHICLE_FEATURES, FEATURE_VALUE_LABELS, type FeatureValue, type TypeFeatures } from '@/lib/vehicle-features'

type VehicleType = {
  id: string
  name: string
  order: number
  features: TypeFeatures | null
  _count?: { vehicles: number }
}

const FEATURE_COLORS: Record<FeatureValue, string> = {
  none: 'text-slate-500',
  optional: 'text-yellow-400',
  required: 'text-blue-400',
}

export default function DevPage() {
  const [types, setTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editFeatures, setEditFeatures] = useState<TypeFeatures>({})
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/vehicle-types')
    const data = await res.json()
    setTypes(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(t: VehicleType) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditFeatures(t.features ?? {})
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError('El nombre no puede estar vacío'); return }
    const res = await fetch(`/api/vehicle-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), features: editFeatures }),
    })
    if (!res.ok) { setError('Error al guardar'); return }
    setEditingId(null)
    load()
  }

  async function deleteType(id: string) {
    const res = await fetch(`/api/vehicle-types/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
      return
    }
    load()
  }

  async function addType() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/vehicle-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), features: {} }),
    })
    setAdding(false)
    if (!res.ok) { setError('Error al crear el tipo'); return }
    setNewName('')
    load()
  }

  async function moveOrder(id: string, direction: 'up' | 'down') {
    const idx = types.findIndex(t => t.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= types.length) return
    const current = types[idx]
    const swap = types[swapIdx]
    await Promise.all([
      fetch(`/api/vehicle-types/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: swap.order }),
      }),
      fetch(`/api/vehicle-types/${swap.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: current.order }),
      }),
    ])
    load()
  }

  function setFeature(key: string, value: FeatureValue) {
    setEditFeatures(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            DESARROLLO
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Portal de desarrollo</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configuración avanzada del sistema</p>
      </div>

      {/* Vehicle types section */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Tipos de vehículos</h2>
            <p className="text-slate-500 text-sm">Definí los tipos y sus capacidades</p>
          </div>
          <span className="text-slate-500 text-sm">{types.length} tipos</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <X size={15} />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {types.map((t, idx) => (
              <div key={t.id} className="rounded-lg border border-slate-700 bg-slate-800/50">
                {editingId === t.id ? (
                  /* Edit mode */
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">Nombre del tipo</label>
                      <input
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(t.id)}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Capacidades</label>
                      <div className="space-y-2">
                        {VEHICLE_FEATURES.map(f => (
                          <div key={f.key} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{f.label}</p>
                              <p className="text-slate-500 text-xs">{f.description}</p>
                            </div>
                            <div className="flex gap-1">
                              {(['none', 'optional', 'required'] as FeatureValue[]).map(v => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setFeature(f.key, v)}
                                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                                    (editFeatures[f.key] ?? 'none') === v
                                      ? v === 'none'
                                        ? 'bg-slate-700 border-slate-500 text-slate-300'
                                        : v === 'optional'
                                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                          : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                      : 'border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-600'
                                  }`}
                                >
                                  {FEATURE_VALUE_LABELS[v]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(t.id)} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                        <Check size={14} /> Guardar
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveOrder(t.id, 'up')}
                        disabled={idx === 0}
                        className="text-slate-600 hover:text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveOrder(t.id, 'down')}
                        disabled={idx === types.length - 1}
                        className="text-slate-600 hover:text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{t.name}</p>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {VEHICLE_FEATURES.map(f => {
                          const val: FeatureValue = (t.features?.[f.key]) ?? 'none'
                          return (
                            <span key={f.key} className={`text-xs ${FEATURE_COLORS[val]}`}>
                              {f.label}: <span className="font-medium">{FEATURE_VALUE_LABELS[val]}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteType(t.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new type */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          <input
            className="input flex-1"
            placeholder="Nombre del nuevo tipo..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addType()}
          />
          <button
            onClick={addType}
            disabled={adding || !newName.trim()}
            className="btn-primary flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            Agregar
          </button>
        </div>
      </section>
    </div>
  )
}
