import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { apiClient } from '../services/apiClient'

export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'MEMBER_ADMIN' | 'TREASURER'
export interface AuthUser { id: string; email: string; name: string; role: AdminRole }
interface AuthState { currentUser: AuthUser | null; isAuthenticated: boolean; isLoading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; refreshUser: () => Promise<void> }
const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null); const [isLoading, setIsLoading] = useState(true)
  const refreshUser = useCallback(async () => { try { const { data } = await apiClient.get<AuthUser>('/auth/me'); setCurrentUser(data) } catch { setCurrentUser(null) } finally { setIsLoading(false) } }, [])
  useEffect(() => { void refreshUser(); const clear = () => setCurrentUser(null); window.addEventListener('church:unauthenticated', clear); return () => window.removeEventListener('church:unauthenticated', clear) }, [refreshUser])
  const login = useCallback(async (email: string, password: string) => { const { data } = await apiClient.post<AuthUser>('/auth/login', { email, password }); setCurrentUser(data) }, [])
  const logout = useCallback(async () => { try { await apiClient.post('/auth/logout') } finally { setCurrentUser(null) } }, [])
  const value = useMemo(() => ({ currentUser, isAuthenticated: currentUser !== null, isLoading, login, logout, refreshUser }), [currentUser, isLoading, login, logout, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
