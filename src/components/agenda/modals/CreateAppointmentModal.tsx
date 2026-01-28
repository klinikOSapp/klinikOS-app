'use client'

import { SelectInput, DatePickerInput } from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import Portal from '@/components/ui/Portal'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { BlockType, RecurrencePattern } from '@/context/AppointmentsContext'
import { BLOCK_TYPE_CONFIG, useAppointments } from '@/context/AppointmentsContext'
import { usePatients, type PatientTreatment } from '@/context/PatientsContext'

type CreateAppointmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AppointmentFormData) => void
  onSubmitBlock?: (data: BlockFormData) => void
  initialData?: Partial<AppointmentFormData>
}

export type AppointmentFormData = {
  servicio: string
  paciente: string
  pacienteId: string
  responsable: string
  observaciones: string
  presupuesto: string
  fecha: string
  hora: string
  duracion: string
  box: string
  linkedTreatments?: {
    id: string
    description: string
    amount: string
  }[]
}

export type BlockFormData = {
  blockType: BlockType
  responsable: string
  observaciones: string
  fecha: string
  hora: string
  duracion: string
  box: string
  recurrence: RecurrencePattern
}

const getEmptyFormData = (): AppointmentFormData => ({
  servicio: '',
  paciente: '',
  pacienteId: '',
  responsable: '',
  observaciones: '',
  presupuesto: '',
  fecha: '',
  hora: '',
  duracion: '',
  box: '',
  linkedTreatments: []
})

const getEmptyBlockFormData = (): BlockFormData => ({
  blockType: 'other',
  responsable: '',
  observaciones: '',
  fecha: '',
  hora: '',
  duracion: '',
  box: '',
  recurrence: { type: 'none' }
})

const DAYS_OF_WEEK = [
  { value: 1, label: 'L', fullLabel: 'Lunes' },
  { value: 2, label: 'M', fullLabel: 'Martes' },
  { value: 3, label: 'X', fullLabel: 'Miércoles' },
  { value: 4, label: 'J', fullLabel: 'Jueves' },
  { value: 5, label: 'V', fullLabel: 'Viernes' },
  { value: 6, label: 'S', fullLabel: 'Sábado' },
  { value: 0, label: 'D', fullLabel: 'Domingo' }
]

// Generate time slots from 08:00 to 21:00 in 15-minute increments
const TIME_SLOTS = (() => {
  const slots: { value: string; label: string }[] = []
  for (let h = 8; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break
      const hStr = h.toString().padStart(2, '0')
      const mStr = m.toString().padStart(2, '0')
      slots.push({ value: `${hStr}:${mStr}`, label: `${hStr}:${mStr}` })
    }
  }
  return slots
})()

// Reusable form row component for consistent styling
function FormRow({ 
  label, 
  icon, 
  required, 
  children 
}: { 
  label: string
  icon?: string
  required?: boolean
  children: React.ReactNode 
}) {
  return (
    <div className='flex items-center gap-4'>
      <div className='flex w-[9rem] shrink-0 items-center gap-2'>
        {icon && (
          <span className='material-symbols-rounded text-lg text-[#6b7280]'>
            {icon}
          </span>
        )}
        <p className='font-normal text-sm leading-5 text-[#4b5563]'>
          {label}
          {required && <span className='ml-0.5 text-red-400'>*</span>}
        </p>
      </div>
      <div className='flex-1'>
        {children}
      </div>
    </div>
  )
}

