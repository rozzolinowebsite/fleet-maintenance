'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package2, Trash2, Link2, Unlink, Search, X, Pencil, Check,
  FileText, Upload, Download, Eye, Plus, AlertTriangle, Calendar,
  Wrench, ClipboardCheck,
} from 'lucide-react'
import { getDocumentStatus, fmtDate, statusBg, StatusLevel } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { dateInputValue } from '@/lib/dates'

const DOC_TYPES: Record<string, string> = {
  seguro: 'Seguro',
  habilitacion: 'Habilitación',
  certificado: 'Certificado',
  manual: 'Manual',
  otro: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  MAINTENANCE: 'En mantenimiento',
}

const MNT_TYPES: Record<string, string> = {
  engrase: 'Engrase',
  otro: 'Otro',
}

const INSP_RESULT: Record<string, { label: string; cls: string }> = {
  ok: { label: 'Todo correcto', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  observations: { label: 'Con observaciones', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  repair: { label: 'Requiere reparación', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

const INSP_FIELDS = [
  { field: 'tires', noteField: 'tiresNote', label: 'Neumáticos' },
  { field: 'lights', noteField: 'lightsNote', label: 'Luces' },
  { field: 'hitch', noteField: 'hitchNote', label: 'Enganche' },
  { field: 'chains', noteField: 'chainsNote', label: 'Cadenas' },
  { field: 'brakes', noteField: 'brakesNote', label: 'Frenos' },
  { field: 'cleaning', noteField: 'cleaningNote', label: 'Limpieza general' },
  { field: 'woodFloor', noteField: 'woodFloorNote', label: 'Piso de madera' },
] as const

const DEFAULT_INSP_FORM = {
  date: '', inspector: '', observations: '',
  tires: 'ok', tiresNote: '', lights: 'ok', lightsNote: '',
  hitch: 'ok', hitchNote: '', chains: 'ok', chainsNote: '',
  brakes: 'ok', brakesNote: '', cleaning: 'ok', cleaningNote: '',
  woodFloor: 'ok', woodFloorNote: '',
}

type Vehicle = { id: string; plate: string; brand: string; model: string }
type TrailerDocument = {
  id: string; name: string; type: string
  issueDate: string | null; expiryDate: string | null
  fileUrl: string | null; fileName: string | null
  fileUploadedAt: string | null; notes: string | null; createdAt: string
}
type TrailerMaintenance = {
  id: string; type: string; date: string
  responsible: string | null; observations: string | null
  nextDueDate: string | null; createdAt: string
}
type TrailerRepair = {
  id: string; date: string; title: string; status: string
  cost: number | null; materialCost: number | null; laborCost: number | null
  responsible: string | null; repairerOther: string | null
  repairerUser: { id: string; name: string } | null
  registeredBy: { id: string; name: string } | null
  description: string | null
  createdAt: string
}
type TrailerInspection = {
  id: string; date: string; inspector: string | null
  generalResult: string; observations: string | null
  tires: string; tiresNote: string | null
  lights: string; lightsNote: string | null
  hitch: string; hitchNote: string | null
  chains: string; chainsNote: string | null
  brakes: string; brakesNote: string | null
  cleaning: string; cleaningNote: string | null
  woodFloor: string; woodFloorNote: string | null
  createdAt: string
}
type TrailerUnit = {
  id: string; companyId: string | null; name: string
  patent: string | null; brand: string | null; model: string | null
  year: number | null; serialNumber: string | null
  description: string | null; status: string
  vehicleId: string | null; vehicle: Vehicle | null
  documents: TrailerDocument[]
  maintenances: TrailerMaintenance[]
  repairs: TrailerRepair[]
  inspections: TrailerInspection[]
  _count: { maintenances: number; inspections: number; repairs: number }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{value ?? '—'}</p>
    </div>
  )
}

function StatusChip({ label, status, note }: { label: string; status: string; note: string }) {
  const c = {
    ok: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', dot: 'bg-emerald-500', text: 'text-emerald-400' },
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: 'bg-amber-500', text: 'text-amber-400' },
    danger: { border: 'border-red-500/30', bg: 'bg-red-500/5', dot: 'bg-red-500', text: 'text-red-400' },
    unknown: { border: 'border-slate-700', bg: 'bg-slate-800/50', dot: 'bg-slate-600', text: 'text-slate-400' },
  }[status] ?? { border: 'border-slate-700', bg: 'bg-slate-800/50', dot: 'bg-slate-600', text: 'text-slate-400' }
  return (
    <div className={`p-3 rounded-lg border ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
        <p className={`text-sm font-semibold ${c.text}`}>{label}</p>
      </div>
      <p className="text-xs text-slate-500 pl-4 leading-tight">{note}</p>
    </div>
  )
}

function FilePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 min-h-0 bg-slate-950 rounded-b-2xl overflow-hidden">
          {isPdf ? <iframe src={url} className="w-full h-full" title={title} /> : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={url} alt={title} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckItem({ label, value, note, onChange, onNoteChange }: {
  label: string; value: string; note: string
  onChange: (v: string) => void; onNoteChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-slate-300 font-medium pt-1 min-w-[120px]">{label}</span>
        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          {(['ok', 'observation', 'repair'] as const).map(opt => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                value === opt
                  ? opt === 'ok' ? 'bg-emerald-500 text-white'
                  : opt === 'observation' ? 'bg-amber-500 text-white'
                  : 'bg-red-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {opt === 'ok' ? '✓ Correcto' : opt === 'observation' ? '⚠ Obs.' : '✗ Reparar'}
            </button>
          ))}
        </div>
      </div>
      {value !== 'ok' && (
        <input className="input text-sm" placeholder="Detalle de la observación..."
          value={note} onChange={e => onNoteChange(e.target.value)} />
      )}
    </div>
  )
}

export default function TrailerUnitDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [trailer, setTrailer] = useState<TrailerUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'general' | 'docs' | 'maintenance' | 'repairs' | 'inspections'>('general')

  // General
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<TrailerUnit>>({})
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Documents
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', type: 'seguro', issueDate: '', expiryDate: '', notes: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [savingDoc, setSavingDoc] = useState(false)
  const [docError, setDocError] = useState('')
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<TrailerDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Maintenance
  const [maintenances, setMaintenances] = useState<TrailerMaintenance[] | null>(null)
  const [maintenancesLoading, setMaintenancesLoading] = useState(false)
  const [showAddMnt, setShowAddMnt] = useState(false)
  const [mntForm, setMntForm] = useState({ type: 'engrase', date: '', responsible: '', observations: '', nextDueDate: '' })
  const [savingMnt, setSavingMnt] = useState(false)

  // Repairs
  const [repairs, setRepairs] = useState<TrailerRepair[] | null>(null)
  const [repairsLoading, setRepairsLoading] = useState(false)
  const [showAddRepair, setShowAddRepair] = useState(false)
  const [repairForm, setRepairForm] = useState({ date: dateInputValue(new Date()), title: '', status: 'open', materialCost: '', laborCost: '', repairerUserId: '', repairerOther: '', description: '' })
  const [savingRepair, setSavingRepair] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  // Inspections
  const [inspections, setInspections] = useState<TrailerInspection[] | null>(null)
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  const [showAddInsp, setShowAddInsp] = useState(false)
  const [inspForm, setInspForm] = useState(DEFAULT_INSP_FORM)
  const [savingInsp, setSavingInsp] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/trailers/${id}`)
    if (res.ok) {
      const data = await res.json()
      setTrailer(data)
      setEditForm(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (tab === 'maintenance' && maintenances === null && id) {
      setMaintenancesLoading(true)
      fetch(`/api/trailers/${id}/maintenance`)
        .then(r => r.json())
        .then(data => { setMaintenances(data); setMaintenancesLoading(false) })
        .catch(() => setMaintenancesLoading(false))
    }
    if (tab === 'inspections' && inspections === null && id) {
      setInspectionsLoading(true)
      fetch(`/api/trailers/${id}/inspections`)
        .then(r => r.json())
        .then(data => { setInspections(data); setInspectionsLoading(false) })
        .catch(() => setInspectionsLoading(false))
    }
    if (tab === 'repairs' && repairs === null && id) {
      setRepairsLoading(true)
      fetch(`/api/trailers/${id}/repairs`)
        .then(r => r.json())
        .then(data => { setRepairs(data); setRepairsLoading(false) })
        .catch(() => setRepairsLoading(false))
    }
  }, [tab, id, maintenances, inspections, repairs])

  async function loadVehicles() {
    const res = await fetch('/api/vehicles')
    if (res.ok) setVehicles(await res.json())
  }

  async function associateVehicle(vehicleId: string | null) {
    setAssigning(true)
    await fetch(`/api/trailers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId }),
    })
    setAssigning(false)
    setShowVehicleModal(false)
    setVehicleSearch('')
    load()
  }

  async function saveEdit() {
    await fetch(`/api/trailers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditing(false)
    load()
  }

  async function deleteTrailer() {
    if (!confirm(`¿Eliminar el trailer "${trailer?.name}"? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/trailers/${id}`, { method: 'DELETE' })
    router.push('/trailers')
  }

  function setEF(field: string, value: unknown) {
    setEditForm(f => ({ ...f, [field]: value }))
  }

  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
  )

  async function addDocument(e: React.FormEvent) {
    e.preventDefault()
    setSavingDoc(true); setDocError('')
    try {
      const fd = new FormData()
      fd.append('name', docForm.name)
      fd.append('type', docForm.type)
      if (docForm.issueDate) fd.append('issueDate', docForm.issueDate)
      if (docForm.expiryDate) fd.append('expiryDate', docForm.expiryDate)
      if (docForm.notes) fd.append('notes', docForm.notes)
      if (docFile) fd.append('file', docFile)
      const res = await fetch(`/api/trailers/${id}/documents`, { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error') }
      setShowAddDoc(false)
      setDocForm({ name: '', type: 'seguro', issueDate: '', expiryDate: '', notes: '' })
      setDocFile(null)
      load()
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setSavingDoc(false) }
  }

  async function uploadFile(docId: string, file: File) {
    setUploadingFile(docId)
    const fd = new FormData(); fd.append('file', file)
    await fetch(`/api/trailers/${id}/documents/${docId}/file`, { method: 'POST', body: fd })
    setUploadingFile(null); load()
  }

  async function removeFile(docId: string) {
    await fetch(`/api/trailers/${id}/documents/${docId}/file`, { method: 'DELETE' })
    load()
  }

  async function deleteDocument(docId: string, docName: string) {
    if (!confirm(`¿Eliminar el documento "${docName}"?`)) return
    await fetch(`/api/trailers/${id}/documents/${docId}`, { method: 'DELETE' })
    load()
  }

  async function addMaintenance(e: React.FormEvent) {
    e.preventDefault()
    setSavingMnt(true)
    try {
      await fetch(`/api/trailers/${id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mntForm),
      })
      setShowAddMnt(false)
      setMntForm({ type: 'engrase', date: '', responsible: '', observations: '', nextDueDate: '' })
      const res = await fetch(`/api/trailers/${id}/maintenance`)
      if (res.ok) setMaintenances(await res.json())
      load()
    } finally { setSavingMnt(false) }
  }

  async function deleteMaintenance(mntId: string) {
    if (!confirm('¿Eliminar este registro de mantenimiento?')) return
    await fetch(`/api/trailers/${id}/maintenance/${mntId}`, { method: 'DELETE' })
    setMaintenances(prev => prev ? prev.filter(m => m.id !== mntId) : prev)
    load()
  }

  async function addRepair(e: React.FormEvent) {
    e.preventDefault()
    setSavingRepair(true)
    try {
      await fetch(`/api/trailers/${id}/repairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairForm),
      })
      setShowAddRepair(false)
      setRepairForm({ date: dateInputValue(new Date()), title: '', status: 'open', materialCost: '', laborCost: '', repairerUserId: '', repairerOther: '', description: '' })
      const res = await fetch(`/api/trailers/${id}/repairs`)
      if (res.ok) setRepairs(await res.json())
      load()
    } finally { setSavingRepair(false) }
  }

  async function updateRepair(repairId: string, status: string) {
    await fetch(`/api/trailers/${id}/repairs/${repairId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setRepairs(prev => prev ? prev.map(r => r.id === repairId ? { ...r, status } : r) : prev)
    load()
  }

  async function deleteRepair(repairId: string) {
    if (!confirm('Eliminar esta reparacion?')) return
    await fetch(`/api/trailers/${id}/repairs/${repairId}`, { method: 'DELETE' })
    setRepairs(prev => prev ? prev.filter(r => r.id !== repairId) : prev)
    load()
  }

  async function addInspection(e: React.FormEvent) {
    e.preventDefault()
    setSavingInsp(true)
    try {
      const hasRepair = INSP_FIELDS.some(f => inspForm[f.field as keyof typeof inspForm] === 'repair')
      const hasObs = INSP_FIELDS.some(f => inspForm[f.field as keyof typeof inspForm] === 'observation')
      const generalResult = hasRepair ? 'repair' : hasObs ? 'observations' : 'ok'
      await fetch(`/api/trailers/${id}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inspForm, generalResult }),
      })
      setShowAddInsp(false)
      setInspForm(DEFAULT_INSP_FORM)
      const res = await fetch(`/api/trailers/${id}/inspections`)
      if (res.ok) setInspections(await res.json())
      load()
    } finally { setSavingInsp(false) }
  }

  async function deleteInspection(inspId: string) {
    if (!confirm('¿Eliminar esta inspección?')) return
    await fetch(`/api/trailers/${id}/inspections/${inspId}`, { method: 'DELETE' })
    setInspections(prev => prev ? prev.filter(i => i.id !== inspId) : prev)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">Cargando...</p>
    </div>
  )
  if (!trailer) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Trailer no encontrado.</p>
      <Link href="/trailers" className="text-blue-400 text-sm mt-2 inline-block">← Volver</Link>
    </div>
  )

  const expiredDocs = trailer.documents.filter(d => d.expiryDate && getDocumentStatus(d.expiryDate) === 'danger')
  const warningDocs = trailer.documents.filter(d => d.expiryDate && getDocumentStatus(d.expiryDate) === 'warning')

  // Operational status
  const insuranceDoc = trailer.documents
    .filter(d => d.type === 'seguro' && d.expiryDate)
    .sort((a, b) => new Date(b.expiryDate!).getTime() - new Date(a.expiryDate!).getTime())[0] ?? null
  const insuranceStatus: StatusLevel = insuranceDoc ? getDocumentStatus(insuranceDoc.expiryDate) : 'unknown'
  const insuranceDays = insuranceDoc?.expiryDate ? differenceInDays(new Date(insuranceDoc.expiryDate), new Date()) : null
  const insuranceNote = !insuranceDoc ? 'Sin seguro registrado'
    : insuranceStatus === 'danger' ? `Vencido hace ${Math.abs(insuranceDays!)} días`
    : insuranceStatus === 'warning' ? `Vence en ${insuranceDays} días`
    : `Vigente hasta ${fmtDate(insuranceDoc.expiryDate)}`

  const criticalOther = trailer.documents.filter(d => ['habilitacion', 'certificado'].includes(d.type))
  const docsStatus: StatusLevel = criticalOther.length === 0 ? 'unknown'
    : criticalOther.reduce((w, d) => {
      if (!d.expiryDate) return w
      const s = getDocumentStatus(d.expiryDate)
      if (s === 'danger') return 'danger' as StatusLevel
      if (s === 'warning' && w !== 'danger') return 'warning' as StatusLevel
      return w
    }, 'ok' as StatusLevel)
  const expiredCritical = criticalOther.filter(d => d.expiryDate && getDocumentStatus(d.expiryDate) === 'danger').length
  const warningCritical = criticalOther.filter(d => d.expiryDate && getDocumentStatus(d.expiryDate) === 'warning').length
  const docsNote = docsStatus === 'unknown' ? 'Sin docs críticos'
    : docsStatus === 'danger' ? `${expiredCritical} vencido${expiredCritical !== 1 ? 's' : ''}`
    : docsStatus === 'warning' ? `${warningCritical} por vencer`
    : 'Al día'

  const lastMnt = trailer.maintenances[0] ?? null
  const mntStatus: StatusLevel = !lastMnt ? 'unknown'
    : lastMnt.nextDueDate ? getDocumentStatus(lastMnt.nextDueDate) : 'ok'
  const mntDays = lastMnt?.nextDueDate ? differenceInDays(new Date(lastMnt.nextDueDate), new Date()) : null
  const mntNote = !lastMnt ? 'Sin registros'
    : !lastMnt.nextDueDate ? `Último: ${fmtDate(lastMnt.date)}`
    : mntStatus === 'danger' ? `Vencido hace ${Math.abs(mntDays!)} días`
    : mntStatus === 'warning' ? `Próx. en ${mntDays} días`
    : `Próx: ${fmtDate(lastMnt.nextDueDate)}`

  const lastInsp = trailer.inspections[0] ?? null
  const inspDaysAgo = lastInsp ? differenceInDays(new Date(), new Date(lastInsp.date)) : null
  const inspStatus: StatusLevel = !lastInsp ? 'unknown'
    : inspDaysAgo! > 60 ? 'danger'
    : inspDaysAgo! > 30 ? 'warning'
    : 'ok'
  const inspNote = !lastInsp ? 'Sin inspecciones'
    : inspDaysAgo === 0 ? 'Realizada hoy'
    : inspDaysAgo === 1 ? 'Ayer'
    : `Hace ${inspDaysAgo} días`

  const allCriticalDocs = trailer.documents
    .filter(d => ['seguro', 'habilitacion', 'certificado'].includes(d.type) && d.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())

  const tabList = [
    ['general', 'General'],
    ['docs', `Documentos (${trailer.documents.length})`],
    ['maintenance', `Mantenimiento (${trailer._count.maintenances})`],
    ['repairs', `Reparaciones (${trailer._count.repairs})`],
    ['inspections', `Inspecciones (${trailer._count.inspections})`],
  ] as const

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/trailers" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{trailer.name}</h1>
              <Package2 size={18} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">
              {[trailer.patent, trailer.brand, trailer.model].filter(Boolean).join(' · ')}
              {trailer.year ? ` · ${trailer.year}` : ''}
              {' · '}<span className="text-slate-500">{STATUS_LABELS[trailer.status] ?? trailer.status}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tab === 'general' && (
            !editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5">
                <Pencil size={14} /><span className="hidden sm:inline">Editar</span>
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
            )
          )}
          <button onClick={deleteTrailer} className="btn-danger flex items-center gap-1.5">
            <Trash2 size={14} /><span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {(expiredDocs.length > 0 || warningDocs.length > 0) && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          expiredDocs.length > 0
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <AlertTriangle size={16} className="shrink-0" />
          <p className="text-sm">
            {expiredDocs.length > 0
              ? `${expiredDocs.length} documento${expiredDocs.length !== 1 ? 's' : ''} vencido${expiredDocs.length !== 1 ? 's' : ''}`
              : `${warningDocs.length} documento${warningDocs.length !== 1 ? 's' : ''} por vencer en los próximos 30 días`}
          </p>
          <button onClick={() => setTab('docs')} className="ml-auto text-xs underline shrink-0">Ver documentos</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
        {tabList.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === 'general' && (
        <div className="space-y-5">
          {!editing && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatusChip label="Seguro" status={insuranceStatus} note={insuranceNote} />
              <StatusChip label="Documentación" status={docsStatus} note={docsNote} />
              <StatusChip label="Engrase" status={mntStatus} note={mntNote} />
              <StatusChip label="Inspección" status={inspStatus} note={inspNote} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">
              <div className="card">
                <h3 className="section-title mb-4">Identificación</h3>
                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label>Nombre</label>
                      <input className="input" value={editForm.name ?? ''} onChange={e => setEF('name', e.target.value)} />
                    </div>
                    <div>
                      <label>Patente</label>
                      <input className="input uppercase" value={editForm.patent ?? ''} onChange={e => setEF('patent', e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label>Número de serie</label>
                      <input className="input" value={editForm.serialNumber ?? ''} onChange={e => setEF('serialNumber', e.target.value)} />
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
                      <input className="input" type="number" value={editForm.year ?? ''} onChange={e => setEF('year', e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div>
                      <label>Estado</label>
                      <select className="input" value={editForm.status ?? 'ACTIVE'} onChange={e => setEF('status', e.target.value)}>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="MAINTENANCE">En mantenimiento</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label>Descripción</label>
                      <textarea className="input h-20 resize-none" value={editForm.description ?? ''} onChange={e => setEF('description', e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <Row label="Nombre" value={trailer.name} />
                    <Row label="Patente" value={trailer.patent} />
                    <Row label="Marca" value={trailer.brand} />
                    <Row label="Modelo" value={trailer.model} />
                    <Row label="Año" value={trailer.year} />
                    <Row label="Número de serie" value={trailer.serialNumber} />
                    <Row label="Estado" value={STATUS_LABELS[trailer.status] ?? trailer.status} />
                    {trailer.description && (
                      <div className="col-span-2 pt-3 border-t border-slate-800">
                        <p className="text-slate-500 text-xs mb-1">Descripción</p>
                        <p className="text-slate-300 text-sm">{trailer.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming expirations */}
              {!editing && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">Próximos vencimientos</h3>
                    <button onClick={() => setTab('docs')} className="text-xs text-blue-400 hover:underline">Ver todos →</button>
                  </div>
                  {allCriticalDocs.length === 0 ? (
                    <p className="text-slate-500 text-sm">Sin documentos con fecha de vencimiento registrada.</p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {allCriticalDocs.map(d => {
                        const s = getDocumentStatus(d.expiryDate)
                        const days = d.expiryDate ? differenceInDays(new Date(d.expiryDate), new Date()) : null
                        return (
                          <div key={d.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                s === 'danger' ? 'bg-red-500' : s === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <span className="text-slate-300 text-sm truncate">{d.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                {DOC_TYPES[d.type] ?? d.type}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-400">{fmtDate(d.expiryDate)}</p>
                              <p className={`text-xs font-medium ${
                                s === 'danger' ? 'text-red-400' : s === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {s === 'danger' ? `Hace ${Math.abs(days!)} días` : s === 'warning' ? `${days} días` : 'Vigente'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Seguro */}
              {!editing && (
                <div className="card">
                  <h3 className="section-title mb-3">Seguro</h3>
                  {!insuranceDoc ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                        <p className="text-slate-500 text-sm">Sin seguro registrado</p>
                      </div>
                      <button
                        onClick={() => { setDocForm(f => ({ ...f, type: 'seguro' })); setShowAddDoc(true) }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Registrar póliza →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${statusBg(insuranceStatus)}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          insuranceStatus === 'ok' ? 'bg-emerald-400' : insuranceStatus === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        {insuranceStatus === 'ok' ? 'Vigente'
                          : insuranceStatus === 'warning' ? `Vence en ${insuranceDays} días`
                          : 'Vencido'}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Póliza</p>
                          <p className="text-white font-medium">{insuranceDoc.name}</p>
                        </div>
                        {insuranceDoc.notes && (
                          <div>
                            <p className="text-slate-500 text-xs">Notas</p>
                            <p className="text-slate-300 text-sm">{insuranceDoc.notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-500 text-xs">Vencimiento</p>
                          <p className="text-white font-medium">{fmtDate(insuranceDoc.expiryDate)}</p>
                        </div>
                        {insuranceDoc.issueDate && (
                          <div>
                            <p className="text-slate-500 text-xs">Emisión</p>
                            <p className="text-slate-300">{fmtDate(insuranceDoc.issueDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle */}
              <div className="card">
                <h3 className="section-title mb-4">Vehículo asociado</h3>
                {trailer.vehicle ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Link2 size={16} className="text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-300 font-bold">{trailer.vehicle.plate}</p>
                        <p className="text-slate-400 text-xs">{trailer.vehicle.brand} {trailer.vehicle.model}</p>
                      </div>
                    </div>
                    <Link href={`/vehicles/${trailer.vehicle.id}`} className="btn-secondary w-full text-center text-sm">
                      Ver vehículo
                    </Link>
                    <button onClick={() => associateVehicle(null)} disabled={assigning}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 text-sm transition-colors">
                      <Unlink size={14} /> Desasociar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <Unlink size={16} className="text-slate-600 shrink-0" />
                      <p className="text-slate-500 text-sm">Sin vehículo asignado</p>
                    </div>
                    <button onClick={() => { loadVehicles(); setShowVehicleModal(true) }}
                      className="btn-primary w-full flex items-center justify-center gap-2">
                      <Link2 size={15} /> Asociar a vehículo
                    </button>
                  </div>
                )}
              </div>

              {/* Last grease */}
              {!editing && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="section-title flex items-center gap-1.5">
                      <Wrench size={13} className="text-slate-500" /> Último engrase
                    </h3>
                    <button onClick={() => setTab('maintenance')} className="text-xs text-blue-400 hover:underline">Ver →</button>
                  </div>
                  {!lastMnt ? (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-sm">Sin registros de engrase.</p>
                      <button
                        onClick={() => { setTab('maintenance'); setMntForm(f => ({ ...f, date: new Date().toISOString().split('T')[0] })); setShowAddMnt(true) }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Registrar primero →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-white text-sm font-medium">{fmtDate(lastMnt.date)}</p>
                      {lastMnt.responsible && <p className="text-slate-400 text-xs">{lastMnt.responsible}</p>}
                      {lastMnt.observations && <p className="text-slate-500 text-xs line-clamp-2">{lastMnt.observations}</p>}
                      {lastMnt.nextDueDate && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${statusBg(mntStatus)}`}>
                          <Calendar size={11} className="shrink-0" />
                          Próx: {fmtDate(lastMnt.nextDueDate)}
                          {mntDays !== null && (
                            <span className="opacity-75">
                              {mntDays >= 0 ? ` · en ${mntDays} días` : ` · hace ${Math.abs(mntDays)} días`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Last inspection */}
              {!editing && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="section-title flex items-center gap-1.5">
                      <ClipboardCheck size={13} className="text-slate-500" /> Última inspección
                    </h3>
                    <button onClick={() => setTab('inspections')} className="text-xs text-blue-400 hover:underline">Ver →</button>
                  </div>
                  {!lastInsp ? (
                    <div className="space-y-2">
                      <p className="text-slate-500 text-sm">Sin inspecciones registradas.</p>
                      <button
                        onClick={() => { setTab('inspections'); setInspForm({ ...DEFAULT_INSP_FORM, date: new Date().toISOString().split('T')[0] }); setShowAddInsp(true) }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Registrar primera →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className={`text-xs px-2 py-0.5 rounded border inline-block ${INSP_RESULT[lastInsp.generalResult]?.cls ?? ''}`}>
                        {INSP_RESULT[lastInsp.generalResult]?.label ?? lastInsp.generalResult}
                      </span>
                      <p className="text-white text-sm font-medium">{fmtDate(lastInsp.date)}</p>
                      {lastInsp.inspector && <p className="text-slate-400 text-xs">{lastInsp.inspector}</p>}
                      {(() => {
                        const findings = INSP_FIELDS.filter(f => (lastInsp as unknown as Record<string, string>)[f.field] !== 'ok')
                        return findings.length > 0 && (
                          <p className="text-xs text-slate-500">
                            {findings.length} hallazgo{findings.length !== 1 ? 's' : ''}:{' '}
                            {findings.map(f => f.label).join(', ')}
                          </p>
                        )
                      })()}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${statusBg(inspStatus)}`}>
                        <Calendar size={11} className="shrink-0" />
                        {inspNote}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCS TAB ── */}
      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{trailer.documents.length} documento{trailer.documents.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAddDoc(true)} className="btn-primary flex items-center gap-1.5">
              <Plus size={15} /> Agregar documento
            </button>
          </div>
          {trailer.documents.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay documentos registrados.</p>
              <button onClick={() => setShowAddDoc(true)} className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={15} /> Agregar primer documento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trailer.documents.map(doc => {
                const docStatus = getDocumentStatus(doc.expiryDate)
                const daysLeft = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : null
                return (
                  <div key={doc.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium">{doc.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                            {DOC_TYPES[doc.type] ?? doc.type}
                          </span>
                          {doc.expiryDate && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(docStatus)}`}>
                              {docStatus === 'danger' ? `Vencido hace ${Math.abs(daysLeft!)} días`
                                : docStatus === 'warning' ? `Vence en ${daysLeft} días`
                                : `Vigente hasta ${fmtDate(doc.expiryDate)}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          {doc.issueDate && <span><Calendar size={11} className="inline mr-1 -mt-0.5" />Emitido: {fmtDate(doc.issueDate)}</span>}
                          {doc.expiryDate && <span><Calendar size={11} className="inline mr-1 -mt-0.5" />Vence: {fmtDate(doc.expiryDate)}</span>}
                        </div>
                        {doc.notes && <p className="text-slate-500 text-xs mt-1">{doc.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.fileUrl ? (
                          <>
                            <button type="button" onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Ver PDF">
                              <Eye size={15} />
                            </button>
                            <a href={doc.fileUrl} download={doc.fileName ?? undefined}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Descargar">
                              <Download size={15} />
                            </a>
                            <label className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer" title="Reemplazar">
                              <Upload size={15} />
                              <input type="file" accept="application/pdf,image/*" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(doc.id, f); e.target.value = '' }} />
                            </label>
                            <button onClick={() => removeFile(doc.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Quitar archivo">
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                            <Upload size={13} />
                            {uploadingFile === doc.id ? 'Subiendo...' : 'Subir PDF'}
                            <input type="file" accept="application/pdf" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(doc.id, f); e.target.value = '' }} />
                          </label>
                        )}
                        <button onClick={() => deleteDocument(doc.id, doc.name)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MAINTENANCE TAB ── */}
      {tab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {maintenances ? `${maintenances.length} registro${maintenances.length !== 1 ? 's' : ''}` : ''}
            </p>
            <button
              onClick={() => { setMntForm(f => ({ ...f, date: new Date().toISOString().split('T')[0] })); setShowAddMnt(true) }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={15} /> Registrar engrase
            </button>
          </div>

          {maintenancesLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-400 text-sm">Cargando...</p>
            </div>
          ) : maintenances?.length === 0 ? (
            <div className="card text-center py-12">
              <Wrench size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Sin registros de mantenimiento.</p>
              <button
                onClick={() => { setMntForm(f => ({ ...f, date: new Date().toISOString().split('T')[0] })); setShowAddMnt(true) }}
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                <Plus size={15} /> Registrar primero
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(maintenances ?? []).map(mnt => {
                const nxtStatus = mnt.nextDueDate ? getDocumentStatus(mnt.nextDueDate) : null
                const nxtDays = mnt.nextDueDate ? differenceInDays(new Date(mnt.nextDueDate), new Date()) : null
                return (
                  <div key={mnt.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                            {MNT_TYPES[mnt.type] ?? mnt.type}
                          </span>
                          <span className="text-white font-semibold">{fmtDate(mnt.date)}</span>
                          {mnt.responsible && <span className="text-slate-400 text-sm">{mnt.responsible}</span>}
                        </div>
                        {mnt.observations && <p className="text-slate-400 text-sm">{mnt.observations}</p>}
                        {mnt.nextDueDate && nxtStatus && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${statusBg(nxtStatus)}`}>
                            <Calendar size={11} className="shrink-0" />
                            Próximo: {fmtDate(mnt.nextDueDate)}
                            {nxtDays !== null && (
                              <span className="opacity-75">
                                {nxtDays >= 0 ? ` · en ${nxtDays} días` : ` · hace ${Math.abs(nxtDays)} días`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteMaintenance(mnt.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── INSPECTIONS TAB ── */}
      {tab === 'repairs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-400 text-sm">
              {repairs ? `${repairs.length} reparacion${repairs.length !== 1 ? 'es' : ''}` : ''}
            </p>
            <button
              onClick={() => { setRepairForm(f => ({ ...f, date: dateInputValue(new Date()) })); setShowAddRepair(v => !v) }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={15} /> Registrar reparacion
            </button>
          </div>

          {showAddRepair && (
            <div className="card">
              <h3 className="section-title">Nueva reparacion</h3>
              <form onSubmit={addRepair} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label>Fecha *</label>
                    <input className="input" type="date" value={repairForm.date} onChange={e => setRepairForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label>Estado</label>
                    <select className="input" value={repairForm.status} onChange={e => setRepairForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="open">Pendiente</option>
                      <option value="in_progress">En curso</option>
                      <option value="done">Resuelta</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label>Detalle *</label>
                    <input className="input" value={repairForm.title} onChange={e => setRepairForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Reparacion de luces traseras" required autoFocus />
                  </div>
                  <div>
                    <label>Quien reparo</label>
                    <select className="input" value={repairForm.repairerUserId} onChange={e => setRepairForm(f => ({ ...f, repairerUserId: e.target.value }))}>
                      <option value="">Sin especificar</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  {repairForm.repairerUserId === 'other' && (
                    <div>
                      <label>Aclarar quien</label>
                      <input className="input" value={repairForm.repairerOther} onChange={e => setRepairForm(f => ({ ...f, repairerOther: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label>Materiales</label>
                    <input className="input" type="number" min="0" step="0.01" value={repairForm.materialCost} onChange={e => setRepairForm(f => ({ ...f, materialCost: e.target.value }))} />
                  </div>
                  <div>
                    <label>Mano de obra</label>
                    <input className="input" type="number" min="0" step="0.01" value={repairForm.laborCost} onChange={e => setRepairForm(f => ({ ...f, laborCost: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Observaciones</label>
                    <textarea className="input h-24 resize-none" value={repairForm.description} onChange={e => setRepairForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary" disabled={savingRepair}>{savingRepair ? 'Guardando...' : 'Guardar'}</button>
                  <button type="button" onClick={() => setShowAddRepair(false)} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {repairsLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-400 text-sm">Cargando...</p>
            </div>
          ) : repairs?.length === 0 ? (
            <div className="card text-center py-12">
              <Wrench size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Sin reparaciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(repairs ?? []).map(rep => {
                const s = {
                  open: { label: 'Pendiente', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
                  in_progress: { label: 'En curso', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                  done: { label: 'Resuelta', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                }[rep.status] ?? { label: rep.status, cls: 'bg-slate-700/50 text-slate-400 border-slate-600' }
                return (
                  <div key={rep.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
                          <span className="text-white font-semibold">{rep.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{fmtDate(rep.date)}</span>
                          {(rep.materialCost != null || rep.laborCost != null || rep.cost != null) && <span>${Number((rep.materialCost ?? 0) + (rep.laborCost ?? 0) || rep.cost).toLocaleString('es-AR')}</span>}
                          {(rep.repairerUser?.name || rep.repairerOther || rep.responsible) && <span>Reparo: {rep.repairerUser?.name || rep.repairerOther || rep.responsible}</span>}
                          {rep.registeredBy?.name && <span>Registro: {rep.registeredBy.name}</span>}
                        </div>
                        {rep.description && <p className="text-slate-400 text-sm mt-2">{rep.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rep.status !== 'done' && (
                          <button onClick={() => updateRepair(rep.id, rep.status === 'open' ? 'in_progress' : 'done')} className="text-xs text-blue-400 hover:text-blue-300">
                            {rep.status === 'open' ? 'Iniciar' : 'Resolver'}
                          </button>
                        )}
                        <button onClick={() => deleteRepair(rep.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'inspections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {inspections ? `${inspections.length} inspección${inspections.length !== 1 ? 'es' : ''}` : ''}
            </p>
            <button
              onClick={() => { setInspForm({ ...DEFAULT_INSP_FORM, date: new Date().toISOString().split('T')[0] }); setShowAddInsp(true) }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={15} /> Nueva inspección
            </button>
          </div>

          {inspectionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-400 text-sm">Cargando...</p>
            </div>
          ) : inspections?.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardCheck size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Sin inspecciones registradas.</p>
              <button
                onClick={() => { setInspForm({ ...DEFAULT_INSP_FORM, date: new Date().toISOString().split('T')[0] }); setShowAddInsp(true) }}
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                <Plus size={15} /> Primera inspección
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(inspections ?? []).map(insp => {
                const result = INSP_RESULT[insp.generalResult]
                const findings = INSP_FIELDS.filter(f => (insp as unknown as Record<string, string>)[f.field] !== 'ok')
                return (
                  <div key={insp.id} className="card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded border ${result?.cls ?? ''}`}>
                            {result?.label ?? insp.generalResult}
                          </span>
                          <span className="text-white font-semibold">{fmtDate(insp.date)}</span>
                          {insp.inspector && <span className="text-slate-400 text-sm">{insp.inspector}</span>}
                        </div>
                        {insp.observations && <p className="text-slate-400 text-sm">{insp.observations}</p>}
                      </div>
                      <button onClick={() => deleteInspection(insp.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {findings.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-800">
                        {findings.map(f => {
                          const fVal = (insp as unknown as Record<string, string>)[f.field]
                          const fNote = (insp as unknown as Record<string, string | null>)[f.noteField]
                          return (
                            <div key={f.field} className="flex items-baseline gap-2 text-sm">
                              <span className={`text-xs font-medium shrink-0 ${fVal === 'repair' ? 'text-red-400' : 'text-amber-400'}`}>
                                {fVal === 'repair' ? '✗' : '⚠'} {f.label}
                              </span>
                              {fNote && <span className="text-slate-500 text-xs">— {fNote}</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Add document ── */}
      {previewDoc?.fileUrl && (
        <FilePreviewModal
          url={previewDoc.fileUrl}
          title={previewDoc.fileName || previewDoc.name}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {showAddDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-semibold text-white">Agregar documento</h2>
              <button onClick={() => { setShowAddDoc(false); setDocError('') }} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addDocument} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label>Nombre del documento *</label>
                  <input className="input" value={docForm.name} onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Seguro 2025 - Mapfre" required autoFocus />
                </div>
                <div>
                  <label>Tipo *</label>
                  <select className="input" value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(DOC_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div />
                <div>
                  <label>Fecha de emisión</label>
                  <input className="input" type="date" value={docForm.issueDate} onChange={e => setDocForm(f => ({ ...f, issueDate: e.target.value }))} />
                </div>
                <div>
                  <label>Fecha de vencimiento</label>
                  <input className="input" type="date" value={docForm.expiryDate} onChange={e => setDocForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label>Notas</label>
                  <input className="input" value={docForm.notes} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Número de póliza, observaciones..." />
                </div>
                <div className="col-span-2">
                  <label>Archivo PDF (opcional, máx. 10 MB)</label>
                  <div className="mt-1">
                    {docFile ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                        <FileText size={15} className="text-blue-400 shrink-0" />
                        <span className="text-sm text-slate-300 flex-1 min-w-0 truncate">{docFile.name}</span>
                        <button type="button" onClick={() => setDocFile(null)} className="text-slate-500 hover:text-red-400"><X size={15} /></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
                        <Upload size={15} className="text-slate-500" />
                        <span className="text-sm text-slate-500">Seleccionar archivo</span>
                        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden"
                          onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              {docError && <p className="text-red-400 text-sm">{docError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={savingDoc}>
                  {savingDoc ? 'Guardando...' : 'Guardar documento'}
                </button>
                <button type="button" onClick={() => { setShowAddDoc(false); setDocError('') }} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add maintenance ── */}
      {showAddMnt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-semibold text-white">Registrar mantenimiento</h2>
              <button onClick={() => setShowAddMnt(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addMaintenance} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Tipo</label>
                  <select className="input" value={mntForm.type} onChange={e => setMntForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(MNT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label>Fecha *</label>
                  <input className="input" type="date" value={mntForm.date} onChange={e => setMntForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label>Responsable</label>
                  <input className="input" value={mntForm.responsible} onChange={e => setMntForm(f => ({ ...f, responsible: e.target.value }))}
                    placeholder="Nombre del responsable" />
                </div>
                <div className="col-span-2">
                  <label>Observaciones</label>
                  <textarea className="input h-20 resize-none" value={mntForm.observations}
                    onChange={e => setMntForm(f => ({ ...f, observations: e.target.value }))}
                    placeholder="Detalles del mantenimiento realizado..." />
                </div>
                <div className="col-span-2">
                  <label>Próximo engrase (fecha sugerida)</label>
                  <input className="input" type="date" value={mntForm.nextDueDate}
                    onChange={e => setMntForm(f => ({ ...f, nextDueDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={savingMnt}>
                  {savingMnt ? 'Guardando...' : 'Guardar registro'}
                </button>
                <button type="button" onClick={() => setShowAddMnt(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add inspection ── */}
      {showAddInsp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
              <h2 className="font-semibold text-white">Nueva inspección mensual</h2>
              <button onClick={() => setShowAddInsp(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addInspection} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Fecha *</label>
                    <input className="input" type="date" value={inspForm.date}
                      onChange={e => setInspForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label>Inspector</label>
                    <input className="input" value={inspForm.inspector}
                      onChange={e => setInspForm(f => ({ ...f, inspector: e.target.value }))}
                      placeholder="Nombre del inspector" />
                  </div>
                </div>

                <div>
                  <p className="section-title mb-4">Checklist</p>
                  <div className="space-y-4">
                    {INSP_FIELDS.map(f => (
                      <CheckItem
                        key={f.field}
                        label={f.label}
                        value={inspForm[f.field as keyof typeof inspForm] as string}
                        note={inspForm[f.noteField as keyof typeof inspForm] as string}
                        onChange={v => setInspForm(prev => ({ ...prev, [f.field]: v }))}
                        onNoteChange={v => setInspForm(prev => ({ ...prev, [f.noteField]: v }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label>Observaciones generales</label>
                  <textarea className="input h-20 resize-none" value={inspForm.observations}
                    onChange={e => setInspForm(f => ({ ...f, observations: e.target.value }))}
                    placeholder="Notas adicionales sobre la inspección..." />
                </div>
              </div>
              <div className="p-5 border-t border-slate-800 flex gap-3 shrink-0">
                <button type="submit" className="btn-primary flex-1" disabled={savingInsp}>
                  {savingInsp ? 'Guardando...' : 'Guardar inspección'}
                </button>
                <button type="button" onClick={() => setShowAddInsp(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Vehicle association ── */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-semibold text-white">Asociar a vehículo</h2>
              <button onClick={() => { setShowVehicleModal(false); setVehicleSearch('') }} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" placeholder="Buscar por patente, marca o modelo..."
                  value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No se encontraron vehículos</p>
                ) : (
                  filteredVehicles.map(v => (
                    <button key={v.id} onClick={() => associateVehicle(v.id)} disabled={assigning}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-800 ${
                        trailer.vehicleId === v.id ? 'bg-blue-500/10 border border-blue-500/30' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{v.plate}</p>
                        <p className="text-slate-400 text-xs">{v.brand} {v.model}</p>
                      </div>
                      {trailer.vehicleId === v.id && <span className="text-xs text-blue-400">Actual</span>}
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
