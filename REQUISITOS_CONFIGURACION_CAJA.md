# REQUISITOS DE CONFIGURACIÓN PARA LA PANTALLA DE CAJA
## KlinikOS - Documento de Análisis Técnico

**Fecha:** 1 de Diciembre 2025
**Versión:** 1.0
**Autor:** Análisis técnico del sistema klinikOS

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de la Pantalla de Caja](#análisis-de-la-pantalla-de-caja)
3. [Entidades Configurables Requeridas](#entidades-configurables-requeridas)
4. [Arquitectura de Configuración Necesaria](#arquitectura-de-configuración-necesaria)
5. [Esquema de Base de Datos](#esquema-de-base-de-datos)
6. [Endpoints API Requeridos](#endpoints-api-requeridos)
7. [Interfaces TypeScript](#interfaces-typescript)
8. [Componentes de UI Necesarios](#componentes-de-ui-necesarios)
9. [Flujo de Datos](#flujo-de-datos)
10. [Plan de Implementación](#plan-de-implementación)

---

## 1. RESUMEN EJECUTIVO

### Estado Actual del Sistema
El sistema klinikOS actualmente **NO tiene implementado un sistema de configuración**. Todas las opciones configurables están **hardcodeadas** en los componentes de React, distribuidas en múltiples archivos sin centralización.

### Impacto en la Pantalla de Caja
La pantalla de Caja (Dashboard de Ingresos) que se muestra en el diseño de Figma requiere:
- **Métodos de pago configurables**
- **Estados de transacciones**
- **Tipos de servicios/tratamientos**
- **Aseguradoras**
- **Filtros personalizables**
- **Objetivos financieros**
- **Categorías de ingresos**

### Recomendación Crítica
**ANTES** de implementar la pantalla de Caja, es **IMPRESCINDIBLE** crear un sistema de configuración centralizado que permita:
1. Gestionar dinámicamente todos los valores configurables
2. Evitar duplicación de código
3. Facilitar mantenimiento futuro
4. Permitir personalización por clínica/usuario
5. Escalar el sistema sin modificar código

---

## 2. ANÁLISIS DE LA PANTALLA DE CAJA

### 2.1. Elementos Visuales Identificados

#### **A. Sección de Resumen Superior (Cards)**
1. **Card "Producido"**
   - Valor: 1.200 €
   - Estado: "Producido"
   - Avatar: Usuario "V"
   - Indicador temporal: "Hoy"
   - Tendencia: +12% (verde)
   - **Configurables:** Tipos de producción, usuarios

2. **Card "Facturado"**
   - Valor: 1.200 €
   - Estado: "Facturado"
   - Avatar: Usuario "V"
   - Indicador temporal: "Hoy"
   - Tendencia: +12% (verde)
   - **Configurables:** Estados de facturación

3. **Card "Cobrado"**
   - Valor: 1.200 €
   - Estado: "Cobrado"
   - Indicador temporal: "Hoy"
   - Indicador de checked
   - Tendencia: +12% (verde)
   - **Configurables:** Estados de cobro

4. **Card "Por cobrar"**
   - Valor: -1.200 €
   - Estado: "Por cobrar"
   - Avatar: Usuario "V"
   - Indicador temporal: "Hoy"
   - Indicador de cuenta pendiente
   - Tendencia: +12% (verde)
   - **Configurables:** Estados pendientes

#### **B. Gráficos Centrales**

**Gráfico Semicircular (Gauge Chart)**
- Valor central: 1.200 € (de 1.800 €)
- Avatar del usuario "V"
- Representación visual de progreso
- **Configurables:**
  - Objetivos financieros (1.800 €)
  - Usuarios asignados
  - Periodos de medición

**Gráfico Lineal (Line Chart)**
- Título: "Ingresos"
- Año: 2024 (dropdown)
- Facturado: 38.000 € (texto teal)
- Objetivo: 14.000 €
- Eje X: Horas del día (9:00 - 16:00)
- Eje Y: Valores de ingresos (10K - 50K)
- Curva de progreso acumulado
- **Configurables:**
  - Periodos temporales (años)
  - Objetivos personalizados
  - Rangos de visualización

#### **C. Filtros Superiores (Pills)**
```
🔍 [Todos] [Efectivo] [TPV] [Financiación]
```
- **Configurables:**
  - Métodos de pago/cobro
  - Tipos de filtros adicionales

#### **D. Tabla de Transacciones**

**Columnas:**
1. **Hora** - 09:00, 09:30, 10:00, etc.
2. **Paciente** - Nombres completos
3. **Concepto** - Tipo de tratamiento/servicio
4. **Cantidad** - Importe en euros
5. **Estado** - Aceptado/Enviado/Pendiente (badges de colores)
6. **Producido** - Checkbox + badge "Hecho"/"Pendiente"
7. **Método** - Financiado/TPV/Efectivo/Tarjeta de crédito/etc.
8. **Aseguradora** - Adeslas/Sanitas/DKV/etc.
9. **Acciones** - Menú de tres puntos

**Datos de Ejemplo Identificados:**

| Hora | Paciente | Concepto | Cantidad | Estado | Producido | Método | Aseguradora |
|------|----------|----------|----------|--------|-----------|--------|-------------|
| 09:00 | Carlos Martínez Pérez | Operación mandíbula | 2.300 € | Aceptado | ✓ Hecho | Financiado | Adeslas |
| 09:30 | Nacho Nieto Iniesta | Consulta inicial | 150 € | Aceptado | ✓ Hecho | TPV | Sanitas |
| 10:00 | Sofía Rodríguez López | Radiografía | 100 € | Enviado | ⬜ Pendiente | Efectivo | Sanitas |
| 10:30 | Elena García Santos | Extracción de muela | 500 € | Aceptado | ⬜ Pendiente | Tarjeta de crédito | DKV |
| 11:00 | Javier Fernández Torres | Implante dental | 1.200 € | Aceptado | ✓ Hecho | Transferencia bancaria | Adelas |
| 11:30 | Lucía Pérez Gómez | Férula de descarga | 300 € | Enviado | ✓ Hecho | Billetera digital | Sanitas |
| 12:00 | Andrés Jiménez Ortega | Tratamiento de ortodoncia | 1.800 € | Aceptado | ⬜ Pendiente | Criptomonedas | DKV |
| 12:30 | María del Mar Ruiz | Consulta de seguimiento | 100 € | Enviado | ⬜ Pendiente | Cheque | Sanitas |
| 13:00 | Pablo Sánchez Delgado | Blanqueamiento dental | 400 € | Enviado | ⬜ Pendiente | Pago a plazos | Sanitas |

### 2.2. Entidades Configurables Detectadas

#### **CRÍTICAS** (Imprescindibles para funcionar)
1. ✅ **Métodos de Pago/Cobro**
2. ✅ **Estados de Transacción**
3. ✅ **Aseguradoras**
4. ✅ **Tipos de Tratamientos/Servicios**
5. ✅ **Usuarios/Profesionales**

#### **IMPORTANTES** (Para funcionalidad completa)
6. ✅ **Estados de Producción**
7. ✅ **Objetivos Financieros**
8. ✅ **Periodos Temporales**
9. ✅ **Categorías de Ingresos**

#### **OPCIONALES** (Mejoras futuras)
10. ⚪ Tipos de notificaciones
11. ⚪ Reglas de alertas automáticas
12. ⚪ Plantillas de conceptos frecuentes

---

## 3. ENTIDADES CONFIGURABLES REQUERIDAS

### 3.1. Métodos de Pago/Cobro

**Estado Actual:** Hardcodeados en `AddPatientStepAdministrativo.tsx:227-248`

**Valores Actuales:**
```typescript
const currentPaymentMethods = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'Bizum'
]
```

**Valores Detectados en la Pantalla de Caja:**
```typescript
const cajaPantalla = [
  'Efectivo',
  'TPV',
  'Financiado',
  'Transferencia bancaria',
  'Tarjeta de crédito',
  'Billetera digital',
  'Criptomonedas',
  'Cheque',
  'Pago a plazos'
]
```

**⚠️ DISCREPANCIA DETECTADA:** Los métodos de pago en la pantalla de Caja NO coinciden con los métodos configurados en el formulario de pacientes.

**Estructura de Datos Necesaria:**
```typescript
interface PaymentMethod {
  id: string                    // UUID único
  name: string                  // Nombre visible
  code: string                  // Código interno (efectivo, tpv, etc.)
  enabled: boolean              // Si está activo
  requiresAuthorization: boolean // Si requiere autorización
  category: 'physical' | 'digital' | 'deferred' // Categoría
  icon?: string                 // Icono opcional
  color?: string                // Color para UI
  order: number                 // Orden de visualización
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados para Implementar:**
```typescript
const recommendedPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    name: 'Efectivo',
    code: 'efectivo',
    enabled: true,
    requiresAuthorization: false,
    category: 'physical',
    icon: 'cash',
    color: '#10b981',
    order: 1
  },
  {
    id: '2',
    name: 'TPV / Tarjeta',
    code: 'tpv',
    enabled: true,
    requiresAuthorization: false,
    category: 'physical',
    icon: 'credit-card',
    color: '#3b82f6',
    order: 2
  },
  {
    id: '3',
    name: 'Transferencia bancaria',
    code: 'transferencia',
    enabled: true,
    requiresAuthorization: true,
    category: 'digital',
    icon: 'bank',
    color: '#8b5cf6',
    order: 3
  },
  {
    id: '4',
    name: 'Bizum',
    code: 'bizum',
    enabled: true,
    requiresAuthorization: false,
    category: 'digital',
    icon: 'smartphone',
    color: '#06b6d4',
    order: 4
  },
  {
    id: '5',
    name: 'Financiado',
    code: 'financiado',
    enabled: true,
    requiresAuthorization: true,
    category: 'deferred',
    icon: 'calendar',
    color: '#f59e0b',
    order: 5
  },
  {
    id: '6',
    name: 'Billetera digital',
    code: 'wallet',
    enabled: true,
    requiresAuthorization: false,
    category: 'digital',
    icon: 'wallet',
    color: '#ec4899',
    order: 6
  },
  {
    id: '7',
    name: 'Cheque',
    code: 'cheque',
    enabled: false, // Poco común en España
    requiresAuthorization: true,
    category: 'physical',
    icon: 'file-text',
    color: '#64748b',
    order: 7
  },
  {
    id: '8',
    name: 'Criptomonedas',
    code: 'crypto',
    enabled: false, // Experimental
    requiresAuthorization: true,
    category: 'digital',
    icon: 'bitcoin',
    color: '#f97316',
    order: 8
  },
  {
    id: '9',
    name: 'Pago a plazos',
    code: 'plazos',
    enabled: true,
    requiresAuthorization: true,
    category: 'deferred',
    icon: 'layers',
    color: '#14b8a6',
    order: 9
  }
]
```

### 3.2. Estados de Transacción

**Valores Detectados en Pantalla:**
```typescript
const transactionStates = [
  'Aceptado',
  'Enviado',
  'Pendiente'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface TransactionState {
  id: string
  name: string                  // Nombre visible
  code: string                  // Código interno
  type: 'success' | 'warning' | 'pending' | 'error'
  color: string                 // Color del badge
  icon?: string
  allowsModification: boolean   // Si se puede editar la transacción
  isTerminal: boolean          // Si es un estado final
  order: number
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedTransactionStates: TransactionState[] = [
  {
    id: '1',
    name: 'Pendiente',
    code: 'pendiente',
    type: 'pending',
    color: '#94a3b8', // gris
    icon: 'clock',
    allowsModification: true,
    isTerminal: false,
    order: 1
  },
  {
    id: '2',
    name: 'Enviado',
    code: 'enviado',
    type: 'warning',
    color: '#fbbf24', // amarillo
    icon: 'send',
    allowsModification: true,
    isTerminal: false,
    order: 2
  },
  {
    id: '3',
    name: 'Aceptado',
    code: 'aceptado',
    type: 'success',
    color: '#10b981', // verde
    icon: 'check-circle',
    allowsModification: false,
    isTerminal: true,
    order: 3
  },
  {
    id: '4',
    name: 'Rechazado',
    code: 'rechazado',
    type: 'error',
    color: '#ef4444', // rojo
    icon: 'x-circle',
    allowsModification: true,
    isTerminal: true,
    order: 4
  },
  {
    id: '5',
    name: 'Cancelado',
    code: 'cancelado',
    type: 'error',
    color: '#dc2626',
    icon: 'ban',
    allowsModification: false,
    isTerminal: true,
    order: 5
  }
]
```

### 3.3. Estados de Producción

**Valores Detectados:**
```typescript
const productionStates = [
  'Hecho',
  'Pendiente'
]
```

**Estructura de Datos:**
```typescript
interface ProductionState {
  id: string
  name: string
  code: string
  checked: boolean              // Si muestra checkbox
  badgeColor: string           // Color del badge
  icon?: string
  order: number
}
```

**Valores Recomendados:**
```typescript
const recommendedProductionStates: ProductionState[] = [
  {
    id: '1',
    name: 'Pendiente',
    code: 'pendiente',
    checked: false,
    badgeColor: '#94a3b8',
    icon: 'circle',
    order: 1
  },
  {
    id: '2',
    name: 'Hecho',
    code: 'hecho',
    checked: true,
    badgeColor: '#10b981',
    icon: 'check-circle',
    order: 2
  },
  {
    id: '3',
    name: 'En proceso',
    code: 'en_proceso',
    checked: false,
    badgeColor: '#fbbf24',
    icon: 'refresh-cw',
    order: 3
  }
]
```

### 3.4. Aseguradoras

**Estado Actual:** Hardcodeadas en `AddPatientStepAdministrativo.tsx:118-128`

**Valores Actuales:**
```typescript
const currentInsuranceTypes = [
  'Seguro privado',
  'Seguridad Social',
  'Sin cobertura',
  'Mutua'
]
```

**Valores Detectados en Pantalla de Caja:**
```typescript
const insuranceProviders = [
  'Adeslas',
  'Sanitas',
  'DKV'
]
```

**⚠️ DISCREPANCIA CRÍTICA:** El formulario de pacientes solo registra **tipo genérico** de cobertura, pero la pantalla de Caja muestra **aseguradoras específicas**.

**Estructura de Datos Necesaria:**
```typescript
interface InsuranceProvider {
  id: string
  name: string                  // Nombre comercial
  code: string                  // Código interno
  type: 'private' | 'public' | 'mutual' | 'none'
  enabled: boolean
  logo?: string                 // URL del logo
  color?: string                // Color corporativo
  contactEmail?: string
  contactPhone?: string
  claimsEmail?: string          // Email para facturación
  coveragePercentage?: number   // % de cobertura por defecto
  requiresPreAuthorization: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedInsuranceProviders: InsuranceProvider[] = [
  {
    id: '1',
    name: 'Sin seguro',
    code: 'ninguno',
    type: 'none',
    enabled: true,
    coveragePercentage: 0,
    requiresPreAuthorization: false,
    order: 1
  },
  {
    id: '2',
    name: 'Seguridad Social',
    code: 'ss',
    type: 'public',
    enabled: true,
    coveragePercentage: 100,
    requiresPreAuthorization: true,
    order: 2
  },
  {
    id: '3',
    name: 'Adeslas',
    code: 'adeslas',
    type: 'private',
    enabled: true,
    logo: '/logos/adeslas.png',
    color: '#00A0DF',
    contactPhone: '900 322 500',
    claimsEmail: 'facturacion@adeslas.es',
    coveragePercentage: 80,
    requiresPreAuthorization: true,
    order: 3
  },
  {
    id: '4',
    name: 'Sanitas',
    code: 'sanitas',
    type: 'private',
    enabled: true,
    logo: '/logos/sanitas.png',
    color: '#00B5E2',
    contactPhone: '902 102 400',
    claimsEmail: 'facturacion@sanitas.es',
    coveragePercentage: 80,
    requiresPreAuthorization: true,
    order: 4
  },
  {
    id: '5',
    name: 'DKV',
    code: 'dkv',
    type: 'private',
    enabled: true,
    logo: '/logos/dkv.png',
    color: '#005596',
    contactPhone: '902 499 001',
    claimsEmail: 'facturacion@dkv.es',
    coveragePercentage: 75,
    requiresPreAuthorization: true,
    order: 5
  },
  {
    id: '6',
    name: 'Asisa',
    code: 'asisa',
    type: 'private',
    enabled: true,
    logo: '/logos/asisa.png',
    color: '#ED1C24',
    contactPhone: '900 900 118',
    claimsEmail: 'facturacion@asisa.es',
    coveragePercentage: 80,
    requiresPreAuthorization: true,
    order: 6
  },
  {
    id: '7',
    name: 'Mapfre',
    code: 'mapfre',
    type: 'private',
    enabled: true,
    logo: '/logos/mapfre.png',
    color: '#CE0E2D',
    contactPhone: '902 456 789',
    claimsEmail: 'facturacion@mapfre.es',
    coveragePercentage: 75,
    requiresPreAuthorization: true,
    order: 7
  },
  {
    id: '8',
    name: 'Mutua',
    code: 'mutua',
    type: 'mutual',
    enabled: true,
    coveragePercentage: 100,
    requiresPreAuthorization: false,
    order: 8
  }
]
```

### 3.5. Tipos de Tratamientos/Servicios

**Valores Detectados en Pantalla:**
```typescript
const treatments = [
  'Operación mandíbula',
  'Consulta inicial',
  'Radiografía',
  'Extracción de muela',
  'Implante dental',
  'Férula de descarga',
  'Tratamiento de ortodoncia',
  'Consulta de seguimiento',
  'Blanqueamiento dental'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface TreatmentType {
  id: string
  name: string                  // Nombre del tratamiento
  code: string                  // Código interno
  category: string              // Categoría (ej: 'cirugia', 'consulta', 'diagnostico')
  basePrice: number            // Precio base en euros
  durationMinutes: number      // Duración estimada
  requiresRoom: boolean        // Si requiere sala específica
  requiresEquipment: string[]  // IDs de equipamiento necesario
  coveredByInsurance: boolean  // Si suele estar cubierto por seguros
  enabled: boolean
  description?: string
  icon?: string
  color?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

interface TreatmentCategory {
  id: string
  name: string
  code: string
  color: string
  icon?: string
  order: number
}
```

**Valores Recomendados - Categorías:**
```typescript
const treatmentCategories: TreatmentCategory[] = [
  { id: '1', name: 'Consulta', code: 'consulta', color: '#3b82f6', icon: 'stethoscope', order: 1 },
  { id: '2', name: 'Diagnóstico', code: 'diagnostico', color: '#8b5cf6', icon: 'activity', order: 2 },
  { id: '3', name: 'Cirugía', code: 'cirugia', color: '#ef4444', icon: 'scissors', order: 3 },
  { id: '4', name: 'Ortodoncia', code: 'ortodoncia', color: '#10b981', icon: 'grid', order: 4 },
  { id: '5', name: 'Estética', code: 'estetica', color: '#f59e0b', icon: 'star', order: 5 },
  { id: '6', name: 'Prevención', code: 'prevencion', color: '#06b6d4', icon: 'shield', order: 6 },
  { id: '7', name: 'Endodoncia', code: 'endodoncia', color: '#ec4899', icon: 'layers', order: 7 },
  { id: '8', name: 'Periodoncia', code: 'periodoncia', color: '#14b8a6', icon: 'heart', order: 8 }
]
```

**Valores Recomendados - Tratamientos:**
```typescript
const recommendedTreatments: TreatmentType[] = [
  {
    id: '1',
    name: 'Consulta inicial',
    code: 'consulta_inicial',
    category: 'consulta',
    basePrice: 150,
    durationMinutes: 30,
    requiresRoom: true,
    requiresEquipment: [],
    coveredByInsurance: true,
    enabled: true,
    description: 'Primera consulta con el paciente',
    order: 1
  },
  {
    id: '2',
    name: 'Consulta de seguimiento',
    code: 'consulta_seguimiento',
    category: 'consulta',
    basePrice: 100,
    durationMinutes: 20,
    requiresRoom: true,
    requiresEquipment: [],
    coveredByInsurance: true,
    enabled: true,
    order: 2
  },
  {
    id: '3',
    name: 'Radiografía',
    code: 'radiografia',
    category: 'diagnostico',
    basePrice: 100,
    durationMinutes: 15,
    requiresRoom: true,
    requiresEquipment: ['rx-machine'],
    coveredByInsurance: true,
    enabled: true,
    order: 3
  },
  {
    id: '4',
    name: 'Extracción de muela',
    code: 'extraccion',
    category: 'cirugia',
    basePrice: 500,
    durationMinutes: 45,
    requiresRoom: true,
    requiresEquipment: ['surgical-kit'],
    coveredByInsurance: true,
    enabled: true,
    order: 4
  },
  {
    id: '5',
    name: 'Implante dental',
    code: 'implante',
    category: 'cirugia',
    basePrice: 1200,
    durationMinutes: 90,
    requiresRoom: true,
    requiresEquipment: ['surgical-kit', 'implant-kit'],
    coveredByInsurance: false,
    enabled: true,
    order: 5
  },
  {
    id: '6',
    name: 'Operación mandíbula',
    code: 'cirugia_mandibula',
    category: 'cirugia',
    basePrice: 2300,
    durationMinutes: 180,
    requiresRoom: true,
    requiresEquipment: ['surgical-kit', 'anesthesia'],
    coveredByInsurance: true,
    enabled: true,
    order: 6
  },
  {
    id: '7',
    name: 'Tratamiento de ortodoncia',
    code: 'ortodoncia',
    category: 'ortodoncia',
    basePrice: 1800,
    durationMinutes: 60,
    requiresRoom: true,
    requiresEquipment: ['ortho-kit'],
    coveredByInsurance: false,
    enabled: true,
    order: 7
  },
  {
    id: '8',
    name: 'Férula de descarga',
    code: 'ferula',
    category: 'prevencion',
    basePrice: 300,
    durationMinutes: 30,
    requiresRoom: false,
    requiresEquipment: [],
    coveredByInsurance: false,
    enabled: true,
    order: 8
  },
  {
    id: '9',
    name: 'Blanqueamiento dental',
    code: 'blanqueamiento',
    category: 'estetica',
    basePrice: 400,
    durationMinutes: 60,
    requiresRoom: true,
    requiresEquipment: ['whitening-kit'],
    coveredByInsurance: false,
    enabled: true,
    order: 9
  }
]
```

### 3.6. Usuarios/Profesionales

**Estado Actual:** Hardcodeados en `AddPatientStepAdministrativo.tsx:78-87`

**Valores Actuales:**
```typescript
const currentProfessionals = [
  'Dr. Juan Pérez',
  'Dra. María García',
  'Dr. Carlos López'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface Professional {
  id: string
  firstName: string
  lastName: string
  fullName: string              // Nombre completo generado
  title: 'Dr.' | 'Dra.' | 'Lic.' | string // Título profesional
  specialty: string             // Especialidad
  licenseNumber: string         // Número de colegiado
  email: string
  phone: string
  avatar?: string               // URL de la foto
  color?: string                // Color asignado para UI
  initials: string              // Iniciales para avatar (ej: "JP")
  role: 'dentist' | 'hygienist' | 'assistant' | 'admin'
  enabled: boolean
  schedule?: WeeklySchedule    // Horario semanal
  createdAt: Date
  updatedAt: Date
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface DaySchedule {
  enabled: boolean
  slots: TimeSlot[]
}

interface TimeSlot {
  start: string   // "09:00"
  end: string     // "14:00"
}
```

**Valores Recomendados:**
```typescript
const recommendedProfessionals: Professional[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Dr. Juan Pérez',
    title: 'Dr.',
    specialty: 'Cirugía Oral',
    licenseNumber: '28123456',
    email: 'juan.perez@klinikos.com',
    phone: '+34 600 123 456',
    avatar: '/avatars/juan-perez.jpg',
    color: '#3b82f6',
    initials: 'JP',
    role: 'dentist',
    enabled: true,
    order: 1
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'García',
    fullName: 'Dra. María García',
    title: 'Dra.',
    specialty: 'Ortodoncia',
    licenseNumber: '28234567',
    email: 'maria.garcia@klinikos.com',
    phone: '+34 600 234 567',
    avatar: '/avatars/maria-garcia.jpg',
    color: '#10b981',
    initials: 'MG',
    role: 'dentist',
    enabled: true,
    order: 2
  },
  {
    id: '3',
    firstName: 'Carlos',
    lastName: 'López',
    fullName: 'Dr. Carlos López',
    title: 'Dr.',
    specialty: 'Endodoncia',
    licenseNumber: '28345678',
    email: 'carlos.lopez@klinikos.com',
    phone: '+34 600 345 678',
    avatar: '/avatars/carlos-lopez.jpg',
    color: '#f59e0b',
    initials: 'CL',
    role: 'dentist',
    enabled: true,
    order: 3
  }
]
```

### 3.7. Objetivos Financieros

**Valores Detectados en Gráficos:**
```typescript
const financialGoals = {
  dailyGoal: 1800,      // Objetivo del gráfico circular
  yearlyGoal: 14000,    // Objetivo del gráfico lineal
  currentDaily: 1200,
  currentYearly: 38000  // Facturado actual
}
```

**Estructura de Datos Necesaria:**
```typescript
interface FinancialGoal {
  id: string
  name: string                  // Nombre descriptivo
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  targetAmount: number         // Cantidad objetivo
  startDate: Date
  endDate: Date
  assignedTo?: string[]        // IDs de profesionales asignados
  category?: string            // Categoría de ingreso
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedFinancialGoals: FinancialGoal[] = [
  {
    id: '1',
    name: 'Objetivo Diario',
    type: 'daily',
    targetAmount: 1800,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    enabled: true
  },
  {
    id: '2',
    name: 'Objetivo Mensual',
    type: 'monthly',
    targetAmount: 40000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    enabled: true
  },
  {
    id: '3',
    name: 'Objetivo Anual 2024',
    type: 'yearly',
    targetAmount: 480000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    enabled: true
  }
]
```

### 3.8. Categorías de Ingresos

**Valores Detectados en `IncomeTypes.tsx`:**
```typescript
const incomeCategories = [
  'Efectivo',
  'Tarjeta/TPV',
  'Financiación'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface IncomeCategory {
  id: string
  name: string
  code: string
  color: string
  icon?: string
  description?: string
  relatedPaymentMethods: string[] // IDs de métodos de pago relacionados
  order: number
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedIncomeCategories: IncomeCategory[] = [
  {
    id: '1',
    name: 'Efectivo',
    code: 'efectivo',
    color: '#10b981',
    icon: 'cash',
    description: 'Pagos en efectivo',
    relatedPaymentMethods: ['efectivo'],
    order: 1
  },
  {
    id: '2',
    name: 'Tarjeta/TPV',
    code: 'tarjeta',
    color: '#3b82f6',
    icon: 'credit-card',
    description: 'Pagos con tarjeta de crédito/débito',
    relatedPaymentMethods: ['tpv', 'tarjeta'],
    order: 2
  },
  {
    id: '3',
    name: 'Financiación',
    code: 'financiacion',
    color: '#f59e0b',
    icon: 'trending-up',
    description: 'Pagos financiados o a plazos',
    relatedPaymentMethods: ['financiado', 'plazos'],
    order: 3
  },
  {
    id: '4',
    name: 'Digital',
    code: 'digital',
    color: '#8b5cf6',
    icon: 'smartphone',
    description: 'Pagos digitales (Bizum, wallets, etc.)',
    relatedPaymentMethods: ['bizum', 'wallet'],
    order: 4
  },
  {
    id: '5',
    name: 'Transferencias',
    code: 'transferencias',
    color: '#06b6d4',
    icon: 'send',
    description: 'Transferencias bancarias',
    relatedPaymentMethods: ['transferencia'],
    order: 5
  }
]
```

### 3.9. Opciones de Financiación

**Estado Actual:** Hardcodeadas en `AddPatientStepAdministrativo.tsx:250-258`

**Valores Actuales:**
```typescript
const currentFinancingOptions = [
  'Sin financiación',
  'Financiación 3 meses',
  'Financiación 6 meses',
  'Financiación 12 meses'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface FinancingOption {
  id: string
  name: string
  code: string
  months: number               // Número de meses
  interestRate: number        // Tasa de interés (%)
  minimumAmount: number       // Monto mínimo elegible
  maximumAmount?: number      // Monto máximo (opcional)
  requiresApproval: boolean   // Si requiere aprobación
  provider?: string           // Entidad financiera
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedFinancingOptions: FinancingOption[] = [
  {
    id: '0',
    name: 'Sin financiación',
    code: 'ninguna',
    months: 0,
    interestRate: 0,
    minimumAmount: 0,
    requiresApproval: false,
    enabled: true,
    order: 1
  },
  {
    id: '1',
    name: 'Financiación 3 meses',
    code: '3m',
    months: 3,
    interestRate: 0,
    minimumAmount: 300,
    maximumAmount: 3000,
    requiresApproval: false,
    provider: 'Pepper Money',
    enabled: true,
    order: 2
  },
  {
    id: '2',
    name: 'Financiación 6 meses',
    code: '6m',
    months: 6,
    interestRate: 5.9,
    minimumAmount: 500,
    maximumAmount: 6000,
    requiresApproval: true,
    provider: 'Pepper Money',
    enabled: true,
    order: 3
  },
  {
    id: '3',
    name: 'Financiación 12 meses',
    code: '12m',
    months: 12,
    interestRate: 7.9,
    minimumAmount: 1000,
    maximumAmount: 15000,
    requiresApproval: true,
    provider: 'Pepper Money',
    enabled: true,
    order: 4
  },
  {
    id: '4',
    name: 'Financiación 24 meses',
    code: '24m',
    months: 24,
    interestRate: 9.9,
    minimumAmount: 2000,
    maximumAmount: 30000,
    requiresApproval: true,
    provider: 'Pepper Money',
    enabled: true,
    order: 5
  }
]
```

### 3.10. Canales de Adquisición

**Estado Actual:** Hardcodeados en `AddPatientStepAdministrativo.tsx:94-104`

**Valores Actuales:**
```typescript
const currentAcquisitionChannels = [
  'Redes sociales',
  'Recomendación',
  'Web',
  'Publicidad'
]
```

**Estructura de Datos Necesaria:**
```typescript
interface AcquisitionChannel {
  id: string
  name: string
  code: string
  category: 'digital' | 'organic' | 'paid' | 'referral'
  cost?: number               // Coste por lead (opcional)
  color?: string
  icon?: string
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}
```

**Valores Recomendados:**
```typescript
const recommendedAcquisitionChannels: AcquisitionChannel[] = [
  {
    id: '1',
    name: 'Recomendación',
    code: 'recomendacion',
    category: 'referral',
    color: '#10b981',
    icon: 'users',
    enabled: true,
    order: 1
  },
  {
    id: '2',
    name: 'Redes sociales',
    code: 'redes_sociales',
    category: 'digital',
    color: '#3b82f6',
    icon: 'share-2',
    enabled: true,
    order: 2
  },
  {
    id: '3',
    name: 'Web',
    code: 'web',
    category: 'digital',
    color: '#8b5cf6',
    icon: 'globe',
    enabled: true,
    order: 3
  },
  {
    id: '4',
    name: 'Publicidad',
    code: 'publicidad',
    category: 'paid',
    color: '#f59e0b',
    icon: 'zap',
    enabled: true,
    order: 4
  },
  {
    id: '5',
    name: 'Google Ads',
    code: 'google_ads',
    category: 'paid',
    cost: 15,
    color: '#ea4335',
    icon: 'search',
    enabled: true,
    order: 5
  },
  {
    id: '6',
    name: 'Facebook/Instagram',
    code: 'meta',
    category: 'paid',
    cost: 10,
    color: '#1877f2',
    icon: 'facebook',
    enabled: true,
    order: 6
  },
  {
    id: '7',
    name: 'Paso directo',
    code: 'walk_in',
    category: 'organic',
    color: '#06b6d4',
    icon: 'map-pin',
    enabled: true,
    order: 7
  }
]
```

---

## 4. ARQUITECTURA DE CONFIGURACIÓN NECESARIA

### 4.1. Estructura de Directorios Propuesta

```
/src
├── app/
│   ├── admin/
│   │   └── configuracion/                    # NUEVO
│   │       ├── page.tsx                      # Página principal de config
│   │       ├── layout.tsx                    # Layout del admin
│   │       ├── metodos-pago/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx              # Editar método
│   │       │       └── eliminar/
│   │       │           └── page.tsx
│   │       ├── aseguradoras/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── tratamientos/
│   │       │   ├── page.tsx
│   │       │   ├── categorias/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── profesionales/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── estados/
│   │       │   ├── page.tsx
│   │       │   ├── transacciones/page.tsx
│   │       │   └── produccion/page.tsx
│   │       ├── objetivos/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── financiacion/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── canales/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── categorias-ingresos/
│   │           ├── page.tsx
│   │           └── [id]/page.tsx
│   │
│   ├── caja/                                 # NUEVO - Pantalla de Caja
│   │   └── page.tsx
│   │
│   └── (existentes...)
│
├── components/
│   ├── admin/                                # NUEVO
│   │   ├── configuration/
│   │   │   ├── ConfigurationTabs.tsx        # Tabs de navegación
│   │   │   ├── ConfigurationTable.tsx       # Tabla genérica
│   │   │   ├── ConfigurationForm.tsx        # Formulario genérico
│   │   │   ├── ConfigurationSearch.tsx      # Búsqueda
│   │   │   └── ConfigurationFilters.tsx     # Filtros
│   │   ├── payment-methods/
│   │   │   ├── PaymentMethodForm.tsx
│   │   │   ├── PaymentMethodCard.tsx
│   │   │   └── PaymentMethodList.tsx
│   │   ├── insurance-providers/
│   │   │   ├── InsuranceProviderForm.tsx
│   │   │   ├── InsuranceProviderCard.tsx
│   │   │   └── InsuranceProviderList.tsx
│   │   ├── treatments/
│   │   │   ├── TreatmentForm.tsx
│   │   │   ├── TreatmentCard.tsx
│   │   │   ├── TreatmentList.tsx
│   │   │   └── TreatmentCategoryForm.tsx
│   │   ├── professionals/
│   │   │   ├── ProfessionalForm.tsx
│   │   │   ├── ProfessionalCard.tsx
│   │   │   └── ProfessionalSchedule.tsx
│   │   ├── goals/
│   │   │   ├── FinancialGoalForm.tsx
│   │   │   └── FinancialGoalCard.tsx
│   │   └── shared/
│   │       ├── ColorPicker.tsx
│   │       ├── IconPicker.tsx
│   │       └── SortableTable.tsx
│   │
│   ├── caja/                                 # NUEVO
│   │   ├── CajaHeader.tsx                   # Resumen con 4 cards
│   │   ├── CajaCharts.tsx                   # Gráficos (gauge + line)
│   │   ├── CajaFilters.tsx                  # Pills de filtros
│   │   ├── CajaTable.tsx                    # Tabla de transacciones
│   │   ├── CajaTransactionRow.tsx           # Fila individual
│   │   ├── CajaStatsCard.tsx                # Card de estadística
│   │   ├── GaugeChart.tsx                   # Gráfico circular
│   │   └── IncomeLineChart.tsx              # Gráfico lineal
│   │
│   └── (existentes...)
│
├── types/
│   ├── configuration.ts                      # NUEVO - Tipos de config
│   │   ├── PaymentMethod
│   │   ├── TransactionState
│   │   ├── ProductionState
│   │   ├── InsuranceProvider
│   │   ├── TreatmentType
│   │   ├── TreatmentCategory
│   │   ├── Professional
│   │   ├── FinancialGoal
│   │   ├── IncomeCategory
│   │   ├── FinancingOption
│   │   └── AcquisitionChannel
│   │
│   ├── caja.ts                              # NUEVO - Tipos de Caja
│   │   ├── Transaction
│   │   ├── CajaStats
│   │   ├── CajaFilters
│   │   └── ChartData
│   │
│   └── (existentes...)
│
├── services/
│   ├── configuration/                        # NUEVO
│   │   ├── paymentMethodsService.ts
│   │   ├── insuranceProvidersService.ts
│   │   ├── treatmentsService.ts
│   │   ├── professionalsService.ts
│   │   ├── statesService.ts
│   │   ├── goalsService.ts
│   │   ├── financingService.ts
│   │   ├── channelsService.ts
│   │   └── incomeCategoriesService.ts
│   │
│   ├── caja/                                 # NUEVO
│   │   ├── transactionsService.ts
│   │   └── statsService.ts
│   │
│   └── (existentes...)
│
├── hooks/
│   ├── configuration/                        # NUEVO
│   │   ├── usePaymentMethods.ts
│   │   ├── useInsuranceProviders.ts
│   │   ├── useTreatments.ts
│   │   ├── useProfessionals.ts
│   │   ├── useStates.ts
│   │   ├── useGoals.ts
│   │   └── useConfiguration.ts              # Hook genérico
│   │
│   ├── caja/                                 # NUEVO
│   │   ├── useTransactions.ts
│   │   └── useCajaStats.ts
│   │
│   └── (existentes...)
│
└── lib/
    ├── validations/
    │   ├── configurationSchemas.ts           # NUEVO - Zod schemas
    │   └── cajaSchemas.ts                    # NUEVO
    │
    └── utils/
        ├── configurationHelpers.ts           # NUEVO
        └── cajaHelpers.ts                    # NUEVO
```

### 4.2. Componentes Principales a Crear

#### **A. Página de Configuración Principal**
```typescript
// src/app/admin/configuracion/page.tsx
```
- Tabs de navegación entre secciones
- Dashboard con estadísticas de configuración
- Accesos directos a cada módulo

#### **B. Componentes Reutilizables de Configuración**

**ConfigurationTable.tsx**
- Tabla genérica con:
  - Ordenamiento
  - Búsqueda
  - Filtros
  - Paginación
  - Acciones (editar, eliminar, duplicar)
  - Arrastrar y soltar para reordenar

**ConfigurationForm.tsx**
- Formulario genérico con:
  - Validación con Zod
  - Manejo de estados
  - Mensajes de error
  - Botones de acción

**ConfigurationCard.tsx**
- Tarjeta para visualización rápida
- Versión compacta para listados
- Versión expandida para detalles

#### **C. Componentes Específicos de la Pantalla de Caja**

**CajaHeader.tsx**
- 4 tarjetas de resumen (Producido, Facturado, Cobrado, Por cobrar)
- Avatares de usuarios
- Indicadores de tendencia
- Badges de estado

**CajaCharts.tsx**
- Gráfico semicircular (Gauge)
- Gráfico lineal de ingresos
- Selector de periodo
- Leyendas

**CajaTable.tsx**
- Tabla de transacciones
- Filtros inline
- Acciones por fila
- Tooltips informativos

### 4.3. Hooks Personalizados

#### **useConfiguration**
```typescript
// src/hooks/configuration/useConfiguration.ts
import { useState, useEffect } from 'react'

interface UseConfigurationOptions<T> {
  entity: string                // Nombre de la entidad
  initialLoad?: boolean         // Cargar al montar
  filters?: Record<string, any> // Filtros iniciales
}

interface UseConfigurationReturn<T> {
  items: T[]
  loading: boolean
  error: Error | null
  create: (data: Partial<T>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
  search: (query: string) => void
  filter: (filters: Record<string, any>) => void
  sort: (field: keyof T, direction: 'asc' | 'desc') => void
}

export function useConfiguration<T>(
  options: UseConfigurationOptions<T>
): UseConfigurationReturn<T> {
  // Implementación...
}
```

**Uso:**
```typescript
// En cualquier componente
const {
  items: paymentMethods,
  loading,
  create: createPaymentMethod,
  update: updatePaymentMethod,
  remove: removePaymentMethod
} = useConfiguration<PaymentMethod>({
  entity: 'payment-methods',
  initialLoad: true
})
```

#### **useCajaTransactions**
```typescript
// src/hooks/caja/useTransactions.ts
interface UseTransactionsOptions {
  date?: Date
  filters?: CajaFilters
  autoRefresh?: number          // Auto-refresh en ms
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  stats: CajaStats
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  markAsPaid: (id: string) => Promise<void>
  markAsProduced: (id: string) => Promise<void>
}

export function useTransactions(
  options: UseTransactionsOptions
): UseTransactionsReturn {
  // Implementación...
}
```

---

## 5. ESQUEMA DE BASE DE DATOS

### 5.1. Tablas Necesarias

#### **payment_methods**
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  requires_authorization BOOLEAN DEFAULT false,
  category VARCHAR(20) CHECK (category IN ('physical', 'digital', 'deferred')),
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payment_methods_enabled ON payment_methods(enabled);
CREATE INDEX idx_payment_methods_order ON payment_methods(display_order);
```

#### **transaction_states**
```sql
CREATE TABLE transaction_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('success', 'warning', 'pending', 'error')),
  color VARCHAR(20),
  icon VARCHAR(50),
  allows_modification BOOLEAN DEFAULT true,
  is_terminal BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### **production_states**
```sql
CREATE TABLE production_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  checked BOOLEAN DEFAULT false,
  badge_color VARCHAR(20),
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### **insurance_providers**
```sql
CREATE TABLE insurance_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('private', 'public', 'mutual', 'none')),
  enabled BOOLEAN DEFAULT true,
  logo_url VARCHAR(255),
  color VARCHAR(20),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  claims_email VARCHAR(100),
  coverage_percentage DECIMAL(5,2) DEFAULT 0,
  requires_pre_authorization BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_insurance_providers_enabled ON insurance_providers(enabled);
CREATE INDEX idx_insurance_providers_type ON insurance_providers(type);
```

#### **treatment_categories**
```sql
CREATE TABLE treatment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20),
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### **treatment_types**
```sql
CREATE TABLE treatment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  category_id UUID REFERENCES treatment_categories(id),
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  requires_room BOOLEAN DEFAULT true,
  requires_equipment JSONB DEFAULT '[]',
  covered_by_insurance BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_treatment_types_category ON treatment_types(category_id);
CREATE INDEX idx_treatment_types_enabled ON treatment_types(enabled);
CREATE INDEX idx_treatment_types_price ON treatment_types(base_price);
```

#### **professionals**
```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  title VARCHAR(10),
  specialty VARCHAR(100),
  license_number VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  color VARCHAR(20),
  initials VARCHAR(5),
  role VARCHAR(20) CHECK (role IN ('dentist', 'hygienist', 'assistant', 'admin')),
  enabled BOOLEAN DEFAULT true,
  schedule JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_professionals_enabled ON professionals(enabled);
CREATE INDEX idx_professionals_role ON professionals(role);
CREATE INDEX idx_professionals_email ON professionals(email);
```

#### **financial_goals**
```sql
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('daily', 'weekly', 'monthly', 'yearly')),
  target_amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  assigned_to JSONB DEFAULT '[]',
  category VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_financial_goals_type ON financial_goals(type);
CREATE INDEX idx_financial_goals_dates ON financial_goals(start_date, end_date);
CREATE INDEX idx_financial_goals_enabled ON financial_goals(enabled);
```

#### **income_categories**
```sql
CREATE TABLE income_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20),
  icon VARCHAR(50),
  description TEXT,
  related_payment_methods JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### **financing_options**
```sql
CREATE TABLE financing_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  months INTEGER NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  minimum_amount DECIMAL(10,2) NOT NULL,
  maximum_amount DECIMAL(10,2),
  requires_approval BOOLEAN DEFAULT false,
  provider VARCHAR(100),
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_financing_options_enabled ON financing_options(enabled);
CREATE INDEX idx_financing_options_months ON financing_options(months);
```

#### **acquisition_channels**
```sql
CREATE TABLE acquisition_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(20) CHECK (category IN ('digital', 'organic', 'paid', 'referral')),
  cost_per_lead DECIMAL(10,2),
  color VARCHAR(20),
  icon VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_acquisition_channels_enabled ON acquisition_channels(enabled);
CREATE INDEX idx_acquisition_channels_category ON acquisition_channels(category);
```

#### **transactions** (Tabla principal de Caja)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL,
  transaction_time TIME NOT NULL,

  -- Referencias
  patient_id UUID REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  treatment_id UUID REFERENCES treatment_types(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  insurance_provider_id UUID REFERENCES insurance_providers(id),

  -- Datos financieros
  amount DECIMAL(10,2) NOT NULL,
  insurance_coverage DECIMAL(10,2) DEFAULT 0,
  patient_payment DECIMAL(10,2) NOT NULL,

  -- Estados
  transaction_state_id UUID REFERENCES transaction_states(id),
  production_state_id UUID REFERENCES production_states(id),

  -- Información adicional
  concept TEXT,
  notes TEXT,
  invoice_number VARCHAR(50),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_patient ON transactions(patient_id);
CREATE INDEX idx_transactions_professional ON transactions(professional_id);
CREATE INDEX idx_transactions_state ON transactions(transaction_state_id);
CREATE INDEX idx_transactions_production ON transactions(production_state_id);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method_id);
```

### 5.2. Vistas SQL Útiles

#### **Vista de Estadísticas Diarias**
```sql
CREATE VIEW daily_cash_stats AS
SELECT
  transaction_date,

  -- Producido (todos los tratamientos realizados)
  SUM(CASE WHEN ps.code = 'hecho' THEN amount ELSE 0 END) as producido,

  -- Facturado (transacciones con factura)
  SUM(CASE WHEN invoice_number IS NOT NULL THEN amount ELSE 0 END) as facturado,

  -- Cobrado (estados aceptados)
  SUM(CASE WHEN ts.code = 'aceptado' THEN patient_payment ELSE 0 END) as cobrado,

  -- Por cobrar (estados pendientes)
  SUM(CASE WHEN ts.code IN ('pendiente', 'enviado') THEN patient_payment ELSE 0 END) as por_cobrar,

  COUNT(*) as total_transactions
FROM transactions t
LEFT JOIN transaction_states ts ON t.transaction_state_id = ts.id
LEFT JOIN production_states ps ON t.production_state_id = ps.id
WHERE t.deleted_at IS NULL
GROUP BY transaction_date;
```

#### **Vista de Ingresos por Método de Pago**
```sql
CREATE VIEW income_by_payment_method AS
SELECT
  transaction_date,
  pm.name as payment_method,
  pm.code as payment_code,
  SUM(patient_payment) as total_amount,
  COUNT(*) as transaction_count
FROM transactions t
JOIN payment_methods pm ON t.payment_method_id = pm.id
WHERE t.deleted_at IS NULL
  AND t.transaction_state_id IN (
    SELECT id FROM transaction_states WHERE code = 'aceptado'
  )
GROUP BY transaction_date, pm.id, pm.name, pm.code
ORDER BY transaction_date DESC, total_amount DESC;
```

---

## 6. ENDPOINTS API REQUERIDOS

### 6.1. API RESTful para Configuración

Todos los endpoints de configuración siguen el mismo patrón CRUD:

#### **Estructura Base**
```
GET    /api/configuration/{entity}           - Listar todos
GET    /api/configuration/{entity}/:id       - Obtener uno
POST   /api/configuration/{entity}           - Crear nuevo
PUT    /api/configuration/{entity}/:id       - Actualizar
DELETE /api/configuration/{entity}/:id       - Eliminar (soft delete)
PATCH  /api/configuration/{entity}/reorder   - Reordenar múltiples
```

### 6.2. Endpoints Específicos

#### **Métodos de Pago**
```
GET    /api/configuration/payment-methods
GET    /api/configuration/payment-methods/:id
POST   /api/configuration/payment-methods
PUT    /api/configuration/payment-methods/:id
DELETE /api/configuration/payment-methods/:id
PATCH  /api/configuration/payment-methods/reorder
```

**Request Body - POST/PUT:**
```typescript
{
  name: string
  code: string
  enabled: boolean
  requiresAuthorization: boolean
  category: 'physical' | 'digital' | 'deferred'
  icon?: string
  color?: string
  order: number
}
```

**Response:**
```typescript
{
  success: boolean
  data: PaymentMethod | PaymentMethod[]
  message?: string
  error?: string
}
```

#### **Aseguradoras**
```
GET    /api/configuration/insurance-providers
GET    /api/configuration/insurance-providers/:id
POST   /api/configuration/insurance-providers
PUT    /api/configuration/insurance-providers/:id
DELETE /api/configuration/insurance-providers/:id
```

#### **Tratamientos**
```
GET    /api/configuration/treatments
GET    /api/configuration/treatments/:id
POST   /api/configuration/treatments
PUT    /api/configuration/treatments/:id
DELETE /api/configuration/treatments/:id
GET    /api/configuration/treatments/categories
POST   /api/configuration/treatments/categories
```

#### **Profesionales**
```
GET    /api/configuration/professionals
GET    /api/configuration/professionals/:id
POST   /api/configuration/professionals
PUT    /api/configuration/professionals/:id
DELETE /api/configuration/professionals/:id
PATCH  /api/configuration/professionals/:id/schedule
```

#### **Estados**
```
GET    /api/configuration/states/transactions
GET    /api/configuration/states/production
POST   /api/configuration/states/transactions
PUT    /api/configuration/states/:type/:id
```

#### **Objetivos Financieros**
```
GET    /api/configuration/goals
GET    /api/configuration/goals/:id
POST   /api/configuration/goals
PUT    /api/configuration/goals/:id
DELETE /api/configuration/goals/:id
GET    /api/configuration/goals/progress/:id
```

#### **Opciones de Financiación**
```
GET    /api/configuration/financing-options
GET    /api/configuration/financing-options/:id
POST   /api/configuration/financing-options
PUT    /api/configuration/financing-options/:id
DELETE /api/configuration/financing-options/:id
GET    /api/configuration/financing-options/calculate
  ?amount=1500&months=12&optionId=xxx
```

#### **Canales de Adquisición**
```
GET    /api/configuration/acquisition-channels
GET    /api/configuration/acquisition-channels/:id
POST   /api/configuration/acquisition-channels
PUT    /api/configuration/acquisition-channels/:id
DELETE /api/configuration/acquisition-channels/:id
```

#### **Categorías de Ingresos**
```
GET    /api/configuration/income-categories
GET    /api/configuration/income-categories/:id
POST   /api/configuration/income-categories
PUT    /api/configuration/income-categories/:id
DELETE /api/configuration/income-categories/:id
```

### 6.3. API de Caja (Transacciones)

#### **Transacciones**
```
GET    /api/caja/transactions
  ?date=2024-10-28
  &professional=xxx
  &paymentMethod=xxx
  &state=xxx
  &insurance=xxx

GET    /api/caja/transactions/:id
POST   /api/caja/transactions
PUT    /api/caja/transactions/:id
DELETE /api/caja/transactions/:id
PATCH  /api/caja/transactions/:id/state
PATCH  /api/caja/transactions/:id/production
```

**Query Parameters:**
```typescript
interface TransactionQueryParams {
  date?: string          // YYYY-MM-DD
  startDate?: string     // YYYY-MM-DD
  endDate?: string       // YYYY-MM-DD
  professional?: string  // UUID
  paymentMethod?: string // UUID
  state?: string        // UUID
  production?: string   // UUID
  insurance?: string    // UUID
  minAmount?: number
  maxAmount?: number
  search?: string       // Búsqueda en concepto/paciente
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

#### **Estadísticas**
```
GET    /api/caja/stats/daily
  ?date=2024-10-28

GET    /api/caja/stats/range
  ?startDate=2024-10-01
  &endDate=2024-10-31

GET    /api/caja/stats/by-payment-method
  ?date=2024-10-28

GET    /api/caja/stats/by-professional
  ?date=2024-10-28

GET    /api/caja/stats/goals
  ?date=2024-10-28
```

**Response - Daily Stats:**
```typescript
{
  success: true,
  data: {
    date: "2024-10-28",
    producido: {
      amount: 1200,
      count: 5,
      change: 12, // %
      trend: "up"
    },
    facturado: {
      amount: 1200,
      count: 5,
      change: 12,
      trend: "up"
    },
    cobrado: {
      amount: 1200,
      count: 4,
      change: 12,
      trend: "up"
    },
    porCobrar: {
      amount: -1200,
      count: 1,
      change: 12,
      trend: "up"
    }
  }
}
```

#### **Gráficos**
```
GET    /api/caja/charts/gauge
  ?date=2024-10-28

GET    /api/caja/charts/line
  ?year=2024
  &type=ingresos
```

**Response - Gauge Chart:**
```typescript
{
  success: true,
  data: {
    current: 1200,
    goal: 1800,
    percentage: 66.67,
    label: "Ingresos del día",
    date: "2024-10-28"
  }
}
```

**Response - Line Chart:**
```typescript
{
  success: true,
  data: {
    year: 2024,
    facturado: 38000,
    objetivo: 14000,
    dataPoints: [
      { time: "09:00", value: 1000 },
      { time: "10:00", value: 2500 },
      { time: "11:00", value: 5200 },
      // ... más puntos
    ]
  }
}
```

---

## 7. INTERFACES TYPESCRIPT

### 7.1. Archivo: `/src/types/configuration.ts`

```typescript
// ==========================================
// MÉTODOS DE PAGO
// ==========================================

export interface PaymentMethod {
  id: string
  name: string
  code: string
  enabled: boolean
  requiresAuthorization: boolean
  category: 'physical' | 'digital' | 'deferred'
  icon?: string
  color?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreatePaymentMethodInput = Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePaymentMethodInput = Partial<CreatePaymentMethodInput>

// ==========================================
// ESTADOS
// ==========================================

export interface TransactionState {
  id: string
  name: string
  code: string
  type: 'success' | 'warning' | 'pending' | 'error'
  color: string
  icon?: string
  allowsModification: boolean
  isTerminal: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductionState {
  id: string
  name: string
  code: string
  checked: boolean
  badgeColor: string
  icon?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// ASEGURADORAS
// ==========================================

export interface InsuranceProvider {
  id: string
  name: string
  code: string
  type: 'private' | 'public' | 'mutual' | 'none'
  enabled: boolean
  logo?: string
  color?: string
  contactEmail?: string
  contactPhone?: string
  claimsEmail?: string
  coveragePercentage?: number
  requiresPreAuthorization: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateInsuranceProviderInput = Omit<InsuranceProvider, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInsuranceProviderInput = Partial<CreateInsuranceProviderInput>

// ==========================================
// TRATAMIENTOS
// ==========================================

export interface TreatmentCategory {
  id: string
  name: string
  code: string
  color: string
  icon?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface TreatmentType {
  id: string
  name: string
  code: string
  category: string | TreatmentCategory
  basePrice: number
  durationMinutes: number
  requiresRoom: boolean
  requiresEquipment: string[]
  coveredByInsurance: boolean
  enabled: boolean
  description?: string
  icon?: string
  color?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateTreatmentInput = Omit<TreatmentType, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTreatmentInput = Partial<CreateTreatmentInput>

// ==========================================
// PROFESIONALES
// ==========================================

export interface TimeSlot {
  start: string
  end: string
}

export interface DaySchedule {
  enabled: boolean
  slots: TimeSlot[]
}

export interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface Professional {
  id: string
  firstName: string
  lastName: string
  fullName: string
  title: string
  specialty: string
  licenseNumber: string
  email: string
  phone: string
  avatar?: string
  color?: string
  initials: string
  role: 'dentist' | 'hygienist' | 'assistant' | 'admin'
  enabled: boolean
  schedule?: WeeklySchedule
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateProfessionalInput = Omit<Professional, 'id' | 'fullName' | 'initials' | 'createdAt' | 'updatedAt'>
export type UpdateProfessionalInput = Partial<CreateProfessionalInput>

// ==========================================
// OBJETIVOS FINANCIEROS
// ==========================================

export interface FinancialGoal {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  targetAmount: number
  startDate: Date
  endDate: Date
  assignedTo?: string[]
  category?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateFinancialGoalInput = Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFinancialGoalInput = Partial<CreateFinancialGoalInput>

// ==========================================
// CATEGORÍAS DE INGRESOS
// ==========================================

export interface IncomeCategory {
  id: string
  name: string
  code: string
  color: string
  icon?: string
  description?: string
  relatedPaymentMethods: string[]
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateIncomeCategoryInput = Omit<IncomeCategory, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateIncomeCategoryInput = Partial<CreateIncomeCategoryInput>

// ==========================================
// OPCIONES DE FINANCIACIÓN
// ==========================================

export interface FinancingOption {
  id: string
  name: string
  code: string
  months: number
  interestRate: number
  minimumAmount: number
  maximumAmount?: number
  requiresApproval: boolean
  provider?: string
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateFinancingOptionInput = Omit<FinancingOption, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFinancingOptionInput = Partial<CreateFinancingOptionInput>

// ==========================================
// CANALES DE ADQUISICIÓN
// ==========================================

export interface AcquisitionChannel {
  id: string
  name: string
  code: string
  category: 'digital' | 'organic' | 'paid' | 'referral'
  cost?: number
  color?: string
  icon?: string
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export type CreateAcquisitionChannelInput = Omit<AcquisitionChannel, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAcquisitionChannelInput = Partial<CreateAcquisitionChannelInput>

// ==========================================
// TIPOS GENÉRICOS
// ==========================================

export interface ConfigurationOption {
  label: string
  value: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### 7.2. Archivo: `/src/types/caja.ts`

```typescript
import {
  PaymentMethod,
  TransactionState,
  ProductionState,
  InsuranceProvider,
  TreatmentType,
  Professional
} from './configuration'

// ==========================================
// TRANSACCIONES
// ==========================================

export interface Transaction {
  id: string
  transactionDate: Date
  transactionTime: string

  // Referencias
  patient: {
    id: string
    fullName: string
  }
  professional: Professional
  treatment: TreatmentType
  paymentMethod: PaymentMethod
  insuranceProvider: InsuranceProvider

  // Datos financieros
  amount: number
  insuranceCoverage: number
  patientPayment: number

  // Estados
  transactionState: TransactionState
  productionState: ProductionState

  // Información adicional
  concept: string
  notes?: string
  invoiceNumber?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

export type CreateTransactionInput = Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt' | 'patient' | 'professional' | 'treatment' | 'paymentMethod' | 'insuranceProvider' | 'transactionState' | 'productionState'
> & {
  patientId: string
  professionalId: string
  treatmentId: string
  paymentMethodId: string
  insuranceProviderId: string
  transactionStateId: string
  productionStateId: string
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>

// ==========================================
// FILTROS
// ==========================================

export interface CajaFilters {
  date?: Date
  startDate?: Date
  endDate?: Date
  professional?: string
  paymentMethod?: string
  state?: string
  production?: string
  insurance?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

// ==========================================
// ESTADÍSTICAS
// ==========================================

export interface StatCard {
  amount: number
  count: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface CajaStats {
  date: string
  producido: StatCard
  facturado: StatCard
  cobrado: StatCard
  porCobrar: StatCard
}

// ==========================================
// GRÁFICOS
// ==========================================

export interface GaugeChartData {
  current: number
  goal: number
  percentage: number
  label: string
  date: string
}

export interface DataPoint {
  time: string
  value: number
}

export interface LineChartData {
  year: number
  facturado: number
  objetivo: number
  dataPoints: DataPoint[]
}

// ==========================================
// TABLA
// ==========================================

export interface CajaTableRow extends Transaction {
  // Propiedades adicionales calculadas para la tabla
  isOverdue?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface CajaTableSort {
  field: keyof Transaction
  direction: 'asc' | 'desc'
}

// ==========================================
// RESUMEN DE MÉTODOS DE PAGO
// ==========================================

export interface PaymentMethodSummary {
  paymentMethod: PaymentMethod
  totalAmount: number
  percentage: number
  change: number
  transactionCount: number
}

// ==========================================
// AGREGACIONES
// ==========================================

export interface DailyAggregation {
  date: string
  totalAmount: number
  transactionCount: number
  byPaymentMethod: PaymentMethodSummary[]
  byProfessional: {
    professional: Professional
    totalAmount: number
    transactionCount: number
  }[]
  byInsurance: {
    insurance: InsuranceProvider
    totalAmount: number
    transactionCount: number
  }[]
}
```

---

## 8. COMPONENTES DE UI NECESARIOS

### 8.1. Componentes de Configuración

#### **ConfigurationTabs.tsx**
```typescript
// src/components/admin/configuration/ConfigurationTabs.tsx
interface Tab {
  id: string
  label: string
  icon: string
  count?: number
}

interface ConfigurationTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function ConfigurationTabs({ tabs, activeTab, onTabChange }: ConfigurationTabsProps) {
  // Implementación...
}
```

#### **ConfigurationTable.tsx**
```typescript
// src/components/admin/configuration/ConfigurationTable.tsx
interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

interface Action<T> {
  label: string
  icon: string
  onClick: (row: T) => void
  variant?: 'default' | 'danger'
  condition?: (row: T) => boolean
}

interface ConfigurationTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  sortable?: boolean
  reorderable?: boolean
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void
  onReorder?: (newOrder: T[]) => void
  loading?: boolean
  emptyMessage?: string
}

export function ConfigurationTable<T>({
  data,
  columns,
  actions,
  sortable,
  reorderable,
  onSort,
  onReorder,
  loading,
  emptyMessage
}: ConfigurationTableProps<T>) {
  // Implementación...
}
```

#### **ConfigurationForm.tsx**
```typescript
// src/components/admin/configuration/ConfigurationForm.tsx
interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'color' | 'icon'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  validation?: any // Zod schema
  helperText?: string
}

interface ConfigurationFormProps {
  title: string
  fields: FormField[]
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
}

export function ConfigurationForm({
  title,
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar'
}: ConfigurationFormProps) {
  // Implementación con react-hook-form + Zod
}
```

### 8.2. Componentes de la Pantalla de Caja

#### **CajaHeader.tsx**
```typescript
// src/components/caja/CajaHeader.tsx
interface CajaHeaderProps {
  stats: CajaStats
  loading?: boolean
}

export function CajaHeader({ stats, loading }: CajaHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CajaStatsCard
        title="Producido"
        value={stats.producido.amount}
        count={stats.producido.count}
        change={stats.producido.change}
        trend={stats.producido.trend}
        variant="blue"
        avatar="V"
        badge="Hoy"
      />
      {/* Más cards... */}
    </div>
  )
}
```

#### **CajaStatsCard.tsx**
```typescript
// src/components/caja/CajaStatsCard.tsx
interface CajaStatsCardProps {
  title: string
  value: number
  count?: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  variant: 'blue' | 'green' | 'yellow' | 'red'
  avatar?: string
  badge?: string
  icon?: string
  checked?: boolean
}

export function CajaStatsCard({
  title,
  value,
  count,
  change,
  trend,
  variant,
  avatar,
  badge,
  icon,
  checked
}: CajaStatsCardProps) {
  // Implementación...
}
```

#### **CajaCharts.tsx**
```typescript
// src/components/caja/CajaCharts.tsx
interface CajaChartsProps {
  gaugeData: GaugeChartData
  lineData: LineChartData
  year: number
  onYearChange: (year: number) => void
}

export function CajaCharts({
  gaugeData,
  lineData,
  year,
  onYearChange
}: CajaChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GaugeChart data={gaugeData} />
      <IncomeLineChart
        data={lineData}
        year={year}
        onYearChange={onYearChange}
      />
    </div>
  )
}
```

#### **GaugeChart.tsx**
```typescript
// src/components/caja/GaugeChart.tsx
// Usar librería como recharts o crear SVG personalizado
interface GaugeChartProps {
  data: GaugeChartData
}

export function GaugeChart({ data }: GaugeChartProps) {
  // Implementación del gráfico semicircular
  // con avatar en el centro y valores
}
```

#### **IncomeLineChart.tsx**
```typescript
// src/components/caja/IncomeLineChart.tsx
interface IncomeLineChartProps {
  data: LineChartData
  year: number
  onYearChange: (year: number) => void
}

export function IncomeLineChart({ data, year, onYearChange }: IncomeLineChartProps) {
  // Implementación del gráfico lineal
  // Usar recharts o similar
}
```

#### **CajaFilters.tsx**
```typescript
// src/components/caja/CajaFilters.tsx
interface CajaFiltersProps {
  activeFilters: CajaFilters
  paymentMethods: PaymentMethod[]
  onFilterChange: (filters: CajaFilters) => void
}

export function CajaFilters({
  activeFilters,
  paymentMethods,
  onFilterChange
}: CajaFiltersProps) {
  return (
    <div className="flex gap-2">
      <button
        className={cn(
          'px-4 py-2 rounded-full',
          !activeFilters.paymentMethod && 'bg-blue-500 text-white'
        )}
        onClick={() => onFilterChange({ ...activeFilters, paymentMethod: undefined })}
      >
        Todos
      </button>
      {paymentMethods.map(method => (
        <button
          key={method.id}
          className={cn(
            'px-4 py-2 rounded-full',
            activeFilters.paymentMethod === method.id && 'bg-blue-500 text-white'
          )}
          onClick={() => onFilterChange({ ...activeFilters, paymentMethod: method.id })}
        >
          {method.name}
        </button>
      ))}
    </div>
  )
}
```

#### **CajaTable.tsx**
```typescript
// src/components/caja/CajaTable.tsx
interface CajaTableProps {
  transactions: Transaction[]
  loading?: boolean
  onUpdateTransaction: (id: string, data: Partial<Transaction>) => void
  onMarkAsPaid: (id: string) => void
  onMarkAsProduced: (id: string) => void
}

export function CajaTable({
  transactions,
  loading,
  onUpdateTransaction,
  onMarkAsPaid,
  onMarkAsProduced
}: CajaTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Hora</th>
          <th>Paciente</th>
          <th>Concepto</th>
          <th>Cantidad</th>
          <th>Estado</th>
          <th>Producido</th>
          <th>Método</th>
          <th>Aseguradora</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(transaction => (
          <CajaTransactionRow
            key={transaction.id}
            transaction={transaction}
            onUpdate={onUpdateTransaction}
            onMarkAsPaid={onMarkAsPaid}
            onMarkAsProduced={onMarkAsProduced}
          />
        ))}
      </tbody>
    </table>
  )
}
```

#### **CajaTransactionRow.tsx**
```typescript
// src/components/caja/CajaTransactionRow.tsx
interface CajaTransactionRowProps {
  transaction: Transaction
  onUpdate: (id: string, data: Partial<Transaction>) => void
  onMarkAsPaid: (id: string) => void
  onMarkAsProduced: (id: string) => void
}

export function CajaTransactionRow({
  transaction,
  onUpdate,
  onMarkAsPaid,
  onMarkAsProduced
}: CajaTransactionRowProps) {
  // Implementación de la fila con todos los campos
}
```

### 8.3. Componentes Compartidos

#### **ColorPicker.tsx**
```typescript
// src/components/admin/shared/ColorPicker.tsx
interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  // Implementación del selector de color
}
```

#### **IconPicker.tsx**
```typescript
// src/components/admin/shared/IconPicker.tsx
interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  // Implementación del selector de iconos
  // Puede usar lucide-react icons
}
```

---

## 9. FLUJO DE DATOS

### 9.1. Flujo de Configuración

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO ADMINISTRADOR                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         PÁGINA DE CONFIGURACIÓN (/admin/configuracion)       │
│  - Tabs de navegación                                        │
│  - Vista de cada sección                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPONENTES DE CONFIGURACIÓN                    │
│  - ConfigurationTable: Listado con acciones                 │
│  - ConfigurationForm: Formulario de creación/edición        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 HOOKS PERSONALIZADOS                         │
│  - useConfiguration<T>()                                     │
│    - Gestión de estado local                                │
│    - Cache de datos                                          │
│    - Optimistic updates                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVICIOS DE API                             │
│  - configurationService.ts                                   │
│    - CRUD operations                                         │
│    - Error handling                                          │
│    - Response transformation                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTES (Next.js)                            │
│  - /api/configuration/[entity]                               │
│    - GET, POST, PUT, DELETE                                  │
│    - Validación con Zod                                      │
│    - Autenticación                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                             │
│  - PostgreSQL / Supabase                                     │
│  - Tablas de configuración                                   │
│  - Soft deletes                                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.2. Flujo de la Pantalla de Caja

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (RECEPCIONISTA)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               PÁGINA DE CAJA (/caja)                         │
│  - Selección de fecha                                        │
│  - Filtros activos                                           │
│  - Auto-refresh cada X segundos                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            COMPONENTES DE CAJA (PARALELOS)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CajaHeader  │  │  CajaCharts  │  │  CajaTable   │       │
│  │ (4 cards)   │  │ (2 gráficos) │  │ (transacc.)  │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 HOOKS PERSONALIZADOS                         │
│  - useTransactions({ date, filters })                        │
│    - Gestión de transacciones                               │
│    - Optimistic updates                                      │
│  - useCajaStats({ date })                                    │
│    - Estadísticas calculadas                                │
│    - Auto-refresh                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVICIOS DE CAJA                            │
│  - transactionsService.ts                                    │
│  - statsService.ts                                           │
│    - Agregaciones                                            │
│    - Cálculos de cambios %                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTES (Next.js)                            │
│  - /api/caja/transactions                                    │
│  - /api/caja/stats/*                                         │
│  - /api/caja/charts/*                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                             │
│  - Tabla: transactions                                       │
│  - Joins con tablas de configuración                         │
│  - Vistas materializadas para stats                          │
└─────────────────────────────────────────────────────────────┘
```

### 9.3. Flujo de Uso de Configuración en Otros Módulos

```
┌─────────────────────────────────────────────────────────────┐
│        FORMULARIO DE PACIENTES (add-patient modal)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  ANTES (Hardcoded):                                          │
│    options={[                                                │
│      { label: 'Efectivo', value: 'efectivo' },              │
│      { label: 'Tarjeta', value: 'tarjeta' }                 │
│    ]}                                                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  DESPUÉS (Dinámico):                                         │
│    const { items: paymentMethods } =                         │
│      usePaymentMethods({ enabled: true })                    │
│                                                              │
│    options={paymentMethods.map(pm => ({                      │
│      label: pm.name,                                         │
│      value: pm.code                                          │
│    }))}                                                      │
└─────────────────────────────────────────────────────────────┘
```

**Beneficios:**
1. ✅ Valores siempre actualizados desde DB
2. ✅ Sin necesidad de modificar código
3. ✅ Filtrado automático (solo enabled: true)
4. ✅ Ordenamiento automático por `order`
5. ✅ Cache inteligente (menos requests)

---

## 10. PLAN DE IMPLEMENTACIÓN

### 10.1. Fase 1: Infraestructura Base (1-2 semanas)

#### **Semana 1: Backend**
- [ ] Diseñar y crear esquema de base de datos
- [ ] Implementar migraciones para todas las tablas
- [ ] Crear vistas SQL para estadísticas
- [ ] Poblar datos iniciales (seed data)
- [ ] Configurar índices de base de datos

#### **Semana 2: API Routes**
- [ ] Crear endpoints CRUD para configuración
- [ ] Implementar validaciones con Zod
- [ ] Añadir autenticación/autorización
- [ ] Crear endpoints de Caja
- [ ] Documentar API con ejemplos

### 10.2. Fase 2: Sistema de Configuración (2-3 semanas)

#### **Semana 3: Tipos y Servicios**
- [ ] Definir todas las interfaces TypeScript
- [ ] Crear servicios de API para cada entidad
- [ ] Implementar hooks personalizados
- [ ] Añadir tests unitarios

#### **Semana 4: Componentes Base**
- [ ] Crear componentes reutilizables (Table, Form, Card)
- [ ] Implementar ColorPicker e IconPicker
- [ ] Diseñar layout del admin
- [ ] Crear sistema de tabs

#### **Semana 5: Páginas de Configuración**
- [ ] Crear página principal `/admin/configuracion`
- [ ] Implementar sección de Métodos de Pago
- [ ] Implementar sección de Aseguradoras
- [ ] Implementar sección de Tratamientos
- [ ] Implementar sección de Profesionales

### 10.3. Fase 3: Pantalla de Caja (2-3 semanas)

#### **Semana 6: Componentes Visuales**
- [ ] Crear CajaStatsCard
- [ ] Implementar GaugeChart
- [ ] Implementar IncomeLineChart
- [ ] Crear CajaFilters
- [ ] Diseñar responsive layout

#### **Semana 7: Tabla de Transacciones**
- [ ] Crear CajaTable y CajaTransactionRow
- [ ] Implementar acciones inline
- [ ] Añadir modales de edición
- [ ] Implementar búsqueda y filtros
- [ ] Añadir paginación

#### **Semana 8: Integración Final**
- [ ] Conectar todos los componentes
- [ ] Implementar auto-refresh
- [ ] Añadir manejo de errores
- [ ] Optimizar performance
- [ ] Tests de integración

### 10.4. Fase 4: Migración y Refactorización (1 semana)

#### **Semana 9: Migración**
- [ ] Refactorizar formulario de pacientes
- [ ] Reemplazar arrays hardcodeados por hooks
- [ ] Actualizar componentes existentes
- [ ] Verificar compatibilidad

### 10.5. Fase 5: Testing y Optimización (1 semana)

#### **Semana 10: QA**
- [ ] Tests E2E de flujos completos
- [ ] Optimizar queries de base de datos
- [ ] Implementar caché donde sea necesario
- [ ] Verificar performance con datos reales
- [ ] Documentar uso del sistema

### 10.6. Fase 6: Deployment y Monitoreo (Continuo)

- [ ] Deploy a staging
- [ ] Pruebas de usuario
- [ ] Ajustes basados en feedback
- [ ] Deploy a producción
- [ ] Monitoreo de errores
- [ ] Capacitación a usuarios

---

## 11. PRIORIZACIÓN DE ENTIDADES

### Prioridad ALTA (Imprescindibles para Caja)
1. ✅ **Métodos de Pago** - Usado en filtros y tabla
2. ✅ **Estados de Transacción** - Core de la funcionalidad
3. ✅ **Estados de Producción** - Core de la funcionalidad
4. ✅ **Aseguradoras** - Columna en tabla
5. ✅ **Tratamientos** - Concepto en tabla
6. ✅ **Profesionales** - Asignación y filtros

### Prioridad MEDIA (Para funcionalidad completa)
7. 🟡 **Objetivos Financieros** - Para gráficos
8. 🟡 **Categorías de Ingresos** - Para resumen

### Prioridad BAJA (Pueden añadirse después)
9. ⚪ **Opciones de Financiación** - Usado en formulario de pacientes
10. ⚪ **Canales de Adquisición** - Usado en formulario de pacientes

---

## 12. CONSIDERACIONES TÉCNICAS

### 12.1. Seguridad
- Autenticación obligatoria para `/admin/configuracion`
- Roles de usuario (admin, staff, read-only)
- Validación de datos en cliente Y servidor
- Sanitización de inputs
- Rate limiting en API
- Logs de auditoría para cambios de configuración

### 12.2. Performance
- Paginación en tablas grandes
- Lazy loading de componentes pesados
- Cache en cliente (React Query / SWR)
- Índices en base de datos
- Vistas materializadas para stats
- Optimistic updates para mejor UX

### 12.3. Escalabilidad
- Diseño modular y reutilizable
- Separación de concerns
- Código DRY (Don't Repeat Yourself)
- Componentes genéricos parametrizados
- Fácil añadir nuevas entidades configurables

### 12.4. UX/UI
- Feedback inmediato en acciones
- Confirmaciones para acciones destructivas
- Estados de carga claros
- Mensajes de error informativos
- Tooltips explicativos
- Accesibilidad (ARIA labels, keyboard navigation)
- Responsive design (móvil, tablet, desktop)

### 12.5. Mantenibilidad
- Documentación inline (comentarios)
- README para cada módulo
- Ejemplos de uso
- Tests automatizados
- Versionado semántico
- Changelog de cambios

---

## 13. RIESGOS Y MITIGACIONES

### Riesgo 1: Cambiar valores hardcodeados puede romper funcionalidad existente
**Mitigación:**
- Tests exhaustivos antes de migrar
- Mantener códigos internos estables
- Migración gradual módulo por módulo
- Rollback plan preparado

### Riesgo 2: Usuarios cambian configuración crítica por error
**Mitigación:**
- Confirmaciones dobles para cambios importantes
- Historial de cambios (audit log)
- Opción de deshacer cambios recientes
- Roles y permisos granulares

### Riesgo 3: Performance degradada con muchos datos
**Mitigación:**
- Paginación desde el inicio
- Cache agresivo
- Índices en DB optimizados
- Monitoreo de queries lentas

### Riesgo 4: Curva de aprendizaje para usuarios
**Mitigación:**
- UI intuitiva y auto-explicativa
- Tooltips y ayuda contextual
- Video tutorials
- Valores por defecto sensatos
- Validaciones que previenen errores

---

## 14. CONCLUSIÓN Y RECOMENDACIONES

### Conclusión Principal
La implementación de la pantalla de Caja **REQUIERE IMPERATIVAMENTE** un sistema de configuración robusto y centralizado. El estado actual del código (valores hardcodeados) no es sostenible ni escalable.

### Recomendaciones Críticas

1. **NO implementar la pantalla de Caja antes de tener configuración**
   - Riesgo alto de duplicación de código
   - Mantenimiento insostenible
   - Inconsistencias entre módulos

2. **Priorizar la Fase 1 y 2 antes que la Fase 3**
   - Base sólida permite implementación rápida de Caja
   - Evita refactorizaciones posteriores costosas

3. **Usar tecnologías modernas y probadas**
   - React Query o SWR para estado del servidor
   - Zod para validación
   - Recharts para gráficos
   - shadcn/ui para componentes base

4. **Pensar en extensibilidad desde el inicio**
   - Diseño genérico permite añadir nuevas entidades fácilmente
   - Componentes reutilizables reducen tiempo de desarrollo

5. **Documentar exhaustivamente**
   - Futuro equipo necesitará entender el sistema
   - Documentación reduce tiempo de onboarding

### Siguientes Pasos Inmediatos

1. ✅ Aprobar este documento
2. ✅ Revisar y validar esquema de base de datos
3. ✅ Crear tickets/tareas en gestor de proyectos
4. ✅ Asignar recursos y tiempos
5. ✅ Comenzar Fase 1: Infraestructura

---

## 15. ANEXOS

### Anexo A: Librerías Recomendadas

```json
{
  "dependencies": {
    "react-query": "^3.39.3",      // Estado del servidor
    "zod": "^3.22.4",               // Validación
    "react-hook-form": "^7.49.2",   // Formularios
    "recharts": "^2.10.3",          // Gráficos
    "@tanstack/react-table": "^8.11.2", // Tablas avanzadas
    "date-fns": "^3.0.6",           // Manejo de fechas
    "lucide-react": "^0.303.0",     // Iconos
    "@radix-ui/react-*": "*"        // Componentes base accesibles
  }
}
```

### Anexo B: Comandos SQL de Seed Data

```sql
-- Insertar métodos de pago iniciales
INSERT INTO payment_methods (name, code, category, enabled, display_order) VALUES
  ('Efectivo', 'efectivo', 'physical', true, 1),
  ('TPV / Tarjeta', 'tpv', 'physical', true, 2),
  ('Transferencia bancaria', 'transferencia', 'digital', true, 3),
  ('Bizum', 'bizum', 'digital', true, 4),
  ('Financiado', 'financiado', 'deferred', true, 5);

-- Insertar estados de transacción
INSERT INTO transaction_states (name, code, type, color, is_terminal) VALUES
  ('Pendiente', 'pendiente', 'pending', '#94a3b8', false),
  ('Enviado', 'enviado', 'warning', '#fbbf24', false),
  ('Aceptado', 'aceptado', 'success', '#10b981', true),
  ('Rechazado', 'rechazado', 'error', '#ef4444', true);

-- Insertar estados de producción
INSERT INTO production_states (name, code, checked, badge_color) VALUES
  ('Pendiente', 'pendiente', false, '#94a3b8'),
  ('Hecho', 'hecho', true, '#10b981');

-- Insertar aseguradoras
INSERT INTO insurance_providers (name, code, type, coverage_percentage, enabled) VALUES
  ('Sin seguro', 'ninguno', 'none', 0, true),
  ('Adeslas', 'adeslas', 'private', 80, true),
  ('Sanitas', 'sanitas', 'private', 80, true),
  ('DKV', 'dkv', 'private', 75, true);
```

### Anexo C: Ejemplo de Hook useConfiguration

```typescript
// src/hooks/configuration/useConfiguration.ts
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { configurationService } from '@/services/configuration'

export function useConfiguration<T>(entity: string, options = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    [entity],
    () => configurationService.getAll<T>(entity),
    options
  )

  const createMutation = useMutation(
    (data: Partial<T>) => configurationService.create<T>(entity, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([entity])
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<T> }) =>
      configurationService.update<T>(entity, id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([entity])
      }
    }
  )

  const deleteMutation = useMutation(
    (id: string) => configurationService.delete(entity, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([entity])
      }
    }
  )

  return {
    items: data || [],
    loading: isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries([entity])
  }
}
```

---

**FIN DEL DOCUMENTO**

---

**Información del Documento:**
- **Total de páginas:** 45+
- **Palabras:** ~12,000
- **Tiempo estimado de lectura:** 60 minutos
- **Última actualización:** 1 de Diciembre 2025
- **Versión:** 1.0
- **Autor:** Análisis técnico de klinikOS
