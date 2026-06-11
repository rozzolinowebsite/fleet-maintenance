'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { DAILY_ITEMS } from '@/lib/utils'
import { useUser } from '@/components/UserProvider'

type ItemStatus = 'ok' | 'fail' | 'na'

export default function DailyReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [kmReading, setKmReading] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Record<string, ItemStatus>>(
    Object.fromEntries(DAILY_ITEMS.map(i => [i.id, 'ok']))
  )

  function toggle(itemId: string) {
    setItems(prev => {
      const current = prev[itemId]
      const next: ItemStatus = current === 'ok' ? 'fail' : current === 'fail' ? 'na' : 'ok'
      return { ...prev, [itemId]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/vehicles/${id}/reviews/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id ?? null,
        reviewer: user?.name ?? null,
        kmReading: kmReading || null,
        notes,
        items: DAILY_ITEMS.map(i => ({ id: i.id, label: i.label, status: items[i.id] })),
      }),
    })
    router.push(`/vehicles/${id}`)
  }

  const okCount = Object.values(items).filter(s => s === 'ok').length
  const failCount = Object.values(items).filter(s => s === 'fail').length

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/vehicles/${id}`} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Revisión diaria</h1>
          <p className="text-slate-400 text-sm">
            {user ? `Revisado por: ${user.name}` : 'Tocá cada ítem para cambiar su estado'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <label>Lectura de KM</label>
          <input
            className="input"
            type="number"
            value={kmReading}
            onChange={e => setKmReading(e.target.value)}
            placeholder="Kilometraje actual del vehículo"
          />
        </div>

        <div className="card space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm">Checklist</h3>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {okCount} OK</span>
              {failCount > 0 && <span className="text-red-400 flex items-center gap-1"><XCircle size={12} /> {failCount} Fallo</span>}
            </div>
          </div>
          <p className="text-slate-500 text-xs mb-3">
            <CheckCircle size={11} className="inline mr-1 text-emerald-400" />OK &nbsp;
            <XCircle size={11} className="inline mr-1 text-red-400" />Fallo &nbsp;
            <MinusCircle size={11} className="inline mr-1 text-slate-500" />N/A
          </p>

          {DAILY_ITEMS.map(item => {
            const status = items[item.id]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                  status === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : status === 'fail' ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/15'
                  : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60'
                }`}
              >
                {status === 'ok' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                {status === 'fail' && <XCircle size={18} className="text-red-400 shrink-0" />}
                {status === 'na' && <MinusCircle size={18} className="text-slate-500 shrink-0" />}
                <span className={`text-sm ${status === 'fail' ? 'text-red-300' : status === 'na' ? 'text-slate-500' : 'text-slate-200'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="card">
          <label>Observaciones</label>
          <textarea
            className="input h-24 resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas adicionales, problemas encontrados..."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar revisión'}
          </button>
          <Link href={`/vehicles/${id}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
