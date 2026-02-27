'use client'

/* eslint-disable @next/next/no-img-element */

import {
  CallRounded,
  CheckRounded,
  CloseRounded,
  EditRounded,
  MailRounded
} from '@/components/icons/md3'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import { uploadPatientFile, getSignedUrl } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import React from 'react'

type ClientSummaryProps = {
  onClose?: () => void
  patientId?: string
  initialEditMode?: boolean
  onEditModeOpened?: () => void
  onPatientUpdated?: () => void
  /** When true, hides edit buttons and disables all editing functionality */
  readOnly?: boolean
}

const initialPatientData = {
  nombre: '—',
  email: '—',
  telefono: '—',
  fechaNacimiento: '—',
  edad: '—',
  dni: '—',
  pais: '—',
  estado: '—',
  motivoConsulta: '—',
  origenCliente: '—',
  recomendadoPor: '—',
  ocupacion: '—',
  idioma: '—',
  contactoEmergenciaNombre: '—',
  contactoEmergenciaEmail: '—',
  contactoEmergenciaTelefono: '—',
  alergias: [] as string[],
  comentario: ''
}

const LEAD_SOURCE_LABELS: Record<string, string> = {
  referencia: 'Recomendación',
  social: 'Redes Sociales',
  ads: 'Publicidad',
  otro: 'Otro'
}

const LEAD_LABEL_TO_SOURCE: Record<string, string> = {
  recomendación: 'referencia',
  redessociales: 'social',
  publicidad: 'ads',
  internet: 'ads',
  otro: 'otro'
}

function toDisplayText(value: unknown): string {
  if (typeof value !== 'string') return '—'
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : '—'
}

function parseListField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    }
  } catch {
    // fallback to plain text split
  }
  return trimmed
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatLeadSource(value: unknown): string {
  const raw = toDisplayText(value)
  if (raw === '—') return raw
  return LEAD_SOURCE_LABELS[raw.toLowerCase()] ?? raw
}

function mapLeadSourceForDb(value: string): string {
  const key = value.toLowerCase().replace(/\s+/g, '')
  return LEAD_LABEL_TO_SOURCE[key] ?? value.toLowerCase()
}

function formatPatientStatus(statusValue: unknown, preRegistrationComplete: unknown): string {
  const raw = toDisplayText(statusValue)
  if (raw !== '—') {
    const key = raw.toLowerCase()
    if (key === 'active' || key === 'activo') return 'Activo'
    if (key === 'inactive' || key === 'inactivo') return 'Inactivo'
    if (key === 'discharged' || key === 'alta') return 'Alta'
    if (key === 'pre_registration' || key === 'pre-registro') return 'Pre-registro'
    return raw
  }
  if (preRegistrationComplete === false) return 'Pre-registro'
  if (preRegistrationComplete === true) return 'Activo'
  return '—'
}

function mapDisplayStatusToDbStatus(value: string): {
  canonical: 'active' | 'inactive' | 'discharged' | 'pre_registration' | null
  preRegistrationComplete: boolean | null
} {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized || normalized === '—') {
    return { canonical: null, preRegistrationComplete: null }
  }
  if (normalized === 'activo' || normalized === 'active') {
    return { canonical: 'active', preRegistrationComplete: true }
  }
  if (normalized === 'inactivo' || normalized === 'inactive') {
    return { canonical: 'inactive', preRegistrationComplete: true }
  }
  if (normalized === 'alta' || normalized === 'discharged') {
    return { canonical: 'discharged', preRegistrationComplete: true }
  }
  if (normalized === 'pre-registro' || normalized === 'pre_registration') {
    return { canonical: 'pre_registration', preRegistrationComplete: false }
  }
  if (normalized === 'pendiente' || normalized === 'pending') {
    return { canonical: 'pre_registration', preRegistrationComplete: false }
  }
  return { canonical: null, preRegistrationComplete: null }
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) {
    return {
      firstName: parts[0] || '',
      lastName: ''
    }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  }
}

