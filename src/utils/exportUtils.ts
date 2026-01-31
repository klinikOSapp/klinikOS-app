/**
 * Export Utilities for Parte Diario (Daily Report)
 * Generates PDF and Excel exports for appointment data
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

import {
  VISIT_STATUS_CONFIG,
  type VisitStatus
} from '@/components/agenda/types'
import type { Appointment } from '@/context/AppointmentsContext'

// ============================================
// TYPES
// ============================================

export type DateRange = {
  startDate: Date
  endDate: Date
}

export type ExportFormat = 'pdf' | 'excel'

export type TimeRangePreset = 'today' | 'week' | 'month' | 'custom'

export type ExportRow = {
  hora: string
  paciente: string
  edad: string
  tratamiento: string
  estado: string
  box: string
  telefono: string
  observaciones: string
  cobro: string
  facturacion: string
}

export type GeneratedDocument = {
  professional: string
  filename: string
  blob: Blob
  url: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date to DD-MM format for filenames
 */
function formatDateForFilename(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}`
}

/**
 * Format date to display format (e.g., "28 de enero de 2026")
 */
function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format date range for display (e.g., "28 de enero - 4 de febrero de 2026")
 */
function formatDateRangeForDisplay(startDate: Date, endDate: Date): string {
  const sameMonth = startDate.getMonth() === endDate.getMonth()
  const sameYear = startDate.getFullYear() === endDate.getFullYear()

  if (startDate.getTime() === endDate.getTime()) {
    return formatDateForDisplay(startDate)
  }

  if (sameMonth && sameYear) {
    return `${startDate.getDate()} - ${endDate.getDate()} de ${startDate.toLocaleDateString('es-ES', { month: 'long' })} de ${startDate.getFullYear()}`
  }

  if (sameYear) {
    return `${startDate.getDate()} de ${startDate.toLocaleDateString('es-ES', { month: 'long' })} - ${endDate.getDate()} de ${endDate.toLocaleDateString('es-ES', { month: 'long' })} de ${startDate.getFullYear()}`
  }

  return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`
}

/**
 * Sanitize professional name for filename (remove special characters)
 */
function sanitizeProfessionalName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '')
    .slice(0, 20)
}

/**
 * Generate export filename following the format:
 * ParteDiario_[NombreProfesional]_[FechaInicio]_[FechaFin].[extension]
 */
export function formatExportFilename(
  professional: string | null,
  startDate: Date,
  endDate: Date,
  format: ExportFormat
): string {
  const extension = format === 'pdf' ? 'pdf' : 'xlsx'
  const professionalPart = professional
    ? `_${sanitizeProfessionalName(professional)}`
    : '_Todos'
  const dateStart = formatDateForFilename(startDate)
  const dateEnd = formatDateForFilename(endDate)

  return `ParteDiario${professionalPart}_${dateStart}_${dateEnd}.${extension}`
}

/**
 * Get visit status label in Spanish
 */
function getVisitStatusLabel(status?: VisitStatus): string {
  if (!status) return 'Programada'
  return VISIT_STATUS_CONFIG[status]?.label ?? 'Programada'
}

/**
 * Format payment info for display
 */
function formatPaymentInfo(appointment: Appointment): string {
  if (!appointment.paymentInfo) {
    return appointment.charge === 'Si' ? 'Pendiente' : 'Sin cargo'
  }

  const { totalAmount, paidAmount, pendingAmount, currency } =
    appointment.paymentInfo

  if (pendingAmount === 0) {
    return `Pagado (${totalAmount.toFixed(2)} ${currency})`
  }

  return `${paidAmount.toFixed(2)} / ${totalAmount.toFixed(2)} ${currency} (Pend: ${pendingAmount.toFixed(2)} ${currency})`
}

/**
 * Format billing info for display
 */
function formatBillingInfo(appointment: Appointment): string {
  if (!appointment.paymentInfo) {
    return '-'
  }

  const { totalAmount, currency } = appointment.paymentInfo
  return `${totalAmount.toFixed(2)} ${currency}`
}

