'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Boxes, Trash2, Link2, Unlink, Search, X, Pencil, Check } from 'lucide-react'

const SUBTYPES = [
  'Playo', 'Sider', 'Tanque', 'Frigorífico', 'Batea',
  'Volcador', 'Jaula', 'Porta contenedor', 'Carretón', 'Cerealero', 'Otro',
]

const TRAILER_TYPE_LABELS: Record<string, string> = {
  acoplado: 'Acoplado',
  semiremolque: 'Semiremolque',
}

type VehicleType = { name: string; features?: Record<string, string> | null }
type Vehicle = { id: string; plate: string; brand: string; model: string; type?: VehicleType | null }
type Trailer = {
  id: string
  domain: string
  brand: string
  model: string
  year: number
  chassisNumber: string | null
  trailerType: string
  subtype: string
  axleCount: number | null
  axleConfig: string | null
  grossWeight: number | null
  tare: number | null
  notes: string | null
  vehicleId: string | null
  vehicle: Vehicle | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{value ?? '—'}</p>
    </div>
  )
}

export default function AcopladoDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [trailer, setTrailer] = useState<Trailer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssocModal, setShowAssocModal] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Trailer>>({})

  const load = useCallback(async () => {
    const res = await fetch(`/api/acoplados/${id}`)
    if (res.ok) {
      const data = await res.json()
      setTrailer(data)
      setEditForm(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function loadVehicles() {
    const res = await fetch('/api/vehicles')
    if (res.ok) setVehicles(await res.json())
  }

  async function associate(vehicleId: string | null) {
    setAssigning(true)
    await fetch(`/api/acoplados/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId }),
    })
    setAssigning(false)
    setShowAssocModal(false)
    setVehicleSearch('')
    load()
  }

  async function saveEdit() {
    await fetch(`/api/acoplados/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditing(false)
    load()
  }

  async function deleteTrailer() {
    if (!confirm(`¿Eliminar el acoplado ${trailer?.domain}? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/acoplados/${id}`, { method: 'DELETE' })
    router.push('/acoplados')
  }

  function setEF(field: string, value: unknown) {
    setEditForm(f => ({ ...f, [field]: value }))
  }

  const requiredFeatureValue = trailer?.trailerType === 'semiremolque' ? 'required' : 'optional'
  const compatibleVehicles = vehicles.filter(v =>
    v.type?.features?.['acoplado'] === requiredFeatureValue
  )
  const filteredVehicles = compatibleVehicles.filter(v =>
    v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">Cargando...</p>
    </div>
  )

  if (!trailer) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Acoplado no encontrado.</p>
      <Link href="/acoplados" className="text-blue-400 text-sm mt-2 inline-block">← Volver</Link>
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/acoplados" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{trailer.domain}</h1>
              <Boxes size={18} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">
              {trailer.brand} {trailer.model} · {trailer.year} ·{' '}
              <span className="text-slate-500">{TRAILER_TYPE_LABELS[trailer.trailerType]} — {trailer.subtype}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5">
              <Pencil size={14} />
              <span className="hidden sm:inline">Editar</span>
            </button>
          ) : (
            <>
              <button onClick={saveEdit} className="btn-primary flex items-center gap-1.5">
                <Check size={14} /> Guardar
              </button>
              <button onClick={() => { setEditing(false); setEditForm(trailer) }} className="btn-secondary flex items-center gap-1.5">
                <X size={14} /> Cancelar
              </button>
            </>
          )}
          <button onClick={deleteTrailer} className="btn-danger flex items-center gap-1.5">
            <Trash2 size={14} />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h3 className="section-title mb-4">Identificación</h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Dominio</label>
                  <input className="input uppercase" value={editForm.domain ?? ''} onChange={e => setEF('domain', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label>Marca</label>
                  <input className="input" value={editForm.brand ?? ''} onChange={e => setEF('brand', e.target.value)} />
                </div>
                <div>
                  <label>Modelo</label>
                  <input className="input" value={editForm.model ?? ''} onChange={e => setEF('model', e.target.value)} />
                </div>
                <div>
                  <label>Año</label>
                  <input className="input" type="number" value={editForm.year ?? ''} onChange={e => setEF('year', Number(e.target.value))} />
                </div>
                <div>
                  <label>Número de chasis</label>
                  <input className="input" value={editForm.chassisNumber ?? ''} onChange={e => setEF('chassisNumber', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row label="Dominio" value={trailer.domain} />
                <Row label="Marca" value={trailer.brand} />
                <Row label="Modelo" value={trailer.model} />
                <Row label="Año" value={trailer.year} />
                <Row label="Número de chasis" value={trailer.chassisNumber} />
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title mb-4">Configuración</h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Tipo</label>
                  <select className="input" value={editForm.trailerType ?? 'acoplado'} onChange={e => setEF('trailerType', e.target.value)}>
                    <option value="acoplado">Acoplado</option>
                    <option value="semiremolque">Semiremolque</option>
                  </select>
                </div>
                <div>
                  <label>Subtipo</label>
                  <select className="input" value={editForm.subtype ?? ''} onChange={e => setEF('subtype', e.target.value)}>
                    {SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label>Cantidad de ejes</label>
                  <input className="input" type="number" value={editForm.axleCount ?? ''} onChange={e => setEF('axleCount', e.target.value ? Number(e.target.value) : null)} min="1" max="10" />
                </div>
                <div>
                  <label>Configuración de ejes</label>
                  <input className="input" value={editForm.axleConfig ?? ''} onChange={e => setEF('axleConfig', e.target.value)} />
                </div>
                <div>
                  <label>Peso bruto total (kg)</label>
                  <input className="input" type="number" value={editForm.grossWeight ?? ''} onChange={e => setEF('grossWeight', e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label>Tara (kg)</label>
                  <input className="input" type="number" value={editForm.tare ?? ''} onChange={e => setEF('tare', e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div className="col-span-2">
                  <label>Notas</label>
                  <textarea className="input h-20 resize-none" value={editForm.notes ?? ''} onChange={e => setEF('notes', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row label="Tipo" value={TRAILER_TYPE_LABELS[trailer.trailerType] ?? trailer.trailerType} />
                <Row label="Subtipo" value={trailer.subtype} />
                <Row label="Cantidad de ejes" value={trailer.axleCount ? `${trailer.axleCount} ejes` : null} />
                <Row label="Configuración de ejes" value={trailer.axleConfig} />
                <Row label="Peso bruto total" value={trailer.grossWeight ? `${trailer.grossWeight.toLocaleString()} kg` : null} />
                <Row label="Tara" value={trailer.tare ? `${trailer.tare.toLocaleString()} kg` : null} />
                {trailer.notes && (
                  <div className="col-span-2 pt-3 border-t border-slate-800">
                    <p className="text-slate-500 text-xs mb-1">Notas</p>
                    <p className="text-slate-300 text-sm">{trailer.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="section-title mb-4">Camión asociado</h3>
            {trailer.vehicle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Link2 size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-emerald-300 font-bold">{trailer.vehicle.plate}</p>
                    <p className="text-slate-400 text-xs">{trailer.vehicle.brand} {trailer.vehicle.model}</p>
                    {trailer.vehicle.type && (
                      <p className="text-slate-500 text-xs">{trailer.vehicle.type.name}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/vehicles/${trailer.vehicle.id}`}
                  className="btn-secondary w-full text-center text-sm"
                >
                  Ver vehículo
                </Link>
                <button
                  onClick={() => associate(null)}
                  disabled={assigning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 text-sm transition-colors"
                >
                  <Unlink size={14} />
                  Desasociar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <Unlink size={16} className="text-slate-600 shrink-0" />
                  <p className="text-slate-500 text-sm">Sin camión asignado</p>
                </div>
                <button
                  onClick={() => { loadVehicles(); setShowAssocModal(true) }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Link2 size={15} />
                  Asociar a camión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-semibold text-white">Asociar a camión</h2>
              <button onClick={() => { setShowAssocModal(false); setVehicleSearch('') }} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-slate-500 mb-3 px-1">
                {trailer.trailerType === 'semiremolque'
                  ? 'Solo se muestran Camiones Semi (acoplado requerido)'
                  : 'Solo se muestran Camiones Chasis (acoplado opcional)'}
              </p>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input pl-9"
                  placeholder="Buscar por patente, marca o modelo..."
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">
                    {compatibleVehicles.length === 0
                      ? `No hay vehículos compatibles con ${TRAILER_TYPE_LABELS[trailer.trailerType]}`
                      : 'No se encontraron vehículos'}
                  </p>
                ) : (
                  filteredVehicles.map(v => (
                    <button
                      key={v.id}
                      onClick={() => associate(v.id)}
                      disabled={assigning}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-800 ${
                        trailer.vehicleId === v.id ? 'bg-blue-500/10 border border-blue-500/30' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{v.plate}</p>
                        <p className="text-slate-400 text-xs">{v.brand} {v.model}</p>
                        {v.type && <p className="text-slate-600 text-xs">{v.type.name}</p>}
                      </div>
                      {trailer.vehicleId === v.id && (
                        <span className="text-xs text-blue-400">Actual</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
