'use client'

import React from 'react'

// Keep old types for backwards compatibility
export type UserRole = 'gerencia' | 'recepcion' | 'doctor' | 'higienista' | null

// New permission types
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

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
  cash?: ModulePermissions
  cash_closings?: ModulePermissions
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
  can: (module: keyof AllPermissions, action: PermissionAction) => boolean
  isLoading: boolean
}

const ALL_PERMS: ModulePermissions = { view: true, create: true, edit: true, delete: true }
const VIEW_ONLY: ModulePermissions = { view: true, create: false, edit: false, delete: false }
const NO_PERMS: ModulePermissions = { view: false, create: false, edit: false, delete: false }

/**
 * Hardcoded permissions for the 3 klinikOS roles.
 * - gerencia: full access
 * - administracion (maps from DB 'recepcion'): everything except settings & reports
 * - doctor (maps from DB 'doctor', 'higienista', 'externo'): patients, appointments, clinical_notes
 */
export const ROLE_PERMISSIONS: Record<string, AllPermissions> = {
  gerencia: {
    patients: ALL_PERMS,
    appointments: ALL_PERMS,
    clinical_notes: ALL_PERMS,
    invoices: ALL_PERMS,
    payments: ALL_PERMS,
    cash: ALL_PERMS,
    cash_closings: ALL_PERMS,
    staff: ALL_PERMS,
    settings: ALL_PERMS,
    reports: ALL_PERMS,
    expenses: ALL_PERMS,
    calls: ALL_PERMS,
    leads: ALL_PERMS
  },
  administracion: {
    patients: ALL_PERMS,
    appointments: ALL_PERMS,
    clinical_notes: ALL_PERMS,
    invoices: ALL_PERMS,
    payments: ALL_PERMS,
    cash: ALL_PERMS,
    cash_closings: ALL_PERMS,
    staff: ALL_PERMS,
    settings: NO_PERMS,
    reports: NO_PERMS,
    expenses: ALL_PERMS,
    calls: ALL_PERMS,
    leads: ALL_PERMS
  },
  doctor: {
    patients: { view: true, create: false, edit: true, delete: false },
    appointments: { view: true, create: false, edit: false, delete: false },
    clinical_notes: ALL_PERMS,
    invoices: NO_PERMS,
    payments: NO_PERMS,
    cash: NO_PERMS,
    cash_closings: NO_PERMS,
    staff: VIEW_ONLY,
    settings: NO_PERMS,
    reports: NO_PERMS,
    expenses: NO_PERMS,
    calls: NO_PERMS,
    leads: NO_PERMS
  }
}

/** Map DB role slugs to the 3 canonical role keys */
const ROLE_SLUG_MAP: Record<string, string> = {
  gerencia: 'gerencia',
  recepcion: 'administracion',
  doctor: 'doctor',
  higienista: 'doctor',
  externo: 'doctor'
}

export function getPermissionsForRole(roleName: string | null): AllPermissions {
  if (!roleName) return {}
  const canonical = ROLE_SLUG_MAP[roleName] || roleName
  return ROLE_PERMISSIONS[canonical] || {}
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
export function usePermission(module: keyof AllPermissions, action: PermissionAction) {
  const { can } = useUserRole()
  return can(module, action)
}
