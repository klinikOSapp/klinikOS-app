'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { MultiDatePickerInput } from './MultiDatePickerInput'

type ParteDiarioModalProps = {
  isOpen: boolean
  onClose: () => void
  clinicId?: string | null
}

type DbStaff = {
  id: string
  full_name: string
}

// RPC return type from get_appointments_calendar
type RpcAppointment = {
  id: number
  scheduled_start_time: string
  scheduled_end_time: string | null
  duration_minutes: number
  status: string
  public_ref: string | null
  notes: string | null
  source: string | null
  // Box info
  box_id: string | null
  box_name: string | null
  // Patient info
  patient_id: string
  patient_name: string | null
  patient_phone: string | null
  patient_email: string | null
  patient_lead_source: string | null
  // Service info
  service_id: number | null
  service_name: string | null
  // Staff assignments as JSONB array
  staff_assigned: Array<{ staff_id: string; full_name: string }> | null
  // Clinical notes as JSONB array (includes SOAP data)
  clinical_notes: Array<{
    id: number
    note_type: string
    content: string
    content_json?: { S?: string; O?: string; A?: string; P?: string } | null
    created_at: string
    staff_full_name: string | null
  }> | null
}

// Helper to format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE
  })
}

// Helper to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DEFAULT_TIMEZONE
  })
}

