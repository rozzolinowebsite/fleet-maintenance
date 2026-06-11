'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type CurrentUser = { id: string; name: string; role: string }
const UserCtx = createContext<{ user: CurrentUser | null; refresh: () => void }>({
  user: null,
  refresh: () => {},
})
export const useUser = () => useContext(UserCtx)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)

  const refresh = useCallback(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return <UserCtx.Provider value={{ user, refresh }}>{children}</UserCtx.Provider>
}
