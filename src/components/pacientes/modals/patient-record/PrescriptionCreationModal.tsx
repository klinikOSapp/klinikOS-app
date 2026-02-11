'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import {
  AddRounded,
  ArrowBackRounded,
  ArrowForwardRounded,
  CloseRounded,
  DeleteRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import {
  MODAL_HEIGHT_REM,
  MODAL_SCALE_FORMULA,
  MODAL_WIDTH_REM
} from './modalDimensions'
import MedicamentoAutocomplete, { mapViaToOption } from '@/components/ui/MedicamentoAutocomplete'

// HU-021: Type for a single medication entry
export type MedicationEntry = {
  id: string
  medicamento: string
  frecuencia: string
  duracion: string
  administracion: string
}

// HU-021: Updated props to support multiple medications
type PrescriptionCreationModalProps = {
  open: boolean
  onClose: () => void
  onBack?: () => void
  // Legacy single medication support
  onContinue?: (data: {
    medicamento: string
    especialista: string
    frecuencia: string
    duracion: string
    administracion: string
    // HU-021: New field for multiple medications
    medicamentos?: MedicationEntry[]
  }) => void
  patientName?: string
}

const TITLE_LEFT_REM = 14.3125
const TITLE_TOP_REM = 6

const FORM_LEFT_REM = 18.3125
const FORM_TOP_REM = 10
const FORM_WIDTH_REM = 31.5

const ROW0_TOP_REM = 0 // Medicamento
const ROW1_TOP_REM = 5.5 // Especialista (sube al hueco de Descuento)
const ROW2_TOP_REM = 11 // Dosis
const ROW3_TOP_REM = 18.25 // Administración (antes 23.75 con Descuento)

const LABEL_LEFT_REM = 0
const INPUT_LEFT_REM = 12.3125
const INPUT_WIDTH_REM = 19.1875
const INPUT_HEIGHT_REM = 3

const SPECIALIST_OPTIONS = ['Dra. Gómez', 'Dr. Pérez', 'Dra. Sánchez']
const ADMINISTRATION_OPTIONS = ['Oral', 'Tópica', 'Intravenosa']

const BOTTOM_LINE_TOP_REM = 53.25
const BUTTONS_TOP_REM = 55.75
const BUTTON_WIDTH_REM = 13.4375
const BUTTON_RADIUS_REM = 8.5

function FieldLabel({
  label,
  top
}: {
  label: string
  top: number
}) {
  return (
    <p
      className='absolute text-body-md text-neutral-900'
      style={{ left: `${LABEL_LEFT_REM}rem`, top: `${top}rem` }}
    >
      {label}
    </p>
  )
}

type TextInputProps = {
  placeholder: string
  top: number
  width?: number
  left?: number
  absolute?: boolean
  value?: string
  onChange?: (val: string) => void
  withIcon?: boolean
}

type ComboBoxProps = {
  placeholder: string
  top: number
  width?: number
  left?: number
  value?: string
  onChange?: (val: string) => void
}

