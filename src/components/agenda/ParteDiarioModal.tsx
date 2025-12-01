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

type DbAppointment = {
  id: number
  scheduled_start_time: string
  scheduled_end_time: string | null
  status: string
  public_ref: string | null
  notes: string | null
  patients?: { 
    first_name: string
    last_name: string
    phone_number: string | null
    email: string | null
  } | null
  boxes?: { name_or_number: string } | null
  service_catalog?: { name: string } | null
  appointment_staff?: Array<{ 
    staff_id: string
    staff?: { full_name: string } | null 
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
        
        // Fetch staff
        const { data: staffData } = await supabase
          .from('staff_clinics')
          .select('staff_id, staff:staff_id(id, full_name)')
          .eq('clinic_id', cId)
        
        const staffList = (staffData ?? [])
          .map(s => s.staff as unknown as DbStaff)
          .filter(Boolean)
        setStaff(staffList)
      }
    }
    
    void init()
  }, [isOpen, supabase, propClinicId])

  const handleDownload = async () => {
    if (!clinicId || selectedDates.length === 0) return
    
    setIsGenerating(true)
    
    try {
      // Get date range
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
      const startDate = new Date(sortedDates[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(sortedDates[sortedDates.length - 1])
      endDate.setHours(23, 59, 59, 999)
      
      // Build query
      let query = supabase
        .from('appointments')
        .select(`
          id, scheduled_start_time, scheduled_end_time, status, public_ref, notes,
          patients (first_name, last_name, phone_number, email),
          boxes (name_or_number),
          service_catalog (name),
          appointment_staff (staff_id, staff:staff_id(full_name))
        `)
        .eq('clinic_id', clinicId)
        .gte('scheduled_start_time', startDate.toISOString())
        .lte('scheduled_start_time', endDate.toISOString())
        .not('status', 'in', '("cancelled","no_show")')
        .order('scheduled_start_time', { ascending: true })
      
      // Filter by professional if selected
      if (selectedProfesional) {
        // We need to filter appointments that have this staff assigned
        // This is done client-side since appointment_staff is a join table
      }
      
      const { data: appointments } = await query
      
      // Filter by professional client-side if needed
      let filteredAppointments = (appointments as DbAppointment[]) ?? []
      if (selectedProfesional) {
        filteredAppointments = filteredAppointments.filter(appt => 
          appt.appointment_staff?.some(as => as.staff_id === selectedProfesional)
        )
      }
      
      // Group appointments by date
      const appointmentsByDate = new Map<string, DbAppointment[]>()
      for (const appt of filteredAppointments) {
        const date = new Date(appt.scheduled_start_time)
        const dateKey = date.toISOString().split('T')[0]
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
      
      // Count stats
      const totalAppointments = filteredAppointments.length
      const uniqueProfessionals = new Set(
        filteredAppointments.flatMap(a => a.appointment_staff?.map(as => as.staff_id) ?? [])
      ).size
      const uniqueBoxes = new Set(
        filteredAppointments.map(a => a.boxes?.name_or_number).filter(Boolean)
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
      <p>Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
    </div>
  </div>
`
      
      // Add appointments by date
      for (const [dateKey, dayAppointments] of appointmentsByDate) {
        const date = new Date(dateKey + 'T00:00:00')
        htmlContent += `
  <div class="section">
    <div class="date-header">${formatDate(date)}</div>
`
        for (const appt of dayAppointments) {
          const patientName = appt.patients 
            ? `${appt.patients.first_name} ${appt.patients.last_name}`
            : 'Sin paciente'
          const staffNames = appt.appointment_staff
            ?.map(as => as.staff?.full_name)
            .filter(Boolean)
            .join(', ') ?? 'Sin asignar'
          
          htmlContent += `
    <div class="appointment-card">
      <div>
        <span class="time">${formatTime(appt.scheduled_start_time)}</span>
        <span class="service">${appt.service_catalog?.name ?? 'Cita'}</span>
        ${appt.boxes?.name_or_number ? `<span style="margin-left: 10px; color: #888;">(${appt.boxes.name_or_number})</span>` : ''}
      </div>
      <div class="details">
        <div class="detail-item">
          <span class="label">Paciente:</span>
          <span>${patientName}</span>
        </div>
        <div class="detail-item">
          <span class="label">Teléfono:</span>
          <span>${appt.patients?.phone_number ?? '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Email:</span>
          <span>${appt.patients?.email ?? '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Profesional:</span>
          <span>${staffNames}</span>
        </div>
      </div>
      ${appt.notes ? `<div class="notes">${appt.notes}</div>` : ''}
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