function computeAgeLabel(dateOfBirth: unknown): string {
  if (!dateOfBirth) return '—'
  const birthDate = new Date(String(dateOfBirth))
  if (Number.isNaN(birthDate.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDelta = now.getMonth() - birthDate.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return `${Math.max(0, age)} años`
}

function parseUiDateToIso(value: string): string | null {
  const raw = String(value || '').trim()
  if (!raw || raw === '—') return null

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    return raw
  }

  const esDateMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (esDateMatch) {
    const day = Number(esDateMatch[1])
    const month = Number(esDateMatch[2])
    const year = Number(esDateMatch[3])
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= 2100
    ) {
      const yyyy = String(year).padStart(4, '0')
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function parseAgeNumber(value: string): number | null {
  const digits = String(value || '').replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 130) return null
  return parsed
}

function computeAgeLabelFromIso(isoDate: string | null): string {
  if (!isoDate) return '—'
  return computeAgeLabel(isoDate)
}

function emptyValueToNull(value: string): string | null {
  const normalized = value.trim()
  if (!normalized || normalized === '—') return null
  return normalized
}

export default function ClientSummary({
  patientId,
  initialEditMode = false,
  onEditModeOpened,
  onPatientUpdated,
  readOnly = false
}: ClientSummaryProps) {
  type MedicalAlertRow = {
    alert_type?: string | null
    description?: string | null
    category?: string | null
  }

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null
  )
  const lastUrlRef = React.useRef<string | null>(null)
  const patientColumnsRef = React.useRef<Set<string>>(new Set())
  const primaryContactIdRef = React.useRef<string | null>(null)

  // Estado de edición
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Estados para todos los campos editables
  const [formData, setFormData] = React.useState(initialPatientData)
  const [tempFormData, setTempFormData] = React.useState(initialPatientData)

  // Efecto para abrir en modo edición cuando se pasa initialEditMode (solo si no es readOnly)
  React.useEffect(() => {
    if (initialEditMode && !readOnly) {
      setTempFormData(formData)
      setIsEditing(true)
      onEditModeOpened?.()
    }
  }, [initialEditMode, formData, onEditModeOpened, readOnly])

  React.useEffect(() => {
    async function loadFromDb() {
      if (!patientId) {
        primaryContactIdRef.current = null
        return
      }

      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle()

      if (!patient) return
      patientColumnsRef.current = new Set(Object.keys(patient))
      primaryContactIdRef.current = patient.primary_contact_id || null

      let primaryContact:
        | {
            full_name?: string
            phone_primary?: string
            email?: string
            address_country?: string
          }
        | null = null

      if (patient.primary_contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('full_name, phone_primary, email, address_country')
          .eq('id', patient.primary_contact_id)
          .maybeSingle()
        primaryContact = contact
      }

      const [{ data: healthProfile }, { data: alerts }] = await Promise.all([
        supabase
          .from('patient_health_profiles')
          .select('allergies, main_complaint, motivo_consulta')
          .eq('patient_id', patientId)
          .maybeSingle(),
        supabase
          .from('patient_medical_alerts')
          .select('alert_type, description, category')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(200)
      ])

      const allergyFromAlerts =
        ((alerts || []) as MedicalAlertRow[])
          .filter((alert) => {
            const category = String(alert.category || '').toLowerCase()
            return !category || category === 'allergy'
          })
          .map((alert) => String(alert.alert_type || alert.description || '').trim())
          .filter(Boolean)

      const allergyFromProfile = parseListField(healthProfile?.allergies)
      const seen = new Set<string>()
      const allergyList = [...allergyFromAlerts, ...allergyFromProfile].filter((item) => {
        const key = item.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      const mappedData = {
        ...initialPatientData,
        nombre:
          [patient.first_name, patient.last_name].filter(Boolean).join(' ').trim() || '—',
        email: toDisplayText(primaryContact?.email ?? patient.email),
        telefono: toDisplayText(primaryContact?.phone_primary ?? patient.phone_number),
        fechaNacimiento: patient.date_of_birth
          ? new Date(patient.date_of_birth).toLocaleDateString('es-ES', {
              timeZone: 'Europe/Madrid'
            })
          : '—',
        edad:
          computeAgeLabel(patient.date_of_birth) !== '—'
            ? computeAgeLabel(patient.date_of_birth)
            : patient.age != null
            ? `${Number(patient.age)} años`
            : '—',
        dni: toDisplayText(patient.national_id),
        pais: toDisplayText(primaryContact?.address_country ?? patient.address_country),
        estado: formatPatientStatus(
          patient.status ??
            patient.patient_status ??
            patient.registration_status ??
            patient.onboarding_status,
          patient.pre_registration_complete
        ),
        motivoConsulta: toDisplayText(
          healthProfile?.main_complaint ??
            healthProfile?.motivo_consulta ??
            patient.consultation_reason
        ),
        origenCliente: formatLeadSource(patient.lead_source ?? patient.source),
        recomendadoPor: toDisplayText(patient.referred_by_name ?? patient.referrer_name),
        ocupacion: toDisplayText(patient.occupation),
        idioma: toDisplayText(patient.preferred_language),
        contactoEmergenciaNombre: toDisplayText(patient.emergency_contact_name),
        contactoEmergenciaEmail: toDisplayText(patient.emergency_contact_email),
        contactoEmergenciaTelefono: toDisplayText(patient.emergency_contact_phone),
        alergias: allergyList,
        comentario: typeof patient.notes === 'string' ? patient.notes : ''
      }

      setFormData(mappedData)
      setTempFormData(mappedData)

      if (patient.avatar_url) {
        try {
          const signed = await getSignedUrl(patient.avatar_url)
          setAvatarPreviewUrl(signed)
        } catch {
          // ignore avatar url issues
        }
      } else {
        setAvatarPreviewUrl(null)
      }
    }

    void loadFromDb()
  }, [patientId, supabase])

  const setPreviewFromFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    lastUrlRef.current = url
    setAvatarPreviewUrl(url)
  }, [])

  const saveAvatar = React.useCallback(
    async (file: File) => {
      if (!patientId) return
      const { path } = await uploadPatientFile({
        patientId,
        file,
        kind: 'avatar'
      })
      await fetch('/api/patients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patient: { avatar_url: path }
        })
      })
      try {
        const signed = await getSignedUrl(path)
        setAvatarPreviewUrl(signed)
      } catch {
        // ignore
      }
    },
    [patientId]
  )

  React.useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  // Manejadores de edición
  const handleEdit = () => {
    setTempFormData(formData)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (readOnly) return
    if (!patientId) {
      setFormData(tempFormData)
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const { firstName, lastName } = splitFullName(tempFormData.nombre)
      const normalizedEmail = emptyValueToNull(tempFormData.email)
      const normalizedPhone = emptyValueToNull(tempFormData.telefono)
      const normalizedCountry = emptyValueToNull(tempFormData.pais)
      const normalizedBirthDate = parseUiDateToIso(tempFormData.fechaNacimiento)
      const normalizedAge = parseAgeNumber(tempFormData.edad)

      const patientPayload: Record<string, unknown> = {
        first_name: firstName || null,
        last_name: lastName || null,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        national_id: emptyValueToNull(tempFormData.dni),
        address_country: normalizedCountry,
        preferred_language: emptyValueToNull(tempFormData.idioma),
        occupation: emptyValueToNull(tempFormData.ocupacion),
        emergency_contact_name: emptyValueToNull(tempFormData.contactoEmergenciaNombre),
        emergency_contact_email: emptyValueToNull(tempFormData.contactoEmergenciaEmail),
        emergency_contact_phone: emptyValueToNull(tempFormData.contactoEmergenciaTelefono),
        notes: tempFormData.comentario?.trim() || null
      }

      const columns = patientColumnsRef.current
      if (columns.has('date_of_birth')) {
        patientPayload.date_of_birth = normalizedBirthDate
      }
      if (columns.has('age')) {
        if (normalizedBirthDate) {
          const computedFromBirth = computeAgeLabelFromIso(normalizedBirthDate)
          patientPayload.age = parseAgeNumber(computedFromBirth)
        } else {
          patientPayload.age = normalizedAge
        }
      }
      if (columns.has('lead_source')) {
        patientPayload.lead_source =
          tempFormData.origenCliente === '—'
            ? null
            : mapLeadSourceForDb(tempFormData.origenCliente)
      }
      if (columns.has('source')) {
        patientPayload.source =
          tempFormData.origenCliente === '—'
            ? null
            : mapLeadSourceForDb(tempFormData.origenCliente)
      }
      if (columns.has('referred_by_name')) {
        patientPayload.referred_by_name =
          tempFormData.recomendadoPor === '—' ? null : tempFormData.recomendadoPor
      }
      if (columns.has('referrer_name')) {
        patientPayload.referrer_name =
          tempFormData.recomendadoPor === '—' ? null : tempFormData.recomendadoPor
      }
      if (columns.has('recommended_by')) {
        patientPayload.recommended_by =
          tempFormData.recomendadoPor === '—' ? null : tempFormData.recomendadoPor
      }

      const mappedStatus = mapDisplayStatusToDbStatus(tempFormData.estado)
      if (mappedStatus.canonical) {
        if (columns.has('status')) {
          patientPayload.status = mappedStatus.canonical
        }
        if (columns.has('patient_status')) {
          patientPayload.patient_status = mappedStatus.canonical
        }
        if (columns.has('registration_status')) {
          patientPayload.registration_status = mappedStatus.canonical
        }
        if (columns.has('onboarding_status')) {
          patientPayload.onboarding_status = mappedStatus.canonical
        }
        if (
          columns.has('pre_registration_complete') &&
          mappedStatus.preRegistrationComplete !== null
        ) {
          patientPayload.pre_registration_complete =
            mappedStatus.preRegistrationComplete
        }
      }

      const alertsPayload = tempFormData.alergias.map((label) => ({
        label,
        category: 'allergy',
        severity: 'high'
      }))

      const savePatientRes = await fetch('/api/patients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patient: patientPayload,
          alerts: alertsPayload,
          primaryContact: primaryContactIdRef.current
            ? {
                id: primaryContactIdRef.current,
                full_name: emptyValueToNull(tempFormData.nombre),
                email: normalizedEmail,
                phone_primary: normalizedPhone,
                address_country: normalizedCountry
              }
            : undefined,
          healthProfile: {
            allergies: tempFormData.alergias.join(', ') || null,
            main_complaint: emptyValueToNull(tempFormData.motivoConsulta),
            motivo_consulta: emptyValueToNull(tempFormData.motivoConsulta)
          }
        })
      })

      if (!savePatientRes.ok) {
        const saveError = (await savePatientRes.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(saveError?.error || 'No se pudo guardar la ficha')
      }

      const nextData = {
        ...tempFormData,
        edad: normalizedBirthDate
          ? computeAgeLabelFromIso(normalizedBirthDate)
          : tempFormData.edad
      }
      setFormData(nextData)
      setTempFormData(nextData)
      setIsEditing(false)
      onPatientUpdated?.()
    } catch (error) {
      console.error('Error saving patient summary', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTempFormData(formData)
    setIsEditing(false)
  }

  const updateField = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setTempFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'fechaNacimiento' && typeof value === 'string') {
        const iso = parseUiDateToIso(value)
        if (iso) {
          next.edad = computeAgeLabelFromIso(iso)
        }
      }
      return next
    })
  }
  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-full h-full'
      data-node-id='423:822'
    >
      <div
        className='absolute content-stretch flex gap-[1.5rem] items-center left-[2rem] top-[3rem]'
        data-node-id='426:854'
      >
        <div className='relative shrink-0'>
          <div
            className='rounded-[12.5rem] size-[6rem] overflow-hidden bg-[var(--color-neutral-600)]'
            data-node-id='423:829'
          >
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=''
                className='w-full h-full object-cover'
                loading='lazy'
              />
            ) : null}
          </div>
          <div className='absolute -bottom-1 -right-1'>
            <AvatarImageDropdown
              previewUrl={avatarPreviewUrl ?? undefined}
              onCaptureFromCamera={async (file) => {
                setPreviewFromFile(file)
                await saveAvatar(file)
              }}
              onUploadFromDevice={async (file) => {
                setPreviewFromFile(file)
                await saveAvatar(file)
              }}
            />
          </div>
        </div>
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-start relative shrink-0 w-[14.25rem]'
          data-node-id='426:853'
        >
          {isEditing ? (
            <input
              type='text'
              value={tempFormData.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] w-full not-italic text-[#24282c] text-[1.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)]"
            />
          ) : (
            <p
              className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] min-w-full not-italic relative shrink-0 text-[#24282c] text-[1.5rem]"
              data-node-id='426:830'
              style={{ width: 'min-content' }}
            >
              {formData.nombre}
            </p>
          )}
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0 w-full'
            data-node-id='426:848'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='mail'
              data-node-id='426:837'
            >
              <MailRounded className='size-6 text-[#24282c]' />
            </div>
            {isEditing ? (
              <input
                type='email'
                value={tempFormData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-full"
              />
            ) : (
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
                data-node-id='426:831'
              >
                {formData.email}
              </p>
            )}
          </div>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='426:849'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='call'
              data-node-id='426:847'
            >
              <CallRounded className='size-6 text-[#24282c]' />
            </div>
            {isEditing ? (
              <input
                type='tel'
                value={tempFormData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-full"
              />
            ) : (
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
                data-node-id='426:838'
              >
                {formData.telefono}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className='absolute left-[2.25rem] top-[11.5rem] w-[70.5rem] border-t border-[#e2e7ea]'
        data-node-id='426:850'
      />
      <div
        className='absolute top-[3rem] flex flex-wrap gap-[0.5rem] max-w-[26rem]'
        style={{ left: 'calc(50% - 0.25rem)' }}
      >
        {(isEditing ? tempFormData.alergias : formData.alergias).map((allergy, index) => (
          <div
            key={`${allergy}-${index}`}
            className='bg-[#f7b7ba] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[6rem]'
          >
            <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic relative shrink-0 text-[0.75rem] text-nowrap text-red-700 whitespace-pre">
              {allergy}
            </p>
          </div>
        ))}
      </div>
      <div
        className='absolute bg-[#e2e7ea] h-[3.5rem] overflow-clip rounded-[0.5rem] top-[5.5rem] w-[30.25rem]'
        data-node-id='426:855'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        {isEditing ? (
          <textarea
            value={tempFormData.comentario}
            onChange={(e) => updateField('comentario', e.target.value)}
            placeholder='Añadir comentario sobre el paciente'
            className='w-full h-full px-2 py-2 text-[0.875rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-[0.5rem] outline-none focus:border-[var(--color-brand-500)] resize-none text-[#24282c]'
          />
        ) : (
          <p
            className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1rem] left-[0.5rem] not-italic text-[#aeb8c2] text-[0.75rem] text-nowrap top-[0.5rem] whitespace-pre"
            data-node-id='426:856'
          >
            {formData.comentario || 'Añadir comentario sobre el paciente'}
          </p>
        )}
      </div>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic text-[#8a95a1] text-[0.75rem] text-nowrap top-[3.25rem] whitespace-pre"
        data-node-id='426:863'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >{`Alergias: `}</p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:864'
      >
        General
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:909'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[27rem] whitespace-pre"
        data-node-id='426:876'
      >
        Información adicional
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[40rem] whitespace-pre"
        data-node-id='426:885'
      >
        Contacto de emergencia
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#8a95a1] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:868'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Edad
      </p>
      <p
        className='absolute font-["Inter:Medium",_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] top-[30rem] w-[11.813rem]'
        data-node-id='426:877'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Recomendado por:
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:870'
      >
        Fecha de nacimiento
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:911'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Estado
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[30rem] whitespace-pre"
        data-node-id='426:878'
      >
        Origen del cliente
      </p>
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.contactoEmergenciaNombre}
          onChange={(e) =>
            updateField('contactoEmergenciaNombre', e.target.value)
          }
          placeholder='Nombre contacto'
          className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] top-[43rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[12rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[43rem] whitespace-pre"
          data-node-id='426:887'
        >
          {formData.contactoEmergenciaNombre}
        </p>
      )}
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:872'
      >
        DNI/NIE
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:912'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Motivo de la consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:879'
      >
        Ocupación
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:874'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Pais
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:880'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Idioma de preferencia
      </p>
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.edad}
          onChange={(e) => updateField('edad', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[6rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:869'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.edad}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.recomendadoPor}
          onChange={(e) => updateField('recomendadoPor', e.target.value)}
          placeholder='Nombre'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[31.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
          data-node-id='426:881'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.recomendadoPor}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.fechaNacimiento}
          onChange={(e) => updateField('fechaNacimiento', e.target.value)}
          placeholder='DD/MM/AAAA'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:871'
        >
          {formData.fechaNacimiento}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.estado}
          onChange={(e) => updateField('estado', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          <option value='Pre-registro'>Pre-registro</option>
          <option value='Activo'>Activo</option>
          <option value='Inactivo'>Inactivo</option>
          <option value='Pendiente'>Pendiente</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:915'
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          {formData.estado}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.origenCliente}
          onChange={(e) => updateField('origenCliente', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[31.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        >
          <option value='Recomendación'>Recomendación</option>
          <option value='Internet'>Internet</option>
          <option value='Redes Sociales'>Redes Sociales</option>
          <option value='Publicidad'>Publicidad</option>
          <option value='Otro'>Otro</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
          data-node-id='426:882'
        >
          {formData.origenCliente}
        </p>
      )}
      {isEditing ? (
        <input
          type='email'
          value={tempFormData.contactoEmergenciaEmail}
          onChange={(e) =>
            updateField('contactoEmergenciaEmail', e.target.value)
          }
          placeholder='Email contacto'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[44.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[12rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[44.75rem] whitespace-pre"
          data-node-id='426:891'
        >
          {formData.contactoEmergenciaEmail}
        </p>
      )}
      {isEditing ? (
        <input
          type='tel'
          value={tempFormData.contactoEmergenciaTelefono}
          onChange={(e) =>
            updateField('contactoEmergenciaTelefono', e.target.value)
          }
          placeholder='Teléfono contacto'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[46.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[46.25rem] whitespace-pre"
          data-node-id='426:894'
        >
          {formData.contactoEmergenciaTelefono}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.dni}
          onChange={(e) => updateField('dni', e.target.value)}
          placeholder='DNI/NIE'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
          data-node-id='426:873'
        >
          {formData.dni}
        </p>
      )}
      {isEditing ? (
        <textarea
          value={tempFormData.motivoConsulta}
          onChange={(e) => updateField('motivoConsulta', e.target.value)}
          placeholder='Motivo de la consulta'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem]"
          data-node-id='426:916'
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          {formData.motivoConsulta}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.ocupacion}
          onChange={(e) => updateField('ocupacion', e.target.value)}
          placeholder='Ocupación'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[36.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
          data-node-id='426:883'
        >
          {formData.ocupacion}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.pais}
          onChange={(e) => updateField('pais', e.target.value)}
          placeholder='País'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
          data-node-id='426:875'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.pais}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.idioma}
          onChange={(e) => updateField('idioma', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[36.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          <option value='Español'>Español</option>
          <option value='Inglés'>Inglés</option>
          <option value='Francés'>Francés</option>
          <option value='Valenciano'>Valenciano</option>
          <option value='Catalán'>Catalán</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
          data-node-id='426:884'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.idioma}
        </p>
      )}
      {/* Edit/Save buttons - hidden when readOnly */}
      {!readOnly &&
        (!isEditing ? (
          <button
            type='button'
            onClick={handleEdit}
            className='absolute bg-[#f8fafb] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[1rem] top-[14.125rem] cursor-pointer hover:bg-[var(--color-brand-50)] transition-colors'
            data-name='Remember - Button'
            data-node-id='426:905'
            style={{ left: 'calc(87.5% + 1.906rem)' }}
          >
            <div
              aria-hidden='true'
              className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[1rem]'
            />
            <EditRounded className='size-4 text-[#1e4947]' />
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic relative shrink-0 text-[#1e4947] text-[0.875rem] text-nowrap whitespace-pre"
              data-node-id='I426:905;236:963'
            >
              Editar
            </p>
          </button>
        ) : (
          <div
            className='absolute flex gap-[0.5rem] top-[14.125rem]'
            style={{ left: 'calc(80% + 1rem)' }}
          >
            <button
              type='button'
              onClick={handleCancel}
              className='bg-[#f8fafb] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-neutral-100)] transition-colors border border-[var(--color-neutral-300)]'
            >
              <CloseRounded className='size-4 text-[var(--color-neutral-700)]' />
              <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-[var(--color-neutral-700)] text-[0.875rem]">
                Cancelar
              </span>
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={isSaving}
              className='bg-[var(--color-brand-500)] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-brand-600)] transition-colors'
            >
              <CheckRounded className='size-4 text-white' />
              <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-white text-[0.875rem]">
                {isSaving ? 'Guardando...' : 'Guardar'}
              </span>
            </button>
          </div>
        ))}
    </div>
  )
}
