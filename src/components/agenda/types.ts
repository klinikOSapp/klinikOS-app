export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type EventDetail = {
  title: string
  date: string
  duration?: string
  patientFull: string
  patientPhone?: string
  patientEmail?: string
  referredBy?: string
  professional: string
  professionalAvatar?: string
  economicAmount?: string
  economicStatus?: string
  notes?: string
  locationLabel: string
  patientLabel: string
  professionalLabel: string
  economicLabel?: string
  notesLabel?: string
  overlayOffsets?: {
    top?: string
    left?: string
  }
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
  left?: string
  width?: string
  detail?: EventDetail
}

export type DayColumn = {
  id: Weekday
  leftVar: string
  widthVar: string
  events: AgendaEvent[]
}

export type EventSelection = { event: AgendaEvent; column: DayColumn } | null

