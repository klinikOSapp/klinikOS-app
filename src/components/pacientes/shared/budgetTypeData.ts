// ============================================
// Datos de Presupuestos Tipo (Templates de Presupuesto)
// ============================================

import type { TreatmentV2, ToothFace } from './treatmentTypes'

// Tipo para tratamiento dentro de un presupuesto tipo
export type BudgetTypeTreatment = {
  codigo: string
  tratamiento: string
  precio: number
  pieza?: number
  cara?: ToothFace
}

// Tipo principal de presupuesto tipo
export type BudgetTypeData = {
  id: string
  name: string
  description: string
  treatments: BudgetTypeTreatment[]
  totalPrice: number
  isActive: boolean
}

// ============================================
// Datos Mock de Presupuestos Tipo
// ============================================

export const BUDGET_TYPES_DATA: BudgetTypeData[] = [
  {
    id: 'bt-001',
    name: 'Pack Revisión Completa',
    description: 'Limpieza + consulta inicial + radiografía panorámica',
    treatments: [
      { codigo: 'LDE', tratamiento: 'Limpieza dental', precio: 72 },
      { codigo: 'CI', tratamiento: 'Consulta inicial', precio: 150 },
      { codigo: 'RX', tratamiento: 'Radiografía', precio: 100 }
    ],
    totalPrice: 322,
    isActive: true
  },
  {
    id: 'bt-002',
    name: 'Pack Blanqueamiento Premium',
    description: 'Blanqueamiento dental completo con limpieza previa',
    treatments: [
      { codigo: 'LDE', tratamiento: 'Limpieza dental', precio: 72 },
      { codigo: 'BLD', tratamiento: 'Blanqueamiento dental', precio: 200 }
    ],
    totalPrice: 272,
    isActive: true
  },
  {
    id: 'bt-003',
    name: 'Pack Implante Unitario',
    description: 'Implante dental + corona cerámica',
    treatments: [
      { codigo: 'IMP', tratamiento: 'Implante dental', precio: 1200, pieza: 36 },
      { codigo: 'COR', tratamiento: 'Corona dental', precio: 600, pieza: 36 }
    ],
    totalPrice: 1800,
    isActive: true
  },
  {
    id: 'bt-004',
    name: 'Pack Endodoncia + Corona',
    description: 'Endodoncia completa con corona de protección',
    treatments: [
      { codigo: 'END', tratamiento: 'Endodoncia', precio: 400 },
      { codigo: 'COR', tratamiento: 'Corona dental', precio: 600 }
    ],
    totalPrice: 1000,
    isActive: true
  },
  {
    id: 'bt-005',
    name: 'Pack Estética Dental',
    description: '4 carillas estéticas + blanqueamiento',
    treatments: [
      {
        codigo: 'CAR',
        tratamiento: 'Carillas estéticas',
        precio: 350,
        pieza: 11,
        cara: 'Vestibular'
      },
      {
        codigo: 'CAR',
        tratamiento: 'Carillas estéticas',
        precio: 350,
        pieza: 12,
        cara: 'Vestibular'
      },
      {
        codigo: 'CAR',
        tratamiento: 'Carillas estéticas',
        precio: 350,
        pieza: 21,
        cara: 'Vestibular'
      },
      {
        codigo: 'CAR',
        tratamiento: 'Carillas estéticas',
        precio: 350,
        pieza: 22,
        cara: 'Vestibular'
      },
      { codigo: 'BLD', tratamiento: 'Blanqueamiento dental', precio: 200 }
    ],
    totalPrice: 1600,
    isActive: true
  },
  {
    id: 'bt-006',
    name: 'Pack Infantil',
    description: 'Revisión + limpieza para niños',
    treatments: [
      { codigo: 'CI', tratamiento: 'Consulta inicial', precio: 150 },
      { codigo: 'LDE', tratamiento: 'Limpieza dental', precio: 72 }
    ],
    totalPrice: 222,
    isActive: false
  }
]

// ============================================
// Helper: Convertir BudgetTypeTreatment a TreatmentV2
// ============================================

export function convertBudgetTypeToTreatmentsV2(
  budgetType: BudgetTypeData,
  defaultDoctor: string = 'Dr. Guillermo'
): TreatmentV2[] {
  return budgetType.treatments.map((treatment, index) => {
    const precioStr = `${treatment.precio.toLocaleString('es-ES')} €`

    return {
      _internalId: `budget-type-${budgetType.id}-${index}`,
      pieza: treatment.pieza,
      cara: treatment.cara,
      codigo: treatment.codigo,
      tratamiento: treatment.tratamiento,
      precio: precioStr,
      porcentajeDescuento: 0,
      descuento: '0 €',
      importe: precioStr,
      importeSeguro: '',
      descripcionAnotaciones: '',
      doctor: defaultDoctor,
      selected: true // Pre-seleccionados para añadir al presupuesto
    }
  })
}

// ============================================
// State Management Functions (for development without backend)
// These will be replaced by API calls when connected to the database
// ============================================

// Mutable state for development
let budgetTypesState = [...BUDGET_TYPES_DATA]

// Get all budget types
export function getBudgetTypes(): BudgetTypeData[] {
  return budgetTypesState
}

// Add a new budget type
export function addBudgetType(
  budgetType: Omit<BudgetTypeData, 'id'>
): BudgetTypeData {
  const newBudget: BudgetTypeData = {
    ...budgetType,
    id: `bt-${Date.now()}`
  }
  budgetTypesState = [...budgetTypesState, newBudget]
  return newBudget
}

// Update an existing budget type
export function updateBudgetType(
  id: string,
  updates: Partial<BudgetTypeData>
): BudgetTypeData | null {
  const index = budgetTypesState.findIndex((bt) => bt.id === id)
  if (index === -1) return null

  const updatedBudget = { ...budgetTypesState[index], ...updates }
  budgetTypesState = budgetTypesState.map((bt) =>
    bt.id === id ? updatedBudget : bt
  )
  return updatedBudget
}

// Delete a budget type
export function deleteBudgetType(id: string): boolean {
  const initialLength = budgetTypesState.length
  budgetTypesState = budgetTypesState.filter((bt) => bt.id !== id)
  return budgetTypesState.length < initialLength
}

// Reset to initial data (for testing)
export function resetBudgetTypes(): void {
  budgetTypesState = [...BUDGET_TYPES_DATA]
}
