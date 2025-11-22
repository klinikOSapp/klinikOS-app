'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import React from 'react'
import AddPatientStepAdministrativo from './AddPatientStepAdministrativo'
import AddPatientStepConsentimientos from './AddPatientStepConsentimientos'
import AddPatientStepContacto from './AddPatientStepContacto'
import AddPatientStepPaciente from './AddPatientStepPaciente'
import AddPatientStepResumen from './AddPatientStepResumen'
import AddPatientStepSalud from './AddPatientStepSalud'
// Removed Figma assets; using MUI MD3 icons instead

type StepState = 'current' | 'completed' | 'upcoming'
type StepConnectorTone = 'brand' | 'neutral'

function StepItem({
  label,
  state,
  top,
  connectorTone,
  onClick
}: {
  label: string
  state: StepState
  top: string
  connectorTone: StepConnectorTone
  onClick?: () => void
}) {
  const isCurrent = state === 'current'
  const isCompleted = state === 'completed'
  const showConnector = label !== 'Resumen'
  const connectorColor =
    connectorTone === 'brand'
      ? 'var(--color-brand-500)'
      : 'var(--color-neutral-300)'
  return (
    <div
      className='absolute left-[2rem] flex h-[3rem] items-start gap-3 cursor-pointer'
      style={{ top }}
      onClick={onClick}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      <div className='relative h-[3rem] w-6'>
        <div className='absolute left-0 top-0 size-6'>
          {isCompleted ? (
            <CheckCircleRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-brand-500)'
              }}
            />
          ) : isCurrent ? (
            <RadioButtonCheckedRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-brand-500)'
              }}
            />
          ) : (
            <RadioButtonUncheckedRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-neutral-900)'
              }}
            />
          )}
        </div>
        {showConnector && (
          <span
            className='absolute left-[0.625rem] top-[1.625rem] block h-[1.375rem] w-[0.125rem]'
            style={{ backgroundColor: connectorColor }}
          />
        )}
      </div>
      <p className='text-title-sm text-neutral-900'>{label}</p>
    </div>
  )
}

type AddPatientModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
}

// FieldLabel, TextInput, SelectInput, TextArea moved to AddPatientInputs.tsx

