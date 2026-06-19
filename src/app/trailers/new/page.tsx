'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SUBTYPES = [
  'Playo', 'Sider', 'Tanque', 'Frigorífico', 'Batea',
  'Volcador', 'Jaula', 'Porta contenedor', 'Carretón', 'Cerealero', 'Otro',
]

export default function NewTrailerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    domain: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    chassisNumber: '',
    trailerType: 'acoplado',
    subtype: 'Playo',
    axleCount: '',
    axleConfig: '',
    grossWeight: '',
    tare: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/trailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const trailer = await res.json()
      router.push(`/trailers/${trailer.id}`)
    } catch {
      setError('No se pudo guardar. Verificá que el dominio no esté duplicado.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/trailers" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nuevo acoplado</h1>
          <p className="text-slate-400 text-sm">Datos del acoplado o semiremolque</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificación */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Identificación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>Dominio *</label>
              <input
                className="input uppercase"
                value={form.domain}
                onChange={e => set('domain', e.target.value.toUpperCase())}
                placeholder="ABC 123"
                required
              />
            </div>
            <div>
              <label>Marca *</label>
              <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Randon" required />
            </div>
            <div>
              <label>Modelo *</label>
              <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="SR BA" required />
            </div>
            <div>
              <label>Año *</label>
              <input className="input" type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1970" max="2030" required />
            </div>
            <div>
              <label>Número de chasis</label>
              <input className="input" value={form.chassisNumber} onChange={e => set('chassisNumber', e.target.value)} placeholder="9BW..." />
            </div>
          </div>
        </div>

        {/* Configuración */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuración</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Tipo *</label>
              <select className="input" value={form.trailerType} onChange={e => set('trailerType', e.target.value)} required>
                <option value="acoplado">Acoplado</option>
                <option value="semiremolque">Semiremolque</option>
              </select>
            </div>
            <div>
              <label>Subtipo *</label>
              <select className="input" value={form.subtype} onChange={e => set('subtype', e.target.value)} required>
                {SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Cantidad de ejes</label>
              <input className="input" type="number" value={form.axleCount} onChange={e => set('axleCount', e.target.value)} min="1" max="10" placeholder="3" />
            </div>
            <div>
              <label>Configuración de ejes</label>
              <input className="input" value={form.axleConfig} onChange={e => set('axleConfig', e.target.value)} placeholder="Ej: 8×2+4" />
            </div>
            <div>
              <label>Peso bruto total (kg)</label>
              <input className="input" type="number" value={form.grossWeight} onChange={e => set('grossWeight', e.target.value)} placeholder="42000" min="0" />
            </div>
            <div>
              <label>Tara (kg)</label>
              <input className="input" type="number" value={form.tare} onChange={e => set('tare', e.target.value)} placeholder="7500" min="0" />
            </div>
            <div className="col-span-2">
              <label>Notas</label>
              <textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Información adicional..." />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar acoplado'}
          </button>
          <Link href="/trailers" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
