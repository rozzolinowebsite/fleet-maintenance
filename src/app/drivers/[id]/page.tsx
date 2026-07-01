'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Car, Boxes, AlertTriangle, CheckCircle, Plus, Trash2,
  Pencil, X, Check, UserCog, BookOpen, ClipboardList, Briefcase, Upload,
  Eye, Download, FileText,
} from 'lucide-react'
import { dateInputValue } from '@/lib/dates'

type Tab = 'resumen' | 'personal' | 'licencia' | 'salud' | 'laboral' | 'operativo' | 'capacitaciones'

const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'personal', label: 'Personal' },
  { id: 'licencia', label: 'Licencia' },
  { id: 'salud', label: 'Salud' },
  { id: 'laboral', label: 'Laboral' },
  { id: 'operativo', label: 'Operativo' },
  { id: 'capacitaciones', label: 'Capacitaciones' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'leave', label: 'Licencia' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Baja' },
]
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  leave: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vacation: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  suspended: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  terminated: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const QUICK_TRAININGS = [
  'Primeros auxilios', 'Cargas peligrosas', 'Uso de extintores',
  'Seguridad vial', 'Manejo defensivo',
]

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
    .toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(d: string | Date | null | undefined): number | null {
  if (!d) return null
  const date = new Date(d)
  return Math.ceil((new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0).getTime() - Date.now()) / 86400000)
}

function ExpiryBadge({ date }: { date: string | Date | null | undefined }) {
  const days = daysUntil(date)
  if (days === null) return <span className="text-slate-600 text-xs">Sin registrar</span>
  if (days < 0) return <span className="text-red-400 text-xs font-medium">Vencida ({fmtDate(date)})</span>
  if (days <= 30) return <span className="text-yellow-400 text-xs font-medium">Vence en {days}d · {fmtDate(date)}</span>
  return <span className="text-emerald-400 text-xs font-medium">Vence el {fmtDate(date)}</span>
}

export default function DriverDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumen')
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchDriver = useCallback(async () => {
    const res = await fetch(`/api/drivers/${id}`)
    if (res.ok) setDriver(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDriver() }, [fetchDriver])

  async function patch(data: Record<string, unknown>) {
    await fetch(`/api/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchDriver()
  }

  async function deleteDriver() {
    if (!confirm(`¿Eliminar a ${driver.fullName}? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/drivers/${id}`, { method: 'DELETE' })
    router.push('/drivers')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-400">Cargando...</div></div>
  if (!driver) return <div className="text-center py-20"><p className="text-slate-400">Conductor no encontrado.</p><Link href="/drivers" className="text-blue-400 text-sm mt-2 inline-block">← Volver</Link></div>

  const lastInfraction = driver.events.find((e: any) => e.type === 'infraction')
  const lastAccident = driver.events.find((e: any) => e.type === 'accident')
  const lastTraining = driver.trainings[0]
  const licDays = daysUntil(driver.licenseExpiry)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/drivers" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold">
              {initials(driver.fullName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{driver.fullName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[driver.status] ?? STATUS_COLORS.terminated}`}>
                  {STATUS_OPTIONS.find(o => o.value === driver.status)?.label ?? driver.status}
                </span>
                {driver.legajo && <span className="text-slate-500 text-xs">Legajo {driver.legajo}</span>}
              </div>
            </div>
          </div>
        </div>
        <button onClick={deleteDriver} className="btn-danger flex items-center gap-1.5 shrink-0">
          <Trash2 size={14} />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <ResumenTab driver={driver} lastInfraction={lastInfraction} lastAccident={lastAccident} lastTraining={lastTraining} licDays={licDays} />
      )}
      {tab === 'personal' && <PersonalTab driver={driver} onSave={patch} onRefresh={fetchDriver} />}
      {tab === 'licencia' && <LicenciaTab driver={driver} onSave={patch} onRefresh={fetchDriver} />}
      {tab === 'salud' && <SaludTab driver={driver} onSave={patch} />}
      {tab === 'laboral' && <LaboralTab driver={driver} onSave={patch} />}
      {tab === 'operativo' && <OperativoTab driver={driver} onSave={patch} onRefresh={fetchDriver} />}
      {tab === 'capacitaciones' && <CapacitacionesTab driver={driver} onRefresh={fetchDriver} />}
    </div>
  )
}

