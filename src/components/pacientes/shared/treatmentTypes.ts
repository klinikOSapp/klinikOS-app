// Tipos compartidos para tratamientos
// Usados en patient-file/Treatments.tsx y patient-record/Treatments.tsx

export type TreatmentStatus =
  | 'Aceptado'
  | 'No aceptado'
  | 'Recall'
  | 'Pagado'
  | 'Sin pagar'

// Tipo legacy - usado en patient-file/Treatments.tsx
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

// ============================================
// Nuevo diseño de Figma (patient-record V2)
// ============================================

// Estado del diente en el odontograma
export type ToothStatus =
  | 'normal'
  | 'pendiente'
  | 'finalizado'
  | 'ausente'
  | 'protesis'

// Colores para cada estado del diente
export const TOOTH_STATUS_COLORS: Record<
  ToothStatus,
  { fill: string; label: string }
> = {
  normal: { fill: '#CBD3D9', label: 'Normal' },
  pendiente: { fill: '#D97706', label: 'Pendiente' },
  finalizado: { fill: '#338F88', label: 'Finalizado' },
  ausente: { fill: '#6B7280', label: 'Ausente' }, // Gris oscuro
  protesis: { fill: '#8B5CF6', label: 'Prótesis' } // Violeta
}

// Caras del diente
export type ToothFace =
  | 'Vestibular'
  | 'Oclusal'
  | 'Mesial'
  | 'Distal'
  | 'Lingual'
  | 'Palatino'
  | 'Incisal'

// Estado de tratamiento V2 (para historial)
export type TreatmentV2Status =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'cancelado'

// Tratamiento V2 - Nuevo diseño de Figma
export type TreatmentV2 = {
  _internalId: string // ID interno único para React keys
  pieza?: number // Número de diente (11-48)
  cara?: ToothFace // Cara del diente
  codigo: string // Código del tratamiento (ej: CZ, CPDC, CORMC)
  tratamiento: string // Nombre completo del tratamiento
  precio: string // Precio base (ej: "500€")
  porcentajeDescuento?: number // % de descuento (0-100)
  descuento?: string // Monto del descuento (ej: "72 €")
  importe: string // Precio final después de descuento
  importeSeguro?: string // Monto cubierto por seguro
  descripcionAnotaciones?: string // Notas adicionales
  doctor?: string // Nombre del profesional (opcional, se asigna automáticamente si hay un único especialista compatible)
  selected?: boolean // Selección para crear presupuesto

  // HU-011: Campos para historial de tratamientos
  estado?: TreatmentV2Status // Estado del tratamiento
  fechaCreacion?: string // Fecha de creación (ISO)
  fechaRealizacion?: string // Fecha en que se realizó el tratamiento (ISO)
  facturado?: boolean // Si el tratamiento ha sido facturado
  facturaId?: string // ID de la factura asociada
  facturaNumero?: string // Número de factura
  presupuestoId?: string // ID del presupuesto asociado
}

// Estado del odontograma - mapa de pieza a estado
export type OdontogramaState = {
  [toothId: number]: ToothStatus
}

// Opciones de cara para selects
export const TOOTH_FACES: { value: ToothFace; label: string }[] = [
  { value: 'Vestibular', label: 'Vestibular' },
  { value: 'Oclusal', label: 'Oclusal' },
  { value: 'Mesial', label: 'Mesial' },
  { value: 'Distal', label: 'Distal' },
  { value: 'Lingual', label: 'Lingual' },
  { value: 'Palatino', label: 'Palatino' },
  { value: 'Incisal', label: 'Incisal' }
]

// Familias de tratamiento para filtros
export const TREATMENT_FAMILIES = [
  { value: 'corona', label: 'Corona' },
  { value: 'endodoncia', label: 'Endodoncia' },
  { value: 'ortodoncia', label: 'Ortodoncia' },
  { value: 'periodoncia', label: 'Periodoncia' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'estetica', label: 'Estética' },
  { value: 'protesis', label: 'Prótesis' },
  { value: 'diagnostico', label: 'Diagnóstico' }
]

// Áreas de tratamiento para filtros
export const TREATMENT_AREAS = [
  { value: 'general', label: 'General' },
  { value: 'maxilar', label: 'Maxilar' },
  { value: 'mandibular', label: 'Mandibular' },
  { value: 'anterior', label: 'Anterior' },
  { value: 'posterior', label: 'Posterior' }
]

// Catálogo de tratamientos por acrónimo
export type TreatmentCatalogEntry = {
  description: string
  amount: string
  familia?: string // Para filtrado
}

export type TreatmentCatalog = {
  [acronym: string]: TreatmentCatalogEntry
}

export const TREATMENT_CATALOG: TreatmentCatalog = {
  // Coronas (del diseño Figma)
  CORMC: {
    description: 'Corona Metal Cerámica Fases',
    amount: '500 €',
    familia: 'corona'
  },
  CPDC: {
    description: 'Corona Preformada Dentición Permanente',
    amount: '140 €',
    familia: 'corona'
  },
  CZ: {
    description: 'Carilla de Zirconio',
    amount: '500 €',
    familia: 'corona'
  },
  COR: {
    description: 'Corona dental',
    amount: '600 €',
    familia: 'corona'
  },
  // Tratamientos generales
  LDE: {
    description: 'Limpieza dental',
    amount: '72 €',
    familia: 'general'
  },
  BLD: {
    description: 'Blanqueamiento dental',
    amount: '200 €',
    familia: 'estetica'
  },
  OPM: {
    description: 'Operación mandíbula',
    amount: '2.300 €',
    familia: 'cirugia'
  },
  CI: {
    description: 'Consulta inicial',
    amount: '150 €',
    familia: 'diagnostico'
  },
  RX: {
    description: 'Radiografía',
    amount: '100 €',
    familia: 'diagnostico'
  },
  EXM: {
    description: 'Extracción de muela',
    amount: '500 €',
    familia: 'cirugia'
  },
  IMP: {
    description: 'Implante dental',
    amount: '1.200 €',
    familia: 'protesis'
  },
  FER: {
    description: 'Férula de descarga',
    amount: '300 €',
    familia: 'protesis'
  },
  EMP: {
    description: 'Empaste / Obturación',
    amount: '80 €',
    familia: 'general'
  },
  END: {
    description: 'Endodoncia',
    amount: '400 €',
    familia: 'endodoncia'
  },
  ORT: {
    description: 'Revisión ortodoncia',
    amount: '120 €',
    familia: 'ortodoncia'
  },
  PER: {
    description: 'Tratamiento periodontal',
    amount: '800 €',
    familia: 'periodoncia'
  },
  CAR: {
    description: 'Carillas estéticas',
    amount: '350 €',
    familia: 'estetica'
  }
}

// Mapeo familia de tratamiento → especialidades profesionales compatibles
// Se usa para auto-asignar doctor cuando solo hay un especialista compatible
export const FAMILY_TO_SPECIALTY: Record<string, string[]> = {
  corona: ['Odontólogo'],
  endodoncia: ['Odontólogo'],
  ortodoncia: ['Ortodoncista'],
  periodoncia: ['Odontólogo', 'Higienista'],
  cirugia: ['Cirujano', 'Odontólogo'],
  estetica: ['Odontólogo'],
  protesis: ['Implantólogo', 'Odontólogo'],
  diagnostico: ['Odontólogo', 'Higienista'],
  general: ['Higienista', 'Odontólogo']
}

// PROFESSIONALS removed - now sourced from ConfigurationContext
// Use useConfiguration().professionalNameOptions for {value, label} format
// Use useConfiguration().professionalNames for string[] format

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
