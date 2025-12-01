export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Structure for SOAP notes display
export type SoapNote = {
  S?: string // Subjetivo
  O?: string // Objetivo
  A?: string // Evaluación (Assessment)
  P?: string // Plan
  createdAt?: string
  createdBy?: string
}

export type ClinicalNoteDisplay = {
  type: string
  content: string
  createdAt?: string
  createdBy?: string
  soap?: SoapNote // If it's a SOAP note
}

export type EventDetail = {
  title: string
  date: string
  duration?: string
  startTime?: string
  endTime?: string
  patientFull: string
  patientPhone?: string
  patientEmail?: string
  referredBy?: string
  source?: string
  professional: string
  professionalAvatar?: string
  economicAmount?: string
  economicStatus?: string
  notes?: string
  clinicalNotes?: string
  clinicalNotesStructured?: ClinicalNoteDisplay[]
  locationLabel: string
  patientLabel: string
  professionalLabel: string
  economicLabel?: string
  notesLabel?: string
  overlayOffsets?: {
    top?: string
    left?: string
  }
  // For action buttons
  appointmentId?: number
  appointmentStatus?: string
}

export type AgendaEvent = {
  id: string
  top: string
  height: string
  title: string
  patient: string
  box: string
  timeRange: string
  backgroundClass: string
  borderClass?: string
  detail?: EventDetail
}

export type DayColumn = {
  id: Weekday
  leftVar: string
  widthVar: string
  events: AgendaEvent[]
}

export type EventSelection = { event: AgendaEvent; column: DayColumn } | null

