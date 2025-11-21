'use client'

import React from 'react'

export type UserRole = 'gerencia' | 'recepcion' | 'doctor' | 'higienista' | null

export type RoleContextValue = {
  role: UserRole
  canViewFinancials: boolean
  canManageAppointments: boolean
  canAssignStaff: boolean
}

const defaultValue: RoleContextValue = {
  role: null,
  canViewFinancials: false,
  canManageAppointments: false,
  canAssignStaff: false
}

export const RoleContext = React.createContext<RoleContextValue>(defaultValue)

export function useUserRole() {
  return React.useContext(RoleContext)
}

