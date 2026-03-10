'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type {
  Receipt,
  RegisterSimplePaymentData,
  GenerateReceiptData,
  PaymentMethod
} from '@/types/payments'
import { generateReceiptNumber } from '@/types/payments'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
// Types - Estructura compatible con Supabase (PostgreSQL)
// ─────────────────────────────────────────────────────────────

/**
 * Tabla: cash_closings
 * Representa un cierre de caja para un día específico
 */
export type CashClosing = {
  // Primary key
  id: string // uuid

  // Clinic reference (for multi-clinic support)
  clinic_id: string // uuid, FK to clinics

  // The specific day being closed (DATE in PostgreSQL)
  closing_date: string // ISO date string YYYY-MM-DD

  // Timestamps
  created_at: string // timestamptz
  updated_at: string // timestamptz
  closed_by: string // uuid, FK to users

  // Cash flow data
  initial_cash: number // decimal(10,2) - Caja inicial
  total_income: number // decimal(10,2) - Total ingresos del día
  total_expenses: number // decimal(10,2) - Total gastos del día
  cash_outflow: number // decimal(10,2) - Salida de caja (retirado)
  final_balance: number // decimal(10,2) - Balance final

  // Breakdown by payment method (JSONB in PostgreSQL)
  income_by_method: {
    efectivo: number
    tpv: number
    transferencia: number
    financiacion: number
    otros: number
  }

  // Transaction counts
  transaction_count: number // integer

  // Status
  status: 'open' | 'closed' | 'reopened' // enum

  // Notes (optional)
  notes: string | null
}

/**
 * Tabla: cash_transactions
 * Representa una transacción individual del día
 */
export type CashTransaction = {
  id: string // uuid
  clinic_id: string // uuid
  closing_id: string | null // uuid, FK to cash_closings (null if day not closed)
  transaction_date: string // DATE
  created_at: string // timestamptz

  // Transaction details
  patient_id: string | null // uuid, FK to patients
  patient_name: string
  concept: string
  amount: number // decimal(10,2)
  payment_method:
    | 'efectivo'
    | 'tpv'
    | 'transferencia'
    | 'financiacion'
    | 'otros'
  payment_status: 'cobrado' | 'pendiente'
  production_status: 'hecho' | 'pendiente'

  // Optional references
  invoice_id: string | null // uuid, FK to invoices
  appointment_id: string | null // uuid, FK to appointments
  budget_id?: string | null // uuid, FK to budgets (para pagos de cuotas)
  installment_ids?: string[] | null // IDs de las cuotas pagadas
}

// ─────────────────────────────────────────────────────────────
// Mock Data - Simula datos que vendrían de Supabase
// ─────────────────────────────────────────────────────────────

const MOCK_CLINIC_ID = 'clinic-001'
const MOCK_USER_ID = 'user-001'

