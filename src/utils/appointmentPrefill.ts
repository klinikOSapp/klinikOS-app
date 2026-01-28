const STORAGE_KEY = 'pending-appointment-prefill'

export type PendingAppointmentData = {
  servicio?: string
  paciente?: string
  pacienteId?: string
  responsable?: string
  observaciones?: string
  linkedTreatments?: { id: string; description: string; amount: string }[]
}

export function setPendingAppointmentData(data: PendingAppointmentData) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getPendingAppointmentData(): PendingAppointmentData | null {
  const data = sessionStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

export function clearPendingAppointmentData() {
  sessionStorage.removeItem(STORAGE_KEY)
}
