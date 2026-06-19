'use client'
import { useState, useEffect } from 'react'
import { Car, LogIn, UserPlus } from 'lucide-react'

type User = { id: string; name: string; role: string; pin: string | null }

const ROLE_LABELS: Record<string, string> = {
  driver: 'Conductor',
  mechanic: 'Mecánico',
  admin: 'Administrador',
}

export default function LoginPage() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // First-user creation state
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [newPin, setNewPin] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadUsers() {
    const res = await fetch('/api/users')
    setUsers(await res.json())
  }

  useEffect(() => { loadUsers() }, [])

  const selected = users?.find(u => u.id === selectedId)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedId, pin }),
    })
    if (res.ok) {
      window.location.href = '/'
    } else {
      const data = await res.json()
      setError(data.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  async function handleCreateFirst(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, role: newRole, pin: newPin || null }),
    })
    if (res.ok) {
      await loadUsers()
    }
    setCreating(false)
  }

  if (users === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FleetMaint</h1>
          <p className="text-slate-400 text-sm mt-1">
            {users.length === 0 ? 'Configuración inicial' : 'Iniciá sesión para continuar'}
          </p>
        </div>

        {users.length === 0 ? (
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={16} className="text-blue-400" />
              <h2 className="font-semibold text-white text-sm">Crear primer usuario</h2>
            </div>
            <p className="text-slate-500 text-xs">No hay usuarios en el sistema. Creá el primer administrador para continuar.</p>
            <form onSubmit={handleCreateFirst} className="space-y-3">
              <div>
                <label>Nombre *</label>
                <input
                  className="input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label>Rol</label>
                <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="admin">Administrador</option>
                  <option value="mechanic">Mecánico</option>
                  <option value="driver">Conductor</option>
                </select>
              </div>
              <div>
                <label>PIN (opcional)</label>
                <input
                  className="input tracking-widest"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="••••"
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={creating || !newName}>
                {creating ? 'Creando...' : 'Crear usuario y entrar'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="card space-y-4">
            <div>
              <label>¿Quién sos?</label>
              <select
                className="input"
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); setPin(''); setError('') }}
                required
              >
                <option value="">Seleccioná tu nombre...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {ROLE_LABELS[u.role] || u.role}
                  </option>
                ))}
              </select>
            </div>

            {selected?.pin && (
              <div>
                <label>PIN</label>
                <input
                  className="input tracking-widest"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading || !selectedId}
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