// ─────────────────────────────────────────────────────────────
// Transacciones mock (simulan tabla cash_transactions)
// VINCULADAS a pacientes y citas reales de PatientsContext y AppointmentsContext
// IDs: tx-{YYYYMMDD}-{seq}
// ─────────────────────────────────────────────────────────────
export const MOCK_TRANSACTIONS: CashTransaction[] = [
  // ─────────────────────────────────────────────────────────────
  // Enero 2026 - Pagos de cuotas de presupuestos formales
  // ─────────────────────────────────────────────────────────────

  // 2 Ene - Ana Martínez - Cuota 5/10 Invisalign
  {
    id: 'tx-20260102-cuota-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260102',
    transaction_date: '2026-01-02',
    created_at: '2026-01-02T09:45:00Z',
    patient_id: 'pat-003',
    patient_name: 'Ana Martínez Sánchez',
    concept: 'Cuota 5/10 - Presupuesto Invisalign completo',
    amount: 350,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260102-01',
    appointment_id: null,
    budget_id: 'budget-003-01',
    installment_ids: ['inst-003-01-5']
  },

  // 3 Ene - Miguel Gómez - Cuota 8/12 Implante
  {
    id: 'tx-20260103-cuota-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260103',
    transaction_date: '2026-01-03',
    created_at: '2026-01-03T09:30:00Z',
    patient_id: 'pat-008',
    patient_name: 'Miguel Gómez Hernández',
    concept: 'Cuota 8/12 - Presupuesto Implante pieza 46',
    amount: 120.83,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260103-cuota',
    appointment_id: null,
    budget_id: 'budget-008-01',
    installment_ids: ['inst-008-01-8']
  },

  // ─────────────────────────────────────────────────────────────
  // Enero 2026 - Citas completadas con pagos
  // ─────────────────────────────────────────────────────────────

  // 3 Ene - Miguel Gómez (cita de control)
  {
    id: 'tx-20260103-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260103',
    transaction_date: '2026-01-03',
    created_at: '2026-01-03T11:30:00Z',
    patient_id: 'pat-008',
    patient_name: 'Miguel Gómez Hernández',
    concept: 'Control implante 46',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-008-01',
    budget_id: null,
    installment_ids: null
  },

  // 6 Ene - Ana Martínez (Invisalign) + Beatriz (limpieza)
  {
    id: 'tx-20260106-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260106',
    transaction_date: '2026-01-06',
    created_at: '2026-01-06T09:30:00Z',
    patient_id: 'pat-003',
    patient_name: 'Ana Martínez Sánchez',
    concept: 'Cuota Invisalign mensual',
    amount: 175,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260106-01',
    appointment_id: 'apt-003-01',
    budget_id: null,
    installment_ids: null
  },
  {
    id: 'tx-20260106-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260106',
    transaction_date: '2026-01-06',
    created_at: '2026-01-06T19:30:00Z',
    patient_id: 'pat-015',
    patient_name: 'Beatriz Muñoz Serrano',
    concept: 'Limpieza semestral',
    amount: 72,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260106-02',
    appointment_id: 'apt-015-01',
    budget_id: null,
    installment_ids: null
  },

  // 7 Ene - Laura Fernández (Invisalign)
  {
    id: 'tx-20260107-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260107',
    transaction_date: '2026-01-07',
    created_at: '2026-01-07T11:30:00Z',
    patient_id: 'pat-005',
    patient_name: 'Laura Fernández Ruiz',
    concept: 'Cuota Invisalign mensual',
    amount: 210,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260107-01',
    appointment_id: 'apt-005-01',
    budget_id: null,
    installment_ids: null
  },

  // 8 Ene - María García (revisión) + Sofía Navarro (consulta)
  {
    id: 'tx-20260108-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260108',
    transaction_date: '2026-01-08',
    created_at: '2026-01-08T10:15:00Z',
    patient_id: 'pat-001',
    patient_name: 'María García López',
    concept: 'Revisión general',
    amount: 45,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260108-01',
    appointment_id: 'apt-001-01',
    budget_id: null,
    installment_ids: null
  },
  {
    id: 'tx-20260108-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260108',
    transaction_date: '2026-01-08',
    created_at: '2026-01-08T12:30:00Z',
    patient_id: 'pat-007',
    patient_name: 'Sofía Navarro Díaz',
    concept: 'Consulta implantes',
    amount: 45,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260108-02',
    appointment_id: 'apt-007-01',
    budget_id: null,
    installment_ids: null
  },

  // 9 Ene - Pablo López (pediátrico)
  {
    id: 'tx-20260109-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260109',
    transaction_date: '2026-01-09',
    created_at: '2026-01-09T17:30:00Z',
    patient_id: 'pat-004',
    patient_name: 'Pablo López García',
    concept: 'Revisión pediátrica',
    amount: 35,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260109-01',
    appointment_id: 'apt-004-01',
    budget_id: null,
    installment_ids: null
  },

  // 10 Ene - Carlos Rodríguez (cita + cuota presupuesto)
  {
    id: 'tx-20260110-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260110',
    transaction_date: '2026-01-10',
    created_at: '2026-01-10T10:30:00Z',
    patient_id: 'pat-002',
    patient_name: 'Carlos Rodríguez Fernández',
    concept: 'Revisión y diagnóstico',
    amount: 45,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260110-01',
    appointment_id: 'apt-002-01',
    budget_id: null,
    installment_ids: null
  },
  // 10 Ene - Carlos Rodríguez - Cuota 1/3 Endodoncia + Corona
  {
    id: 'tx-20260110-cuota-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260110',
    transaction_date: '2026-01-10',
    created_at: '2026-01-10T11:15:00Z',
    patient_id: 'pat-002',
    patient_name: 'Carlos Rodríguez Fernández',
    concept: 'Cuota 1/3 - Presupuesto Endodoncia y corona molar 36',
    amount: 256.67,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260110-cuota',
    appointment_id: null,
    budget_id: 'budget-002-01',
    installment_ids: ['inst-002-01-1']
  },

  // 13 Ene - Ana (limpieza) + Fernando (impresiones)
  {
    id: 'tx-20260113-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260113',
    transaction_date: '2026-01-13',
    created_at: '2026-01-13T09:30:00Z',
    patient_id: 'pat-003',
    patient_name: 'Ana Martínez Sánchez',
    concept: 'Limpieza dental',
    amount: 72,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260113-01',
    appointment_id: 'apt-003-02'
  },
  {
    id: 'tx-20260113-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260113',
    transaction_date: '2026-01-13',
    created_at: '2026-01-13T19:00:00Z',
    patient_id: 'pat-014',
    patient_name: 'Fernando Díaz Ortega',
    concept: 'Impresiones férula',
    amount: 50,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260113-02',
    appointment_id: 'apt-014-01'
  },

  // 14 Ene - Javier Moreno (valoración periodontal)
  {
    id: 'tx-20260114-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260114',
    transaction_date: '2026-01-14',
    created_at: '2026-01-14T12:30:00Z',
    patient_id: 'pat-006',
    patient_name: 'Javier Moreno Torres',
    concept: 'Valoración periodontal',
    amount: 50,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-006-01'
  },

  // 15 Ene - María García (obturación) + Antonio Pérez (limpieza)
  {
    id: 'tx-20260115-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260115',
    transaction_date: '2026-01-15',
    created_at: '2026-01-15T12:00:00Z',
    patient_id: 'pat-001',
    patient_name: 'María García López',
    concept: 'Obturación composite pieza 16',
    amount: 85,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260115-01',
    appointment_id: 'apt-001-02'
  },
  {
    id: 'tx-20260115-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260115',
    transaction_date: '2026-01-15',
    created_at: '2026-01-15T17:30:00Z',
    patient_id: 'pat-010',
    patient_name: 'Antonio Pérez Molina',
    concept: 'Limpieza dental',
    amount: 72,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-010-01'
  },

  // 16 Ene - Carmen Ruiz (control)
  {
    id: 'tx-20260116-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260116',
    transaction_date: '2026-01-16',
    created_at: '2026-01-16T10:30:00Z',
    patient_id: 'pat-012',
    patient_name: 'Carmen Ruiz Jiménez',
    concept: 'Control endodoncia',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-012-01'
  },

  // 17 Ene - Carlos (endodoncia fase 1)
  {
    id: 'tx-20260117-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260117',
    transaction_date: '2026-01-17',
    created_at: '2026-01-17T17:30:00Z',
    patient_id: 'pat-002',
    patient_name: 'Carlos Rodríguez Fernández',
    concept: 'Endodoncia 36 - Fase 1 (cuota 1/3)',
    amount: 106.67,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260117-01',
    appointment_id: 'apt-002-02'
  },

  // 20 Ene - Elena (consulta) + David (periodontal)
  {
    id: 'tx-20260120-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260120',
    transaction_date: '2026-01-20',
    created_at: '2026-01-20T09:30:00Z',
    patient_id: 'pat-009',
    patient_name: 'Elena Vega Castillo',
    concept: 'Primera consulta blanqueamiento',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-009-01'
  },
  {
    id: 'tx-20260120-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260120',
    transaction_date: '2026-01-20',
    created_at: '2026-01-20T13:00:00Z',
    patient_id: 'pat-011',
    patient_name: 'David Sánchez Martín',
    concept: 'Tratamiento periodontal fase 1',
    amount: 50,
    payment_method: 'tpv',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260120-02',
    appointment_id: 'apt-011-01'
  },

  // 21 Ene - Laura (Invisalign)
  {
    id: 'tx-20260121-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260121',
    transaction_date: '2026-01-21',
    created_at: '2026-01-21T11:30:00Z',
    patient_id: 'pat-005',
    patient_name: 'Laura Fernández Ruiz',
    concept: 'Revisión Invisalign',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-005-02'
  },

  // 22 Ene - María (limpieza) + Sofía (implante)
  {
    id: 'tx-20260122-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260122',
    transaction_date: '2026-01-22',
    created_at: '2026-01-22T09:30:00Z',
    patient_id: 'pat-001',
    patient_name: 'María García López',
    concept: 'Limpieza dental',
    amount: 72,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260122-01',
    appointment_id: 'apt-001-03'
  },
  {
    id: 'tx-20260122-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260122',
    transaction_date: '2026-01-22',
    created_at: '2026-01-22T17:30:00Z',
    patient_id: 'pat-007',
    patient_name: 'Sofía Navarro Díaz',
    concept: 'Implante dental pieza 36',
    amount: 800,
    payment_method: 'transferencia',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260122-02',
    appointment_id: 'apt-007-02'
  },

  // 23 Ene - Pablo (selladores)
  {
    id: 'tx-20260123-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260123',
    transaction_date: '2026-01-23',
    created_at: '2026-01-23T17:45:00Z',
    patient_id: 'pat-004',
    patient_name: 'Pablo López García',
    concept: 'Selladores molares x4',
    amount: 60,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260123-01',
    appointment_id: 'apt-004-02'
  },

  // 24 Ene - Carlos (endodoncia fase 2) + Miguel (control)
  {
    id: 'tx-20260124-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260124',
    transaction_date: '2026-01-24',
    created_at: '2026-01-24T17:00:00Z',
    patient_id: 'pat-002',
    patient_name: 'Carlos Rodríguez Fernández',
    concept: 'Endodoncia 36 - Fase 2 (cuota 2/3)',
    amount: 106.67,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260124-01',
    appointment_id: 'apt-002-03'
  },
  {
    id: 'tx-20260124-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260124',
    transaction_date: '2026-01-24',
    created_at: '2026-01-24T10:30:00Z',
    patient_id: 'pat-008',
    patient_name: 'Miguel Gómez Hernández',
    concept: 'Control implante + cuota 5',
    amount: 100,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260124-02',
    appointment_id: 'apt-008-03'
  },

  // 27 Ene - Ana (Invisalign) + Marta (revisión)
  {
    id: 'tx-20260127-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260127',
    transaction_date: '2026-01-27',
    created_at: '2026-01-27T09:30:00Z',
    patient_id: 'pat-003',
    patient_name: 'Ana Martínez Sánchez',
    concept: 'Revisión Invisalign + cuota',
    amount: 175,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260127-01',
    appointment_id: 'apt-003-03'
  },
  {
    id: 'tx-20260127-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260127',
    transaction_date: '2026-01-27',
    created_at: '2026-01-27T18:30:00Z',
    patient_id: 'pat-013',
    patient_name: 'Marta Alonso Blanco',
    concept: 'Revisión pre-empaste',
    amount: 40,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260127-02',
    appointment_id: 'apt-013-01'
  },

  // 28 Ene - María (control) + Javier (raspado)
  {
    id: 'tx-20260128-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260128',
    transaction_date: '2026-01-28',
    created_at: '2026-01-28T10:30:00Z',
    patient_id: 'pat-001',
    patient_name: 'María García López',
    concept: 'Control post-obturación',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-001-04'
  },
  {
    id: 'tx-20260128-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: 'closing-20260128',
    transaction_date: '2026-01-28',
    created_at: '2026-01-28T12:30:00Z',
    patient_id: 'pat-006',
    patient_name: 'Javier Moreno Torres',
    concept: 'Raspado cuadrante 1',
    amount: 120,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'hecho',
    invoice_id: null,
    appointment_id: 'apt-006-02'
  },

  // ─────────────────────────────────────────────────────────────
  // HOY - 31 de Enero 2026 - Transacciones del día
  // ─────────────────────────────────────────────────────────────
  {
    id: 'tx-20260131-01',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T09:30:00Z',
    patient_id: 'pat-001',
    patient_name: 'María García López',
    concept: 'Limpieza semestral',
    amount: 72,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260131-01',
    appointment_id: 'apt-today-01'
  },
  {
    id: 'tx-20260131-02',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T09:45:00Z',
    patient_id: 'pat-002',
    patient_name: 'Carlos Rodríguez Fernández',
    concept: 'Reconstrucción post-endodoncia (cuota 3/3)',
    amount: 106.66,
    payment_method: 'financiacion',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260131-02',
    appointment_id: 'apt-today-02'
  },
  {
    id: 'tx-20260131-03',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T10:00:00Z',
    patient_id: 'pat-004',
    patient_name: 'Pablo López García',
    concept: 'Aplicación de flúor',
    amount: 35,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'hecho',
    invoice_id: 'inv-20260131-03',
    appointment_id: 'apt-today-03'
  },
  {
    id: 'tx-20260131-04',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T10:30:00Z',
    patient_id: 'pat-003',
    patient_name: 'Ana Martínez Sánchez',
    concept: 'Revisión Invisalign (incluida)',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-04'
  },
  {
    id: 'tx-20260131-05',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T11:00:00Z',
    patient_id: 'pat-005',
    patient_name: 'Laura Fernández Ruiz',
    concept: 'Ajuste Invisalign (incluido)',
    amount: 0,
    payment_method: 'efectivo',
    payment_status: 'cobrado',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-05'
  },
  {
    id: 'tx-20260131-06',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T11:30:00Z',
    patient_id: 'pat-006',
    patient_name: 'Javier Moreno Torres',
    concept: 'Raspado cuadrante 2',
    amount: 120,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-08'
  },
  {
    id: 'tx-20260131-07',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T12:00:00Z',
    patient_id: 'pat-012',
    patient_name: 'Carmen Ruiz Jiménez',
    concept: 'Revisión semestral',
    amount: 40,
    payment_method: 'efectivo',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-09'
  },
  {
    id: 'tx-20260131-08',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T12:30:00Z',
    patient_id: 'pat-008',
    patient_name: 'Miguel Gómez Hernández',
    concept: 'Control implante + cuota 6',
    amount: 100,
    payment_method: 'financiacion',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-11'
  },
  {
    id: 'tx-20260131-09',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T16:00:00Z',
    patient_id: 'pat-013',
    patient_name: 'Marta Alonso Blanco',
    concept: 'Empaste molar 16',
    amount: 85,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-12'
  },
  {
    id: 'tx-20260131-10',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T17:00:00Z',
    patient_id: 'pat-014',
    patient_name: 'Fernando Díaz Ortega',
    concept: 'Entrega férula de descarga',
    amount: 300,
    payment_method: 'transferencia',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-13'
  },
  {
    id: 'tx-20260131-11',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T17:30:00Z',
    patient_id: 'pat-015',
    patient_name: 'Beatriz Muñoz Serrano',
    concept: 'Revisión anual',
    amount: 40,
    payment_method: 'efectivo',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-14'
  },
  {
    id: 'tx-20260131-12',
    clinic_id: MOCK_CLINIC_ID,
    closing_id: null,
    transaction_date: '2026-01-31',
    created_at: '2026-01-31T18:00:00Z',
    patient_id: 'pat-010',
    patient_name: 'Antonio Pérez Molina',
    concept: 'Extracción molar 47',
    amount: 90,
    payment_method: 'tpv',
    payment_status: 'pendiente',
    production_status: 'pendiente',
    invoice_id: null,
    appointment_id: 'apt-today-15'
  }
]