/* ─── RESUMEN ─── */
function ResumenTab({ driver, lastInfraction, lastAccident, lastTraining, licDays }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Stats */}
      <div className="card space-y-3">
        <h3 className="section-title">Estado operativo</h3>

        <InfoRow label="Vehículo habitual">
          {driver.currentVehicle
            ? <Link href={`/vehicles/${driver.currentVehicle.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">{driver.currentVehicle.plate}</Link>
            : <span className="text-slate-500">Sin asignar</span>}
        </InfoRow>
        <InfoRow label="Acoplado habitual">
          {driver.currentTrailer
            ? <Link href={`/acoplados/${driver.currentTrailer.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">{driver.currentTrailer.domain}</Link>
            : <span className="text-slate-500">Sin asignar</span>}
        </InfoRow>

        <div className="border-t border-slate-800 pt-3 space-y-3">
          <InfoRow label="Licencia vence">
            {licDays === null ? <span className="text-slate-500">Sin registrar</span>
              : licDays < 0 ? <span className="text-red-400 font-medium">Vencida ({fmtDate(driver.licenseExpiry)})</span>
              : licDays <= 30 ? <span className="text-yellow-400 font-medium">En {licDays} días</span>
              : <span className="text-emerald-400">En {licDays} días</span>}
          </InfoRow>
          <InfoRow label="Última infracción">
            {lastInfraction
              ? <span className="text-orange-400">{fmtDate(lastInfraction.date)}</span>
              : <span className="text-slate-500">Sin registros</span>}
          </InfoRow>
          <InfoRow label="Último accidente">
            {lastAccident
              ? <span className="text-red-400">{fmtDate(lastAccident.date)}</span>
              : <span className="text-slate-500">Sin registros</span>}
          </InfoRow>
          <InfoRow label="Última capacitación">
            {lastTraining
              ? <span className="text-slate-300">{lastTraining.name} · {fmtDate(lastTraining.date)}</span>
              : <span className="text-slate-500">Sin registros</span>}
          </InfoRow>
        </div>
      </div>

      {/* Quick data */}
      <div className="card space-y-3">
        <h3 className="section-title">Datos del conductor</h3>
        <InfoRow label="DNI">{driver.dni || <span className="text-slate-500">—</span>}</InfoRow>
        <InfoRow label="CUIL">{driver.cuil || <span className="text-slate-500">—</span>}</InfoRow>
        <InfoRow label="Teléfono">{driver.phone || <span className="text-slate-500">—</span>}</InfoRow>
        <InfoRow label="Contacto emergencia">{driver.emergencyContact || <span className="text-slate-500">—</span>}</InfoRow>
        <InfoRow label="Base operativa">{driver.operativeBase || <span className="text-slate-500">—</span>}</InfoRow>
        <InfoRow label="Categorías">
          {Array.isArray(driver.licenseCategories) && driver.licenseCategories.length > 0
            ? <div className="flex gap-1 flex-wrap">
                {(driver.licenseCategories as string[]).map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold">{c}</span>
                ))}
              </div>
            : <span className="text-slate-500">Sin categorías</span>}
        </InfoRow>
      </div>

      {/* Alerts */}
      {(licDays !== null && licDays <= 30) && (
        <div className="lg:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Licencia próxima a vencer</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              {licDays < 0 ? 'La licencia ya está vencida.' : `Vence en ${licDays} días (${fmtDate(driver.licenseExpiry)}).`} Actualizá la información en la pestaña Licencia.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-white text-right">{children}</span>
    </div>
  )
}