function ComboBox({
  placeholder,
  top,
  width = INPUT_WIDTH_REM,
  left = INPUT_LEFT_REM,
  value,
  onChange
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
    return undefined
  }, [open])

  return (
    <div
      ref={containerRef}
      className='absolute'
      style={{ left: `${left}rem`, top: `${top}rem`, width: `${width}rem` }}
    >
      <div className='relative flex items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50'>
        <input
          type='text'
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className='w-full h-[3rem] bg-transparent px-[0.625rem] pr-8 text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
        />
        <button
          type='button'
          aria-label='Abrir selección'
          onClick={() => setOpen((s) => !s)}
          className='absolute right-2 flex items-center justify-center text-neutral-500'
        >
          <KeyboardArrowDownRounded className='text-neutral-500' />
        </button>
      </div>
      {open && (
        <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-[0.5rem] border border-neutral-300 bg-[rgba(248,250,251,0.95)] backdrop-blur-sm shadow-[2px_2px_4px_rgba(0,0,0,0.1)] max-h-60 overflow-y-auto'>
          {(placeholder === 'Value' ? SPECIALIST_OPTIONS : ADMINISTRATION_OPTIONS)
            .filter((opt) =>
              (value ?? '').length === 0
                ? true
                : opt.toLowerCase().includes((value ?? '').toLowerCase())
            )
            .map((opt) => (
              <button
                key={opt}
                type='button'
                onClick={() => {
                  onChange?.(opt)
                  setOpen(false)
                }}
                className='w-full px-2 py-2 text-left text-body-md text-neutral-900 hover:bg-brand-50'
              >
                {opt}
              </button>
            ))}
          {((placeholder === 'Value' ? SPECIALIST_OPTIONS : ADMINISTRATION_OPTIONS).filter(
            (opt) =>
              (value ?? '').length === 0
                ? true
                : opt.toLowerCase().includes((value ?? '').toLowerCase())
          ).length === 0) && (
            <div className='px-2 py-2 text-body-md text-neutral-500'>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}

function TextInput({
  placeholder,
  top,
  width = INPUT_WIDTH_REM,
  left = INPUT_LEFT_REM,
  absolute = true,
  value,
  onChange,
  withIcon
}: TextInputProps) {
  const positionStyles = absolute
    ? { left: `${left}rem`, top: `${top}rem` }
    : {}

  return (
    <div
      className={[
        absolute ? 'absolute' : '',
        'relative flex items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50'
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...positionStyles, width: `${width}rem`, height: `${INPUT_HEIGHT_REM}rem` }}
    >
      <input
        type='text'
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full h-full bg-transparent px-[0.625rem]',
          withIcon ? 'pr-8' : '',
          'text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
        ].join(' ')}
      />
      {withIcon && (
        <span className='absolute right-2 text-neutral-500'>
          <KeyboardArrowDownRounded className='text-neutral-500' />
        </span>
      )}
    </div>
  )
}

// HU-021: Generate unique ID for medications
function generateMedicationId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// HU-021: Create an empty medication entry
function createEmptyMedication(): MedicationEntry {
  return {
    id: generateMedicationId(),
    medicamento: '',
    frecuencia: '',
    duracion: '',
    administracion: 'Oral'
  }
}

export default function PrescriptionCreationModal({
  open,
  onClose,
  onBack,
  onContinue,
  patientName
}: PrescriptionCreationModalProps) {
  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'María García López'
  const [mounted, setMounted] = React.useState(false)
  const [especialista, setEspecialista] = React.useState('')
  
  // HU-021: State for multiple medications
  const [medicamentos, setMedicamentos] = React.useState<MedicationEntry[]>([createEmptyMedication()])
  
  // Helper to update a specific medication field
  const updateMedication = (id: string, field: keyof MedicationEntry, value: string) => {
    setMedicamentos(prev => prev.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ))
  }
  
  // Add a new medication
  const addMedication = () => {
    setMedicamentos(prev => [...prev, createEmptyMedication()])
  }
  
  // Remove a medication
  const removeMedication = (id: string) => {
    if (medicamentos.length > 1) {
      setMedicamentos(prev => prev.filter(med => med.id !== id))
    }
  }
  
  // Legacy compatibility: get first medication for single-medication callback
  const firstMed = medicamentos[0] || createEmptyMedication()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, open])

  if (!open || !mounted) return null

  const modalScaleVars = {
    '--modal-scale': MODAL_SCALE_FORMULA
  } as React.CSSProperties

  const modalFrameStyle = {
    ...modalScaleVars,
    width: `min(92vw, calc(${MODAL_WIDTH_REM}rem * var(--modal-scale)))`,
    height: `min(85vh, calc(${MODAL_HEIGHT_REM}rem * var(--modal-scale)))`
  } as React.CSSProperties

  const modalContentStyle = {
    width: `${MODAL_WIDTH_REM}rem`,
    height: `${MODAL_HEIGHT_REM}rem`,
    transform: 'scale(var(--modal-scale))',
    transformOrigin: 'top left'
  } as React.CSSProperties

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Creación de receta'
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative flex shrink-0 items-start justify-center'
            style={modalFrameStyle}
          >
            <div className='relative h-full w-full overflow-hidden rounded-[0.5rem] bg-neutral-50'>
              <div
                className='relative w-[68.25rem] h-[60rem]'
                style={modalContentStyle}
              >
                {/* Header */}
                <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 bg-neutral-50 px-[2rem]'>
                  <p className='text-title-md text-neutral-900'>
                    Creación de receta
                  </p>
                  <button
                    type='button'
                    onClick={onClose}
                    aria-label='Cerrar creación de receta'
                    className='flex size-[0.875rem] items-center justify-center text-neutral-900'
                  >
                    <CloseRounded fontSize='inherit' />
                  </button>
                </header>

                {/* Title */}
                <div
                  className='absolute flex flex-col gap-1'
                  style={{
                    left: `${TITLE_LEFT_REM}rem`,
                    top: `${TITLE_TOP_REM}rem`,
                    width: '34rem'
                  }}
                >
                  <p className='text-title-lg text-neutral-900'>
                    Datos de la receta
                  </p>
                  <p className='text-body-md font-medium text-brand-600'>
                    Paciente: {displayPatientName}
                  </p>
                </div>

                {/* Form frame - HU-021: Updated to support multiple medications */}
                <div
                  className='absolute overflow-y-auto'
                  style={{
                    left: `${FORM_LEFT_REM}rem`,
                    top: `${FORM_TOP_REM}rem`,
                    width: `${FORM_WIDTH_REM + 4}rem`,
                    height: '43.25rem',
                    paddingRight: '1rem'
                  }}
                >
                  {/* Specialist (applies to all medications) */}
                  <div className='mb-6'>
                    <p className='text-body-md text-neutral-900 mb-2'>Especialista</p>
                    <div className='relative' style={{ width: `${INPUT_WIDTH_REM}rem` }}>
                      <ComboBox
                        placeholder='Value'
                        top={0}
                        left={0}
                        value={especialista}
                        onChange={setEspecialista}
                      />
                    </div>
                  </div>
                  
                  {/* HU-021: Medications list */}
                  <div className='mt-8'>
                    <div className='flex items-center justify-between mb-4'>
                      <p className='text-body-md font-medium text-neutral-900'>
                        Medicamentos ({medicamentos.length})
                      </p>
                      <button
                        type='button'
                        onClick={addMedication}
                        className='flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-label-sm font-medium hover:bg-brand-200 transition-colors'
                      >
                        <AddRounded className='size-4' />
                        Añadir medicamento
                      </button>
                    </div>
                    
                    <div className='space-y-4'>
                      {medicamentos.map((med, index) => (
                        <div
                          key={med.id}
                          className='relative p-4 border border-neutral-200 rounded-lg bg-white'
                        >
                          {/* Medication number and delete button */}
                          <div className='flex items-center justify-between mb-3'>
                            <span className='text-label-sm font-medium text-neutral-500'>
                              Medicamento {index + 1}
                            </span>
                            {medicamentos.length > 1 && (
                              <button
                                type='button'
                                onClick={() => removeMedication(med.id)}
                                className='p-1 rounded-full text-neutral-400 hover:text-error-500 hover:bg-error-50 transition-colors'
                                aria-label='Eliminar medicamento'
                              >
                                <DeleteRounded className='size-5' />
                              </button>
                            )}
                          </div>
                          
                          {/* Medication name - with CIMA vademecum autocomplete */}
                          <div className='mb-3'>
                            <p className='text-body-sm text-neutral-700 mb-1'>Nombre del medicamento</p>
                            <MedicamentoAutocomplete
                              value={med.medicamento}
                              onChange={(val) => updateMedication(med.id, 'medicamento', val)}
                              onSelect={(medicamento) => {
                                updateMedication(med.id, 'medicamento', medicamento.nombre)
                                // Auto-fill administration route based on selected medication
                                if (medicamento.viaAdministracion) {
                                  updateMedication(med.id, 'administracion', mapViaToOption(medicamento.viaAdministracion))
                                }
                              }}
                              width={INPUT_WIDTH_REM}
                            />
                          </div>
                          
                          {/* Dosage row */}
                          <div className='flex gap-3 mb-3'>
                            <div className='flex-1'>
                              <p className='text-body-sm text-neutral-700 mb-1'>Frecuencia</p>
                              <TextInput
                                placeholder='x al día'
                                top={0}
                                width={8.5}
                                left={0}
                                absolute={false}
                                value={med.frecuencia}
                                onChange={(val) => updateMedication(med.id, 'frecuencia', val)}
                              />
                            </div>
                            <div className='flex-1'>
                              <p className='text-body-sm text-neutral-700 mb-1'>Duración</p>
                              <TextInput
                                placeholder='x días'
                                top={0}
                                width={8.5}
                                left={0}
                                absolute={false}
                                value={med.duracion}
                                onChange={(val) => updateMedication(med.id, 'duracion', val)}
                              />
                            </div>
                          </div>
                          
                          {/* Administration */}
                          <div>
                            <p className='text-body-sm text-neutral-700 mb-1'>Administración</p>
                            <div className='relative' style={{ width: `${INPUT_WIDTH_REM}rem` }}>
                              <select
                                value={med.administracion}
                                onChange={(e) => updateMedication(med.id, 'administracion', e.target.value)}
                                className='w-full h-[3rem] px-[0.625rem] rounded-[0.5rem] border border-neutral-300 bg-neutral-50 text-body-md text-neutral-900 outline-none appearance-none cursor-pointer'
                              >
                                {ADMINISTRATION_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <KeyboardArrowDownRounded className='absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none' />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className='absolute border-t border-neutral-300'
                  style={{
                    left: `${FORM_LEFT_REM}rem`,
                    top: `${BOTTOM_LINE_TOP_REM}rem`,
                    width: `${FORM_WIDTH_REM}rem`
                  }}
                />

                {/* Actions */}
                <div
                  className='absolute flex items-center gap-[2.5rem]'
                  style={{ left: `${FORM_LEFT_REM}rem`, top: `${BUTTONS_TOP_REM}rem` }}
                >
                  <button
                    type='button'
                    onClick={onBack || onClose}
                    className='flex items-center justify-center gap-2 rounded-[8.5rem] border border-neutral-300 bg-neutral-50 px-4 py-2 text-body-md font-medium text-neutral-900 transition-colors hover:bg-brand-100'
                    style={{ width: `${BUTTON_WIDTH_REM}rem`, borderRadius: `${BUTTON_RADIUS_REM}rem` }}
                  >
                    <ArrowBackRounded className='size-5 text-neutral-900' />
                    Volver
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      onContinue?.({
                        // Legacy compatibility: pass first medication fields
                        medicamento: firstMed.medicamento,
                        especialista,
                        frecuencia: firstMed.frecuencia,
                        duracion: firstMed.duracion,
                        administracion: firstMed.administracion,
                        // HU-021: Pass all medications
                        medicamentos
                      })
                    }
                    disabled={medicamentos.every(m => !m.medicamento.trim())}
                    className='flex items-center justify-center gap-2 rounded-[8.5rem] border border-brand-500 bg-brand-500 px-4 py-2 text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed'
                    style={{ width: `${BUTTON_WIDTH_REM}rem`, borderRadius: `${BUTTON_RADIUS_REM}rem` }}
                  >
                    Continuar
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