// Time Picker Component
function TimePickerInput({
  value,
  onChange,
  hasError
}: {
  value: string
  onChange: (time: string) => void
  hasError?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ left: number; top: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Position the popover
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const popoverHeight = 280
    const margin = 8
    
    let top = rect.bottom + 4
    if (top + popoverHeight > window.innerHeight - margin) {
      top = rect.top - popoverHeight - 4
    }
    
    setPopoverPos({
      left: rect.left,
      top: Math.max(margin, top)
    })
  }, [isOpen])

  // Scroll to selected time when opening
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedIndex = TIME_SLOTS.findIndex(s => s.value === value)
      if (selectedIndex >= 0) {
        const itemHeight = 40
        listRef.current.scrollTop = selectedIndex * itemHeight - 100
      }
    }
  }, [isOpen, value])

  const displayValue = value || 'Seleccionar...'

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => setIsOpen(v => !v)}
        className={`h-12 w-full rounded-lg border bg-[var(--color-neutral-50)] px-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 ${
          hasError 
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
            : 'border-[var(--color-neutral-300)] focus:border-brand-400 focus:ring-brand-100'
        } ${value ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-400)]'}`}
      >
        {displayValue}
      </button>
      
      {isOpen && popoverPos && createPortal(
        <div
          ref={popoverRef}
          className='fixed z-[10000] w-36 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden'
          style={{ left: popoverPos.left, top: popoverPos.top }}
        >
          <div 
            ref={listRef}
            className='max-h-[280px] overflow-y-auto py-1'
          >
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.value}
                type='button'
                onClick={() => {
                  onChange(slot.value)
                  setIsOpen(false)
                }}
                className={`w-full h-10 px-4 text-left text-sm transition-colors ${
                  slot.value === value
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// Duration options for the dropdown
const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '75', label: '1h 15m' },
  { value: '90', label: '1h 30m' },
  { value: '105', label: '1h 45m' },
  { value: '120', label: '2 horas' },
  { value: '150', label: '2h 30m' },
  { value: '180', label: '3 horas' },
]

// Duration Input Component - editable input with dropdown suggestions
function DurationInput({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [popoverPos, setPopoverPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync input value with prop value when not focused
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(value || '')
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Position the popover
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const popoverHeight = 280
    const margin = 8
    
    let top = rect.bottom + 4
    if (top + popoverHeight > window.innerHeight - margin) {
      top = rect.top - popoverHeight - 4
    }
    
    setPopoverPos({
      left: rect.left,
      top: Math.max(margin, top),
      width: rect.width
    })
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(newValue)
    if (newValue) {
      const mins = parseInt(newValue, 10)
      if (!isNaN(mins) && mins > 0) {
        onChange(newValue)
      }
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setInputValue(value || '')
  }

  const handleInputBlur = () => {
    // Small delay to allow clicking on dropdown options
    setTimeout(() => {
      if (!inputValue && value) {
        setInputValue(value)
      }
    }, 150)
  }

  const handleSelectPreset = (optionValue: string) => {
    onChange(optionValue)
    setInputValue(optionValue)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  // Get display value - show formatted label when not focused
  const displayValue = document.activeElement === inputRef.current ? inputValue : (value || '')

  return (
    <>
      <div ref={containerRef} className='relative'>
        <div className='relative'>
          <input
            ref={inputRef}
            type='text'
            inputMode='numeric'
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder='Minutos'
            className='h-12 w-full rounded-lg border bg-[var(--color-neutral-50)] pl-3 pr-10 text-left text-sm transition-colors focus:outline-none focus:ring-2 border-[var(--color-neutral-300)] focus:border-brand-400 focus:ring-brand-100 text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]'
          />
          <button
            type='button'
            tabIndex={-1}
            onClick={() => {
              setIsOpen(v => !v)
              if (!isOpen) inputRef.current?.focus()
            }}
            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600'
          >
            <span className='material-symbols-rounded text-lg'>
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>
      
      {isOpen && popoverPos && createPortal(
        <div
          ref={popoverRef}
          className='fixed z-[10000] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden'
          style={{ left: popoverPos.left, top: popoverPos.top, width: popoverPos.width }}
        >
          <div className='max-h-[260px] overflow-y-auto py-1'>
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type='button'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectPreset(option.value)}
                className={`w-full h-10 px-4 text-left text-sm transition-colors flex items-center justify-between ${
                  option.value === value
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{option.label}</span>
                <span className='text-xs text-gray-400'>{option.value} min</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// Helper to convert Date to YYYY-MM-DD string
function dateToString(date: Date | null | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Helper to convert YYYY-MM-DD string to Date
function stringToDate(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// Type for treatment with selection state
type SelectableTreatment = PatientTreatment & { selected: boolean }

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBlock,
  initialData
}: CreateAppointmentModalProps) {
  const { isTimeSlotBlocked } = useAppointments()
  const { getPatientsForSelect, getPendingTreatments, getPatientById } = usePatients()
  const [formData, setFormData] = useState<AppointmentFormData>(() => getEmptyFormData())
  const [blockFormData, setBlockFormData] = useState<BlockFormData>(() => getEmptyBlockFormData())
  const [blockConflictError, setBlockConflictError] = useState<string | null>(null)
  const [pendingTreatments, setPendingTreatments] = useState<SelectableTreatment[]>([])
  
  const isBlockMode = formData.servicio === 'block'
  
  // Get patients list from context
  const pacientes = getPatientsForSelect()

  // Handle patient selection - load pending treatments
  const handlePatientChange = useCallback((patientId: string) => {
    const patient = getPatientById(patientId)
    const patientName = patient?.fullName || ''
    
    setFormData(prev => ({ 
      ...prev, 
      paciente: patientName,
      pacienteId: patientId,
      // Clear block mode when selecting a patient
      servicio: prev.servicio === 'block' ? '' : prev.servicio
    }))
    
    if (patientId) {
      // Get pending treatments for this patient
      const treatments = getPendingTreatments(patientId)
      // Mark treatments with status 'Pendiente' as pre-selected
      const selectableTreatments: SelectableTreatment[] = treatments.map(t => ({
        ...t,
        selected: t.status === 'Pendiente'
      }))
      setPendingTreatments(selectableTreatments)
    } else {
      setPendingTreatments([])
    }
  }, [getPatientById, getPendingTreatments])

  // Toggle treatment selection
  const toggleTreatmentSelection = useCallback((treatmentId: string) => {
    setPendingTreatments(prev => 
      prev.map(t => 
        t.id === treatmentId ? { ...t, selected: !t.selected } : t
      )
    )
  }, [])

  // Get selected treatments for form submission
  const selectedTreatments = useMemo(() => {
    return pendingTreatments
      .filter(t => t.selected)
      .map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount
      }))
  }, [pendingTreatments])

  const hasTimeSlotConflict = useMemo(() => {
    if (isBlockMode) return false
    if (!formData.fecha || !formData.hora) return false
    
    const [hours, minutes] = formData.hora.split(':').map(Number)
    const duration = parseInt(formData.duracion || '30', 10)
    const endMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
    
    return isTimeSlotBlocked(formData.fecha, formData.hora, endTime, formData.box || undefined)
  }, [isBlockMode, formData.fecha, formData.hora, formData.duracion, formData.box, isTimeSlotBlocked])

  useEffect(() => {
    if (hasTimeSlotConflict) {
      setBlockConflictError('Este horario está bloqueado')
    } else {
      setBlockConflictError(null)
    }
  }, [hasTimeSlotConflict])

  const handleOpenCreatePatient = (name?: string) => {
    onClose()
    window.dispatchEvent(
      new CustomEvent('patients:open-add-patient', { detail: { name } })
    )
  }

  useEffect(() => {
    if (!isOpen) {
      setFormData(getEmptyFormData())
      setBlockFormData(getEmptyBlockFormData())
      setPendingTreatments([])
      return
    }

    if (initialData) {
      setFormData((previous) => ({
        ...previous,
        ...initialData
      }))
    }
  }, [initialData, isOpen])

  const handleSubmit = () => {
    if (isBlockMode) {
      onSubmitBlock?.(blockFormData)
    } else {
      // Include selected treatments in form data
      const dataWithTreatments: AppointmentFormData = {
        ...formData,
        linkedTreatments: selectedTreatments
      }
      onSubmit?.(dataWithTreatments)
    }
    setFormData(getEmptyFormData())
    setBlockFormData(getEmptyBlockFormData())
    setPendingTreatments([])
  }

  const toggleRecurrenceDay = (dayValue: number) => {
    setBlockFormData(prev => {
      const currentDays = prev.recurrence.daysOfWeek || []
      const newDays = currentDays.includes(dayValue)
        ? currentDays.filter(d => d !== dayValue)
        : [...currentDays, dayValue].sort()
      return {
        ...prev,
        recurrence: {
          ...prev.recurrence,
          daysOfWeek: newDays
        }
      }
    })
  }

  if (!isOpen) return null

  const servicios = [
    { value: 'block', label: 'Bloquear agenda' },
    { value: 'consulta', label: 'Consulta' },
    { value: 'limpieza', label: 'Limpieza dental' },
    { value: 'ortodoncia', label: 'Ortodoncia' },
    { value: 'endodoncia', label: 'Endodoncia' },
    { value: 'revision', label: 'Revisión' },
    { value: 'extraccion', label: 'Extracción' },
  ]

  // pacientes now comes from context (getPatientsForSelect)

  const responsables = [
    { value: '', label: 'Sin asignar' },
    { value: 'dr1', label: 'Dr. Antonio López' },
    { value: 'dr2', label: 'Dra. Carmen Sánchez' },
    { value: 'dr3', label: 'Dr. Miguel Torres' },
  ]

  const blockTypes = Object.entries(BLOCK_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label
  }))

  const boxes = [
    { value: 'box 1', label: 'Box 1' },
    { value: 'box 2', label: 'Box 2' },
    { value: 'box 3', label: 'Box 3' },
  ]


  const recurrenceTypes = [
    { value: 'none', label: 'No repetir' },
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'custom', label: 'Personalizado' },
  ]

  const isBlockFormValid = isBlockMode && 
    blockFormData.blockType && 
    blockFormData.fecha && 
    blockFormData.hora && 
    blockFormData.duracion && 
    blockFormData.box

  // Determine if patient has pending treatments
  const hasPendingTreatments = formData.pacienteId && pendingTreatments.length > 0
  
  // Appointment is valid if:
  // - Has patient, date, time, duration, and no conflict
  // - AND either: has selected treatments OR has selected a service (when no pending treatments)
  const isAppointmentFormValid = !isBlockMode && 
    formData.paciente && 
    formData.fecha && 
    formData.hora &&
    formData.duracion &&
    !hasTimeSlotConflict &&
    (selectedTreatments.length > 0 || (!hasPendingTreatments && formData.servicio))

  const canSubmit = isBlockMode ? isBlockFormValid : isAppointmentFormValid

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]'
        onClick={onClose}
      >
        <div
          className='relative w-[min(32rem,92vw)] overflow-hidden rounded-2xl bg-white shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 ${
            isBlockMode 
              ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200' 
              : 'bg-gradient-to-r from-brand-50 to-teal-50 border-b border-brand-100'
          }`}>
            <div className='flex items-center gap-3'>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isBlockMode ? 'bg-gray-200' : 'bg-brand-100'
              }`}>
                <span className={`material-symbols-rounded text-xl ${
                  isBlockMode ? 'text-gray-600' : 'text-brand-600'
                }`}>
                  {isBlockMode ? 'block' : 'calendar_add_on'}
                </span>
              </div>
              <div>
                <h2 className='font-semibold text-base text-[#1f2937]'>
                  {isBlockMode ? 'Bloquear agenda' : 'Nueva cita'}
                </h2>
                <p className='text-xs text-[#6b7280]'>
                  {isBlockMode ? 'Reservar tiempo para actividades' : 'Agendar paciente'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-xl'>close</span>
            </button>
          </div>

          {/* Content */}
          <div className='max-h-[60vh] overflow-y-auto px-6 py-5'>
            <div className='flex flex-col gap-5'>

              {isBlockMode ? (
                <>
                  {/* Back to appointment mode */}
                  <button
                    type='button'
                    onClick={() => setFormData(prev => ({ ...prev, servicio: '' }))}
                    className='flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors -mb-2'
                  >
                    <span className='material-symbols-rounded text-base'>arrow_back</span>
                    <span>Volver a crear cita</span>
                  </button>

                  {/* Block mode fields */}
                  <FormRow label='Tipo' icon='category'>
                    <SelectInput
                      placeholder='Seleccionar tipo...'
                      value={blockFormData.blockType}
                      onChange={(v) => setBlockFormData(prev => ({ ...prev, blockType: v as BlockType }))}
                      options={blockTypes}
                    />
                  </FormRow>

                  <FormRow label='Box' icon='door_open' required>
                    <SelectInput
                      placeholder='Seleccionar box...'
                      value={blockFormData.box}
                      onChange={(v) => setBlockFormData(prev => ({ ...prev, box: v }))}
                      options={boxes}
                    />
                  </FormRow>

                  <FormRow label='Responsable' icon='person'>
                    <SelectInput
                      placeholder='Sin asignar'
                      value={blockFormData.responsable}
                      onChange={(v) => setBlockFormData(prev => ({ ...prev, responsable: v }))}
                      options={responsables}
                    />
                  </FormRow>

                  <div className='h-px bg-gray-100' />

                  <FormRow label='Fecha' icon='calendar_month' required>
                    <DatePickerInput
                      value={stringToDate(blockFormData.fecha)}
                      onChange={(d) => setBlockFormData(prev => ({ ...prev, fecha: dateToString(d) }))}
                    />
                  </FormRow>

                  <FormRow label='Hora' icon='schedule' required>
                    <TimePickerInput
                      value={blockFormData.hora}
                      onChange={(t) => setBlockFormData(prev => ({ ...prev, hora: t }))}
                    />
                  </FormRow>

                  <FormRow label='Duración' icon='timelapse' required>
                    <DurationInput
                      value={blockFormData.duracion}
                      onChange={(v) => setBlockFormData(prev => ({ ...prev, duracion: v }))}
                    />
                  </FormRow>

                  <FormRow label='Descripción' icon='notes'>
                    <textarea
                      value={blockFormData.observaciones}
                      onChange={(e) => setBlockFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder='Ej: Limpieza, descanso, reunión...'
                      className='h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'
                      rows={2}
                    />
                  </FormRow>

                  <div className='h-px bg-gray-100' />

                  <FormRow label='Repetir' icon='repeat'>
                    <SelectInput
                      placeholder='No repetir'
                      value={blockFormData.recurrence.type}
                      onChange={(v) => setBlockFormData(prev => ({ 
                        ...prev, 
                        recurrence: { 
                          ...prev.recurrence, 
                          type: v as RecurrencePattern['type'],
                          daysOfWeek: v === 'custom' ? [] : undefined
                        } 
                      }))}
                      options={recurrenceTypes}
                    />
                  </FormRow>

                  {blockFormData.recurrence.type === 'custom' && (
                    <FormRow label='Días' icon='date_range'>
                      <div className='flex gap-1.5'>
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = blockFormData.recurrence.daysOfWeek?.includes(day.value)
                          return (
                            <button
                              key={day.value}
                              type='button'
                              onClick={() => toggleRecurrenceDay(day.value)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-brand-500 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                              title={day.fullLabel}
                            >
                              {day.label}
                            </button>
                          )
                        })}
                      </div>
                    </FormRow>
                  )}

                  {blockFormData.recurrence.type !== 'none' && (
                    <FormRow label='Hasta' icon='event'>
                      <DatePickerInput
                        value={stringToDate(blockFormData.recurrence.endDate || '')}
                        onChange={(d) => setBlockFormData(prev => ({ 
                          ...prev, 
                          recurrence: { 
                            ...prev.recurrence, 
                            endDate: dateToString(d) 
                          } 
                        }))}
                      />
                    </FormRow>
                  )}
                </>
              ) : (
                <>
                  {/* Appointment mode fields - Patient FIRST */}
                  <FormRow label='Paciente' icon='person' required>
                    <SelectInput
                      placeholder='Buscar paciente...'
                      value={formData.pacienteId}
                      onChange={handlePatientChange}
                      options={pacientes}
                      onCreate={(text) => handleOpenCreatePatient(text)}
                      createLabel='Crear paciente'
                      createLabelFromInput={(text) =>
                        text?.trim() ? `Crear "${text.trim()}"` : 'Crear paciente'
                      }
                    />
                  </FormRow>

                  {/* Option to block agenda when no patient selected */}
                  {!formData.pacienteId && (
                    <button
                      type='button'
                      onClick={() => setFormData(prev => ({ ...prev, servicio: 'block' }))}
                      className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors -mt-2'
                    >
                      <span className='material-symbols-rounded text-base'>block</span>
                      <span>¿Necesitas bloquear la agenda?</span>
                    </button>
                  )}

                  {/* Pending treatments section - shown when patient has treatments */}
                  {formData.pacienteId && pendingTreatments.length > 0 && (
                    <div className='rounded-xl border border-brand-200 bg-brand-50/50 p-4'>
                      <div className='mb-3 flex items-center gap-2'>
                        <span className='material-symbols-rounded text-lg text-brand-600'>
                          medical_services
                        </span>
                        <h3 className='text-sm font-medium text-gray-800'>
                          Tratamientos pendientes ({pendingTreatments.length})
                        </h3>
                      </div>
                      <div className='space-y-2'>
                        {pendingTreatments.map((treatment) => (
                          <button
                            key={treatment.id}
                            type='button'
                            onClick={() => toggleTreatmentSelection(treatment.id)}
                            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                              treatment.selected
                                ? 'border-brand-300 bg-white shadow-sm'
                                : 'border-transparent bg-white/60 hover:bg-white hover:border-gray-200'
                            }`}
                          >
                            <span className={`material-symbols-rounded text-xl ${
                              treatment.selected ? 'text-brand-500' : 'text-gray-300'
                            }`}>
                              {treatment.selected ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900 truncate'>
                                {treatment.description}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {treatment.professional}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-sm font-semibold text-gray-900'>
                                {treatment.amount}
                              </p>
                              <span className={`inline-flex text-xs px-1.5 py-0.5 rounded ${
                                treatment.status === 'Aceptado' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : treatment.status === 'Recall'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {treatment.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedTreatments.length > 0 && (
                        <p className='mt-3 text-xs text-brand-600'>
                          {selectedTreatments.length} tratamiento{selectedTreatments.length > 1 ? 's' : ''} seleccionado{selectedTreatments.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Servicio - Only shown when patient has NO pending treatments */}
                  {formData.pacienteId && pendingTreatments.length === 0 && (
                    <FormRow label='Servicio' icon='medical_services' required>
                      <SelectInput
                        placeholder='Seleccionar servicio...'
                        value={formData.servicio}
                        onChange={(v) => setFormData(prev => ({ ...prev, servicio: v }))}
                        options={servicios.filter(s => s.value !== 'block')}
                      />
                    </FormRow>
                  )}

                  <FormRow label='Profesional' icon='stethoscope'>
                    <SelectInput
                      placeholder='Seleccionar...'
                      value={formData.responsable}
                      onChange={(v) => setFormData(prev => ({ ...prev, responsable: v }))}
                      options={responsables.filter(r => r.value !== '')}
                    />
                  </FormRow>

                  <FormRow label='Box' icon='door_open'>
                    <SelectInput
                      placeholder='Cualquiera'
                      value={formData.box}
                      onChange={(v) => setFormData(prev => ({ ...prev, box: v }))}
                      options={[{ value: '', label: 'Cualquiera' }, ...boxes]}
                    />
                  </FormRow>

                  <div className='h-px bg-gray-100' />

                  <FormRow label='Fecha' icon='calendar_month' required>
                    <DatePickerInput
                      value={stringToDate(formData.fecha)}
                      onChange={(d) => setFormData(prev => ({ ...prev, fecha: dateToString(d) }))}
                    />
                  </FormRow>

                  <FormRow label='Hora' icon='schedule' required>
                    <TimePickerInput
                      value={formData.hora}
                      onChange={(t) => setFormData(prev => ({ ...prev, hora: t }))}
                      hasError={!!blockConflictError}
                    />
                  </FormRow>

                  <FormRow label='Duración' icon='timelapse' required>
                    <DurationInput
                      value={formData.duracion}
                      onChange={(v) => setFormData(prev => ({ ...prev, duracion: v }))}
                    />
                  </FormRow>

                  {blockConflictError && (
                    <div className='flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2'>
                      <span className='material-symbols-rounded text-base text-red-500'>warning</span>
                      <p className='text-xs text-red-600'>{blockConflictError}</p>
                    </div>
                  )}

                  <FormRow label='Notas' icon='notes'>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder='Observaciones adicionales...'
                      className='h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'
                      rows={2}
                    />
                  </FormRow>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4'>
            <button
              onClick={onClose}
              className='h-10 px-4 rounded-lg text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-medium transition-all ${
                canSubmit
                  ? isBlockMode
                    ? 'bg-gray-700 text-white hover:bg-gray-800'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{isBlockMode ? 'Bloquear' : 'Crear cita'}</span>
              <span className='material-symbols-rounded text-lg'>
                {isBlockMode ? 'block' : 'check'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