/* ─── PHOTO UPLOAD ─── */
function DocumentPreview({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h2 className="font-semibold text-white">{label}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 min-h-0 bg-slate-950 rounded-b-2xl overflow-hidden">
          {isPdf ? (
            <iframe src={url} className="w-full h-full" title={label} />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={url} alt={label} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PhotoUpload({ url, label, driverId, field, onRefresh }: {
  url: string | null | undefined
  label: string
  driverId: string
  field: string
  onRefresh: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPdf = !!url && url.toLowerCase().includes('.pdf')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('field', field)
    await fetch(`/api/drivers/${driverId}/photos`, { method: 'POST', body: formData })
    if (inputRef.current) inputRef.current.value = ''
    setUploading(false)
    onRefresh()
  }

  async function clearPhoto() {
    await fetch(`/api/drivers/${driverId}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field }),
    })
    onRefresh()
  }

  return (
    <div className="relative group">
      {url ? (
        <>
          <div className="w-full aspect-video rounded-lg border border-slate-700 bg-slate-800/70 flex items-center justify-center overflow-hidden">
            {isPdf ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <FileText size={32} />
                <span className="text-xs">PDF cargado</span>
              </div>
            ) : (
              <img src={url} alt={label} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => setPreview(true)}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Ver
            </button>
            <a
              href={url}
              download
              className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Descargar
            </a>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cambiar
            </button>
            <button
              onClick={clearPhoto}
              className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Quitar
            </button>
          </div>
          {preview && <DocumentPreview url={url} label={label} onClose={() => setPreview(false)} />}
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-lg bg-slate-800 border border-slate-700 border-dashed flex flex-col items-center justify-center gap-2 hover:border-slate-500 hover:bg-slate-800/80 transition-colors"
        >
          <Upload size={20} className="text-slate-600" />
          <p className="text-slate-600 text-xs">{label}</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploading && (
        <div className="absolute inset-0 bg-slate-900/70 rounded-lg flex items-center justify-center">
          <p className="text-white text-xs">Subiendo...</p>
        </div>
      )}
    </div>
  )
}

/* ─── PERSONAL ─── */
function PersonalTab({ driver, onSave, onRefresh }: any) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: driver.fullName,
    dni: driver.dni ?? '',
    cuil: driver.cuil ?? '',
    birthDate: dateInputValue(driver.birthDate),
    address: driver.address ?? '',
    phone: driver.phone ?? '',
    emergencyContact: driver.emergencyContact ?? '',
  })

  async function save() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        {!editing ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="section-title">Datos personales</h3>
              <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                <Pencil size={12} /> Editar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <StaticRow label="Nombre completo" value={driver.fullName} />
              <StaticRow label="DNI" value={driver.dni} />
              <StaticRow label="CUIL" value={driver.cuil} />
              <StaticRow label="Fecha de nacimiento" value={fmtDate(driver.birthDate)} />
              <StaticRow label="Teléfono" value={driver.phone} />
              <StaticRow label="Domicilio" value={driver.address} full />
              <StaticRow label="Contacto de emergencia" value={driver.emergencyContact} full />
            </div>
          </>
        ) : (
          <>
            <h3 className="section-title">Editar datos personales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label>Nombre completo *</label>
                <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label>DNI</label>
                <input className="input" value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} />
              </div>
              <div>
                <label>CUIL</label>
                <input className="input" value={form.cuil} onChange={e => setForm(f => ({ ...f, cuil: e.target.value }))} />
              </div>
              <div>
                <label>Fecha de nacimiento</label>
                <input className="input" type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div>
                <label>Teléfono</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label>Domicilio</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label>Contacto de emergencia</label>
                <input className="input" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="Nombre · Relación · Teléfono" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
                <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Fotos de DNI</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-2">Frente</p>
            <PhotoUpload url={driver.dniPhotoFront} label="Subir frente del DNI" driverId={driver.id} field="dniPhotoFront" onRefresh={onRefresh} />
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-2">Dorso</p>
            <PhotoUpload url={driver.dniPhotoBack} label="Subir dorso del DNI" driverId={driver.id} field="dniPhotoBack" onRefresh={onRefresh} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StaticRow({ label, value, full }: { label: string; value: string | null | undefined; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-white font-medium mt-0.5">{value || '—'}</p>
    </div>
  )
}

/* ─── LICENCIA ─── */
function LicenciaTab({ driver, onSave, onRefresh }: any) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cats, setCats] = useState<string[]>(Array.isArray(driver.licenseCategories) ? driver.licenseCategories : [])
  const [expiry, setExpiry] = useState(dateInputValue(driver.licenseExpiry))

  function toggleCat(c: string) {
    setCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function save() {
    setSaving(true)
    await onSave({ licenseCategories: cats, licenseExpiry: expiry || null })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Licencia de conducir</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>

        <div>
          <p className="text-slate-500 text-xs mb-2">Categorías habilitadas</p>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {LICENSE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                    cats.includes(cat)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {cats.length > 0
                ? cats.map(c => (
                    <span key={c} className="text-sm px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold">{c}</span>
                  ))
                : <span className="text-slate-600 text-sm">Sin categorías registradas</span>}
            </div>
          )}
        </div>

        <div>
          <p className="text-slate-500 text-xs mb-1">Vencimiento</p>
          {editing
            ? <input className="input max-w-xs" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
            : <ExpiryBadge date={driver.licenseExpiry} />}
        </div>

        {editing && (
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Fotos de licencia</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-2">Frente</p>
            <PhotoUpload url={driver.licensePhotoFront} label="Subir frente de licencia" driverId={driver.id} field="licensePhotoFront" onRefresh={onRefresh} />
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-2">Dorso</p>
            <PhotoUpload url={driver.licensePhotoBack} label="Subir dorso de licencia" driverId={driver.id} field="licensePhotoBack" onRefresh={onRefresh} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── SALUD ─── */
function SaludTab({ driver, onSave }: any) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    psychoDate: dateInputValue(driver.psychoDate),
    psychoExpiry: dateInputValue(driver.psychoExpiry),
    preOccupDate: dateInputValue(driver.preOccupDate),
    preOccupResult: driver.preOccupResult ?? '',
  })

  async function save() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Apto psicofísico</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Fecha de realización</label>
              <input className="input" type="date" value={form.psychoDate} onChange={e => setForm(f => ({ ...f, psychoDate: e.target.value }))} />
            </div>
            <div>
              <label>Fecha de vencimiento</label>
              <input className="input" type="date" value={form.psychoExpiry} onChange={e => setForm(f => ({ ...f, psychoExpiry: e.target.value }))} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <StaticRow label="Fecha de realización" value={fmtDate(driver.psychoDate)} />
            <div>
              <p className="text-slate-500 text-xs">Vencimiento</p>
              <div className="mt-0.5"><ExpiryBadge date={driver.psychoExpiry} /></div>
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h3 className="section-title">Examen preocupacional</h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Fecha</label>
              <input className="input" type="date" value={form.preOccupDate} onChange={e => setForm(f => ({ ...f, preOccupDate: e.target.value }))} />
            </div>
            <div>
              <label>Resultado</label>
              <input className="input" value={form.preOccupResult} onChange={e => setForm(f => ({ ...f, preOccupResult: e.target.value }))} placeholder="Apto / No apto / Apto con restricciones" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <StaticRow label="Fecha" value={fmtDate(driver.preOccupDate)} />
            <StaticRow label="Resultado" value={driver.preOccupResult} />
          </div>
        )}
        {editing && (
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── LABORAL ─── */
function LaboralTab({ driver, onSave }: any) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    legajo: driver.legajo ?? '',
    hireDate: dateInputValue(driver.hireDate),
    position: driver.position ?? '',
    agreement: driver.agreement ?? '',
    operativeBase: driver.operativeBase ?? '',
    status: driver.status,
  })

  async function save() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setEditing(false)
  }

  const statusLabel = STATUS_OPTIONS.find(o => o.value === driver.status)?.label ?? driver.status

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Datos laborales</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
            <Pencil size={12} /> Editar
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Legajo</label>
              <input className="input" value={form.legajo} onChange={e => setForm(f => ({ ...f, legajo: e.target.value }))} />
            </div>
            <div>
              <label>Fecha de ingreso</label>
              <input className="input" type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
            </div>
            <div>
              <label>Puesto</label>
              <input className="input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label>Convenio</label>
              <input className="input" value={form.agreement} onChange={e => setForm(f => ({ ...f, agreement: e.target.value }))} />
            </div>
            <div>
              <label>Base operativa</label>
              <input className="input" value={form.operativeBase} onChange={e => setForm(f => ({ ...f, operativeBase: e.target.value }))} />
            </div>
            <div>
              <label>Estado</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <StaticRow label="Estado" value={statusLabel} />
          <StaticRow label="Legajo" value={driver.legajo} />
          <StaticRow label="Fecha de ingreso" value={fmtDate(driver.hireDate)} />
          <StaticRow label="Puesto" value={driver.position} />
          <StaticRow label="Convenio" value={driver.agreement} />
          <StaticRow label="Base operativa" value={driver.operativeBase} />
        </div>
      )}
    </div>
  )
}

/* ─── OPERATIVO ─── */
function OperativoTab({ driver, onSave, onRefresh }: any) {
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [trailers, setTrailers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function openVehicle() {
    setLoading(true)
    const res = await fetch('/api/vehicles')
    setVehicles(await res.json())
    setLoading(false)
    setShowVehicleModal(true)
  }

  async function openTrailer() {
    setLoading(true)
    const res = await fetch('/api/acoplados')
    setTrailers(await res.json())
    setLoading(false)
    setShowTrailerModal(true)
  }

  async function assignVehicle(vehicleId: string | null) {
    setSaving(true)
    await onSave({ currentVehicleId: vehicleId })
    setSaving(false)
    setShowVehicleModal(false)
    onRefresh()
  }

  async function assignTrailer(trailerId: string | null) {
    setSaving(true)
    await onSave({ currentTrailerId: trailerId })
    setSaving(false)
    setShowTrailerModal(false)
    onRefresh()
  }

  return (
    <div className="space-y-5">
      {/* Vehicle */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={15} className="text-slate-400" />
            <h3 className="section-title">Vehículo habitual</h3>
          </div>
          <button onClick={openVehicle} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            {driver.currentVehicle ? 'Cambiar' : '+ Asignar'}
          </button>
        </div>
        {driver.currentVehicle ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Car size={15} className="text-slate-400 shrink-0" />
            <div className="flex-1">
              <Link href={`/vehicles/${driver.currentVehicle.id}`} className="text-white font-medium text-sm hover:text-blue-400 transition-colors">
                {driver.currentVehicle.plate}
              </Link>
              <p className="text-slate-500 text-xs">{driver.currentVehicle.brand} {driver.currentVehicle.model} · {driver.currentVehicle.year}</p>
            </div>
            <button onClick={() => assignVehicle(null)} className="text-slate-600 hover:text-red-400 transition-colors" title="Desasignar">
              <X size={15} />
            </button>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">Sin vehículo asignado</p>
        )}
      </div>

      {/* Trailer */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes size={15} className="text-slate-400" />
            <h3 className="section-title">Acoplado habitual</h3>
          </div>
          <button onClick={openTrailer} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            {driver.currentTrailer ? 'Cambiar' : '+ Asignar'}
          </button>
        </div>
        {driver.currentTrailer ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Boxes size={15} className="text-slate-400 shrink-0" />
            <div className="flex-1">
              <Link href={`/acoplados/${driver.currentTrailer.id}`} className="text-white font-medium text-sm hover:text-blue-400 transition-colors">
                {driver.currentTrailer.domain}
              </Link>
              <p className="text-slate-500 text-xs">{driver.currentTrailer.brand} {driver.currentTrailer.model} · {driver.currentTrailer.trailerType}</p>
            </div>
            <button onClick={() => assignTrailer(null)} className="text-slate-600 hover:text-red-400 transition-colors" title="Desasignar">
              <X size={15} />
            </button>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">Sin acoplado asignado</p>
        )}
      </div>

      {/* History */}
      {driver.history.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-3">Historial de asignaciones</h3>
          <div className="space-y-2">
            {driver.history.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 py-2 border-b border-slate-800/60 last:border-0 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  {h.vehiclePlate && <span className="text-white">{h.vehiclePlate}</span>}
                  {h.vehiclePlate && h.trailerDomain && <span className="text-slate-500"> + </span>}
                  {h.trailerDomain && <span className="text-white">{h.trailerDomain}</span>}
                </div>
                <span className="text-slate-500 text-xs shrink-0">{fmtDate(h.assignedAt)}</span>
                {h.assignedBy && <span className="text-slate-600 text-xs">{h.assignedBy}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      <EventsCard driver={driver} onRefresh={onRefresh} />

      {/* Vehicle modal */}
      {showVehicleModal && (
        <AssignModal
          title="Asignar vehículo"
          loading={loading}
          onClose={() => setShowVehicleModal(false)}
        >
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => assignVehicle(v.id)}
              disabled={saving}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
            >
              <Car size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{v.plate}</p>
                <p className="text-slate-500 text-xs">{v.brand} {v.model} · {v.year}</p>
              </div>
              {v.id === driver.currentVehicleId && <span className="ml-auto text-xs text-blue-400">Actual</span>}
            </button>
          ))}
        </AssignModal>
      )}

      {/* Trailer modal */}
      {showTrailerModal && (
        <AssignModal
          title="Asignar acoplado"
          loading={loading}
          onClose={() => setShowTrailerModal(false)}
        >
          {trailers.map(t => (
            <button
              key={t.id}
              onClick={() => assignTrailer(t.id)}
              disabled={saving}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
            >
              <Boxes size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{t.domain}</p>
                <p className="text-slate-500 text-xs">{t.brand} {t.model} · {t.subtype}</p>
              </div>
              {t.id === driver.currentTrailerId && <span className="ml-auto text-xs text-blue-400">Actual</span>}
            </button>
          ))}
        </AssignModal>
      )}
    </div>
  )
}

function AssignModal({ title, loading, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto space-y-2">
          {loading ? <p className="text-slate-500 text-sm text-center py-4">Cargando...</p> : children}
        </div>
      </div>
    </div>
  )
}

function EventsCard({ driver, onRefresh }: any) {
  const [adding, setAdding] = useState<'infraction' | 'accident' | null>(null)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '' })
  const [saving, setSaving] = useState(false)

  async function addEvent() {
    if (!form.date) return
    setSaving(true)
    await fetch(`/api/drivers/${driver.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: adding, ...form }),
    })
    setSaving(false)
    setAdding(null)
    setForm({ date: new Date().toISOString().split('T')[0], description: '' })
    onRefresh()
  }

  async function deleteEvent(eid: string) {
    await fetch(`/api/drivers/${driver.id}/events/${eid}`, { method: 'DELETE' })
    onRefresh()
  }

  const infractions = driver.events.filter((e: any) => e.type === 'infraction')
  const accidents = driver.events.filter((e: any) => e.type === 'accident')

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Infracciones y accidentes</h3>
        <div className="flex gap-2">
          <button onClick={() => setAdding('infraction')} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">+ Infracción</button>
          <button onClick={() => setAdding('accident')} className="text-xs text-red-400 hover:text-red-300 transition-colors">+ Accidente</button>
        </div>
      </div>

      {adding && (
        <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 space-y-3">
          <p className="text-sm font-medium text-white">Nuevo {adding === 'infraction' ? 'infracción' : 'accidente'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Fecha *</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label>Descripción</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opcional..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addEvent} disabled={saving} className="btn-primary text-sm py-1.5">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setAdding(null)} className="btn-secondary text-sm py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {infractions.length === 0 && accidents.length === 0 && !adding && (
        <p className="text-slate-600 text-sm">Sin registros de infracciones o accidentes.</p>
      )}

      {infractions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Infracciones</p>
          <div className="space-y-1.5">
            {infractions.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-orange-400 font-medium shrink-0">{fmtDate(e.date)}</span>
                <span className="text-slate-400 flex-1 truncate">{e.description || '—'}</span>
                <button onClick={() => deleteEvent(e.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {accidents.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Accidentes</p>
          <div className="space-y-1.5">
            {accidents.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-red-400 font-medium shrink-0">{fmtDate(e.date)}</span>
                <span className="text-slate-400 flex-1 truncate">{e.description || '—'}</span>
                <button onClick={() => deleteEvent(e.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── CAPACITACIONES ─── */
function CapacitacionesTab({ driver, onRefresh }: any) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', expiry: '', notes: '' })

  async function addTraining(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/drivers/${driver.id}/trainings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', date: '', expiry: '', notes: '' })
    onRefresh()
  }

  async function deleteTraining(tid: string) {
    await fetch(`/api/drivers/${driver.id}/trainings/${tid}`, { method: 'DELETE' })
    onRefresh()
  }

  function quickAdd(name: string) {
    setForm(f => ({ ...f, name }))
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Capacitaciones</h3>
          <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm py-1.5 flex items-center gap-1.5">
            <Plus size={14} /> Agregar
          </button>
        </div>

        <div>
          <p className="text-slate-500 text-xs mb-2">Carga rápida</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TRAININGS.map(t => (
              <button
                key={t}
                onClick={() => quickAdd(t)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-white hover:bg-blue-500/5 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="section-title mb-3">Nueva capacitación</h3>
          <form onSubmit={addTraining} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label>Nombre *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ej: Manejo defensivo" required autoFocus />
              </div>
              <div>
                <label>Fecha de realización</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label>Vencimiento</label>
                <input className="input" type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label>Notas</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Institución, certificado, etc." />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {driver.trainings.length === 0 ? (
        <div className="card text-center py-10">
          <BookOpen size={32} className="text-slate-700 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Sin capacitaciones registradas.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Capacitación</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Vencimiento</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Notas</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {driver.trainings.map((t: any) => (
                <tr key={t.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-white text-sm font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{fmtDate(t.date)}</td>
                  <td className="px-5 py-3 text-sm"><ExpiryBadge date={t.expiry} /></td>
                  <td className="px-5 py-3 text-slate-500 text-sm">{t.notes || '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => deleteTraining(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