export default function AddPatientModal({
  open,
  onClose,
  onContinue
}: AddPatientModalProps) {
  const [step, setStep] = React.useState<
    | 'paciente'
    | 'contacto'
    | 'administrativo'
    | 'salud'
    | 'consentimientos'
    | 'resumen'
  >('paciente')
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const dateFieldRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null)
  const today = React.useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = React.useState<number>(today.getMonth())
  const [viewYear, setViewYear] = React.useState<number>(today.getFullYear())
  const [popoverPos, setPopoverPos] = React.useState<{
    left: number
    top: number
  } | null>(null)
  const [scale, setScale] = React.useState(1)
  const [showMonthMenu, setShowMonthMenu] = React.useState(false)
  const [showYearMenu, setShowYearMenu] = React.useState(false)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!calendarOpen) return
      const target = e.target as Node
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        dateFieldRef.current &&
        !dateFieldRef.current.contains(target)
      ) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  const remToPx = React.useCallback((rem: number) => {
    const root = getComputedStyle(document.documentElement).fontSize
    const base = parseFloat(root || '16') || 16
    return rem * base
  }, [])

  React.useEffect(() => {
    const updatePosition = () => {
      if (!dateFieldRef.current) return
      const rect = dateFieldRef.current.getBoundingClientRect()
      const margin = 8 // px
      const baseWpx = remToPx(22.5)
      const baseHpx = remToPx(28.75)
      const maxWFrac = 0.4 // máx 40% del viewport ancho
      const maxHFrac = 0.6 // máx 60% del viewport alto
      const s = Math.min(
        1,
        (window.innerWidth * maxWFrac) / baseWpx,
        (window.innerHeight * maxHFrac) / baseHpx
      )
      setScale(s)
      const scaledW = baseWpx * s
      const scaledH = baseHpx * s
      let left = rect.left + window.scrollX
      let top = rect.bottom + window.scrollY + 4
      const maxLeft = window.scrollX + window.innerWidth - scaledW - margin
      const maxTop = window.scrollY + window.innerHeight - scaledH - margin
      left = Math.max(window.scrollX + margin, Math.min(left, maxLeft))
      top = Math.max(window.scrollY + margin, Math.min(top, maxTop))
      setPopoverPos({ left, top })
    }
    if (calendarOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
    return undefined
  }, [calendarOpen, remToPx])

  React.useEffect(() => {
    if (calendarOpen) {
      const base = selectedDate ?? new Date()
      setPendingDate(selectedDate ?? null)
      setViewMonth(base.getMonth())
      setViewYear(base.getFullYear())
    }
  }, [calendarOpen, selectedDate])

  const monthLabels = React.useMemo(
    () => [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ],
    []
  )
  const dayHeader = React.useMemo(() => ['D', 'L', 'M', 'X', 'J', 'V', 'S'], [])

  function formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  function buildMonthMatrix(year: number, month: number) {
    const first = new Date(year, month, 1)
    const startDow = first.getDay()
    const start = new Date(year, month, 1 - startDow)
    const weeks: { date: Date; inMonth: boolean }[][] = []
    for (let r = 0; r < 6; r++) {
      const row: { date: Date; inMonth: boolean }[] = []
      for (let c = 0; c < 7; c++) {
        const d = new Date(start)
        d.setDate(start.getDate() + (r * 7 + c))
        row.push({ date: d, inMonth: d.getMonth() === month })
      }
      weeks.push(row)
    }
    return weeks
  }

  const weeks = React.useMemo(() => {
    const allWeeks = buildMonthMatrix(viewYear, viewMonth)
    const last = allWeeks[allWeeks.length - 1]
    if (last && last.every((c) => !c.inMonth)) {
      return allWeeks.slice(0, allWeeks.length - 1)
    }
    return allWeeks
  }, [viewYear, viewMonth])
  const prevMonth = () => setViewMonth((m) => (m > 0 ? m - 1 : 11))
  const nextMonth = () => setViewMonth((m) => (m < 11 ? m + 1 : 0))
  const prevYear = () => setViewYear((y) => y - 1)
  const nextYear = () => setViewYear((y) => y + 1)

  const handleContinue = React.useCallback(() => {
    if (step === 'paciente') {
      setStep('contacto')
      return
    }
    if (step === 'contacto') {
      setStep('administrativo')
      return
    }
    if (step === 'administrativo') {
      setStep('salud')
      return
    }
    if (step === 'salud') {
      setStep('consentimientos')
      return
    }
    if (step === 'consentimientos') {
      setStep('resumen')
      return
    }
    onContinue?.()
  }, [step, onContinue])

  const handleBack = React.useCallback(() => {
    if (step === 'resumen') {
      setStep('consentimientos')
    } else if (step === 'consentimientos') {
      setStep('salud')
    } else if (step === 'salud') {
      setStep('administrativo')
    } else if (step === 'administrativo') {
      setStep('contacto')
    } else if (step === 'contacto') {
      setStep('paciente')
    }
  }, [step])

  // Centralized toggle states for steps
  const [contactoToggles, setContactoToggles] = React.useState({
    recordatorios: false,
    marketing: false
  })
  const [adminFacturaEmpresa, setAdminFacturaEmpresa] = React.useState(false)
  const [saludToggles, setSaludToggles] = React.useState({
    embarazo: false,
    tabaquismo: false
  })

  // Datos para resumen
  const [contactEmail, setContactEmail] = React.useState<string>('')
  const [contactPhone, setContactPhone] = React.useState<string>('')
  const [adminNotas, setAdminNotas] = React.useState<string>('')
  const [saludAlergiasText, setSaludAlergiasText] = React.useState<string>('')
  const [nombre, setNombre] = React.useState<string>('')
  const [apellidos, setApellidos] = React.useState<string>('')
  const [dni, setDni] = React.useState<string>('')
  const [sexo, setSexo] = React.useState<string>('')
  const [idioma, setIdioma] = React.useState<string>('')

  // Estados adicionales Administrativo
  const [adminProfesional, setAdminProfesional] = React.useState<string>('')
  const [adminCanal, setAdminCanal] = React.useState<string>('')
  const [adminCobertura, setAdminCobertura] = React.useState<string>('')
  const [adminPais, setAdminPais] = React.useState<string>('')
  const [adminPago1, setAdminPago1] = React.useState<string>('')
  const [adminPago2, setAdminPago2] = React.useState<string>('')
  const [adminFinanciacion, setAdminFinanciacion] = React.useState<string>('')
  const [adminCif, setAdminCif] = React.useState<string>('')
  const [adminCalle, setAdminCalle] = React.useState<string>('')
  const [adminCiudad, setAdminCiudad] = React.useState<string>('')
  const [adminProvincia, setAdminProvincia] = React.useState<string>('')
  const [adminCodigoPostal, setAdminCodigoPostal] = React.useState<string>('')

  // Estados adicionales Salud
  const [saludAntecedentes, setSaludAntecedentes] = React.useState<string>('')
  const [saludMiedo, setSaludMiedo] = React.useState<string>('')

  // Type helper for Salud component props (workaround for JSX inference)
  const SaludComp = AddPatientStepSalud as unknown as React.ComponentType<{
    embarazo: boolean
    onChangeEmbarazo: (v: boolean) => void
    tabaquismo: boolean
    onChangeTabaquismo: (v: boolean) => void
    alergiasText?: string
    onChangeAlergiasText?: (v: string) => void
    antecedentes?: string
    onChangeAntecedentes?: (v: string) => void
    miedo?: string
    onChangeMiedo?: (v: string) => void
  }>

  if (!open) return null

  // Calcular estados de los pasos
  const stepOrder = ['paciente', 'contacto', 'administrativo', 'salud', 'consentimientos', 'resumen']
  const currentStepIndex = stepOrder.indexOf(step)
  
  const getStepState = (stepName: string): StepState => {
    const stepIndex = stepOrder.indexOf(stepName)
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'upcoming'
  }

  const getConnectorTone = (stepName: string): StepConnectorTone => {
    const stepIndex = stepOrder.indexOf(stepName)
    return stepIndex < currentStepIndex ? 'brand' : 'neutral'
  }

  return (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className='w-[68.25rem] h-[59.75rem] max-w-[92vw] max-h-[85vh] shrink-0 relative bg-[var(--color-surface-modal,#fff)] rounded-[0.5rem] overflow-hidden flex items-start justify-center'
            style={{
              width: 'min(68.25rem, calc(68.25rem * (85vh / 60rem)))',
              height: 'min(59.75rem, calc(59.75rem * (85vh / 60rem)))'
            }}
          >
            {/* Scaled content to always fit within 85vh without scroll */}
            <div
              className='relative w-[68.25rem] h-[60rem]'
              style={{
                transform: 'scale(min(1, calc(85vh / 60rem)))',
                transformOrigin: 'top left'
              }}
            >
              <div className='w-[68.25rem] h-14 px-8 left-0 top-0 absolute border-b border-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-md font-sans'>
                  Formulario de creación de usuarios
                </div>
                <button
                  type='button'
                  aria-label='Cerrar'
                  onClick={onClose}
                  className='w-3.5 h-3.5'
                >
                  <CloseRounded className='block w-3.5 h-3.5' />
                </button>
              </div>

              <StepItem
                label='Paciente'
                state={getStepState('paciente')}
                top='6rem'
                connectorTone={getConnectorTone('paciente')}
                onClick={() => setStep('paciente')}
              />

              <StepItem
                label='Contacto'
                state={getStepState('contacto')}
                top='9rem'
                connectorTone={getConnectorTone('contacto')}
                onClick={() => setStep('contacto')}
              />

              <StepItem
                label='Administrativo'
                state={getStepState('administrativo')}
                top='12rem'
                connectorTone={getConnectorTone('administrativo')}
                onClick={() => setStep('administrativo')}
              />

              <StepItem
                label='Salud'
                state={getStepState('salud')}
                top='15rem'
                connectorTone={getConnectorTone('salud')}
                onClick={() => setStep('salud')}
              />

              <StepItem
                label='Consentimientos'
                state={getStepState('consentimientos')}
                top='18rem'
                connectorTone={getConnectorTone('consentimientos')}
                onClick={() => setStep('consentimientos')}
              />

              <StepItem
                label='Resumen'
                state={getStepState('resumen')}
                top='21rem'
                connectorTone={getConnectorTone('resumen')}
                onClick={() => setStep('resumen')}
              />

              <div
                data-property-1='Default'
                className='w-[35.5rem] left-[14.3125rem] top-[6rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='inline-flex justify-start items-center gap-2'>
                  <div className='justify-start text-[var(--color-neutral-900)] text-[1.5rem] leading-[2rem] font-medium font-sans'>
                    {step === 'contacto'
                      ? 'Contacto y consentimientos rápidos'
                      : step === 'administrativo'
                      ? 'Datos administrativos'
                      : step === 'salud'
                      ? 'Salud'
                      : step === 'consentimientos'
                      ? 'Documentos y consentimientos'
                      : step === 'resumen'
                      ? 'Resumen'
                      : 'Datos básicos del paciente'}
                  </div>
                </div>
              </div>

              {step === 'paciente' && (
                <AddPatientStepPaciente
                  nombre={nombre}
                  onChangeNombre={setNombre}
                  apellidos={apellidos}
                  onChangeApellidos={setApellidos}
                  fechaNacimiento={selectedDate}
                  onChangeFechaNacimiento={(d) => setSelectedDate(d)}
                  dni={dni}
                  onChangeDni={setDni}
                  sexo={sexo}
                  onChangeSexo={setSexo}
                  idioma={idioma}
                  onChangeIdioma={setIdioma}
                />
              )}

              {step === 'contacto' && (
                <AddPatientStepContacto
                  recordatorios={contactoToggles.recordatorios}
                  onChangeRecordatorios={(v) =>
                    setContactoToggles((p) => ({ ...p, recordatorios: v }))
                  }
                  marketing={contactoToggles.marketing}
                  onChangeMarketing={(v) =>
                    setContactoToggles((p) => ({ ...p, marketing: v }))
                  }
                  telefono={contactPhone}
                  onChangeTelefono={setContactPhone}
                  email={contactEmail}
                  onChangeEmail={setContactEmail}
                />
              )}

              {step === 'administrativo' && (
                <AddPatientStepAdministrativo
                  facturaEmpresa={adminFacturaEmpresa}
                  onChangeFacturaEmpresa={setAdminFacturaEmpresa}
                  notas={adminNotas}
                  onChangeNotas={setAdminNotas}
                  profesional={adminProfesional}
                  onChangeProfesional={setAdminProfesional}
                  canal={adminCanal}
                  onChangeCanal={setAdminCanal}
                  cobertura={adminCobertura}
                  onChangeCobertura={setAdminCobertura}
                  pais={adminPais}
                  onChangePais={setAdminPais}
                  pago1={adminPago1}
                  onChangePago1={setAdminPago1}
                  pago2={adminPago2}
                  onChangePago2={setAdminPago2}
                  financiacion={adminFinanciacion}
                  onChangeFinanciacion={setAdminFinanciacion}
                  cif={adminCif}
                  onChangeCif={setAdminCif}
                  calle={adminCalle}
                  onChangeCalle={setAdminCalle}
                  ciudad={adminCiudad}
                  onChangeCiudad={setAdminCiudad}
                  provincia={adminProvincia}
                  onChangeProvincia={setAdminProvincia}
                  codigoPostal={adminCodigoPostal}
                  onChangeCodigoPostal={setAdminCodigoPostal}
                />
              )}

              {step === 'salud' && (
                <SaludComp
                  embarazo={saludToggles.embarazo}
                  onChangeEmbarazo={(v: boolean) =>
                    setSaludToggles((p) => ({ ...p, embarazo: v }))
                  }
                  tabaquismo={saludToggles.tabaquismo}
                  onChangeTabaquismo={(v: boolean) =>
                    setSaludToggles((p) => ({ ...p, tabaquismo: v }))
                  }
                  alergiasText={saludAlergiasText}
                  onChangeAlergiasText={setSaludAlergiasText}
                  antecedentes={saludAntecedentes}
                  onChangeAntecedentes={setSaludAntecedentes}
                  miedo={saludMiedo}
                  onChangeMiedo={setSaludMiedo}
                />
              )}

              {step === 'consentimientos' && <AddPatientStepConsentimientos />}

              {step === 'resumen' && (
                <AddPatientStepResumen
                  nombre={nombre}
                  apellidos={apellidos}
                  email={contactEmail}
                  telefono={contactPhone}
                  anotaciones={adminNotas}
                  alergias={saludAlergiasText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)}
                  recordatorios={contactoToggles.recordatorios}
                  marketing={contactoToggles.marketing}
                />
              )}

              <div className='w-[31.5rem] h-0 left-[18.375rem] top-[53.25rem] absolute origin-top-left rotate-180 border-t-[0.0625rem] border-[var(--color-neutral-400)]'></div>
              
              {step !== 'paciente' && (
                <button
                  type='button'
                  onClick={handleBack}
                  className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-[var(--color-brand-500)] bg-[var(--color-neutral-50)] px-[1rem] text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-100)]'
                >
                  <ArrowBackRounded className='size-5' />
                  Volver
                </button>
              )}

              {step !== 'resumen' ? (
                <button
                  type='button'
                  onClick={handleContinue}
                  className='w-[13.4375rem] px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute bg-[var(--color-brand-500)] rounded-[8.5rem] border border-[var(--color-brand-500)] inline-flex justify-center items-center gap-2 text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
                >
                  Continuar
                  <ArrowForwardRounded className='w-6 h-6' />
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handleContinue}
                  className='w-[13.4375rem] px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute bg-[var(--color-brand-500)] rounded-[8.5rem] border border-[var(--color-brand-500)] inline-flex justify-center items-center gap-2 text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
                >
                  Crear paciente
                  <ArrowForwardRounded className='w-6 h-6' />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