/**
 * Convert Appointment to ExportRow format
 */
function appointmentToExportRow(appointment: Appointment): ExportRow {
  return {
    hora: appointment.startTime,
    paciente: appointment.patientName,
    edad: appointment.patientAge ? String(appointment.patientAge) : '-',
    tratamiento: appointment.reason,
    estado: getVisitStatusLabel(appointment.visitStatus),
    box: appointment.box?.replace('box ', 'Box ') ?? '-',
    telefono: appointment.patientPhone,
    observaciones: appointment.notes ?? '-',
    cobro: formatPaymentInfo(appointment),
    facturacion: formatBillingInfo(appointment)
  }
}

// ============================================
// DATE RANGE CALCULATIONS
// ============================================

/**
 * Calculate date range based on preset
 * @param preset - The time range preset to use
 * @param referenceDate - Optional reference date (defaults to today). Used as the center point for calculations.
 * @param customRange - Optional custom range for 'custom' preset
 */
export function calculateDateRange(
  preset: TimeRangePreset,
  referenceDate?: Date,
  customRange?: DateRange
): DateRange {
  const baseDate = referenceDate ? new Date(referenceDate) : new Date()
  baseDate.setHours(0, 0, 0, 0)

  switch (preset) {
    case 'today':
      return { startDate: baseDate, endDate: baseDate }

    case 'week': {
      // 7 days centered around reference date (3 days before, reference day, 3 days after)
      const weekStart = new Date(baseDate)
      weekStart.setDate(weekStart.getDate() - 3)
      const weekEnd = new Date(baseDate)
      weekEnd.setDate(weekEnd.getDate() + 3)
      return { startDate: weekStart, endDate: weekEnd }
    }

    case 'month': {
      // 30 days centered around reference date (15 days before, 15 days after)
      const monthStart = new Date(baseDate)
      monthStart.setDate(monthStart.getDate() - 15)
      const monthEnd = new Date(baseDate)
      monthEnd.setDate(monthEnd.getDate() + 15)
      return { startDate: monthStart, endDate: monthEnd }
    }

    case 'custom':
      if (customRange) {
        return customRange
      }
      return { startDate: baseDate, endDate: baseDate }

    default:
      return { startDate: baseDate, endDate: baseDate }
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD) for filtering
 */
export function dateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================
// PDF GENERATION
// ============================================

/**
 * Generate a PDF document for the daily report
 */
export function generateParteDiarioPDF(
  appointments: Appointment[],
  professional: string | null,
  dateRange: DateRange
): Blob {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Parte Diario', margin, 20)

  // Professional and date info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const professionalText = professional
    ? `Profesional: ${professional}`
    : 'Todos los profesionales'
  doc.text(professionalText, margin, 30)

  const dateRangeText = `Período: ${formatDateRangeForDisplay(dateRange.startDate, dateRange.endDate)}`
  doc.text(dateRangeText, margin, 37)

  // Summary info
  const totalAppointments = appointments.length
  const completedCount = appointments.filter(
    (a) => a.visitStatus === 'completed'
  ).length
  const pendingPayments = appointments.filter(
    (a) => a.paymentInfo && a.paymentInfo.pendingAmount > 0
  ).length

  doc.setFontSize(10)
  doc.text(
    `Total citas: ${totalAppointments} | Realizadas: ${completedCount} | Con pagos pendientes: ${pendingPayments}`,
    margin,
    44
  )

  // Convert appointments to table rows
  const rows = appointments
    .sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })
    .map((apt) => {
      const row = appointmentToExportRow(apt)
      // Add date column for multi-day reports
      const dateStr = new Date(apt.date + 'T00:00:00').toLocaleDateString(
        'es-ES',
        {
          day: '2-digit',
          month: '2-digit'
        }
      )
      return [
        dateStr,
        row.hora,
        row.paciente,
        row.edad,
        row.tratamiento,
        row.estado,
        row.box,
        row.telefono,
        row.cobro
      ]
    })

  // Table headers
  const headers = [
    'Fecha',
    'Hora',
    'Paciente',
    'Edad',
    'Tratamiento',
    'Estado',
    'Box',
    'Teléfono',
    'Cobro'
  ]

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 50,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 73, 71], // Brand color #1E4947
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 251] // Light gray
    },
    columnStyles: {
      0: { cellWidth: 18 }, // Fecha
      1: { cellWidth: 15 }, // Hora
      2: { cellWidth: 45 }, // Paciente
      3: { cellWidth: 12 }, // Edad
      4: { cellWidth: 50 }, // Tratamiento
      5: { cellWidth: 25 }, // Estado
      6: { cellWidth: 15 }, // Box
      7: { cellWidth: 28 }, // Teléfono
      8: { cellWidth: 45 } // Cobro
    }
  })

  // Footer with generation date
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    const footerText = `Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} | Página ${i} de ${pageCount}`
    doc.text(
      footerText,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

// ============================================
// EXCEL GENERATION
// ============================================

/**
 * Generate an Excel document for the daily report
 */
export function generateParteDiarioExcel(
  appointments: Appointment[],
  professional: string | null,
  dateRange: DateRange
): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Prepare data with headers
  const headers = [
    'Fecha',
    'Hora',
    'Paciente',
    'Edad',
    'Tratamiento',
    'Estado',
    'Box',
    'Teléfono',
    'Observaciones',
    'Cobro',
    'Facturación'
  ]

  // Convert appointments to rows
  const rows = appointments
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })
    .map((apt) => {
      const row = appointmentToExportRow(apt)
      const dateStr = new Date(apt.date + 'T00:00:00').toLocaleDateString(
        'es-ES',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }
      )
      return [
        dateStr,
        row.hora,
        row.paciente,
        row.edad,
        row.tratamiento,
        row.estado,
        row.box,
        row.telefono,
        row.observaciones,
        row.cobro,
        row.facturacion
      ]
    })

  // Create metadata rows
  const metaRows = [
    ['PARTE DIARIO'],
    [],
    ['Profesional:', professional ?? 'Todos los profesionales'],
    [
      'Período:',
      formatDateRangeForDisplay(dateRange.startDate, dateRange.endDate)
    ],
    ['Total citas:', appointments.length],
    [
      'Generado:',
      new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    ],
    [],
    headers,
    ...rows
  ]

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(metaRows)

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 8 }, // Hora
    { wch: 30 }, // Paciente
    { wch: 6 }, // Edad
    { wch: 35 }, // Tratamiento
    { wch: 15 }, // Estado
    { wch: 10 }, // Box
    { wch: 15 }, // Teléfono
    { wch: 30 }, // Observaciones
    { wch: 25 }, // Cobro
    { wch: 15 } // Facturación
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Parte Diario')

  // Generate binary
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// ============================================
// DOCUMENT GENERATION
// ============================================

