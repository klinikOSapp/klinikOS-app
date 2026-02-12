import type { CashTimeScale } from '@/components/caja/cajaTypes'

export type Specialty =
  | 'Conservadora'
  | 'Ortodoncia'
  | 'Implantes'
  | 'Estética'

export const SPECIALTIES: Specialty[] = [
  'Conservadora',
  'Ortodoncia',
  'Implantes',
  'Estética'
]

export type SpecialtyFilter = Specialty | null

export type GestionSummaryKpis = {
  produced: number
  invoiced: number
  collected: number
  pending: number
  producedDelta: number
  invoicedDelta: number
  collectedDelta: number
  pendingDelta: number | null
}

export type GestionIncomeMethod = {
  label: string
  amount: number
  percent: number
}

export type GestionPatientsSummary = {
  active: number
  nextDate: number
  growthPercent: number
}

export type GestionSpecialtyMetric = {
  label: Specialty
  produced: number
  invoiced: number
  collected: number
  pending: number
  sharePercent: number
}

export type GestionBillingPoint = {
  label: string
  current: number | null
  previous: number | null
}

export type GestionProfessionalMetric = {
  name: string
  produced: number
  appointmentCount: number
}

export type GestionOverviewResponse = {
  timeScale: CashTimeScale
  anchorDate: string
  summary: GestionSummaryKpis
  incomeMethods: GestionIncomeMethod[]
  patients: GestionPatientsSummary
  specialties: GestionSpecialtyMetric[]
  billing: {
    points: GestionBillingPoint[]
  }
  professionals: GestionProfessionalMetric[]
  accounting: {
    fixedCosts: number
    fixedCostRatio: number
  }
}
