import type { Appointment, LinkedTreatmentStatus, VisitStatus } from '@/context/AppointmentsContext'

// Filter types for the clinical history timeline
export type ClinicalHistoryFilter = 'todas' | 'proximas' | 'pasadas' | 'confirmadas' | 'inasistencia'

// Props for the VisitCard component
export type VisitCardProps = {
  appointment: Appointment
  selected: boolean
  onClick: () => void
  isUpcoming: boolean
}

// Props for the VisitDetailPanel component
export type VisitDetailPanelProps = {
  appointment: Appointment | null
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onSOAPChange: (field: 'subjective' | 'objective' | 'assessment' | 'plan', value: string) => void
  onTreatmentStatusChange: (treatmentId: string, status: LinkedTreatmentStatus) => void
  onUploadAttachment: () => void
  onRemoveAttachment: (attachmentId: string) => void
}

// Treatment status badge config
export const TREATMENT_STATUS_CONFIG: Record<
  LinkedTreatmentStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  pending: {
    label: 'Pendiente',
    bgColor: '#FEF3C7',
    textColor: '#D97706'
  },
  in_progress: {
    label: 'En progreso',
    bgColor: '#DBEAFE',
    textColor: '#2563EB'
  },
  completed: {
    label: 'Realizado',
    bgColor: '#E9FBF9',
    textColor: 'var(--color-brand-700)'
  },
  cancelled: {
    label: 'Cancelado',
    bgColor: '#FEE2E2',
    textColor: '#DC2626'
  }
}

// Visit status label mapping
export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'Programada',
  waiting_room: 'En espera',
  call_patient: 'Llamar',
  in_consultation: 'En consulta',
  completed: 'Completada'
}

// Helper function to format date for display
export function formatVisitDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  return date.toLocaleDateString('es-ES', options)
}

// Helper function to format short date
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Helper to get time range display
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}

// Helper to calculate duration in minutes
export function calculateDurationMinutes(ms: number): number {
  return Math.round(ms / 60000)
}