/**
 * Generate documents for export (one per professional if multiple selected)
 */
export function generateExportDocuments(
  appointments: Appointment[],
  professionals: string[],
  dateRange: DateRange,
  format: ExportFormat
): GeneratedDocument[] {
  const documents: GeneratedDocument[] = []

  if (professionals.length === 0) {
    // Export all appointments in one document
    const blob =
      format === 'pdf'
        ? generateParteDiarioPDF(appointments, null, dateRange)
        : generateParteDiarioExcel(appointments, null, dateRange)

    const filename = formatExportFilename(
      null,
      dateRange.startDate,
      dateRange.endDate,
      format
    )
    const url = URL.createObjectURL(blob)

    documents.push({
      professional: 'Todos los profesionales',
      filename,
      blob,
      url
    })
  } else {
    // Generate one document per professional
    for (const professional of professionals) {
      const filteredAppointments = appointments.filter(
        (apt) => apt.professional === professional
      )

      if (filteredAppointments.length === 0) continue

      const blob =
        format === 'pdf'
          ? generateParteDiarioPDF(
              filteredAppointments,
              professional,
              dateRange
            )
          : generateParteDiarioExcel(
              filteredAppointments,
              professional,
              dateRange
            )

      const filename = formatExportFilename(
        professional,
        dateRange.startDate,
        dateRange.endDate,
        format
      )
      const url = URL.createObjectURL(blob)

      documents.push({
        professional,
        filename,
        blob,
        url
      })
    }
  }

  return documents
}

