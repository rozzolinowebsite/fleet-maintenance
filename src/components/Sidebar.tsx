'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Car, Plus, Users, FileText, LogOut, Menu, X, FlaskConical, Boxes, UserCog } from 'lucide-react'
import { useUser } from './UserProvider'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/vehicles', label: 'Vehículos', icon: Car, exact: false },
  { href: '/trailers', label: 'Acoplados', icon: Boxes, exact: false },
  { href: '/drivers', label: 'Conductores', icon: UserCog, exact: false },
  { href: '/reports/weekly-review', label: 'Reporte semanal', icon: FileText, exact: false },
  { href: '/usuarios', label: 'Usuarios', icon: Users, exact: false },
  { href: '/dev', label: 'Desarrollo', icon: FlaskConical, exact: false },
]

const ROLE_LABELS: Record<string, string> = {
  driver: 'Conductor',
  mechanic: 'Mecánico',
  admin: 'Administrador',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, refresh } = useUser()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    refresh()
    router.push('/login')
  }

  function close() { setOpen(false) }

  const sidebarContent = (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64
      md:static md:w-60 md:z-auto md:translate-x-0
      bg-slate-900 border-r border-slate-800 flex flex-col shrink-0
      transition-transform duration-200
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Car size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">FleetMaint</p>
            <p className="text-slate-500 text-xs">Gestión de flota</p>
          </div>
          <button onClick={close} className="md:hidden text-slate-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/vehicles/new"
          onClick={close}
          className="flex items-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Agregar vehículo
        </Link>

        {user && (
          <div className="flex items-center justify-between px-3 py-2">
            <Link href="/perfil" onClick={close} className="min-w-0 hover:opacity-80 transition-opacity">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-slate-500 text-xs">{ROLE_LABELS[user.role] || user.role}</p>
            </Link>
            <button onClick={logout} className="text-slate-600 hover:text-red-400 transition-colors ml-2 shrink-0" title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-slate-400 hover:text-white p-1 -ml-1"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">FleetMaint</span>
        </div>
        {user && (
          <span className="ml-auto text-xs text-slate-500 truncate max-w-[120px]">{user.name}</span>
        )}
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      )}

      {sidebarContent}
    </>
  )
}
