'use client'

import { uploadPatientFile } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useClinic } from '@/context/ClinicContext'
import Portal from '@/components/ui/Portal'
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
import AddPatientStepSalud, { type AllergyEntry } from './AddPatientStepSalud'
// Removed Figma assets; using MUI MD3 icons instead

type AddPatientModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
  onPatientCreated?: (patientId: string) => void
}

// FieldLabel, TextInput, SelectInput, TextArea moved to AddPatientInputs.tsx

export default function AddPatientModal({
  open,
  onClose,
  onContinue,
  onPatientCreated
}: AddPatientModalProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
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
    marketing: false,
    terminos: false
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
  const [phonePrefix, setPhonePrefix] = React.useState<string>('+34')
  const [emergencyContactName, setEmergencyContactName] = React.useState<string>('')
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState<string>('')
  const [emergencyContactEmail, setEmergencyContactEmail] = React.useState<string>('')
  const [adminNotas, setAdminNotas] = React.useState<string>('')
  const [saludAlergias, setSaludAlergias] = React.useState<AllergyEntry[]>([])
  const [saludMedicamentosText, setSaludMedicamentosText] = React.useState<string>('')
  const [saludMotivoText, setSaludMotivoText] = React.useState<string>('')
  const [saludFearScale, setSaludFearScale] = React.useState<string>('')
  const [saludAccesibilidad, setSaludAccesibilidad] = React.useState<{
    movilidad: boolean
    interprete: boolean
  }>({ movilidad: false, interprete: false })
  const [nombre, setNombre] = React.useState<string>('')
  const [apellidos, setApellidos] = React.useState<string>('')
  const [tipoDocumento, setTipoDocumento] = React.useState<'DNI' | 'NIE' | 'Pasaporte' | 'Otro'>('DNI')
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

  const [referidoPor, setReferidoPor] = React.useState<string>('')

  // Consentimientos step state (lifted from child component)
  const [imagenesMarketing, setImagenesMarketing] = React.useState(false)
  const [derivacionFile, setDerivacionFile] = React.useState<File | null>(null)
  const [informesFile, setInformesFile] = React.useState<File | null>(null)
  const [rxFile, setRxFile] = React.useState<File | null>(null)
  const [fotosFile, setFotosFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (!open) return
    let active = true
    async function loadClinicContext() {
      try {
        if (!isClinicInitialized) return
        const firstClinic = activeClinicId
        if (!active) return
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
  }, [activeClinicId, isClinicInitialized, open, supabase])

  // Type helper for Salud component props (workaround for JSX inference)
  const SaludComp = AddPatientStepSalud

  if (!open) return null

  async function handleCreatePatient() {
    const clinicForPatient = clinicId || activeClinicId
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
      phone_number: contactPhone
        ? (() => {
            const digits = contactPhone.replace(/\s/g, '')
            if (digits.startsWith('+')) return digits
            return `${phonePrefix}${digits.replace(/^0+/, '')}`
          })()
        : null,
      email: contactEmail || null,
      date_of_birth: selectedDate ? selectedDate.toISOString().slice(0, 10) : null,
      national_id: dni || null,
      national_id_type: tipoDocumento || null,
      recommended_by: referidoPor || null,
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
      billing_preferences: billingPrefs,
      status: 'active'
    }

    try {
      const payloadToInsert: Record<string, any> = { ...payload }
      let insertedPatient: { id?: string } | null = null
      let lastInsertError: { code?: string; message?: string } | null = null

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data, error } = await supabase
          .from('patients')
          .insert(payloadToInsert)
          .select('id')
          .single()
        if (!error) {
          insertedPatient = data as { id?: string }
          lastInsertError = null
          break
        }

        lastInsertError = { code: error.code, message: error.message }
        break
      }

      if (lastInsertError || !insertedPatient) {
        throw new Error(lastInsertError?.message || 'No se pudo crear el paciente')
      }

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
              allergies: saludAlergias.length ? saludAlergias.map((a) => a.name).join(', ') : null,
              medications: saludMedicamentosText || null,
              main_complaint: saludMotivoText || null,
              fear_scale: saludFearScale ? Number(saludFearScale) : null,
              is_pregnant: saludToggles.embarazo,
              is_smoker: saludToggles.tabaquismo,
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

      const allergyEntries = saludAlergias.map((a) => ({
        alert_type: a.name,
        description: a.name,
        is_critical: a.severity === 'grave' || a.severity === 'extrema',
        category: 'allergy',
        severity: (
          a.severity === 'extrema' ? 'high' :
          a.severity === 'grave' ? 'high' :
          a.severity === 'moderada' ? 'medium' : 'low'
        ) as 'low' | 'medium' | 'high'
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

      // Save consent records
      if (patientId) {
        followUp.push(
          (async () => {
            const consentRows = [
              { patient_id: patientId, consent_type: 'informativo_general', status: 'pending' },
              { patient_id: patientId, consent_type: 'proteccion_datos', status: 'pending' },
              {
                patient_id: patientId,
                consent_type: 'cesion_imagenes',
                status: imagenesMarketing ? 'signed' : 'refused',
                signed_at: imagenesMarketing ? new Date().toISOString() : null
              }
            ]
            const { error } = await supabase.from('patient_consents').insert(consentRows)
            if (error) console.warn('Error saving patient_consents', error)
          })()
        )

        // Upload attachment files and save to clinical_attachments
        // Use getSession() (local read, no network) to reliably get the user ID
        const { data: { session } } = await supabase.auth.getSession()
        const staffId = session?.user?.id
        if (staffId) {
          const attachments: Array<{ file: File; kind: 'rx' | 'consents'; label: string }> = [
            ...(derivacionFile ? [{ file: derivacionFile, kind: 'consents' as const, label: 'derivacion' }] : []),
            ...(informesFile ? [{ file: informesFile, kind: 'consents' as const, label: 'informes' }] : []),
            ...(rxFile ? [{ file: rxFile, kind: 'rx' as const, label: 'rx' }] : []),
            ...(fotosFile ? [{ file: fotosFile, kind: 'consents' as const, label: 'fotos_seguro' }] : [])
          ]
          for (const att of attachments) {
            followUp.push(
              (async () => {
                try {
                  const { path } = await uploadPatientFile({ patientId, file: att.file, kind: att.kind })
                  const { error: insertError } = await supabase.from('clinical_attachments').insert({
                    patient_id: patientId,
                    staff_id: staffId,
                    file_name: att.file.name,
                    file_type: att.file.type || null,
                    storage_path: path
                  })
                  if (insertError) {
                    console.error(`Error saving ${att.label} to DB`, insertError)
                  }
                } catch (attachError) {
                  console.error(`Error uploading ${att.label}`, attachError)
                }
              })()
            )
          }
        } else {
          console.warn('No active session — skipping document uploads')
        }
      }

      await Promise.all(followUp)

      // Create a contact record and link it as the patient's primary contact
      if (patientId) {
        try {
          const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .insert({
              full_name: `${nombre} ${apellidos}`.trim() || nombre || apellidos || '—',
              phone_primary: payload.phone_number || null,
              email: contactEmail || null
            })
            .select('id')
            .single()

          if (!contactError && contactData?.id) {
            const contactId = contactData.id
            await Promise.all([
              supabase.from('patient_contacts').insert({
                patient_id: patientId,
                contact_id: contactId,
                relationship_type: 'self',
                is_primary: true
              }),
              supabase
                .from('patients')
                .update({ primary_contact_id: contactId })
                .eq('id', patientId)
            ])
          } else if (contactError) {
            console.warn('No se pudo crear el contacto principal', contactError)
          }
        } catch (contactErr) {
          console.warn('Error creando contacto del paciente', contactErr)
        }
      }

      if (patientId) {
        onPatientCreated?.(patientId)
      }
      setAvatarFile(null)
      onClose()
    } catch (error) {
      console.error('Error creating patient', error)
      alert('No se pudo crear el paciente. Intenta nuevamente.')
    }
  }

  // Step state helpers
  const stepOrder = [
    'paciente',
    'contacto',
    'administrativo',
    'salud',
    'consentimientos',
    'resumen'
  ]
  const currentStepIndex = stepOrder.indexOf(step)
  const getStepIcon = (stepName: string) => {
    const idx = stepOrder.indexOf(stepName)
    if (idx < currentStepIndex) {
      return (
        <CheckCircleRounded
          style={{ width: 24, height: 24, color: 'var(--color-brand-500)' }}
        />
      )
    }
    if (idx === currentStepIndex) {
      return (
        <RadioButtonCheckedRounded
          style={{ width: 24, height: 24, color: 'var(--color-brand-500)' }}
        />
      )
    }
    return (
      <RadioButtonUncheckedRounded
        style={{ width: 24, height: 24, color: 'var(--color-neutral-900)' }}
      />
    )
  }
  const getConnectorColor = (stepName: string) => {
    const idx = stepOrder.indexOf(stepName)
    return idx < currentStepIndex
      ? 'var(--color-brand-500)'
      : 'var(--color-neutral-300)'
  }

  return (
    <Portal>
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

              {(
                [
                  { name: 'paciente', label: 'Paciente', top: '6rem', hasLine: true },
                  { name: 'contacto', label: 'Contacto', top: '9rem', hasLine: true },
                  { name: 'administrativo', label: 'Administrativo', top: '12rem', hasLine: true },
                  { name: 'salud', label: 'Salud', top: '15rem', hasLine: true },
                  { name: 'consentimientos', label: 'Consentimientos', top: '18rem', hasLine: true },
                  { name: 'resumen', label: 'Resumen', top: '21rem', hasLine: false }
                ] as const
              ).map(({ name, label, top, hasLine }) => (
                <div
                  key={name}
                  className='left-[2rem] absolute inline-flex justify-start items-start gap-3 cursor-pointer'
                  style={{ top }}
                  role='button'
                  tabIndex={0}
                  onClick={() => setStep(name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setStep(name)
                  }}
                >
                  <div className='w-6 h-12 relative'>
                    <div className='w-6 h-6 left-0 top-0 absolute'>
                      {getStepIcon(name)}
                    </div>
                    {hasLine && (
                      <span
                        className='absolute left-[0.625rem] top-[1.625rem] block h-[1.375rem] w-[0.125rem]'
                        style={{ backgroundColor: getConnectorColor(name) }}
                      />
                    )}
                  </div>
                  <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                    {label}
                  </div>
                </div>
              ))}

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
                  tipoDocumento={tipoDocumento}
                  onChangeTipoDocumento={setTipoDocumento}
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
                  phonePrefix={phonePrefix}
                  onChangePhonePrefix={setPhonePrefix}
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
                  referidoPor={referidoPor}
                  onChangeReferidoPor={setReferidoPor}
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
                  alergias={saludAlergias}
                  onChangeAlergias={setSaludAlergias}
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

              {step === 'consentimientos' && (
                <AddPatientStepConsentimientos
                  imagenesMarketing={imagenesMarketing}
                  onChangeImagenesMarketing={setImagenesMarketing}
                  derivacionFile={derivacionFile}
                  onChangeDerivacionFile={setDerivacionFile}
                  informesFile={informesFile}
                  onChangeInformesFile={setInformesFile}
                  rxFile={rxFile}
                  onChangeRxFile={setRxFile}
                  fotosFile={fotosFile}
                  onChangeFotosFile={setFotosFile}
                />
              )}

              {step === 'resumen' && (
                <AddPatientStepResumen
                  nombre={nombre}
                  apellidos={apellidos}
                  email={contactEmail}
                  telefono={contactPhone ? `${phonePrefix}${contactPhone.replace(/\s/g, '').replace(/^0+/, '')}` : undefined}
                  anotaciones={adminNotas}
                  alergiasConSeveridad={saludAlergias}
                  recordatorios={contactoToggles.recordatorios}
                  marketing={contactoToggles.marketing}
                />
              )}

              <div className='w-[31.5rem] h-0 left-[18.375rem] top-[53.25rem] absolute origin-top-left rotate-180 border-t-[0.0625rem] border-[var(--color-neutral-400)]'></div>

              {step !== 'paciente' && (
                <button
                  type='button'
                  onClick={handleBack}
                  className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] cursor-pointer items-center justify-center gap-[0.5rem] rounded-full border border-[var(--color-brand-500)] bg-[var(--color-neutral-50)] px-[1rem] text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-100)]'
                >
                  Volver
                </button>
              )}

              <button
                type='button'
                onClick={() => {
                  if (step === 'resumen') {
                    void handleCreatePatient()
                  } else {
                    handleContinue()
                  }
                }}
                className='w-[13.4375rem] px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute cursor-pointer bg-[var(--color-brand-500)] rounded-[8.5rem] border border-[var(--color-brand-500)] inline-flex justify-center items-center gap-2 text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
              >
                {step === 'resumen' ? 'Crear paciente' : 'Continuar'}
                <ArrowForwardRounded className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  )
}
