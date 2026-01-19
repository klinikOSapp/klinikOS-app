'use client'

import { SelectInput, DatePickerInput } from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import Portal from '@/components/ui/Portal'
import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { BlockType, RecurrencePattern } from '@/context/AppointmentsContext'
import { BLOCK_TYPE_CONFIG, useAppointments } from '@/context/AppointmentsContext'

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
  responsable: string
  observaciones: string
  presupuesto: string
  fecha: string
  hora: string
  duracion: string
  box: string
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
  responsable: '',
  observaciones: '',
  presupuesto: '',
  fecha: '',
  hora: '',
  duracion: '30',
  box: ''
})

const getEmptyBlockFormData = (): BlockFormData => ({
  blockType: 'other',
  responsable: '',
  observaciones: '',
  fecha: '',
  hora: '',
  duracion: '30',
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

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBlock,
  initialData
}: CreateAppointmentModalProps) {
  const { isTimeSlotBlocked } = useAppointments()
  const [formData, setFormData] = useState<AppointmentFormData>(() => getEmptyFormData())
  const [blockFormData, setBlockFormData] = useState<BlockFormData>(() => getEmptyBlockFormData())
  const [blockConflictError, setBlockConflictError] = useState<string | null>(null)
  
  const isBlockMode = formData.servicio === 'block'

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
      onSubmit?.(formData)
    }
    setFormData(getEmptyFormData())
    setBlockFormData(getEmptyBlockFormData())
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

  const pacientes = [
    { value: '1', label: 'Juan Pérez' },
    { value: '2', label: 'María García' },
    { value: '3', label: 'Carlos Rodríguez' },
  ]

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

  const duraciones = [
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

  const isAppointmentFormValid = !isBlockMode && 
    formData.servicio && 
    formData.paciente && 
    formData.fecha && 
    formData.hora &&
    !hasTimeSlotConflict

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
              
              {/* Servicio - Always visible */}
              <FormRow label='Servicio' icon='medical_services' required>
                <SelectInput
                  placeholder='Seleccionar...'
                  value={formData.servicio}
                  onChange={(v) => setFormData(prev => ({ ...prev, servicio: v }))}
                  options={servicios}
                />
              </FormRow>

              {isBlockMode ? (
                <>
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
                    <SelectInput
                      placeholder='Seleccionar...'
                      value={blockFormData.duracion}
                      onChange={(v) => setBlockFormData(prev => ({ ...prev, duracion: v }))}
                      options={duraciones}
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
                  {/* Appointment mode fields */}
                  <FormRow label='Paciente' icon='person' required>
                    <SelectInput
                      placeholder='Buscar paciente...'
                      value={formData.paciente}
                      onChange={(v) => setFormData(prev => ({ ...prev, paciente: v }))}
                      options={pacientes}
                      onCreate={(text) => handleOpenCreatePatient(text)}
                      createLabel='Crear paciente'
                      createLabelFromInput={(text) =>
                        text?.trim() ? `Crear "${text.trim()}"` : 'Crear paciente'
                      }
                    />
                  </FormRow>

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

                  <FormRow label='Duración' icon='timelapse'>
                    <SelectInput
                      placeholder='Seleccionar...'
                      value={formData.duracion}
                      onChange={(v) => setFormData(prev => ({ ...prev, duracion: v }))}
                      options={duraciones}
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
