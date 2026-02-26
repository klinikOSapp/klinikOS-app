// ============================================
// Shared types for roles & permissions configuration
// Used by ConfigurationContext and RolesPermissionsPage
// ============================================

export type ConfigRole = {
  id: string
  nombre: string
  usuariosAsignados: number
  permisos: string[] // Array of ConfigPermission IDs assigned to this role
}

export type ConfigPermission = {
  id: string
  nombre: string
  descripcion: string
  modulo: string
  activo: boolean
}