/**
 * Download a single document
 */
export function downloadDocument(document: GeneratedDocument): void {
  const link = window.document.createElement('a')
  link.href = document.url
  link.download = document.filename
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
}

/**
 * Download all documents
 */
export function downloadAllDocuments(documents: GeneratedDocument[]): void {
  // Download with small delay between each to avoid browser blocking
  documents.forEach((doc, index) => {
    setTimeout(() => {
      downloadDocument(doc)
    }, index * 500)
  })
}

/**
 * Clean up document URLs (call when done with documents)
 */
export function revokeDocumentUrls(documents: GeneratedDocument[]): void {
  documents.forEach((doc) => {
    URL.revokeObjectURL(doc.url)
  })
}

// ============================================
// BUDGET PDF GENERATION
// ============================================

export type BudgetTreatment = {
  pieza?: number
  cara?: string
  codigo: string
  tratamiento: string
  precio: string
  porcentajeDescuento?: number
  descuento?: string
  importe: string
  importeSeguro?: string
  descripcionAnotaciones?: string
  doctor: string
}

export type BudgetGeneralDiscount = {
  type: 'percentage' | 'fixed'
  value: number
}

export type BudgetOptions = {
  budgetName?: string
  generalDiscount?: BudgetGeneralDiscount
  subtotal?: number
  generalDiscountAmount?: number
  totalFinal?: number
}

/**
 * Generate a PDF document for a patient budget
 */
