'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useRef, useState } from 'react'

type CreateAppointmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AppointmentFormData) => void
  clinicId?: string | null
  appointment?: AppointmentForEdit
  defaults?: Partial<AppointmentFormData> & { start_iso?: string }
}

export type AppointmentFormData = {
  servicio: string
  paciente: string
  responsable: string
  observaciones: string
  presupuesto: string
  fecha: string
  hora: string
  box: string
}

type ServiceOption = { value: string; label: string; duration: number }
type PatientOption = { value: string; label: string }
type StaffOption = { value: string; label: string }
type BoxOption = { value: string; label: string }

type AppointmentForEdit = {
  id: number
  patient_id: string
  service_id: number | null
  box_id: string | null
  scheduled_start_time: string
  scheduled_end_time: string | null
  notes: string | null
  status?: string | null
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  clinicId,
  appointment,
  defaults = {}
}: CreateAppointmentModalProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const isEditing = Boolean(appointment)
  const defaultsAppliedRef = useRef(false)
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    servicio: '',
    paciente: '',
    responsable: '',
    observaciones: '',
    presupuesto: '',
    fecha: '',
    hora: '',
    box: '',
  })
  
  // Data from database
  const [servicios, setServicios] = useState<ServiceOption[]>([])
  const [pacientes, setPacientes] = useState<PatientOption[]>([])
  const [responsables, setResponsables] = useState<StaffOption[]>([])
  const [boxes, setBoxes] = useState<BoxOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen || !clinicId) return
    
    async function fetchData() {
      // Fetch services
      const { data: serviceData } = await supabase
        .from('service_catalog')
        .select('id, name, default_duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name')
      
      setServicios((serviceData ?? []).map(s => ({
        value: String(s.id),
        label: s.name,
        duration: s.default_duration_minutes ?? 30
      })))
      
      // Fetch patients
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('clinic_id', clinicId)
        .order('first_name')
        .limit(100)
      
      setPacientes((patientData ?? []).map(p => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name}`
      })))
      
      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff_clinics')
        .select('staff_id, staff:staff_id(id, full_name)')
        .eq('clinic_id', clinicId)
      
      setResponsables((staffData ?? [])
        .map(s => s.staff as unknown as { id: string; full_name: string })
        .filter(Boolean)
        .map(s => ({ value: s.id, label: s.full_name })))
      
      // Fetch boxes
      const { data: boxData } = await supabase
        .from('boxes')
        .select('id, name_or_number')
        .eq('clinic_id', clinicId)
        .order('name_or_number')
      
      setBoxes((boxData ?? []).map(b => ({
        value: b.id,
        label: (b as { name?: string; name_or_number?: string }).name_or_number ?? (b as { name?: string }).name ?? ''
      })))
    }
    
    void fetchData()
  }, [isOpen, clinicId, supabase])

  // Prefill form when editing
  useEffect(() => {
    if (!appointment) return
    const start = new Date(appointment.scheduled_start_time)
    const dateStr = start.toISOString().slice(0, 10)
    const timeStr = start.toTimeString().slice(0, 5)

    setFormData({
      servicio: appointment.service_id ? String(appointment.service_id) : '',
      paciente: appointment.patient_id,
      responsable: '',
      observaciones: appointment.notes ?? '',
      presupuesto: '',
      fecha: dateStr,
      hora: timeStr,
      box: appointment.box_id ?? ''
    })
  }, [appointment])

  // Reset flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      defaultsAppliedRef.current = false
    }
  }, [isOpen])

  // Prefill defaults (e.g., from holds) once per open, only when not editing an existing appointment
  useEffect(() => {
    if (appointment || defaultsAppliedRef.current) return
    const hasDefaults =
      defaults.servicio || defaults.paciente || defaults.box || defaults.start_iso
    if (!hasDefaults) return

    let fecha = ''
    let hora = ''
    if (defaults.start_iso) {
      const d = new Date(defaults.start_iso)
      fecha = d.toISOString().slice(0, 10)
      hora = d.toTimeString().slice(0, 5)
    }
    setFormData((prev) => ({
      ...prev,
      servicio: defaults.servicio ?? prev.servicio,
      paciente: defaults.paciente ?? prev.paciente,
      box: defaults.box ?? prev.box,
      fecha: fecha || prev.fecha,
      hora: hora || prev.hora
    }))
    defaultsAppliedRef.current = true
  }, [
    appointment,
    defaults.box,
    defaults.paciente,
    defaults.servicio,
    defaults.start_iso
  ])

  const handleSubmit = async () => {
    if (!clinicId || !formData.paciente || !formData.fecha || !formData.hora || !formData.box) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Calculate end time based on service duration
      const service = servicios.find(s => s.value === formData.servicio)
      const durationMinutes = service?.duration ?? 30
      
      const startDateTime = new Date(`${formData.fecha}T${formData.hora}`)
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)
      
      const payload = {
        clinic_id: clinicId,
        patient_id: formData.paciente,
        box_id: formData.box,
        service_id: formData.servicio ? Number(formData.servicio) : null,
        scheduled_start_time: startDateTime.toISOString(),
        scheduled_end_time: endDateTime.toISOString(),
        notes: formData.observaciones || null,
        source: 'manual'
      }

      if (appointment) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', appointment.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert({
            ...payload,
            status: 'scheduled'
          })
        if (insertError) throw insertError
      }

      onSubmit?.(formData)
      
      // Reset form
      setFormData({
        servicio: '',
        paciente: '',
        responsable: '',
        observaciones: '',
        presupuesto: '',
        fecha: '',
        hora: '',
        box: '',
      })
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError('Error al crear la cita. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Legacy presupuestos - keep for UI but not functional yet
  const presupuestos = [
    { value: 'p1', label: 'Presupuesto #001' },
    { value: 'p2', label: 'Presupuesto #002' },
    { value: 'p3', label: 'Presupuesto #003' },
  ]

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className='relative w-[min(68.25rem,92vw)] h-[min(59.75rem,85vh)] overflow-clip rounded-lg bg-[#f8fafb]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - 56px height, border bottom */}
        <div className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-solid border-[#cbd3d9] px-8 bg-[#f8fafb]'>
          <p className='font-medium text-[1.125rem] leading-[1.75rem] text-[#24282c]'>
            {isEditing ? 'Editar cita' : 'Añadir cita'}
          </p>
          <button
            onClick={onClose}
            className='flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-200 transition-colors'
            aria-label='Cerrar modal'
          >
            <span className='material-symbols-rounded text-sm text-[#24282c]'>
              close
            </span>
          </button>
        </div>

        {/* Main Title - left: 229px (14.3125rem), top: 96px (6rem) */}
        <div
          className='absolute flex items-center gap-2'
          style={{
            left: 'calc(20.97% + 1.5rem)',
            top: '6rem',
          }}
        >
          <p className='font-medium text-[1.5rem] leading-[2rem] text-[#24282c]'>
            {isEditing ? 'Editar cita del calendario' : 'Añadir una cita al calendario'}
          </p>
        </div>

        {/* Servicio - top: 184px (11.5rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '11.5rem',
          }}
        >
          Servicio
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '11.5rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.servicio}
            onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar servicio</option>
            {servicios.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Paciente - top: 287px (17.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '17.9375rem',
          }}
        >
          Paciente
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '17.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.paciente}
            onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar paciente</option>
            {pacientes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Responsable - top: 383px (23.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '23.9375rem',
          }}
        >
          Responsable
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '23.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.responsable}
            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar responsable</option>
            {responsables.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Observaciones - top: 479px (29.9375rem), height: 80px */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '29.9375rem',
          }}
        >
          Observaciones
        </p>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          placeholder='Añadir observaciones'
          className='absolute h-[5rem] resize-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 font-normal text-base leading-6 text-[#24282c] placeholder:text-[#aeb8c2] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '29.9375rem',
            width: '19.1875rem',
          }}
          rows={3}
        />

        {/* Presupuesto - top: 607px (37.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '37.9375rem',
          }}
        >
          Presupuesto
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '37.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.presupuesto}
            onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar presupuesto</option>
            {presupuestos.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Fecha de la cita - top: 703px (43.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '43.9375rem',
          }}
        >
          Fecha de la cita
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '43.9375rem',
            width: '19.1875rem',
          }}
        >
          <input
            type='date'
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            placeholder='Martes 13 de Octubre'
            className='h-[3rem] w-full rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-10 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          />
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#aeb8c2]'>
              calendar_month
            </span>
          </div>
        </div>

        {/* Hora de la cita - top: ~783px (48.9375rem) - NUEVO */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '48.9375rem',
          }}
        >
          Hora de la cita
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '48.9375rem',
            width: '19.1875rem',
          }}
        >
          <input
            type='time'
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            className='h-[3rem] w-full rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-10 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          />
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#aeb8c2]'>
              schedule
            </span>
          </div>
        </div>

        {/* Separator Line - top: 852px (53.25rem) */}
        <div
          className='absolute h-px bg-[#cbd3d9]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '53.25rem',
            width: '31.5rem',
          }}
        />

        {/* Box selector - between Hora and separator */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '51.4375rem',
          }}
        >
          Box / Gabinete
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '51.4375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.box}
            onChange={(e) => setFormData({ ...formData, box: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar box</option>
            {boxes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            className='absolute font-normal text-sm leading-5 text-red-600'
            style={{
              left: 'calc(44.96% + 0.8rem)',
              top: '54.5rem',
              width: '19.1875rem',
            }}
          >
            {error}
          </p>
        )}

        {/* Separator Line - adjusted */}
        <div
          className='absolute h-px bg-[#cbd3d9]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '55.75rem',
            width: '31.5rem',
          }}
        />

        {/* Add Button - adjusted */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className='absolute flex items-center justify-center gap-2 rounded-[8.5rem] border border-solid border-[#cbd3d9] bg-[#51d6c7] px-4 py-2 transition-all hover:bg-[#3fb7ab] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          style={{
            left: 'calc(50% + 2.3125rem)',
            top: '57.25rem',
            width: '13.4375rem',
            height: '2.5rem',
          }}
        >
          <span className='font-medium text-base leading-6 text-[#1e4947]'>
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Añadir'}
          </span>
          {!isSubmitting && (
            <span className='material-symbols-rounded text-2xl text-[#1e4947]'>
              arrow_forward
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

