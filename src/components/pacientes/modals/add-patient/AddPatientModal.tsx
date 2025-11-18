'use client'

import { uploadPatientFile } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
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
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
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

  // Centralized toggle states for steps
  const [contactoToggles, setContactoToggles] = React.useState({
    recordatorios: true,
    marketing: true,
    terminos: true
  })
  const [contactWhatsapp, setContactWhatsapp] = React.useState(true)
  const [adminFacturaEmpresa, setAdminFacturaEmpresa] = React.useState(false)
  const [saludToggles, setSaludToggles] = React.useState({
    embarazo: false,
    tabaquismo: false
  })

  // Datos para resumen
  const [contactEmail, setContactEmail] = React.useState<string>('')
  const [contactPhone, setContactPhone] = React.useState<string>('')
  const [emergencyContactName, setEmergencyContactName] = React.useState<string>('')
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState<string>('')
  const [emergencyContactEmail, setEmergencyContactEmail] = React.useState<string>('')
  const [adminNotas, setAdminNotas] = React.useState<string>('')
  const [saludAlergiasText, setSaludAlergiasText] = React.useState<string>('')
  const [saludMedicamentosText, setSaludMedicamentosText] = React.useState<string>('')
  const [saludMotivoText, setSaludMotivoText] = React.useState<string>('')
  const [saludFearScale, setSaludFearScale] = React.useState<string>('')
  const [saludAccesibilidad, setSaludAccesibilidad] = React.useState<{
    movilidad: boolean
    interprete: boolean
  }>({ movilidad: false, interprete: false })
  const [nombre, setNombre] = React.useState<string>('')
  const [apellidos, setApellidos] = React.useState<string>('')
  const [dni, setDni] = React.useState<string>('')
  const [sexo, setSexo] = React.useState<string>('')
  const [idioma, setIdioma] = React.useState<string>('')
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [clinicId, setClinicId] = React.useState<string | null>(null)
  const [staffOptions, setStaffOptions] = React.useState<Array<{ label: string; value: string }>>(
    []
  )
  const [selectedProfessionalId, setSelectedProfessionalId] = React.useState<string>('')
  const [leadSource, setLeadSource] = React.useState<string>('')
  const [coverageType, setCoverageType] = React.useState<string>('')
  const [insuranceProvider, setInsuranceProvider] = React.useState<string>('')
  const [insurancePolicyNumber, setInsurancePolicyNumber] = React.useState<string>('')
  const [insuranceExpiry, setInsuranceExpiry] = React.useState<Date | null>(null)
  const [addressLine1, setAddressLine1] = React.useState<string>('')
  const [addressLine2, setAddressLine2] = React.useState<string>('')
  const [addressNumber, setAddressNumber] = React.useState<string>('')
  const [addressState, setAddressState] = React.useState<string>('')
  const [addressCity, setAddressCity] = React.useState<string>('')
  const [addressPostalCode, setAddressPostalCode] = React.useState<string>('')
  const [addressCountry, setAddressCountry] = React.useState<string>('')
  const [billCompanyName, setBillCompanyName] = React.useState<string>('')
  const [billCompanyTaxId, setBillCompanyTaxId] = React.useState<string>('')
  const [preferredPaymentMethod, setPreferredPaymentMethod] = React.useState<string>('')
  const [preferredFinancingOption, setPreferredFinancingOption] = React.useState<string>('')

  React.useEffect(() => {
    if (!open) return
    let active = true
    async function loadClinicContext() {
      try {
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        if (!active) return
        const firstClinic =
          Array.isArray(clinics) && clinics.length > 0 ? (clinics[0] as string) : null
        setClinicId(firstClinic)
        if (firstClinic) {
          const { data: staffRows } = await supabase.rpc('get_clinic_staff', {
            clinic: firstClinic
          })
          if (!active) return
          setStaffOptions(
            (staffRows || []).map((row: any) => ({
              label: row.full_name || row.id,
              value: row.id
            }))
          )
        } else {
          setStaffOptions([])
        }
      } catch (error) {
        console.error('Error loading clinic context', error)
        setStaffOptions([])
      }
    }
    loadClinicContext()
    return () => {
      active = false
    }
  }, [open, supabase])

  // Type helper for Salud component props (workaround for JSX inference)
  const SaludComp = AddPatientStepSalud as unknown as React.ComponentType<{
    embarazo: boolean
    onChangeEmbarazo: (v: boolean) => void
    tabaquismo: boolean
    onChangeTabaquismo: (v: boolean) => void
    alergiasText?: string
    onChangeAlergiasText?: (v: string) => void
    medicamentosText?: string
    onChangeMedicamentosText?: (v: string) => void
    motivoConsulta?: string
    onChangeMotivoConsulta?: (v: string) => void
    fearScale?: string
    onChangeFearScale?: (v: string) => void
    mobilityRestricted?: boolean
    onChangeMobilityRestricted?: (v: boolean) => void
    needsInterpreter?: boolean
    onChangeNeedsInterpreter?: (v: boolean) => void
  }>

  if (!open) return null

  async function handleCreatePatient() {
    let clinicForPatient = clinicId
    if (!clinicForPatient) {
      const { data: clinics } = await supabase.rpc('get_my_clinics')
      clinicForPatient =
        Array.isArray(clinics) && clinics.length > 0 ? (clinics[0] as string) : null
      setClinicId(clinicForPatient)
    }
    if (!clinicForPatient) {
      alert('No se encontró una clínica asociada. Contacta con administración.')
      return
    }

    const billingPrefs =
      adminFacturaEmpresa || billCompanyName || billCompanyTaxId
        ? {
            bill_to_company: adminFacturaEmpresa,
            company_name: billCompanyName || null,
            company_tax_id: billCompanyTaxId || null
          }
        : null

    const payload: Record<string, any> = {
      clinic_id: clinicForPatient,
      first_name: nombre || '—',
      last_name: apellidos || '—',
      phone_number: contactPhone || null,
      email: contactEmail || null,
      date_of_birth: selectedDate ? selectedDate.toISOString().slice(0, 10) : null,
      national_id: dni || null,
      preferred_language: idioma || null,
      biological_sex: sexo || null,
      allow_marketing: contactoToggles.marketing,
      allow_appointment_reminders: contactoToggles.recordatorios,
      allow_whatsapp: contactWhatsapp,
      primary_staff_id: selectedProfessionalId || null,
      lead_source: leadSource || null,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      address_number: addressNumber || null,
      address_state: addressState || null,
      address_city: addressCity || null,
      address_postal_code: addressPostalCode || null,
      address_country: addressCountry || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      emergency_contact_email: emergencyContactEmail || null,
      notes: adminNotas || null,
      preferred_payment_method: preferredPaymentMethod || null,
      preferred_financing_option: preferredFinancingOption || null,
      billing_preferences: billingPrefs
    }

    try {
      const { data: insertedPatient, error } = await supabase
        .from('patients')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      const patientId = insertedPatient?.id
      const followUp: Promise<any>[] = []

      if (
        patientId &&
        (insuranceProvider || insurancePolicyNumber || coverageType || insuranceExpiry)
      ) {
        followUp.push(
          (async () => {
            await supabase.from('patient_insurances').insert({
              patient_id: patientId,
              provider: insuranceProvider || null,
              policy_number: insurancePolicyNumber || null,
              coverage_type: coverageType || null,
              expiry_date: insuranceExpiry ? insuranceExpiry.toISOString().slice(0, 10) : null,
              metadata:
                billCompanyName || billCompanyTaxId
                  ? {
                      bill_to_company: adminFacturaEmpresa,
                      company_name: billCompanyName || null,
                      company_tax_id: billCompanyTaxId || null
                    }
                  : null
            })
          })()
        )
      }

      if (patientId) {
        followUp.push(
          (async () => {
            await supabase.from('patient_health_profiles').upsert({
              patient_id: patientId,
              allergies: saludAlergiasText || null,
              medications: saludMedicamentosText || null,
              main_complaint: saludMotivoText || null,
              fear_scale: saludFearScale ? Number(saludFearScale) : null,
              is_pregnant: saludToggles.embarazo,
              is_smoker: saludToggles.tabaquismo,
              motivo_consulta: saludMotivoText || null,
              mobility_restrictions: saludAccesibilidad.movilidad,
              needs_interpreter: saludAccesibilidad.interprete,
              accessibility: {
                mobility_restrictions: saludAccesibilidad.movilidad,
                needs_interpreter: saludAccesibilidad.interprete
              }
            })
          })()
        )
      }

      const alerts: Array<{
        alert_type: string
        description: string
        is_critical: boolean
        category?: string | null
        severity?: 'low' | 'medium' | 'high' | null
      }> = []

      const allergyEntries = saludAlergiasText
        .split(/[,\\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text) => ({
          alert_type: text,
          description: text,
          is_critical: true,
          category: 'allergy',
          severity: 'high' as const
        }))
      alerts.push(...allergyEntries)

      if (saludToggles.embarazo) {
        alerts.push({
          alert_type: 'pregnancy',
          description: 'Paciente embarazada',
          is_critical: false,
          category: 'condition',
          severity: 'medium'
        })
      }

      if (saludToggles.tabaquismo) {
        alerts.push({
          alert_type: 'tobacco_use',
          description: 'Paciente fumador',
          is_critical: false,
          category: 'habit',
          severity: 'medium'
        })
      }

      const fearValue = saludFearScale ? Number(saludFearScale) : null
      if (fearValue && fearValue >= 7) {
        alerts.push({
          alert_type: 'dental_anxiety',
          description: `Nivel de miedo ${fearValue}/10`,
          is_critical: false,
          category: 'condition',
          severity: 'medium'
        })
      }

      if (saludAccesibilidad.movilidad) {
        alerts.push({
          alert_type: 'mobility_restrictions',
          description: 'Movilidad reducida',
          is_critical: false,
          category: 'accessibility',
          severity: 'medium'
        })
      }

      if (saludAccesibilidad.interprete) {
        alerts.push({
          alert_type: 'needs_interpreter',
          description: 'Requiere intérprete',
          is_critical: false,
          category: 'accessibility',
          severity: 'low'
        })
      }

      if (patientId && alerts.length) {
        followUp.push(
          (async () => {
            await supabase
              .from('patient_medical_alerts')
              .insert(
                alerts.map((alert) => ({
                  ...alert,
                  category: alert.category ?? null,
                  severity: alert.severity ?? null,
                  patient_id: patientId
                }))
              )
          })()
        )
      }

      if (patientId && avatarFile) {
        followUp.push(
          (async () => {
            try {
              const { path } = await uploadPatientFile({
                patientId,
                file: avatarFile,
                kind: 'avatar'
              })
              await supabase.from('patients').update({ avatar_url: path }).eq('id', patientId)
            } catch (avatarError) {
              console.error('Error uploading avatar', avatarError)
            }
          })()
        )
      }

      await Promise.all(followUp)
      setAvatarFile(null)
      onClose()
    } catch (error) {
      console.error('Error creating patient', error)
      alert('No se pudo crear el paciente. Intenta nuevamente.')
    }
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
            className='w-[68.25rem] h-[59.75rem] max-w-[92vw] max-h-[85vh] shrink-0 relative bg-[var(--color-surface-modal,#fff)] rounded-[1rem] overflow-hidden flex items-start justify-center'
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
                <div className='justify-start text-[var(--color-neutral-900)] text-title-lg font-sans'>
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

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[6rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('paciente')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setStep('paciente')
                }}
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='Fill'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonCheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-brand-500)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Paciente
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[9rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('contacto')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setStep('contacto')
                }}
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color:
                          step === 'contacto'
                            ? 'var(--color-brand-500)'
                            : 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Contacto
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[12rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('administrativo')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setStep('administrativo')
                }}
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color:
                          step === 'administrativo'
                            ? 'var(--color-brand-500)'
                            : 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Administrativo
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[15rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('salud')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setStep('salud')
                }}
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color:
                          step === 'salud'
                            ? 'var(--color-brand-500)'
                            : 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Salud
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[18rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('consentimientos')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setStep('consentimientos')
                }}
              >
                <div
                  data-has-line='false'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color:
                          step === 'consentimientos'
                            ? 'var(--color-brand-500)'
                            : 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Consentimientos
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[21rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => setStep('resumen')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setStep('resumen')
                }}
              >
                <div
                  data-has-line='false'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color:
                          step === 'resumen'
                            ? 'var(--color-brand-500)'
                            : 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Resumen
                </div>
              </div>

              <div
                data-property-1='Default'
                className='w-[35.5rem] left-[14.3125rem] top-[6rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='inline-flex justify-start items-center gap-2'>
                  <div className='justify-start text-[var(--color-neutral-900)] text-title-lg font-sans'>
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
                  onAvatarSelected={setAvatarFile}
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
                  terminos={contactoToggles.terminos}
                  onChangeTerminos={(v) =>
                    setContactoToggles((p) => ({ ...p, terminos: v }))
                  }
                  whatsappOptIn={contactWhatsapp}
                  onChangeWhatsappOptIn={setContactWhatsapp}
                  telefono={contactPhone}
                  onChangeTelefono={setContactPhone}
                  email={contactEmail}
                  onChangeEmail={setContactEmail}
                  emergencyName={emergencyContactName}
                  onChangeEmergencyName={setEmergencyContactName}
                  emergencyPhone={emergencyContactPhone}
                  onChangeEmergencyPhone={setEmergencyContactPhone}
                  emergencyEmail={emergencyContactEmail}
                  onChangeEmergencyEmail={setEmergencyContactEmail}
                />
              )}

              {step === 'administrativo' && (
                <AddPatientStepAdministrativo
                  facturaEmpresa={adminFacturaEmpresa}
                  onChangeFacturaEmpresa={setAdminFacturaEmpresa}
                  notas={adminNotas}
                  onChangeNotas={setAdminNotas}
                  staffOptions={staffOptions}
                  selectedStaffId={selectedProfessionalId}
                  onChangeStaff={setSelectedProfessionalId}
                  leadSource={leadSource}
                  onChangeLeadSource={setLeadSource}
                  coverageType={coverageType}
                  onChangeCoverageType={setCoverageType}
                  insuranceProvider={insuranceProvider}
                  onChangeInsuranceProvider={setInsuranceProvider}
                  insurancePolicyNumber={insurancePolicyNumber}
                  onChangeInsurancePolicyNumber={setInsurancePolicyNumber}
                  insuranceExpiry={insuranceExpiry}
                  onChangeInsuranceExpiry={(date: Date) => setInsuranceExpiry(date)}
                  addressLine1={addressLine1}
                  onChangeAddressLine1={setAddressLine1}
                  addressLine2={addressLine2}
                  onChangeAddressLine2={setAddressLine2}
                  addressNumber={addressNumber}
                  onChangeAddressNumber={setAddressNumber}
                  addressState={addressState}
                  onChangeAddressState={setAddressState}
                  addressCity={addressCity}
                  onChangeAddressCity={setAddressCity}
                  addressPostalCode={addressPostalCode}
                  onChangeAddressPostalCode={setAddressPostalCode}
                  addressCountry={addressCountry}
                  onChangeAddressCountry={setAddressCountry}
                  billCompanyName={billCompanyName}
                  onChangeBillCompanyName={setBillCompanyName}
                  billCompanyTaxId={billCompanyTaxId}
                  onChangeBillCompanyTaxId={setBillCompanyTaxId}
                  preferredPaymentMethod={preferredPaymentMethod}
                  onChangePreferredPaymentMethod={setPreferredPaymentMethod}
                  preferredFinancingOption={preferredFinancingOption}
                  onChangePreferredFinancingOption={setPreferredFinancingOption}
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
                  medicamentosText={saludMedicamentosText}
                  onChangeMedicamentosText={setSaludMedicamentosText}
                  motivoConsulta={saludMotivoText}
                  onChangeMotivoConsulta={setSaludMotivoText}
                  fearScale={saludFearScale}
                  onChangeFearScale={setSaludFearScale}
                  mobilityRestricted={saludAccesibilidad.movilidad}
                  onChangeMobilityRestricted={(v: boolean) =>
                    setSaludAccesibilidad((p) => ({ ...p, movilidad: v }))
                  }
                  needsInterpreter={saludAccesibilidad.interprete}
                  onChangeNeedsInterpreter={(v: boolean) =>
                    setSaludAccesibilidad((p) => ({ ...p, interprete: v }))
                  }
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
                  terminos={contactoToggles.terminos}
                />
              )}

              <div className='w-[31.5rem] h-0 left-[49.875rem] top-[53.25rem] absolute origin-top-left rotate-180 border-t-[0.0625rem] border-[var(--color-neutral-400)]'></div>
              <button
                type='button'
                onClick={() => {
                  if (step === 'resumen') {
                    void handleCreatePatient()
                  } else {
                    handleContinue()
                  }
                }}
                className='w-52 px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute bg-[var(--color-brand-500)] rounded-[8.5rem] outline-[0.0625rem] outline-offset-[-0.0625rem] outline-[var(--color-neutral-300)] inline-flex justify-center items-center gap-2'
              >
                <div className='justify-start text-[var(--color-brand-900)] text-body-md font-medium font-sans'>
                  {step === 'resumen' ? 'Crear paciente' : 'Continuar'}
                </div>
                <ArrowForwardRounded className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
