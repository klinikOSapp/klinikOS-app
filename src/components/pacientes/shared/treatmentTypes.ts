// Tipos compartidos para tratamientos
// Usados en patient-file/Treatments.tsx y patient-record/Treatments.tsx

export type TreatmentStatus =
  | 'Aceptado'
  | 'No aceptado'
  | 'Recall'
  | 'Pagado'
  | 'Sin pagar'

export type Treatment = {
  id: string
  description: string
  date: string | 'Sin fecha'
  amount: string
  discount?: number // Porcentaje de descuento (0-100) - solo usado en patient-record
  status: TreatmentStatus
  professional: string
  selected?: boolean
  _internalId?: string // ID interno único para React keys - solo usado en patient-record
}

// Catálogo de tratamientos por acrónimo
export type TreatmentCatalog = {
  [acronym: string]: {
    description: string
    amount: string
  }
}

export const TREATMENT_CATALOG: TreatmentCatalog = {
  LDE: {
    description: 'Limpieza dental',
    amount: '72 €'
  },
  BLD: {
    description: 'Blanqueamiento dental',
    amount: '200 €'
  },
  OPM: {
    description: 'Operación mandíbula',
    amount: '2.300 €'
  },
  CI: {
    description: 'Consulta inicial',
    amount: '150 €'
  },
  RX: {
    description: 'Radiografía',
    amount: '100 €'
  },
  EXM: {
    description: 'Extracción de muela',
    amount: '500 €'
  },
  IMP: {
    description: 'Implante dental',
    amount: '1.200 €'
  },
  FER: {
    description: 'Férula de descarga',
    amount: '300 €'
  },
  EMP: {
    description: 'Empaste / Obturación',
    amount: '80 €'
  },
  END: {
    description: 'Endodoncia',
    amount: '400 €'
  },
  COR: {
    description: 'Corona dental',
    amount: '600 €'
  },
  ORT: {
    description: 'Revisión ortodoncia',
    amount: '120 €'
  },
  PER: {
    description: 'Tratamiento periodontal',
    amount: '800 €'
  },
  CAR: {
    description: 'Carillas estéticas',
    amount: '350 €'
  }
}

// Lista de profesionales disponibles
export const PROFESSIONALS = [
  { value: 'Dr. Guillermo', label: 'Dr. Guillermo' },
  { value: 'Dra. Andrea', label: 'Dra. Andrea' }
]

// Helper function para calcular el monto final con descuento
export function calculateFinalAmount(
  amount: string,
  discount?: number
): string {
  if (!discount || discount === 0) return amount

  // Extraer el número del string "72 €" o "2.300 €" (puntos como separadores de miles)
  const cleaned = amount.replace(/[^\d,.-]/g, '').trim()
  // Reemplazar punto (separador de miles) y coma (decimal) para parsear correctamente
  const numericValue = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  if (isNaN(numericValue)) return amount

  // Calcular el descuento
  const discountAmount = (numericValue * discount) / 100
  const finalAmount = numericValue - discountAmount

  // Formatear el resultado con el mismo formato que el original (puntos como separadores de miles)
  const formatted = finalAmount
    .toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    .replace(/,/g, '.')

  return `${formatted} €`
}
