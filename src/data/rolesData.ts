import type { ConfigPermission, ConfigRole } from '@/types/configRoles'

export const initialRoles: ConfigRole[] = [
  {
    id: 'r1',
    nombre: 'Doctor',
    usuariosAsignados: 32,
    permisos: ['p1', 'p2', 'p3', 'p4', 'p5'] // Pacientes, historial, citas, agenda, facturación
  },
  {
    id: 'r2',
    nombre: 'Administrativo',
    usuariosAsignados: 4,
    permisos: ['p1', 'p3', 'p4', 'p5', 'p6'] // Pacientes, citas, agenda, facturación, caja
  },
  {
    id: 'r3',
    nombre: 'Higienista',
    usuariosAsignados: 8,
    permisos: ['p2', 'p4'] // Historial clínico, ver agenda
  },
  {
    id: 'r4',
    nombre: 'Auxiliar',
    usuariosAsignados: 2,
    permisos: ['p4'] // Solo ver agenda
  }
]

export const initialPermissions: ConfigPermission[] = [
  {
    id: 'p1',
    nombre: 'Gestión de pacientes',
    descripcion: 'Crear, editar y eliminar pacientes',
    modulo: 'Pacientes',
    activo: true
  },
  {
    id: 'p2',
    nombre: 'Ver historial clínico',
    descripcion: 'Acceso a historiales clínicos de pacientes',
    modulo: 'Pacientes',
    activo: true
  },
  {
    id: 'p3',
    nombre: 'Gestión de citas',
    descripcion: 'Crear, modificar y cancelar citas',
    modulo: 'Agenda',
    activo: true
  },
  {
    id: 'p4',
    nombre: 'Ver agenda',
    descripcion: 'Visualizar la agenda de citas',
    modulo: 'Agenda',
    activo: true
  },
  {
    id: 'p5',
    nombre: 'Gestión de facturación',
    descripcion: 'Crear y gestionar facturas',
    modulo: 'Facturación',
    activo: true
  },
  {
    id: 'p6',
    nombre: 'Acceso a caja',
    descripcion: 'Gestionar movimientos de caja',
    modulo: 'Caja',
    activo: false
  },
  {
    id: 'p7',
    nombre: 'Configuración',
    descripcion: 'Acceso a configuración del sistema',
    modulo: 'Sistema',
    activo: false
  },
  {
    id: 'p8',
    nombre: 'Gestión de usuarios',
    descripcion: 'Crear y gestionar usuarios del sistema',
    modulo: 'Sistema',
    activo: false
  }
]
