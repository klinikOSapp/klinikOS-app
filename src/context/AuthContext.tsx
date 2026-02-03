'use client'

import { createContext, ReactNode, useContext, useMemo } from 'react'

// ============================================
// TIPOS PARA AUTENTICACIÓN
// ============================================

export type UserRole =
  | 'gerencia'
  | 'administracion'
  | 'doctor'
  | 'recepcion'
  | 'higienista'
  | 'auxiliar'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  accessibleClinicIds: string[] // Clínicas a las que tiene acceso
  avatarUrl?: string
}

// ============================================
// MOCK DATA
// ============================================

// Mock user: Gerente con acceso a las 3 clínicas
const mockUser: AuthUser = {
  id: 'user-1',
  name: 'Vicente Morales',
  email: 'vicente@morales.es',
  role: 'gerencia',
  accessibleClinicIds: ['clinic-1', 'clinic-2', 'clinic-3'],
  avatarUrl: undefined
}

// ============================================
// CONTEXT TYPE
// ============================================

type AuthContextType = {
  // User data
  user: AuthUser | null
  isAuthenticated: boolean

  // Role helpers
  isGerente: boolean
  isAdmin: boolean
  isDoctor: boolean
  isRecepcion: boolean

  // Clinic access helpers
  canSwitchClinic: boolean // gerente + más de 1 clínica accesible
  accessibleClinicIds: string[]
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // In production, this would come from Supabase Auth or similar
  // For now, we use mock data
  const user = mockUser

  // Derived state
  const isAuthenticated = user !== null
  const isGerente = user?.role === 'gerencia'
  const isAdmin = user?.role === 'administracion'
  const isDoctor = user?.role === 'doctor'
  const isRecepcion = user?.role === 'recepcion'

  const accessibleClinicIds = user?.accessibleClinicIds ?? []

  // Can switch clinic if user is gerente AND has access to more than 1 clinic
  const canSwitchClinic = isGerente && accessibleClinicIds.length > 1

  // ====== CONTEXT VALUE ======
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isGerente,
      isAdmin,
      isDoctor,
      isRecepcion,
      canSwitchClinic,
      accessibleClinicIds
    }),
    [
      user,
      isAuthenticated,
      isGerente,
      isAdmin,
      isDoctor,
      isRecepcion,
      canSwitchClinic,
      accessibleClinicIds
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