// Cierres mock (simulan tabla cash_closings) - Días cerrados de Enero 2026
const INITIAL_MOCK_CLOSINGS: CashClosing[] = [
  {
    id: 'closing-20260103',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-03',
    created_at: '2026-01-03T20:00:00Z',
    updated_at: '2026-01-03T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 100,
    total_expenses: 0,
    cash_outflow: 0,
    final_balance: 200,
    income_by_method: {
      efectivo: 0,
      tpv: 0,
      transferencia: 0,
      financiacion: 100,
      otros: 0
    },
    transaction_count: 1,
    status: 'closed',
    notes: null
  },
  {
    id: 'closing-20260106',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-06',
    created_at: '2026-01-06T20:00:00Z',
    updated_at: '2026-01-06T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 247,
    total_expenses: 0,
    cash_outflow: 100,
    final_balance: 247,
    income_by_method: {
      efectivo: 0,
      tpv: 72,
      transferencia: 0,
      financiacion: 175,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: null
  },
  {
    id: 'closing-20260108',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-08',
    created_at: '2026-01-08T20:00:00Z',
    updated_at: '2026-01-08T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 90,
    total_expenses: 0,
    cash_outflow: 50,
    final_balance: 140,
    income_by_method: {
      efectivo: 45,
      tpv: 45,
      transferencia: 0,
      financiacion: 0,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: null
  },
  {
    id: 'closing-20260115',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-15',
    created_at: '2026-01-15T20:00:00Z',
    updated_at: '2026-01-15T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 85,
    total_expenses: 0,
    cash_outflow: 0,
    final_balance: 185,
    income_by_method: {
      efectivo: 85,
      tpv: 0,
      transferencia: 0,
      financiacion: 0,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: 'Antonio Pérez pendiente de pago'
  },
  {
    id: 'closing-20260122',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-22',
    created_at: '2026-01-22T20:00:00Z',
    updated_at: '2026-01-22T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 872,
    total_expenses: 0,
    cash_outflow: 300,
    final_balance: 672,
    income_by_method: {
      efectivo: 72,
      tpv: 0,
      transferencia: 800,
      financiacion: 0,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: 'Implante Sofía Navarro - transferencia recibida'
  },
  {
    id: 'closing-20260127',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-27',
    created_at: '2026-01-27T20:00:00Z',
    updated_at: '2026-01-27T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 215,
    total_expenses: 0,
    cash_outflow: 100,
    final_balance: 215,
    income_by_method: {
      efectivo: 40,
      tpv: 0,
      transferencia: 0,
      financiacion: 175,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: null
  },
  {
    id: 'closing-20260128',
    clinic_id: MOCK_CLINIC_ID,
    closing_date: '2026-01-28',
    created_at: '2026-01-28T20:00:00Z',
    updated_at: '2026-01-28T20:00:00Z',
    closed_by: MOCK_USER_ID,
    initial_cash: 100,
    total_income: 0,
    total_expenses: 0,
    cash_outflow: 0,
    final_balance: 100,
    income_by_method: {
      efectivo: 0,
      tpv: 0,
      transferencia: 0,
      financiacion: 0,
      otros: 0
    },
    transaction_count: 2,
    status: 'closed',
    notes: 'Javier Moreno pendiente 120€ (raspado Q1)'
  }
]

// ─────────────────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────────────────

// Datos para registrar pago de cuotas de presupuesto
export type RegisterBudgetPaymentInput = {
  patientId: string
  patientName: string
  budgetId: string
  budgetDescription: string
  amount: number
  paymentMethod: CashTransaction['payment_method']
  installmentIds: string[]
  reference?: string
}

type CashClosingContextValue = {
  // State
  closings: CashClosing[]
  transactions: CashTransaction[]
  receipts: Receipt[]

  // Queries
  getClosingByDate: (date: string) => CashClosing | undefined
  isDayClosed: (date: string) => boolean
  getTransactionsByDate: (date: string) => CashTransaction[]
  getDaySummary: (date: string) => DaySummary
  getReceiptsByPatient: (patientId: string) => Receipt[]
  getReceiptByTransaction: (transactionId: string) => Receipt | undefined

  // Mutations
  closeDay: (date: string, cashOutflow: number, notes?: string) => Promise<CashClosing>
  reopenDay: (date: string) => Promise<void>
  registerBudgetPayment: (data: RegisterBudgetPaymentInput) => CashTransaction
  registerSimplePayment: (data: RegisterSimplePaymentData) => CashTransaction
  generateReceipt: (data: GenerateReceiptData) => Receipt
  updateTransactionStatus: (
    transactionId: string,
    status: 'cobrado' | 'pendiente'
  ) => void
  generateInvoiceForTransaction: (transactionId: string) => string // Returns invoice_id

  // Available dates (days with transactions)
  getAvailableDates: () => string[]
}

export type DaySummary = {
  date: string
  initialCash: number
  totalIncome: number
  totalExpenses: number
  finalBalance: number
  incomeByMethod: {
    efectivo: number
    tpv: number
    transferencia: number
    financiacion: number
    otros: number
  }
  transactionCount: number
  transactions: CashTransaction[]
  isClosed: boolean
  closing?: CashClosing
}

function mapDbPaymentMethodToUi(value: string | null): CashTransaction['payment_method'] {
  switch ((value || '').toLowerCase()) {
    case 'efectivo':
    case 'cash':
      return 'efectivo'
    case 'tpv':
    case 'card':
      return 'tpv'
    case 'transferencia':
    case 'transfer':
      return 'transferencia'
    case 'financiacion':
    case 'financing':
      return 'financiacion'
    default:
      return 'otros'
  }
}

function mapDbProductionStatus(value: string | null): CashTransaction['production_status'] {
  return String(value || '').toLowerCase() === 'done' ? 'hecho' : 'pendiente'
}

function isoDate(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function madridIsoDate(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

type DbCajaMovementRow = {
  invoice_id: number | null
  invoice_number: string | null
  issue_timestamp: string | null
  day_madrid: string | null
  patient_first_name: string | null
  patient_last_name: string | null
  quote_id: number | null
  quote_number: string | null
  production_status: string | null
  total_paid: number | string | null
  last_payment_method: string | null
}

type DbPaymentRow = {
  id: string | number | null
  invoice_id: string | number | null
  patient_id: string | null
  amount: number | string | null
  payment_method: string | null
  transaction_date: string | null
  concept: string | null
}

type DbInvoiceMetaRow = {
  id: string | number
  invoice_number: string | null
  quote_id: string | number | null
  patients?: {
    first_name?: string | null
    last_name?: string | null
  } | null
  quotes?: {
    quote_number?: string | null
    production_status?: string | null
  } | null
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const CashClosingContext = createContext<CashClosingContextValue | null>(null)

export function CashClosingProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [closings, setClosings] = useState<CashClosing[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [refreshToken, setRefreshToken] = useState(0)
  const clinicIdRef = useRef<string | null>(null)
  const staffIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function hydrateCashData() {
      try {
        if (!isClinicInitialized) return

        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session || !activeClinicId) {
          if (isMounted) {
            setClosings([])
            setTransactions([])
          }
          return
        }

        staffIdRef.current = session.user.id
        const clinicId = activeClinicId
        clinicIdRef.current = clinicId

        const start = new Date()
        start.setDate(start.getDate() - 365)
        const end = new Date()
        end.setDate(end.getDate() + 1)

        const [{ data: closingRows }, { data: movementRows }, { data: paymentRows, error: paymentRowsError }] = await Promise.all([
          supabase
            .from('daily_cash_closings')
            .select(
              'id, clinic_id, closing_date, staff_id, notes, starter_box_amount, daily_box_amount, cash_withdrawals, cash_balance, card_total, financed_total, payment_method_breakdown'
            )
            .eq('clinic_id', clinicId)
            .order('closing_date', { ascending: false }),
          supabase.rpc('get_caja_movements_in_time_range', {
            p_clinic_id: clinicId,
            p_start_time: start.toISOString(),
            p_end_time: end.toISOString()
          }),
          supabase
            .from('payments')
            .select('id, invoice_id, patient_id, amount, payment_method, transaction_date, concept')
            .eq('clinic_id', clinicId)
            .is('voided_at', null)
            .gte('transaction_date', start.toISOString())
            .lte('transaction_date', end.toISOString())
            .order('transaction_date', { ascending: false })
            .limit(5000)
        ])

        if (paymentRowsError) {
          console.warn('CashClosingContext payment hydration failed', paymentRowsError)
        }

        const rpcMetaByInvoice = new Map<
          string,
          { patientName: string; concept: string; quoteId: string | null; productionStatus: string | null }
        >()
        for (const row of (movementRows || []) as DbCajaMovementRow[]) {
          const invoiceId = row.invoice_id != null ? String(row.invoice_id) : ''
          if (!invoiceId || rpcMetaByInvoice.has(invoiceId)) continue
          const patientName = [row.patient_first_name, row.patient_last_name]
            .filter(Boolean)
            .join(' ')
            .trim()
          rpcMetaByInvoice.set(invoiceId, {
            patientName: patientName || 'Paciente',
            concept: row.quote_number || row.invoice_number || 'Movimiento caja',
            quoteId: row.quote_id != null ? String(row.quote_id) : null,
            productionStatus: row.production_status || null
          })
        }

        const paymentInvoiceIds = Array.from(
          new Set(
            ((paymentRows || []) as DbPaymentRow[])
              .map((row) => (row.invoice_id != null ? String(row.invoice_id) : ''))
              .filter(Boolean)
          )
        )

        const invoiceMetaById = new Map<
          string,
          { patientName: string; concept: string; quoteId: string | null; productionStatus: string | null }
        >()

        if (paymentInvoiceIds.length > 0) {
          const { data: invoiceRows, error: invoiceRowsError } = await supabase
            .from('invoices')
            .select(
              `
              id,
              invoice_number,
              quote_id,
              patients (
                first_name,
                last_name
              ),
              quotes (
                quote_number,
                production_status
              )
            `
            )
            .eq('clinic_id', clinicId)
            .in('id', paymentInvoiceIds)

          if (invoiceRowsError) {
            console.warn('CashClosingContext invoice meta hydration failed', invoiceRowsError)
          } else {
            for (const row of (invoiceRows || []) as unknown as DbInvoiceMetaRow[]) {
              const patientName = [
                row.patients?.first_name || '',
                row.patients?.last_name || ''
              ]
                .join(' ')
                .trim()
              const concept = row.quotes?.quote_number || row.invoice_number || 'Movimiento caja'
              invoiceMetaById.set(String(row.id), {
                patientName: patientName || 'Paciente',
                concept,
                quoteId: row.quote_id != null ? String(row.quote_id) : null,
                productionStatus: row.quotes?.production_status || null
              })
            }
          }
        }

        const mappedClosings = (closingRows || []).map((row) => {
          const breakdown =
            (row.payment_method_breakdown as Record<string, number> | null) || {}
          const initialCash = Number(row.starter_box_amount ?? 100)
          const dailyCash = Number(row.daily_box_amount ?? 0)
          const cardTotal = Number(row.card_total ?? 0)
          const financedTotal = Number(row.financed_total ?? 0)
          const cashOutflow = Number(row.cash_withdrawals ?? 0)
          const finalBalance = Number(
            row.cash_balance ?? initialCash + dailyCash - cashOutflow
          )

          return {
            id: String(row.id),
            clinic_id: row.clinic_id,
            closing_date: row.closing_date,
            created_at: `${row.closing_date}T20:00:00.000Z`,
            updated_at: `${row.closing_date}T20:00:00.000Z`,
            closed_by: row.staff_id,
            initial_cash: initialCash,
            total_income:
              dailyCash + cardTotal + financedTotal + Number(breakdown.transfer || 0),
            total_expenses: 0,
            cash_outflow: cashOutflow,
            final_balance: finalBalance,
            income_by_method: {
              efectivo: Number(breakdown.cash ?? dailyCash),
              tpv: Number(breakdown.card ?? cardTotal),
              transferencia: Number(breakdown.transfer ?? 0),
              financiacion: Number(financedTotal),
              otros: Number(breakdown.other ?? 0)
            },
            transaction_count: 0,
            status: 'closed' as const,
            notes: row.notes
          } as CashClosing
        })

        const closingByDate = new Map(
          mappedClosings.map((closing) => [closing.closing_date, closing])
        )

        const mappedTransactions: CashTransaction[] = ((paymentRows || []) as DbPaymentRow[])
          .filter((row) => Number(row.amount || 0) > 0)
          .map((row) => {
            const invoiceId =
              row.invoice_id != null ? String(row.invoice_id) : null
            const transactionDateRaw = row.transaction_date || new Date().toISOString()
            const date = madridIsoDate(transactionDateRaw)
            const invoiceMeta = invoiceId
              ? invoiceMetaById.get(invoiceId) || rpcMetaByInvoice.get(invoiceId)
              : null

            return {
              id: row.id != null ? `pay-${row.id}` : `pay-${Date.now()}`,
              clinic_id: clinicId,
              closing_id: closingByDate.get(date)?.id || null,
              transaction_date: date,
              created_at: transactionDateRaw,
              patient_id: row.patient_id || null,
              patient_name: invoiceMeta?.patientName || 'Paciente',
              concept: invoiceMeta?.concept || row.concept || 'Movimiento caja',
              amount: Number(row.amount || 0),
              payment_method: mapDbPaymentMethodToUi(row.payment_method),
              payment_status: 'cobrado',
              production_status: mapDbProductionStatus(
                invoiceMeta?.productionStatus || null
              ),
              invoice_id: invoiceId,
              appointment_id: null,
              budget_id: invoiceMeta?.quoteId || null,
              installment_ids: null
            }
          })

        const txCountByDate = new Map<string, number>()
        for (const tx of mappedTransactions) {
          txCountByDate.set(
            tx.transaction_date,
            (txCountByDate.get(tx.transaction_date) || 0) + 1
          )
        }

        const closingsWithCount = mappedClosings.map((closing) => ({
          ...closing,
          transaction_count: txCountByDate.get(closing.closing_date) || 0
        }))

        if (isMounted) {
          setClosings(closingsWithCount)
          setTransactions(mappedTransactions)
        }
      } catch (error) {
        console.warn('CashClosingContext DB hydration failed, using local state', error)
        if (isMounted) {
          setClosings([])
          setTransactions([])
        }
      }
    }

    void hydrateCashData()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized, refreshToken])

  useEffect(() => {
    const onRefresh = () => setRefreshToken((prev) => prev + 1)
    if (typeof window !== 'undefined') {
      window.addEventListener('caja:refresh-closing', onRefresh as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('caja:refresh-closing', onRefresh as EventListener)
      }
    }
  }, [])

  const createInvoiceAndPayment = useCallback(
    async (input: {
      patientId: string
      amount: number
      paymentMethod: string
      reference?: string
      concept: string
      paymentDate?: Date
    }): Promise<string | null> => {
      const clinicId = clinicIdRef.current
      const staffId = staffIdRef.current
      if (!clinicId || !staffId) return null

      try {
        const supabase = createSupabaseBrowserClient()
        const paymentDate = input.paymentDate || new Date()

        const { data: invoiceNumberData } = await supabase.rpc(
          'get_next_invoice_number',
          { p_clinic_id: clinicId, p_series_id: null }
        )
        const payload = (invoiceNumberData || {}) as Record<string, unknown>
        const invoiceNumber =
          typeof payload.invoice_number === 'string'
            ? payload.invoice_number
            : `TMP-${Date.now()}`
        const seriesId =
          typeof payload.series_id === 'number' ? payload.series_id : null

        const { data: invoiceRow, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            patient_id: input.patientId,
            clinic_id: clinicId,
            invoice_number: invoiceNumber,
            total_amount: input.amount,
            amount_paid: input.amount,
            status: 'open',
            issue_timestamp: paymentDate.toISOString(),
            series_id: seriesId
          })
          .select('id')
          .single()

        if (invoiceError || !invoiceRow) {
          console.warn('No se pudo crear invoice para caja', invoiceError)
          return null
        }

        const { error: paymentError } = await supabase.from('payments').insert({
          invoice_id: invoiceRow.id,
          clinic_id: clinicId,
          staff_id: staffId,
          payment_method: input.paymentMethod,
          amount: input.amount,
          transaction_date: paymentDate.toISOString(),
          transaction_id: input.reference || null,
          notes: input.concept
        })

        if (paymentError) {
          console.warn('No se pudo crear payment para caja', paymentError)
        }

        return String(invoiceRow.id)
      } catch (error) {
        console.warn('Error creando invoice/payment en caja', error)
        return null
      }
    },
    []
  )

  const getClosingByDate = useCallback(
    (date: string) => {
      return closings.find((c) => c.closing_date === date)
    },
    [closings]
  )

  const isDayClosed = useCallback(
    (date: string) => {
      const closing = getClosingByDate(date)
      return closing?.status === 'closed'
    },
    [getClosingByDate]
  )

  const getTransactionsByDate = useCallback(
    (date: string) => {
      return transactions.filter((t) => t.transaction_date === date)
    },
    [transactions]
  )

  const getDaySummary = useCallback(
    (date: string): DaySummary => {
      const dayTransactions = getTransactionsByDate(date)
      const closing = getClosingByDate(date)

      // Calculate totals from transactions
      const incomeByMethod = {
        efectivo: 0,
        tpv: 0,
        transferencia: 0,
        financiacion: 0,
        otros: 0
      }

      let totalIncome = 0
      dayTransactions.forEach((t) => {
        if (t.payment_status === 'cobrado') {
          totalIncome += t.amount
          incomeByMethod[t.payment_method] += t.amount
        }
      })

      // Use closing data if available, otherwise calculate
      const initialCash = closing?.initial_cash ?? 100 // Default initial cash
      const totalExpenses = closing?.total_expenses ?? 0
      const finalBalance = initialCash + totalIncome - totalExpenses

      return {
        date,
        initialCash,
        totalIncome,
        totalExpenses,
        finalBalance,
        incomeByMethod,
        transactionCount: dayTransactions.length,
        transactions: dayTransactions,
        isClosed: closing?.status === 'closed',
        closing
      }
    },
    [getTransactionsByDate, getClosingByDate]
  )

  const closeDay = useCallback(
    async (date: string, cashOutflow: number, notes?: string): Promise<CashClosing> => {
      const summary = getDaySummary(date)
      const existingClosing = getClosingByDate(date)
      const clinicId = clinicIdRef.current || existingClosing?.clinic_id
      const staffId = staffIdRef.current || existingClosing?.closed_by
      if (!clinicId || !staffId) {
        throw new Error('No clinic/staff context available to close day')
      }

      const newClosing: CashClosing = {
        id: existingClosing?.id ?? `closing-${Date.now()}`,
        clinic_id: clinicId,
        closing_date: date,
        created_at: existingClosing?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_by: staffId,
        initial_cash: summary.initialCash,
        total_income: summary.totalIncome,
        total_expenses: summary.totalExpenses,
        cash_outflow: cashOutflow,
        final_balance: summary.finalBalance - cashOutflow,
        income_by_method: summary.incomeByMethod,
        transaction_count: summary.transactionCount,
        status: 'closed',
        notes: notes ?? null
      }

      // Persist to DB first, then update local state
      if (clinicIdRef.current && staffIdRef.current) {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.from('daily_cash_closings').upsert(
          {
            clinic_id: clinicIdRef.current,
            closing_date: date,
            staff_id: staffIdRef.current,
            expected_cash: summary.finalBalance,
            actual_cash: newClosing.final_balance,
            card_total: summary.incomeByMethod.tpv,
            financed_total: summary.incomeByMethod.financiacion,
            discrepancy: 0,
            notes: notes ?? null,
            starter_box_amount: summary.initialCash,
            daily_box_amount: summary.incomeByMethod.efectivo,
            cash_withdrawals: cashOutflow,
            cash_balance: newClosing.final_balance,
            payment_method_breakdown: {
              cash: summary.incomeByMethod.efectivo,
              card: summary.incomeByMethod.tpv,
              transfer: summary.incomeByMethod.transferencia,
              financing: summary.incomeByMethod.financiacion,
              other: summary.incomeByMethod.otros
            }
          },
          { onConflict: 'clinic_id,closing_date' }
        )

        if (error) {
          throw new Error(`Error al cerrar caja: ${error.message}`)
        }
      }

      setClosings((prev) => {
        const filtered = prev.filter((c) => c.closing_date !== date)
        return [...filtered, newClosing]
      })

      return newClosing
    },
    [getDaySummary, getClosingByDate]
  )

  const reopenDay = useCallback(async (date: string): Promise<void> => {
    const clinicId = clinicIdRef.current
    if (!clinicId) {
      throw new Error('No clinic context available to reopen day')
    }

    // Delete from DB first, then update local state
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase
      .from('daily_cash_closings')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('closing_date', date)

    if (error) {
      throw new Error(`Error al reabrir caja: ${error.message}`)
    }

    // Remove the closing from local state (consistent with DB delete)
    setClosings((prev) => prev.filter((c) => c.closing_date !== date))
  }, [])

  // Registrar pago de cuotas de presupuesto
  const registerBudgetPayment = useCallback(
    (data: RegisterBudgetPaymentInput): CashTransaction => {
      const today = new Date().toISOString().split('T')[0]
      const clinicId = clinicIdRef.current
      if (!clinicId) {
        throw new Error('No clinic context available')
      }
      const newTransaction: CashTransaction = {
        id: `tx-budget-${Date.now()}`,
        clinic_id: clinicId,
        closing_id: null,
        transaction_date: today,
        created_at: new Date().toISOString(),
        patient_id: data.patientId,
        patient_name: data.patientName,
        concept: `Cuota presupuesto: ${data.budgetDescription}`,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_status: 'cobrado',
        production_status: 'hecho',
        invoice_id: null,
        appointment_id: null,
        budget_id: data.budgetId,
        installment_ids: data.installmentIds
      }

      setTransactions((prev) => [newTransaction, ...prev])

      void (async () => {
        const invoiceId = await createInvoiceAndPayment({
          patientId: data.patientId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          concept: `Cuota presupuesto: ${data.budgetDescription}`,
          paymentDate: new Date()
        })

        if (!invoiceId) return
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === newTransaction.id ? { ...tx, invoice_id: invoiceId } : tx
          )
        )
      })()

      return newTransaction
    },
    [createInvoiceAndPayment]
  )

  // Registrar pago simple (no de presupuesto)
  const registerSimplePayment = useCallback(
    (data: RegisterSimplePaymentData): CashTransaction => {
      const today = new Date().toISOString().split('T')[0]
      const clinicId = clinicIdRef.current
      if (!clinicId) {
        throw new Error('No clinic context available')
      }
      const newTransaction: CashTransaction = {
        id: `tx-payment-${Date.now()}`,
        clinic_id: clinicId,
        closing_id: null,
        transaction_date: today,
        created_at: new Date().toISOString(),
        patient_id: data.patientId,
        patient_name: data.patientName,
        concept: data.concept,
        amount: data.amount,
        payment_method: data.paymentMethod as CashTransaction['payment_method'],
        payment_status: 'cobrado',
        production_status: 'hecho',
        invoice_id: null,
        appointment_id: null,
        budget_id: null,
        installment_ids: null
      }

      setTransactions((prev) => [newTransaction, ...prev])

      void (async () => {
        const invoiceId = await createInvoiceAndPayment({
          patientId: data.patientId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          concept: data.concept,
          paymentDate: new Date()
        })
        if (!invoiceId) return
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === newTransaction.id ? { ...tx, invoice_id: invoiceId } : tx
          )
        )
      })()

      return newTransaction
    },
    [createInvoiceAndPayment]
  )

  // Generar y guardar recibo
  const generateReceipt = useCallback(
    (data: GenerateReceiptData): Receipt => {
      const receipt: Receipt = {
        id: `receipt-${Date.now()}`,
        receiptNumber: generateReceiptNumber(),
        date: new Date().toISOString(),
        patientId: data.patientId,
        patientName: data.patientName,
        concept: data.concept,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        transactionId: data.transactionId,
        createdAt: new Date().toISOString(),
        clinicName: 'Clínica Dental KlinikOS',
        clinicNIF: 'B12345678',
        clinicAddress: 'Calle Ejemplo 123, Madrid'
      }

      setReceipts((prev) => [...prev, receipt])
      return receipt
    },
    []
  )

  // Obtener recibos por paciente
  const getReceiptsByPatient = useCallback(
    (patientId: string): Receipt[] => {
      return receipts.filter((r) => r.patientId === patientId)
    },
    [receipts]
  )

  // Obtener recibo por transacción
  const getReceiptByTransaction = useCallback(
    (transactionId: string): Receipt | undefined => {
      return receipts.find((r) => r.transactionId === transactionId)
    },
    [receipts]
  )

  // Actualizar estado de transacción
  const updateTransactionStatus = useCallback(
    (transactionId: string, status: 'cobrado' | 'pendiente') => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, payment_status: status } : t
        )
      )
    },
    []
  )

  // Generar factura para transacción
  const generateInvoiceForTransaction = useCallback(
    (transactionId: string): string => {
      const optimisticInvoiceId = `inv-${Date.now()}`

      const tx = transactions.find((item) => item.id === transactionId)
      if (!tx || !tx.patient_id) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, invoice_id: optimisticInvoiceId }
              : t
          )
        )
        return optimisticInvoiceId
      }
      const patientId = tx.patient_id

      void (async () => {
        const invoiceId = await createInvoiceAndPayment({
          patientId,
          amount: tx.amount,
          paymentMethod: tx.payment_method,
          concept: tx.concept,
          paymentDate: new Date(tx.created_at)
        })
        if (!invoiceId) return
        setTransactions((prev) =>
          prev.map((item) =>
            item.id === transactionId ? { ...item, invoice_id: invoiceId } : item
          )
        )
      })()

      return optimisticInvoiceId
    },
    [createInvoiceAndPayment, transactions]
  )

  const getAvailableDates = useCallback(() => {
    const dates = new Set([
      ...transactions.map((t) => t.transaction_date),
      ...closings.map((c) => c.closing_date)
    ])
    return Array.from(dates).sort((a, b) => b.localeCompare(a)) // Most recent first
  }, [transactions, closings])

  const value = useMemo(
    () => ({
      closings,
      transactions,
      receipts,
      getClosingByDate,
      isDayClosed,
      getTransactionsByDate,
      getDaySummary,
      getReceiptsByPatient,
      getReceiptByTransaction,
      closeDay,
      reopenDay,
      registerBudgetPayment,
      registerSimplePayment,
      generateReceipt,
      updateTransactionStatus,
      generateInvoiceForTransaction,
      getAvailableDates
    }),
    [
      closings,
      transactions,
      receipts,
      getClosingByDate,
      isDayClosed,
      getTransactionsByDate,
      getDaySummary,
      getReceiptsByPatient,
      getReceiptByTransaction,
      closeDay,
      reopenDay,
      registerBudgetPayment,
      registerSimplePayment,
      generateReceipt,
      updateTransactionStatus,
      generateInvoiceForTransaction,
      getAvailableDates
    ]
  )

  return (
    <CashClosingContext.Provider value={value}>
      {children}
    </CashClosingContext.Provider>
  )
}

