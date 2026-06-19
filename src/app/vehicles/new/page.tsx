'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Boxes, Plus, ChevronRight } from 'lucide-react'

type VehicleType = { id: string; name: string; order: number; features?: Record<string, string> | null }
type AvailableTrailer = { id: string; domain: string; brand: string; model: string; trailerType: string; subtype: string; vehicleId: string | null }

const SUBTYPES = ['Playo', 'Sider', 'Tanque', 'Frigorífico', 'Batea', 'Volcador', 'Jaula', 'Porta contenedor', 'Carretón', 'Cerealero', 'Otro']

export default function NewVehiclePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [types, setTypes] = useState<VehicleType[]>([])
  const [hasWarranty, setHasWarranty] = useState(false)
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null)
  const [form, setForm] = useState({
    plate: '', brand: '', model: '', year: new Date().getFullYear().toString(),
    color: '', kmCurrent: '0', notes: '', typeId: '', warrantyExpiry: '',
  })

  useEffect(() => {
    fetch('/api/vehicle-types')
      .then(r => r.json())
      .then((data: VehicleType[]) => {
        setTypes(data)
        const defaultType = data.find(t => t.name === 'Auto / Camioneta')
        if (defaultType) setForm(f => ({ ...f, typeId: defaultType.id }))
      })
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const selectedType = types.find(t => t.id === form.typeId)
  const requiresTrailer = selectedType?.features?.acoplado === 'required'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, warrantyExpiry: hasWarranty ? form.warrantyExpiry : null }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const vehicle = await res.json()
      if (requiresTrailer) {
        setCreatedVehicleId(vehicle.id)
        setSaving(false)
      } else {
        router.push(`/vehicles/${vehicle.id}`)
      }
    } catch {
      setError('No se pudo guardar el vehículo. Verificá que la patente no esté duplicada.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/vehicles" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Nuevo vehículo</h1>
            <p className="text-slate-400 text-sm">Datos básicos del vehículo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>Tipo de vehículo *</label>
              <select
                className="input"
                value={form.typeId}
                onChange={e => set('typeId', e.target.value)}
                required
              >
                <option value="">Seleccioná un tipo...</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {requiresTrailer && (
                <p className="text-amber-400/80 text-xs mt-1.5 flex items-center gap-1">
                  <Boxes size={11} />
                  Este tipo requiere asociar un semirremolque al guardar
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label>Patente *</label>
              <input
                className="input uppercase"
                value={form.plate}
                onChange={e => set('plate', e.target.value.toUpperCase())}
                placeholder="ABC 123"
                required
              />
            </div>
            <div>
              <label>Marca *</label>
              <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Ford" required />
            </div>
            <div>
              <label>Modelo *</label>
              <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Transit" required />
            </div>
            <div>
              <label>Año *</label>
              <input className="input" type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1980" max="2030" required />
            </div>
            <div>
              <label>Color</label>
              <input className="input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
            </div>
            <div className="col-span-2">
              <label>Kilometraje actual</label>
              <input className="input" type="number" value={form.kmCurrent} onChange={e => set('kmCurrent', e.target.value)} min="0" />
            </div>
            <div className="col-span-2">
              <label>Notas</label>
              <textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Información adicional..." />
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-blue-500"
                  checked={hasWarranty}
                  onChange={e => {
                    setHasWarranty(e.target.checked)
                    if (!e.target.checked) set('warrantyExpiry', '')
                  }}
                />
                <span className="text-slate-300 text-sm font-medium">El vehículo tiene garantía</span>
              </label>
              {hasWarranty && (
                <div className="mt-3">
                  <label>Vencimiento de garantía *</label>
                  <input
                    className="input"
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={e => set('warrantyExpiry', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Guardando...' : requiresTrailer ? 'Guardar y asociar acoplado →' : 'Guardar vehículo'}
            </button>
            <Link href="/vehicles" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>

      {createdVehicleId && (
        <TrailerRequiredModal
          vehicleId={createdVehicleId}
          onDone={() => router.push(`/vehicles/${createdVehicleId}`)}
        />
      )}
    </>
  )
}

function TrailerRequiredModal({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const [mode, setMode] = useState<'choose' | 'existing' | 'create'>('choose')
  const [trailers, setTrailers] = useState<AvailableTrailer[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newError, setNewError] = useState('')
  const [newForm, setNewForm] = useState({
    domain: '', brand: '', model: '', year: new Date().getFullYear().toString(), subtype: 'Playo',
  })

  async function fetchAvailable() {
    setLoading(true)
    const res = await fetch('/api/trailers')
    const data = await res.json()
    setTrailers(data.filter((t: AvailableTrailer) => t.trailerType === 'semiremolque' && !t.vehicleId))
    setLoading(false)
  }

  function goExisting() {
    setMode('existing')
    fetchAvailable()
  }

  async function associate(trailerId: string) {
    setSaving(true)
    await fetch(`/api/trailers/${trailerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId }),
    })
    onDone()
  }

  async function createAndAssociate(e: React.FormEvent) {
    e.preventDefault()
    setNewError('')
    setSaving(true)
    const res = await fetch('/api/trailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newForm,
        year: Number(newForm.year),
        trailerType: 'semiremolque',
        vehicleId,
      }),
    })
    if (!res.ok) {
      setNewError('No se pudo crear el semirremolque. Verificá que el dominio no esté duplicado.')
      setSaving(false)
      return
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Boxes size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-medium mb-0.5">Vehículo guardado</p>
            <h2 className="font-bold text-white">Asociar semirremolque</h2>
            <p className="text-slate-400 text-sm mt-0.5">Este tipo de vehículo requiere un semirremolque asociado.</p>
          </div>
        </div>

        <div className="p-5">
          {mode === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={goExisting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
              >
                <Boxes size={18} className="text-blue-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">Asociar semirremolque existente</p>
                  <p className="text-slate-500 text-xs mt-0.5">Elegí uno que ya esté cargado en el sistema</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </button>

              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
              >
                <Plus size={18} className="text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">Crear nuevo semirremolque</p>
                  <p className="text-slate-500 text-xs mt-0.5">Ingresá los datos del semirremolque ahora</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </button>

              <button
                onClick={onDone}
                className="w-full text-center text-slate-500 hover:text-slate-300 text-sm pt-1 transition-colors"
              >
                Saltar por ahora →
              </button>
            </div>
          )}

          {mode === 'existing' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('choose')}
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                ← Volver
              </button>
              {loading ? (
                <p className="text-slate-500 text-sm py-4 text-center">Cargando...</p>
              ) : trailers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No hay semirremolques disponibles sin asociar.</p>
                  <button
                    onClick={() => setMode('create')}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                  >
                    Crear uno nuevo →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trailers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => associate(t.id)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
                    >
                      <Boxes size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">{t.domain}</p>
                        <p className="text-slate-500 text-xs">{t.brand} {t.model} · {t.subtype}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('choose')}
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                ← Volver
              </button>
              <form onSubmit={createAndAssociate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label>Dominio *</label>
                    <input
                      className="input uppercase"
                      value={newForm.domain}
                      onChange={e => setNewForm(f => ({ ...f, domain: e.target.value.toUpperCase() }))}
                      placeholder="ABC 123"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label>Marca *</label>
                    <input
                      className="input"
                      value={newForm.brand}
                      onChange={e => setNewForm(f => ({ ...f, brand: e.target.value }))}
                      placeholder="Randon"
                      required
                    />
                  </div>
                  <div>
                    <label>Modelo *</label>
                    <input
                      className="input"
                      value={newForm.model}
                      onChange={e => setNewForm(f => ({ ...f, model: e.target.value }))}
                      placeholder="SR"
                      required
                    />
                  </div>
                  <div>
                    <label>Año *</label>
                    <input
                      className="input"
                      type="number"
                      value={newForm.year}
                      onChange={e => setNewForm(f => ({ ...f, year: e.target.value }))}
                      min="1980"
                      max="2030"
                      required
                    />
                  </div>
                  <div>
                    <label>Subtipo *</label>
                    <select
                      className="input"
                      value={newForm.subtype}
                      onChange={e => setNewForm(f => ({ ...f, subtype: e.target.value }))}
                    >
                      {SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {newError && <p className="text-red-400 text-sm">{newError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Creando...' : 'Crear y asociar'}
                  </button>
                  <button type="button" onClick={onDone} className="btn-secondary">
                    Saltar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
