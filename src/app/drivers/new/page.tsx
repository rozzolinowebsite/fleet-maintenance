'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'leave', label: 'Licencia' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Baja' },
]

export default function NewDriverPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [licenseCategories, setLicenseCategories] = useState<string[]>([])
  const [form, setForm] = useState({
    fullName: '', dni: '', cuil: '', birthDate: '', address: '', phone: '', emergencyContact: '',
    licenseExpiry: '',
    psychoDate: '', psychoExpiry: '',
    preOccupDate: '', preOccupResult: '',
    legajo: '', hireDate: '', position: '', agreement: '', operativeBase: '', status: 'active',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleCategory(cat: string) {
    setLicenseCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, licenseCategories }),
      })
      if (!res.ok) throw new Error()
      const driver = await res.json()
      router.push(`/drivers/${driver.id}`)
    } catch {
      setError('No se pudo guardar el conductor.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/drivers" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nuevo conductor</h1>
          <p className="text-slate-400 text-sm">Completá los datos del chofer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Personal */}
        <div className="card space-y-4">
          <h2 className="section-title">Información personal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>Nombre completo *</label>
              <input className="input" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Juan Pérez" required />
            </div>
            <div>
              <label>DNI</label>
              <input className="input" value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" />
            </div>
            <div>
              <label>CUIL</label>
              <input className="input" value={form.cuil} onChange={e => set('cuil', e.target.value)} placeholder="20-12345678-9" />
            </div>
            <div>
              <label>Fecha de nacimiento</label>
              <input className="input" type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
            </div>
            <div>
              <label>Teléfono</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+54 9 11 1234-5678" />
            </div>
            <div className="col-span-2">
              <label>Domicilio</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Av. Ejemplo 1234, CABA" />
            </div>
            <div className="col-span-2">
              <label>Contacto de emergencia</label>
              <input className="input" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Nombre · Relación · Teléfono" />
            </div>
          </div>
        </div>

        {/* License */}
        <div className="card space-y-4">
          <h2 className="section-title">Licencia de conducir</h2>
          <div>
            <label className="block mb-2">Categorías habilitadas</label>
            <div className="flex flex-wrap gap-2">
              {LICENSE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                    licenseCategories.includes(cat)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-xs">
            <label>Fecha de vencimiento</label>
            <input className="input" type="date" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
          </div>
        </div>

        {/* Health */}
        <div className="card space-y-4">
          <h2 className="section-title">Aptitud y salud</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Apto psicofísico — Fecha</label>
              <input className="input" type="date" value={form.psychoDate} onChange={e => set('psychoDate', e.target.value)} />
            </div>
            <div>
              <label>Apto psicofísico — Vencimiento</label>
              <input className="input" type="date" value={form.psychoExpiry} onChange={e => set('psychoExpiry', e.target.value)} />
            </div>
            <div>
              <label>Examen preocupacional — Fecha</label>
              <input className="input" type="date" value={form.preOccupDate} onChange={e => set('preOccupDate', e.target.value)} />
            </div>
            <div>
              <label>Examen preocupacional — Resultado</label>
              <input className="input" value={form.preOccupResult} onChange={e => set('preOccupResult', e.target.value)} placeholder="Apto / No apto / Apto con restricciones" />
            </div>
          </div>
        </div>

        {/* Labor */}
        <div className="card space-y-4">
          <h2 className="section-title">Información laboral</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Legajo</label>
              <input className="input" value={form.legajo} onChange={e => set('legajo', e.target.value)} placeholder="001" />
            </div>
            <div>
              <label>Fecha de ingreso</label>
              <input className="input" type="date" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} />
            </div>
            <div>
              <label>Puesto</label>
              <input className="input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Conductor largo alcance" />
            </div>
            <div>
              <label>Convenio</label>
              <input className="input" value={form.agreement} onChange={e => set('agreement', e.target.value)} placeholder="FADEEAC" />
            </div>
            <div>
              <label>Base operativa</label>
              <input className="input" value={form.operativeBase} onChange={e => set('operativeBase', e.target.value)} placeholder="CABA Norte" />
            </div>
            <div>
              <label>Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Guardando...' : 'Guardar conductor'}
          </button>
          <Link href="/drivers" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
