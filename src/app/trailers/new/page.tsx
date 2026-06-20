'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewTrailerUnitPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    patent: '',
    brand: '',
    model: '',
    year: '',
    serialNumber: '',
    description: '',
    status: 'ACTIVE',
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
      setError('No se pudo guardar el trailer.')
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
          <h1 className="text-xl font-bold text-white">Nuevo trailer</h1>
          <p className="text-slate-400 text-sm">Registrar un trailer de la flota</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Identificación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>Nombre *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Trailer de repuestos A"
                required
              />
            </div>
            <div>
              <label>Patente</label>
              <input
                className="input uppercase"
                value={form.patent}
                onChange={e => set('patent', e.target.value.toUpperCase())}
                placeholder="ABC 123"
              />
            </div>
            <div>
              <label>Número de serie</label>
              <input className="input" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-12345" />
            </div>
            <div>
              <label>Marca</label>
              <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Inarca" />
            </div>
            <div>
              <label>Modelo</label>
              <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="T-500" />
            </div>
            <div>
              <label>Año</label>
              <input className="input" type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1970" max="2030" placeholder="2020" />
            </div>
            <div>
              <label>Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="MAINTENANCE">En mantenimiento</option>
              </select>
            </div>
            <div className="col-span-2">
              <label>Descripción</label>
              <textarea className="input h-20 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción del trailer..." />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar trailer'}
          </button>
          <Link href="/trailers" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
