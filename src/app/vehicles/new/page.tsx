'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewVehiclePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    plate: '', brand: '', model: '', year: new Date().getFullYear().toString(),
    color: '', kmCurrent: '0', notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const vehicle = await res.json()
      router.push(`/vehicles/${vehicle.id}`)
    } catch (err) {
      setError('No se pudo guardar el vehículo. Verificá que la patente no esté duplicada.')
      setSaving(false)
    }
  }

  return (
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
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar vehículo'}
          </button>
          <Link href="/vehicles" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