export function useCashClosing() {
  const context = useContext(CashClosingContext)
  if (!context) {
    throw new Error('useCashClosing must be used within a CashClosingProvider')
  }
  return context
}

// ─────────────────────────────────────────────────────────────
// SQL Schema Reference (for Supabase migration)
// ─────────────────────────────────────────────────────────────

/*
-- Enum for payment methods
CREATE TYPE payment_method AS ENUM ('efectivo', 'tpv', 'transferencia', 'financiacion', 'otros');

-- Enum for closing status
CREATE TYPE closing_status AS ENUM ('open', 'closed', 'reopened');

-- Enum for payment status
CREATE TYPE payment_status AS ENUM ('cobrado', 'pendiente');

-- Enum for production status
CREATE TYPE production_status AS ENUM ('hecho', 'pendiente');

-- Cash closings table
CREATE TABLE cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  closing_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by UUID NOT NULL REFERENCES users(id),
  
  initial_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash_outflow DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  income_by_method JSONB NOT NULL DEFAULT '{"efectivo": 0, "tpv": 0, "transferencia": 0, "financiacion": 0, "otros": 0}',
  transaction_count INTEGER NOT NULL DEFAULT 0,
  status closing_status NOT NULL DEFAULT 'closed',
  notes TEXT,
  
  UNIQUE(clinic_id, closing_date)
);

-- Cash transactions table
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  closing_id UUID REFERENCES cash_closings(id),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  concept TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pendiente',
  production_status production_status NOT NULL DEFAULT 'pendiente',
  
  invoice_id UUID REFERENCES invoices(id),
  appointment_id UUID REFERENCES appointments(id)
);

-- Indexes
CREATE INDEX idx_cash_closings_clinic_date ON cash_closings(clinic_id, closing_date);
CREATE INDEX idx_cash_transactions_date ON cash_transactions(transaction_date);
CREATE INDEX idx_cash_transactions_clinic ON cash_transactions(clinic_id);

-- RLS Policies (example)
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic's closings"
  ON cash_closings FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM user_clinics WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert closings for their clinic"
  ON cash_closings FOR INSERT
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM user_clinics WHERE user_id = auth.uid()));
*/
