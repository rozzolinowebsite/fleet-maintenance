import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { UserProvider } from '@/components/UserProvider'

export const metadata: Metadata = {
  title: 'Fleet Maintenance',
  description: 'Sistema de mantenimiento de flota vehicular',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <div className="flex h-screen bg-slate-950 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
              <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  )
}
