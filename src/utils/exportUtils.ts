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