export function generateBudgetPDF(
  treatments: BudgetTreatment[],
  patientName: string,
  options?: BudgetOptions
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // ============================================
  // HEADER
  // ============================================

  // Clinic name
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 73, 71) // Brand color #1E4947
  doc.text('klinikOS', margin, 25)

  // Budget title (use custom name if provided)
  doc.setFontSize(18)
  doc.setTextColor(36, 40, 44) // #24282C
  const budgetTitle = options?.budgetName || 'Presupuesto'
  doc.text(budgetTitle, pageWidth - margin, 25, { align: 'right' })

  // Horizontal line
  doc.setDrawColor(203, 211, 217) // #CBD3D9
  doc.setLineWidth(0.5)
  doc.line(margin, 32, pageWidth - margin, 32)

  // ============================================
  // PATIENT INFO
  // ============================================

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(83, 92, 102) // #535C66

  const today = new Date()
  const dateStr = today.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  doc.text(`Paciente: ${patientName}`, margin, 42)
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin, 42, { align: 'right' })

  // Budget number
  const budgetNumber = `PRE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  doc.text(`Nº Presupuesto: ${budgetNumber}`, margin, 50)

  // ============================================
  // TREATMENTS TABLE
  // ============================================

  const tableHeaders = [
    'Pieza',
    'Tratamiento',
    'Precio',
    '%',
    'Dto.',
    'Importe'
  ]

  const tableRows = treatments.map((t) => [
    t.pieza ? String(t.pieza) : '-',
    t.tratamiento,
    t.precio,
    t.porcentajeDescuento ? `${t.porcentajeDescuento}%` : '0%',
    t.descuento || '0 €',
    t.importe
  ])

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 58,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      textColor: [36, 40, 44] // #24282C
    },
    headStyles: {
      fillColor: [30, 73, 71], // Brand color #1E4947
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 251] // #F8FAFB
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' }, // Pieza
      1: { cellWidth: 70 }, // Tratamiento
      2: { cellWidth: 22, halign: 'right' }, // Precio
      3: { cellWidth: 15, halign: 'center' }, // %
      4: { cellWidth: 22, halign: 'right' }, // Dto.
      5: { cellWidth: 25, halign: 'right' } // Importe
    }
  })

  // ============================================
  // TOTALS
  // ============================================

  // Calculate totals
  const parseAmount = (str: string): number => {
    const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(num) ? 0 : num
  }

  const totalPrecio = treatments.reduce(
    (sum, t) => sum + parseAmount(t.precio),
    0
  )
  const totalDescuentoTratamientos = treatments.reduce(
    (sum, t) => sum + parseAmount(t.descuento || '0'),
    0
  )
  const subtotalTratamientos = treatments.reduce(
    (sum, t) => sum + parseAmount(t.importe),
    0
  )

  // Use provided values or calculate from treatments
  const subtotal = options?.subtotal ?? subtotalTratamientos
  const generalDiscountAmount = options?.generalDiscountAmount ?? 0
  const totalFinal = options?.totalFinal ?? subtotal - generalDiscountAmount
  const hasGeneralDiscount = generalDiscountAmount > 0

  // Get final Y position after table
  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY || 150

  // Totals box - adjust height if there's general discount
  const totalsStartY = finalY + 10
  const totalsWidth = 85
  const totalsX = pageWidth - margin - totalsWidth
  const totalsBoxHeight = hasGeneralDiscount ? 50 : 35

  doc.setFillColor(248, 250, 251) // #F8FAFB
  doc.setDrawColor(203, 211, 217) // #CBD3D9
  doc.roundedRect(
    totalsX,
    totalsStartY,
    totalsWidth,
    totalsBoxHeight,
    2,
    2,
    'FD'
  )

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(83, 92, 102) // #535C66

  let currentY = totalsStartY + 10

  // Subtotal (suma de importes de tratamientos)
  doc.text('Subtotal tratamientos:', totalsX + 5, currentY)
  doc.text(`${subtotal.toFixed(2)} €`, totalsX + totalsWidth - 5, currentY, {
    align: 'right'
  })
  currentY += 8

  // Descuento por tratamientos (si existe)
  if (totalDescuentoTratamientos > 0) {
    doc.text('Dto. tratamientos:', totalsX + 5, currentY)
    doc.text(
      `-${totalDescuentoTratamientos.toFixed(2)} €`,
      totalsX + totalsWidth - 5,
      currentY,
      { align: 'right' }
    )
    currentY += 8
  }

  // General discount (if any)
  if (hasGeneralDiscount) {
    doc.setTextColor(34, 197, 94) // Green #22C55E
    const discountLabel =
      options?.generalDiscount?.type === 'percentage'
        ? `Dto. general (${options.generalDiscount.value}%):`
        : 'Dto. general:'
    doc.text(discountLabel, totalsX + 5, currentY)
    doc.text(
      `-${generalDiscountAmount.toFixed(2)} €`,
      totalsX + totalsWidth - 5,
      currentY,
      { align: 'right' }
    )
    currentY += 8
    doc.setTextColor(83, 92, 102) // Reset color
  }

  // Separator line
  doc.setDrawColor(203, 211, 217)
  doc.line(totalsX + 5, currentY, totalsX + totalsWidth - 5, currentY)
  currentY += 8

  // Total final
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 73, 71) // Brand color
  doc.text('TOTAL:', totalsX + 5, currentY)
  doc.text(`${totalFinal.toFixed(2)} €`, totalsX + totalsWidth - 5, currentY, {
    align: 'right'
  })

  // ============================================
  // FOOTER - NOTES & VALIDITY
  // ============================================

  const footerY = totalsStartY + totalsBoxHeight + 15

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(83, 92, 102)

  doc.text('Notas:', margin, footerY)
  doc.setFontSize(8)
  doc.text(
    '• Este presupuesto tiene una validez de 30 días desde la fecha de emisión.',
    margin,
    footerY + 6
  )
  doc.text('• Los precios incluyen IVA.', margin, footerY + 11)
  doc.text(
    '• El presupuesto puede variar si durante el tratamiento se detectan necesidades adicionales.',
    margin,
    footerY + 16
  )

  // Generation timestamp
  doc.setFontSize(7)
  doc.setTextColor(174, 184, 194) // #AEB8C2
  const timestamp = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(
    `Generado el ${timestamp}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  )

  return doc.output('blob')
}