export default function ParteDiarioModal({
  isOpen,
  onClose,
  clinicId: propClinicId
}: ParteDiarioModalProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  
  const [selectedProfesional, setSelectedProfesional] = useState('')
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [staff, setStaff] = useState<DbStaff[]>([])
  const [clinicId, setClinicId] = useState<string | null>(propClinicId ?? null)
  const [clinicName, setClinicName] = useState<string>('KlinikOS')
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch staff on mount
  useEffect(() => {
    if (!isOpen) return
    
    async function init() {
      let cId = propClinicId
      if (!cId) {
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        cId = Array.isArray(clinics) && clinics.length > 0 ? clinics[0] : null
      }
      setClinicId(cId)
      
      if (cId) {
        // Fetch clinic name
        const { data: clinicData } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', cId)
          .single()
        if (clinicData) setClinicName(clinicData.name)
        
        // Fetch staff using RPC function (bypasses RLS)
        const { data: staffData } = await supabase
          .rpc('get_clinic_staff', { clinic: cId })
        
        const staffList: DbStaff[] = (staffData ?? []).map((s: { id: string; full_name: string }) => ({
          id: s.id,
          full_name: s.full_name
        }))
        setStaff(staffList)
      }
    }
    
    void init()
  }, [isOpen, supabase, propClinicId])

  const handleDownload = async () => {
    if (!clinicId || selectedDates.length === 0) return
    
    setIsGenerating(true)
    
    try {
      // Get date range - use local date formatting to avoid timezone issues
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
      
      // Format dates as YYYY-MM-DD in local timezone (not UTC!)
      const formatLocalDate = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const startDate = formatLocalDate(sortedDates[0])
      const endDate = formatLocalDate(sortedDates[sortedDates.length - 1])
      
      console.log('Fetching appointments for date range:', { startDate, endDate })
      
      // Use optimized RPC function - returns all data in a single call
      const { data: appointments, error } = await supabase
        .rpc('get_appointments_calendar', {
          p_clinic_id: clinicId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_staff_id: selectedProfesional || null,  // Server-side filter if professional selected
          p_box_id: null
        })
      
      if (error) {
        console.error('Error fetching appointments:', error)
        setIsGenerating(false)
        return
      }
      
      const filteredAppointments = (appointments as RpcAppointment[]) ?? []
      console.log('Fetched appointments:', filteredAppointments.length)
      
      // Group appointments by date - use local timezone for grouping
      const appointmentsByDate = new Map<string, RpcAppointment[]>()
      for (const appt of filteredAppointments) {
        // Parse the UTC time and format in local timezone
        const date = new Date(appt.scheduled_start_time)
        const dateKey = date.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE }) // YYYY-MM-DD format
        if (!appointmentsByDate.has(dateKey)) {
          appointmentsByDate.set(dateKey, [])
        }
        appointmentsByDate.get(dateKey)!.push(appt)
      }
      
      // Generate HTML for PDF
      const professionalName = selectedProfesional 
        ? staff.find(s => s.id === selectedProfesional)?.full_name ?? 'Todos'
        : 'Todos los profesionales'
      
      const now = new Date()
      const generatedAt = now.toLocaleString(DEFAULT_LOCALE, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: DEFAULT_TIMEZONE
      })
      
      // Format date range for header
      const startDateFormatted = formatDate(sortedDates[0])
      const endDateFormatted = formatDate(sortedDates[sortedDates.length - 1])
      
      // Count stats (using RPC format)
      const totalAppointments = filteredAppointments.length
      const uniqueProfessionals = new Set(
        filteredAppointments.flatMap(a => a.staff_assigned?.map(s => s.staff_id) ?? [])
      ).size
      const uniqueBoxes = new Set(
        filteredAppointments.map(a => a.box_name).filter(Boolean)
      ).size
      
      let htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Parte Diario - ${clinicName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1a1a1a;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #51d6c7;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1e4947;
    }
    .header .meta {
      text-align: right;
      font-size: 11px;
      color: #666;
    }
    .section {
      margin-bottom: 25px;
    }
    .date-header {
      background: #f0fdfb;
      padding: 10px 15px;
      border-left: 4px solid #51d6c7;
      margin-bottom: 15px;
      font-weight: 600;
      font-size: 14px;
    }
    .appointment-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 15px;
      margin-bottom: 10px;
      background: #fff;
    }
    .appointment-card .time {
      font-weight: 600;
      color: #1e4947;
      font-size: 13px;
    }
    .appointment-card .service {
      font-weight: 500;
      margin-left: 10px;
    }
    .appointment-card .details {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 11px;
    }
    .appointment-card .detail-item {
      display: flex;
      gap: 5px;
    }
    .appointment-card .label {
      color: #666;
      font-weight: 500;
    }
    .appointment-card .notes {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #e5e7eb;
      font-style: italic;
      color: #666;
    }
    .appointment-card .clinical-notes {
      margin-top: 8px;
      padding: 8px;
      background: #f0fdf4;
      border-radius: 4px;
      font-size: 12px;
      color: #166534;
    }
    .appointment-card .note-meta {
      font-size: 10px;
      color: #888;
      margin-bottom: 4px;
    }
    .appointment-card .soap-note {
      margin-top: 8px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .appointment-card .soap-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .appointment-card .soap-item {
      padding: 8px;
      background: white;
      border-radius: 4px;
    }
    .appointment-card .soap-label {
      font-weight: 600;
      color: #374151;
      font-size: 12px;
    }
    .appointment-card .soap-sublabel {
      font-size: 10px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .appointment-card .soap-value {
      font-size: 12px;
      color: #111827;
    }
    .appointment-card .regular-note {
      margin-top: 8px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    .stats {
      display: flex;
      gap: 20px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #1e4947;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media print {
      body { padding: 0; }
      .appointment-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Parte Diario</h1>
      <p style="margin-top: 5px; color: #666;">${clinicName}</p>
      <p style="margin-top: 3px; color: #888;">Profesional: ${professionalName}</p>
    </div>
    <div class="meta">
      <p>Generado: ${generatedAt}</p>
      <p>Periodo: ${startDateFormatted} - ${endDateFormatted}</p>
    </div>
  </div>
`
      
      // Add appointments by date
      for (const [dateKey, dayAppointments] of appointmentsByDate) {
        // Parse dateKey (YYYY-MM-DD) and format directly without Date object to avoid timezone issues
        const [year, month, day] = dateKey.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        // Format the date header directly without timezone conversion
        const dateHeader = dateObj.toLocaleDateString(DEFAULT_LOCALE, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
          // Note: NO timeZone here - we want to display the date as-is
        })
        htmlContent += `
  <div class="section">
    <div class="date-header">${dateHeader}</div>
`
        for (const appt of dayAppointments) {
          // RPC returns patient_name directly
          const patientName = appt.patient_name ?? 'Sin paciente'
          
          // RPC returns staff_assigned as array
          const staffNames = appt.staff_assigned
            ?.map(s => s.full_name)
            .filter(Boolean)
            .join(', ') ?? 'Sin asignar'
          
          // RPC returns patient_phone and patient_email directly
          const patientPhone = appt.patient_phone ?? '-'
          const patientEmail = appt.patient_email ?? '-'
          
          // RPC returns patient_lead_source directly
          const leadSource = appt.patient_lead_source ?? null
          
          // RPC returns clinical_notes as JSONB array
          const allNotes = appt.clinical_notes ?? []
          
          // Build clinical notes HTML with SOAP format support
          let clinicalNotesHtml = ''
          if (allNotes.length > 0) {
            clinicalNotesHtml = '<div class="clinical-notes"><strong>Notas clínicas:</strong>'
            for (const note of allNotes) {
              const createdAt = note.created_at 
                ? new Date(note.created_at).toLocaleDateString('es-ES', { 
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                    timeZone: DEFAULT_TIMEZONE
                  })
                : ''
              const createdBy = note.staff_full_name ?? ''
              const metaInfo = [createdAt, createdBy].filter(Boolean).join(' • ')
              
              // Check if it's a SOAP note - either by note_type OR by having content_json with S/O/A/P
              const contentJson = note.content_json
              const isSoapNoteType = note.note_type === 'SOAP' || note.note_type === 'soap'
              const hasSoapStructure = contentJson && (contentJson.S || contentJson.O || contentJson.A || contentJson.P)
              
              // If it's a SOAP note type but no content_json, try to parse from content text
              let soapData: { S?: string; O?: string; A?: string; P?: string } | null = null
              if (isSoapNoteType) {
                if (hasSoapStructure) {
                  soapData = contentJson
                } else if (note.content) {
                  // Try to parse SOAP from text content (format: "S: xxx O: xxx A: xxx P: xxx")
                  const sMatch = note.content.match(/S:\s*([^OAP]+?)(?=\s*[OAP]:|$)/i)
                  const oMatch = note.content.match(/O:\s*([^SAP]+?)(?=\s*[SAP]:|$)/i)
                  const aMatch = note.content.match(/A:\s*([^SOP]+?)(?=\s*[SOP]:|$)/i)
                  const pMatch = note.content.match(/P:\s*(.+?)$/i)
                  if (sMatch || oMatch || aMatch || pMatch) {
                    soapData = {
                      S: sMatch?.[1]?.trim(),
                      O: oMatch?.[1]?.trim(),
                      A: aMatch?.[1]?.trim(),
                      P: pMatch?.[1]?.trim()
                    }
                  }
                }
              }
              
              if (soapData) {
                clinicalNotesHtml += `
                  <div class="soap-note">
                    ${metaInfo ? `<div class="note-meta">${metaInfo}</div>` : ''}
                    <div class="soap-grid">
                      <div class="soap-item">
                        <div class="soap-label">Subjetivo</div>
                        <div class="soap-sublabel">¿Por qué viene?</div>
                        <div class="soap-value">${soapData.S || '-'}</div>
                      </div>
                      <div class="soap-item">
                        <div class="soap-label">Objetivo</div>
                        <div class="soap-sublabel">¿Qué tiene?</div>
                        <div class="soap-value">${soapData.O || '-'}</div>
                      </div>
                      <div class="soap-item">
                        <div class="soap-label">Evaluación</div>
                        <div class="soap-sublabel">¿Qué le hacemos?</div>
                        <div class="soap-value">${soapData.A || '-'}</div>
                      </div>
                      <div class="soap-item">
                        <div class="soap-label">Plan</div>
                        <div class="soap-sublabel">Tratamiento a seguir</div>
                        <div class="soap-value">${soapData.P || '-'}</div>
                      </div>
                    </div>
                  </div>`
              } else {
                clinicalNotesHtml += `
                  <div class="regular-note">
                    ${metaInfo ? `<div class="note-meta">${metaInfo}</div>` : ''}
                    <div>[${note.note_type}] ${note.content}</div>
                  </div>`
              }
            }
            clinicalNotesHtml += '</div>'
          }
          
          const endTimeStr = appt.scheduled_end_time ? ` - ${formatTime(appt.scheduled_end_time)}` : ''
          htmlContent += `
    <div class="appointment-card">
      <div>
        <span class="time">${formatTime(appt.scheduled_start_time)}${endTimeStr}</span>
        <span class="service">${appt.service_name ?? 'Cita'}</span>
        ${appt.box_name ? `<span style="margin-left: 10px; color: #888;">(${appt.box_name})</span>` : ''}
      </div>
      <div class="details">
        <div class="detail-item">
          <span class="label">Paciente:</span>
          <span>${patientName}</span>
        </div>
        <div class="detail-item">
          <span class="label">Teléfono:</span>
          <span>${patientPhone}</span>
        </div>
        <div class="detail-item">
          <span class="label">Email:</span>
          <span>${patientEmail}</span>
        </div>
        ${leadSource ? `<div class="detail-item"><span class="label">Referido por:</span><span>${leadSource}</span></div>` : ''}
        <div class="detail-item">
          <span class="label">Profesional:</span>
          <span>${staffNames}</span>
        </div>
      </div>
      ${appt.notes ? `<div class="notes"><strong>Notas de cita:</strong> ${appt.notes}</div>` : ''}
      ${clinicalNotesHtml}
    </div>
`
        }
        htmlContent += `  </div>\n`
      }
      
      // Add footer with stats
      htmlContent += `
  <div class="footer">
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${totalAppointments}</div>
        <div class="stat-label">Citas totales</div>
      </div>
      <div class="stat">
        <div class="stat-value">${uniqueProfessionals}</div>
        <div class="stat-label">Profesionales</div>
      </div>
      <div class="stat">
        <div class="stat-value">${uniqueBoxes}</div>
        <div class="stat-label">Boxes</div>
      </div>
    </div>
    <div>
      <p>${clinicName}</p>
    </div>
  </div>
</body>
</html>
`
      
      // Open print dialog
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
      
    } catch (error) {
      console.error('Error generating parte diario:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/30'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'>
        <div
          className='pointer-events-auto flex h-full flex-col overflow-hidden rounded-lg bg-[var(--color-neutral-50)]'
          style={{
            width: 'min(37.625rem, 92vw)',
            height: 'min(26.25rem, 85vh)'
          }}
          role='dialog'
          aria-modal='true'
          aria-labelledby='parte-diario-title'
        >
          {/* Header */}
          <div
            className='flex items-center justify-between border-b border-[var(--color-border-default)] px-8'
            style={{ height: '3.5rem' }}
          >
            <h2
              id='parte-diario-title'
              className='text-title-md font-medium text-[var(--color-neutral-900)]'
            >
              Generar parte diario
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='flex items-center justify-center transition-colors hover:bg-[var(--color-neutral-100)] rounded'
              style={{ width: '1.5rem', height: '1.5rem' }}
              aria-label='Cerrar modal'
            >
              <CloseRounded
                className='text-[var(--color-neutral-600)]'
                style={{ fontSize: '0.875rem' }}
              />
            </button>
          </div>

          {/* Content */}
          <div className='flex-1 px-8 pt-12'>
            {/* Profesional Field */}
            <div className='flex items-start gap-6 mb-16'>
              <label
                htmlFor='profesional-select'
                className='text-base font-normal text-[var(--color-neutral-900)]'
                style={{ width: '7.375rem', paddingTop: '0.75rem' }}
              >
                Profesional
              </label>
              <div className='flex-1' style={{ maxWidth: '19.1875rem' }}>
                <div className='relative'>
                  <select
                    id='profesional-select'
                    value={selectedProfesional}
                    onChange={(e) => setSelectedProfesional(e.target.value)}
                    className='w-full h-12 px-3 pr-10 text-base bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] transition-colors'
                    style={{
                      color: selectedProfesional
                        ? 'var(--color-neutral-900)'
                        : 'var(--color-neutral-400)'
                    }}
                  >
                    <option value=''>Todos los profesionales</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                    </option>
                    ))}
                  </select>
                  <KeyboardArrowDownRounded
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)] pointer-events-none'
                    fontSize='small'
                  />
                </div>
              </div>
            </div>

            {/* Fecha del parte Field */}
            <div className='flex items-start gap-6'>
              <label
                htmlFor='periodo-input'
                className='text-base font-normal text-[var(--color-neutral-900)]'
                style={{ width: '7.375rem', paddingTop: '0.75rem' }}
              >
                Fecha del parte
              </label>
              <div style={{ width: '19.1875rem' }}>
                <p className='text-sm font-normal text-[var(--color-neutral-900)] mb-2'>
                  Periodo
                </p>
                <MultiDatePickerInput
                  value={selectedDates}
                  onChange={setSelectedDates}
                  placeholder='Seleccionar fechas'
                />
              </div>
            </div>
          </div>

          {/* Footer with Download Button */}
          <div className='flex justify-end px-8 pb-[2.6875rem]'>
            <button
              type='button'
              onClick={handleDownload}
              disabled={selectedDates.length === 0 || isGenerating}
              className='h-10 w-[7.4375rem] rounded-full border border-[var(--color-border-default)] bg-[var(--color-brand-500)] px-4 text-base font-medium text-[var(--color-brand-900)] transition-all duration-150 hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--color-brand-500)]'
            >
              {isGenerating ? 'Generando...' : 'Descargar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
