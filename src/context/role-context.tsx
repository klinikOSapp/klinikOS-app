'use client'

import React from 'react'

// Keep old types for backwards compatibility
export type UserRole = 'gerencia' | 'recepcion' | 'doctor' | 'higienista' | null

// New permission types
export type ModulePermissions = {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  custom?: Record<string, unknown>
}

export type AllPermissions = {
  patients?: ModulePermissions
  appointments?: ModulePermissions
  clinical_notes?: ModulePermissions
  invoices?: ModulePermissions
  payments?: ModulePermissions
  staff?: ModulePermissions
  settings?: ModulePermissions
  reports?: ModulePermissions
  expenses?: ModulePermissions
  calls?: ModulePermissions
  leads?: ModulePermissions
}

export type RoleContextValue = {
  // Legacy (for backwards compatibility)
  role: UserRole
  canViewFinancials: boolean
  canManageAppointments: boolean
  canAssignStaff: boolean
  
  // New permission-based
  roleId: number | null
  roleName: string | null
  roleDisplayName: string | null
  isSystemRole: boolean
  permissions: AllPermissions
  
  // Helper functions
  can: (module: keyof AllPermissions, action: keyof ModulePermissions) => boolean
  isLoading: boolean
}

const defaultPermissions: AllPermissions = {}

const defaultValue: RoleContextValue = {
  role: null,
  canViewFinancials: false,
  canManageAppointments: false,
  canAssignStaff: false,
  roleId: null,
  roleName: null,
  roleDisplayName: null,
  isSystemRole: false,
  permissions: defaultPermissions,
  can: () => false,
  isLoading: true
}

export const RoleContext = React.createContext<RoleContextValue>(defaultValue)

export function useUserRole() {
  return React.useContext(RoleContext)
}

// New hook for permission checks
export function usePermission(module: keyof AllPermissions, action: keyof ModulePermissions) {
  const { can } = useUserRole()
  return can(module, action)
}