// ============================================
// PAYMENT RECEIPT PDF GENERATION (HU-015)
// ============================================

export type PaymentReceiptData = {
  // Receipt info
  receiptNumber: string
  paymentDate: Date
  
  // Patient info
  patientName: string
  patientDni?: string
  
  // Invoice/Treatment info
  invoiceNumber: string
  treatment: string
  
  // Payment details
  amountPaid: number
  paymentMethod: string
  reference?: string
  
  // Balance info
  totalAmount: number
  previousPaid: number
  remainingBalance: number
  
  // Clinic info (optional)
  clinicName?: string
  clinicAddress?: string
  clinicCif?: string
  clinicPhone?: string
}

/**
 * Generate a PDF receipt for a payment
 */
export function generatePaymentReceiptPDF(data: PaymentReceiptData): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const clinicName = data.clinicName || 'klinikOS'

  // ============================================
  // HEADER
  // ============================================

  // Clinic name
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 73, 71) // Brand color #1E4947
  doc.text(clinicName, margin, 25)

  // Receipt title
  doc.setFontSize(16)
  doc.setTextColor(36, 40, 44) // #24282C
  doc.text('RECIBO DE PAGO', pageWidth - margin, 25, { align: 'right' })

  // Horizontal line
  doc.setDrawColor(203, 211, 217) // #CBD3D9
  doc.setLineWidth(0.5)
  doc.line(margin, 32, pageWidth - margin, 32)

  // ============================================
  // RECEIPT INFO
  // ============================================

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(83, 92, 102) // #535C66

  const dateStr = data.paymentDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  doc.text(`Nº Recibo: ${data.receiptNumber}`, margin, 42)
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin, 42, { align: 'right' })

  // ============================================
  // PATIENT INFO
  // ============================================

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(36, 40, 44)
  doc.text('Datos del paciente', margin, 56)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(83, 92, 102)
  doc.text(`Nombre: ${data.patientName}`, margin, 64)
  if (data.patientDni) {
    doc.text(`DNI/NIE: ${data.patientDni}`, margin, 71)
  }

  // ============================================
  // TREATMENT/INVOICE INFO
  // ============================================

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(36, 40, 44)
  doc.text('Detalle del pago', margin, 86)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(83, 92, 102)
  doc.text(`Factura: ${data.invoiceNumber}`, margin, 94)
  doc.text(`Tratamiento: ${data.treatment}`, margin, 101)

  // ============================================
  // PAYMENT BREAKDOWN TABLE
  // ============================================

  const formatCurrency = (amount: number) => 
    `${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

  const paymentMethodLabel = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    bizum: 'Bizum'
  }[data.paymentMethod.toLowerCase()] || data.paymentMethod

  autoTable(doc, {
    startY: 110,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Importe']],
    body: [
      ['Importe total del tratamiento', formatCurrency(data.totalAmount)],
      ['Pagado anteriormente', formatCurrency(data.previousPaid)],
      ['Pendiente antes de este pago', formatCurrency(data.totalAmount - data.previousPaid)],
      [`PAGO REALIZADO (${paymentMethodLabel})`, formatCurrency(data.amountPaid)],
      ['Saldo pendiente', formatCurrency(data.remainingBalance)]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 4,
      textColor: [36, 40, 44]
    },
    headStyles: {
      fillColor: [30, 73, 71], // Brand color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' }
    },
    bodyStyles: {
      lineColor: [203, 211, 217],
      lineWidth: 0.1
    },
    didParseCell: function(hookData) {
      // Highlight the payment row
      if (hookData.section === 'body' && hookData.row.index === 3) {
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.fillColor = [233, 251, 249] // Brand light #E9FBF9
        hookData.cell.styles.textColor = [30, 73, 71] // Brand color
      }
      // Highlight remaining balance row
      if (hookData.section === 'body' && hookData.row.index === 4) {
        hookData.cell.styles.fontStyle = 'bold'
        if (data.remainingBalance === 0) {
          hookData.cell.styles.textColor = [22, 163, 74] // Green for zero balance
        } else {
          hookData.cell.styles.textColor = [217, 119, 6] // Amber for pending
        }
      }
    }
  })

  // ============================================
  // REFERENCE (if provided)
  // ============================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableEndY = (doc as any).lastAutoTable?.finalY || 180

  if (data.reference) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(83, 92, 102)
    doc.text(`Referencia: ${data.reference}`, margin, tableEndY + 10)
  }

  // ============================================
  // CONFIRMATION MESSAGE
  // ============================================

  const messageY = data.reference ? tableEndY + 25 : tableEndY + 15

  if (data.remainingBalance === 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74) // Green
    doc.text('✓ TRATAMIENTO COMPLETAMENTE PAGADO', pageWidth / 2, messageY, { align: 'center' })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(217, 119, 6) // Amber
    doc.text(`Queda un saldo pendiente de ${formatCurrency(data.remainingBalance)}`, pageWidth / 2, messageY, { align: 'center' })
  }

  // ============================================
  // CLINIC INFO (Footer)
  // ============================================

  const footerY = doc.internal.pageSize.getHeight() - 35

  doc.setDrawColor(203, 211, 217)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(142, 149, 161) // #8E95A1

  doc.text(clinicName, margin, footerY)
  if (data.clinicAddress) {
    doc.text(data.clinicAddress, margin, footerY + 5)
  }
  if (data.clinicCif) {
    doc.text(`CIF: ${data.clinicCif}`, margin, footerY + 10)
  }
  if (data.clinicPhone) {
    doc.text(`Tel: ${data.clinicPhone}`, margin, footerY + 15)
  }

  // Generated timestamp
  const timestamp = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Documento generado el ${timestamp}`, pageWidth - margin, footerY + 15, { align: 'right' })

  return doc.output('blob')
}

