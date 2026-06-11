'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Shield, Truck, Wrench } from 'lucide-react'

type User = { id: string; name: string; role: string; pin: string | null; createdAt: string }

const ROLES = [
  { value: 'driver', label: 'Conductor', icon: Truck },
  { value: 'mechanic', label: 'Mecánico', icon: Wrench },
  { value: 'admin', label: 'Administrador', icon: Shield },
]

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', role: 'driver', pin: '' })

  async function load() {
    const res = await fetch('/api/users')
    setUsers(await res.json())
  }

  useEffect(() => { load() }, [])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', role: 'driver', pin: '' })
    load()
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`¿Desactivar a ${name}?`)) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    load()
  }

  const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} activo{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {showForm && (
        <div className="card max-w-md">
          <h3 className="section-title">Nuevo usuario</h3>
          <form onSubmit={addUser} className="space-y-3">
            <div>
              <label>Nombre *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre completo"
                required
                autoFocus
              />
            </div>
            <div>
              <label>Rol</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label>PIN (opcional — dejalo vacío si no querés restringir)</label>
              <input
                className="input tracking-widest"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={form.pin}
                onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                placeholder="••••"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear usuario'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No hay usuarios</p>
          <p className="text-slate-500 text-sm mt-1">Creá el primer usuario para empezar.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Nombre</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">Rol</th>
                <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider px-5 py-3">PIN</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const role = roleMap[u.role]
                const RoleIcon = role?.icon || Users
                return (
                  <tr key={u.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-medium text-sm">{u.name}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-slate-300 text-sm">
                        <RoleIcon size={14} className="text-slate-500" />
                        {role?.label || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-sm">
                      {u.pin ? '•••• (configurado)' : 'Sin PIN'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => deleteUser(u.id, u.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