/**
 * Generate receipt number for payments
 */
export function generateReceiptNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `REC-${year}${month}${day}-${random}`
}

/**
 * Generate filename for payment receipt
 */
export function formatReceiptFilename(patientName: string, receiptNumber: string): string {
  const sanitizedPatientName = patientName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ_]/g, '')
    .slice(0, 30)
  return `Recibo_${receiptNumber}_${sanitizedPatientName}.pdf`
}

/**
 * Generate budget filename
 */
export function formatBudgetFilename(
  patientName: string,
  budgetName?: string
): string {
  const sanitizedPatientName = patientName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ_]/g, '')
    .slice(0, 30)

  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

  // Use budget name if provided, otherwise use "Presupuesto"
  if (budgetName) {
    const sanitizedBudgetName = budgetName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ_0-9]/g, '')
      .slice(0, 40)
    return `${sanitizedBudgetName}_${sanitizedPatientName}_${dateStr}.pdf`
  }

  return `Presupuesto_${sanitizedPatientName}_${dateStr}.pdf`
}

// ============================================
// CASH CLOSING EXCEL GENERATION
// ============================================

export type CashClosingTransaction = {
  date: string
  patientName: string
  concept: string
  amount: number
  paymentMethod: string
  paymentStatus: string
  productionStatus: string
}

export type CashClosingSummary = {
  closingDate: string
  initialCash: number
  totalIncome: number
  totalExpenses: number
  cashOutflow: number
  finalBalance: number
  incomeByMethod: {
    efectivo: number
    tpv: number
    transferencia: number
    financiacion: number
    otros: number
  }
  transactionCount: number
}

/**
 * Format date for cash closing filename
 */
function formatCashClosingDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Generate filename for cash closing export
 */
export function formatCashClosingFilename(closingDate: string): string {
  const formattedDate = formatCashClosingDate(closingDate)
  return `CierreCaja_${formattedDate}.xlsx`
}

/**
 * Capitalize payment method for display
 */
function capitalizePaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    efectivo: 'Efectivo',
    tpv: 'TPV',
    transferencia: 'Transferencia',
    financiacion: 'Financiación',
    otros: 'Otros'
  }
  return methodMap[method.toLowerCase()] ?? method
}

/**
 * Generate an Excel document for cash closing
 */
export function generateCashClosingExcel(
  transactions: CashClosingTransaction[],
  summary: CashClosingSummary
): Blob {
  const wb = XLSX.utils.book_new()

  // Format closing date for display
  const closingDateDisplay = new Date(
    summary.closingDate + 'T00:00:00'
  ).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // ========================================
  // Sheet 1: Resumen
  // ========================================
  const summaryData = [
    ['CIERRE DE CAJA'],
    [],
    ['Fecha:', closingDateDisplay],
    [
      'Generado:',
      new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    ],
    [],
    ['RESUMEN FINANCIERO'],
    [],
    ['Caja inicial:', `${summary.initialCash.toFixed(2)} €`],
    ['Total ingresos:', `${summary.totalIncome.toFixed(2)} €`],
    ['Total gastos:', `${summary.totalExpenses.toFixed(2)} €`],
    ['Salida de caja:', `${summary.cashOutflow.toFixed(2)} €`],
    ['Balance final:', `${summary.finalBalance.toFixed(2)} €`],
    [],
    ['DESGLOSE POR MÉTODO DE PAGO'],
    [],
    ['Efectivo:', `${summary.incomeByMethod.efectivo.toFixed(2)} €`],
    ['TPV:', `${summary.incomeByMethod.tpv.toFixed(2)} €`],
    ['Transferencia:', `${summary.incomeByMethod.transferencia.toFixed(2)} €`],
    ['Financiación:', `${summary.incomeByMethod.financiacion.toFixed(2)} €`],
    ['Otros:', `${summary.incomeByMethod.otros.toFixed(2)} €`],
    [],
    ['Total transacciones:', summary.transactionCount]
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

  // ========================================
  // Sheet 2: Transacciones
  // ========================================
  const transactionHeaders = [
    'Fecha',
    'Paciente',
    'Concepto',
    'Importe',
    'Método de Pago',
    'Estado Cobro',
    'Estado Producción'
  ]

  const transactionRows = transactions.map((t) => [
    new Date(t.date + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    t.patientName,
    t.concept,
    `${t.amount.toFixed(2)} €`,
    capitalizePaymentMethod(t.paymentMethod),
    t.paymentStatus === 'cobrado' ? 'Cobrado' : 'Pendiente',
    t.productionStatus === 'hecho' ? 'Hecho' : 'Pendiente'
  ])

  const transactionData = [
    [`MOVIMIENTOS DEL DÍA - ${closingDateDisplay}`],
    [],
    transactionHeaders,
    ...transactionRows
  ]

  const wsTransactions = XLSX.utils.aoa_to_sheet(transactionData)
  wsTransactions['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 30 }, // Paciente
    { wch: 35 }, // Concepto
    { wch: 12 }, // Importe
    { wch: 18 }, // Método
    { wch: 15 }, // Estado Cobro
    { wch: 18 } // Estado Producción
  ]
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transacciones')

  // Generate binary
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

/**
 * Download cash closing Excel file
 */
export function downloadCashClosingExcel(
  transactions: CashClosingTransaction[],
  summary: CashClosingSummary
): void {
  const blob = generateCashClosingExcel(transactions, summary)
  const filename = formatCashClosingFilename(summary.closingDate)
  const url = URL.createObjectURL(blob)

  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
