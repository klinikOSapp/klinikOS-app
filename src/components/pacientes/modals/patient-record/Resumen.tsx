'use client'

/* eslint-disable @next/next/no-img-element */

import {
  AddRounded,
  CallRounded,
  MailRounded,
  MoreVertRounded,
  AppsRounded
} from '@/components/icons/md3'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { getSignedUrl } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import React from 'react'

type ResumenProps = {
  onClose?: () => void
  patientId?: string
  patientName?: string
  onNavigateToTreatments?: (withAddAction?: boolean) => void
  onNavigateToFinances?: (withBudgetCreation?: boolean) => void
  onNavigateToInfo?: (withEditMode?: boolean) => void
  onNavigateToClinicalHistory?: () => void
  onNavigateToConsents?: () => void
  onNavigateToPrescriptions?: () => void
}

type PendingTreatment = {
  nombre: string
  fecha: string
  doctora: string
  precio: string
  estado: string
}

type PendingDocument = {
  tipo: string
  descripcion: string
}

type OverdueInvoice = {
  numero: string
  descripcion: string
  importe: string
}

type RecentHistoryItem = {
  descripcion: string
}

type AlertSeverity = 'low' | 'medium' | 'high'

type AlertTag = {
  label: string
  severity: AlertSeverity
}

type CalendarAppointmentRow = {
  id: number
  patient_id: string | null
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  status: string | null
  notes: string | null
  service_name?: string | null
  staff_assigned?: Array<{ staff_id?: string | null; full_name?: string | null }> | null
}

type ResumenPatientData = {
  nombre: string
  edad: string
  email: string
  telefono: string
  proximaCita: {
    tipo: string
    fecha: string
    hora: string
    doctora: string
    duracion: string
    estado: string
  }
  informacionCritica: {
    alergias: AlertTag[]
    enfermedades: AlertTag[]
    medicacion: string[]
    notas: string
  }
  tratamientosPendientes: PendingTreatment[]
  saldoPendiente: string
  documentosPendientes: PendingDocument[]
  facturasVencidas: OverdueInvoice[]
  historialReciente: RecentHistoryItem[]
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
    // Continue with plain text parsing
  }

  return trimmed
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function createInitialPatientData(patientName?: string): ResumenPatientData {
  return {
    nombre: patientName?.trim() || 'Paciente',
    edad: 'No disponible',
    email: 'No registrado',
    telefono: 'No registrado',
    proximaCita: {
      tipo: 'Sin próxima cita',
      fecha: 'Sin fecha',
      hora: '',
      doctora: 'Sin asignar',
      duracion: 'No especificada',
      estado: 'Pendiente'
    },
    informacionCritica: {
      alergias: [],
      enfermedades: [],
      medicacion: [],
      notas: 'Sin notas clínicas registradas.'
    },
    tratamientosPendientes: [],
    saldoPendiente: '0,00 €',
    documentosPendientes: [],
    facturasVencidas: [],
    historialReciente: []
  }
}

function getAlertSeverity(value: unknown, isCritical: unknown): AlertSeverity {
  const raw = String(value || '').toLowerCase()
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw
  return isCritical ? 'high' : 'medium'
}

function getAlertTagClasses(severity: AlertSeverity): string {
  if (severity === 'high') {
    return 'bg-[#f7b7ba] text-red-700'
  }
  if (severity === 'medium') {
    return 'bg-[#FEF3C7] text-[#B45309]'
  }
  return 'bg-[#DBEAFE] text-[#1D4ED8]'
}

function severityRank(severity: AlertSeverity): number {
  if (severity === 'high') return 3
  if (severity === 'medium') return 2
  return 1
}

function mergeAlertTags(...groups: AlertTag[][]): AlertTag[] {
  const merged = new Map<string, AlertTag>()

  for (const group of groups) {
    for (const tag of group) {
      const label = String(tag.label || '').trim()
      if (!label) continue
      const key = label.toLowerCase()
      const existing = merged.get(key)
      if (!existing || severityRank(tag.severity) > severityRank(existing.severity)) {
        merged.set(key, { label, severity: tag.severity })
      }
    }
  }

  return Array.from(merged.values())
}

function parseValidDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function mapAppointmentStatusToLabel(status: string | null | undefined): string {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'confirmed') return 'Confirmado'
  if (normalized === 'completed') return 'Completado'
  if (normalized === 'in_progress' || normalized === 'checked_in') return 'En curso'
  if (normalized === 'cancelled' || normalized === 'no_show') return 'Cancelado'
  return 'Pendiente'
}

export default function Resumen({
  patientId,
  patientName,
  onNavigateToTreatments,
  onNavigateToFinances,
  onNavigateToInfo,
  onNavigateToClinicalHistory,
  onNavigateToConsents,
  onNavigateToPrescriptions
}: ResumenProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [patientData, setPatientData] = React.useState<ResumenPatientData>(() =>
    createInitialPatientData(patientName)
  )
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null
  )
  const lastUrlRef = React.useRef<string | null>(null)

  const setPreviewFromFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    lastUrlRef.current = url
    setAvatarPreviewUrl(url)
  }, [])

  React.useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  React.useEffect(() => {
    if (lastUrlRef.current) {
      URL.revokeObjectURL(lastUrlRef.current)
      lastUrlRef.current = null
    }
    setAvatarPreviewUrl(null)
    setPatientData(createInitialPatientData(patientName))
  }, [patientId, patientName])

  React.useEffect(() => {
    let isMounted = true

    async function hydrateResumen() {
      if (!patientId) return
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select(
            'id, clinic_id, first_name, last_name, email, phone_number, date_of_birth, avatar_url'
          )
          .eq('id', patientId)
          .maybeSingle()

        if (!isMounted || !patient) return

        if (patient.avatar_url) {
          try {
            const signedAvatarUrl = await getSignedUrl(patient.avatar_url)
            if (isMounted) setAvatarPreviewUrl(signedAvatarUrl)
          } catch {
            if (isMounted) setAvatarPreviewUrl(null)
          }
        } else if (isMounted) {
          setAvatarPreviewUrl(null)
        }

        const fullName =
          [patient.first_name, patient.last_name].filter(Boolean).join(' ') ||
          patientName?.trim() ||
          'Paciente'
        const years = patient.date_of_birth
          ? Math.max(
              0,
              new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
            )
          : null

        const nowIso = new Date().toISOString()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 1)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 365)
        const dateFrom = startDate.toISOString().slice(0, 10)
        const dateTo = endDate.toISOString().slice(0, 10)
        const nowMs = Date.now()

        const [
          { data: calendarRows },
          { data: alerts },
          { data: healthProfile },
          { data: pendingConsents },
          { data: openInvoices },
          { data: pendingTreatments }
        ] = await Promise.all([
          patient.clinic_id
            ? supabase.rpc('get_appointments_calendar', {
                p_clinic_id: patient.clinic_id,
                p_start_date: dateFrom,
                p_end_date: dateTo,
                p_staff_id: null,
                p_box_id: null
              })
            : Promise.resolve({ data: [] as CalendarAppointmentRow[] }),
          supabase
            .from('patient_medical_alerts')
            .select('alert_type, description, category, severity, is_critical')
            .eq('patient_id', patientId)
            .limit(200),
          supabase
            .from('patient_health_profiles')
            .select('allergies, medications, conditions, main_complaint, motivo_consulta')
            .eq('patient_id', patientId)
            .maybeSingle(),
          supabase
            .from('patient_consents')
            .select('consent_type, status')
            .eq('patient_id', patientId)
            .neq('status', 'signed')
            .limit(20),
          supabase
            .from('invoices')
            .select('invoice_number, total_amount, amount_paid, status')
            .eq('patient_id', patientId)
            .in('status', ['open', 'overdue'])
            .order('issue_timestamp', { ascending: false })
            .limit(20),
          supabase
            .from('patient_treatments')
            .select('treatment_name, scheduled_date, final_amount, status')
            .eq('patient_id', patientId)
            .in('status', ['pending', 'in_progress'])
            .order('scheduled_date', { ascending: true })
            .limit(10)
        ])

        const nextAppointmentFromCalendar = ((calendarRows || []) as CalendarAppointmentRow[])
          .filter((row) => row.patient_id === patientId)
          .map((row) => ({
            ...row,
            __startAt: parseValidDate(row.scheduled_start_time),
            __endAt: parseValidDate(row.scheduled_end_time)
          }))
          .filter((row) => row.__startAt && row.__startAt.getTime() >= nowMs)
          .sort((a, b) => a.__startAt!.getTime() - b.__startAt!.getTime())[0]

        let nextAppointment:
          | {
              scheduled_start_time: string | null
              scheduled_end_time: string | null
              status: string | null
              notes: string | null
              service_name?: string | null
              staff_assigned?: Array<{
                staff_id?: string | null
                full_name?: string | null
              }> | null
            }
          | null = nextAppointmentFromCalendar ?? null

        if (!nextAppointment) {
          const { data: nextAppointmentsFallback } = await supabase
            .from('appointments')
            .select('scheduled_start_time, scheduled_end_time, status, notes')
            .eq('patient_id', patientId)
            .gte('scheduled_start_time', nowIso)
            .order('scheduled_start_time', { ascending: true })
            .limit(1)
          nextAppointment = nextAppointmentsFallback?.[0] ?? null
        }

        const startAt = parseValidDate(nextAppointment?.scheduled_start_time)
        const endAt = parseValidDate(nextAppointment?.scheduled_end_time)
        const nextDuration =
          startAt && endAt
            ? `${Math.max(
                15,
                Math.round((endAt.getTime() - startAt.getTime()) / 60000)
              )} minutos`
            : 'No especificada'

        const debt = (openInvoices || []).reduce((sum, inv) => {
          return sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0))
        }, 0)

        const allergyTagsFromAlerts =
          alerts
            ?.filter((alert) => {
              const category = String(alert.category || '').toLowerCase()
              const alertType = String(alert.alert_type || '').toLowerCase()
              if (category) return category === 'allergy'
              if (alertType === 'allergy') return true
              // Legacy rows often don't set category; treat them as allergies by default.
              return true
            })
            .map((alert) => ({
              label: String(alert.alert_type || alert.description || 'Alerta').trim(),
              severity: getAlertSeverity(alert.severity, alert.is_critical)
            }))
            .filter((alert) => Boolean(alert.label))
            || []

        const conditionsFromAlerts =
          alerts
            ?.filter((alert) => {
              const category = String(alert.category || '').toLowerCase()
              return category === 'condition'
            })
            .map((alert) => ({
              label: String(alert.alert_type || alert.description || 'Alerta').trim(),
              severity: getAlertSeverity(alert.severity, alert.is_critical)
            }))
            .filter(Boolean)
            || []

        const allergiesFromProfile = parseListField(healthProfile?.allergies)
        const allergyTagsFromProfile: AlertTag[] = allergiesFromProfile.map((label) => ({
          label,
          severity: 'medium'
        }))
        const combinedAllergyTags = mergeAlertTags(
          allergyTagsFromAlerts,
          allergyTagsFromProfile
        )
        const conditionsFromProfile = parseListField(healthProfile?.conditions).map((label) => ({
          label,
          severity: 'medium' as AlertSeverity
        }))
        const combinedConditionTags = mergeAlertTags(
          conditionsFromAlerts,
          conditionsFromProfile
        )
        const medicationsFromProfile = parseListField(healthProfile?.medications)
        const baseData = createInitialPatientData(fullName)
        const assignedStaff = Array.isArray(nextAppointment?.staff_assigned)
          ? nextAppointment.staff_assigned[0]
          : null
        const doctorName =
          String(assignedStaff?.full_name || '').trim() ||
          baseData.proximaCita.doctora
        const clinicalNotes =
          String(
            healthProfile?.main_complaint || healthProfile?.motivo_consulta || ''
          ).trim() || baseData.informacionCritica.notas

        if (!isMounted) return

        setPatientData({
          ...baseData,
          nombre: fullName,
          edad: years !== null ? `${years} años` : baseData.edad,
          email: patient.email || baseData.email,
          telefono: patient.phone_number || baseData.telefono,
          proximaCita: startAt
            ? {
                ...baseData.proximaCita,
                tipo:
                  nextAppointment?.service_name ||
                  nextAppointment?.notes ||
                  baseData.proximaCita.tipo,
                fecha: startAt.toLocaleDateString(DEFAULT_LOCALE, {
                  timeZone: DEFAULT_TIMEZONE
                }),
                hora: startAt.toLocaleTimeString(DEFAULT_LOCALE, {
                  timeZone: DEFAULT_TIMEZONE,
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                doctora: doctorName,
                duracion: nextDuration,
                estado: mapAppointmentStatusToLabel(nextAppointment?.status)
              }
            : baseData.proximaCita,
          informacionCritica: {
            ...baseData.informacionCritica,
            alergias: combinedAllergyTags,
            enfermedades: combinedConditionTags,
            medicacion: medicationsFromProfile,
            notas: clinicalNotes
          },
          tratamientosPendientes:
            pendingTreatments?.map((t) => ({
              nombre: t.treatment_name || 'Tratamiento',
              fecha: t.scheduled_date
                ? new Date(t.scheduled_date).toLocaleDateString(DEFAULT_LOCALE, {
                    timeZone: DEFAULT_TIMEZONE
                  })
                : 'Sin fecha',
              doctora: baseData.proximaCita.doctora,
              precio: `${Number(t.final_amount || 0).toFixed(2)}€`,
              estado: t.status === 'in_progress' ? 'En curso' : 'Pendiente'
            })) || [],
          saldoPendiente: `${debt.toLocaleString(DEFAULT_LOCALE, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} €`,
          documentosPendientes:
            pendingConsents?.map((c) => ({
              tipo: 'Consentimiento',
              descripcion: c.consent_type
            })) || [],
          facturasVencidas:
            openInvoices
              ?.filter((inv) => inv.status === 'overdue')
              .map((inv) => ({
                numero: inv.invoice_number || 'Factura',
                descripcion: 'Factura pendiente',
                importe: `${(
                  Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)
                ).toFixed(2)}€`
              })) || []
        })
      } catch (error) {
        console.warn('Resumen hydration failed', error)
      }
    }

    void hydrateResumen()
    return () => {
      isMounted = false
    }
  }, [patientId, patientName, supabase])

  return (
    <div
      className='bg-[#f8fafb] w-full h-full flex flex-col'
      data-node-id='resumen-container'
    >
      {/* Header con información del paciente - FIJO, no hace scroll */}
      <div
        className='flex gap-6 items-center px-8 pt-8 pb-6 shrink-0 bg-[#f8fafb]'
        data-node-id='resumen-header'
      >
        {/* Avatar */}
        <div className='relative shrink-0'>
          <div
            className='rounded-full size-24 overflow-hidden bg-[var(--color-neutral-600)]'
            data-node-id='resumen-avatar'
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
              onCaptureFromCamera={setPreviewFromFile}
              onUploadFromDevice={setPreviewFromFile}
            />
          </div>
        </div>

        {/* Nombre y edad */}
        <div
          className='flex flex-col gap-2 items-start'
          data-node-id='resumen-name-section'
        >
          <p
            className='font-medium leading-8 text-[#24282c] text-2xl'
            data-node-id='resumen-name'
          >
            {patientData.nombre}
          </p>
          <p
            className='font-normal leading-6 text-[#24282c] text-base'
            data-node-id='resumen-age'
          >
            Edad: {patientData.edad}
          </p>
        </div>

        {/* Contacto - Alineado a la derecha */}
        <div
          className='flex flex-col gap-2 items-end ml-auto'
          data-node-id='resumen-contact'
        >
          <div
            className='flex gap-2 items-center'
            data-node-id='resumen-email'
          >
            <MailRounded className='size-6 text-[#24282c]' />
            <p className='font-normal leading-6 text-[#24282c] text-base whitespace-nowrap'>
              {patientData.email}
            </p>
          </div>
          <div
            className='flex gap-2 items-center'
            data-node-id='resumen-phone'
          >
            <CallRounded className='size-6 text-[#24282c]' />
            <p className='font-normal leading-6 text-[#24282c] text-base whitespace-nowrap'>
              {patientData.telefono}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal - Grid de dos columnas que se adaptan - CON SCROLL */}
      <div
        className='flex-1 overflow-y-auto px-8 pb-8'
        data-node-id='resumen-content-wrapper'
      >
        <div
          className='grid grid-cols-2 gap-6'
          data-node-id='resumen-content-columns'
        >
        {/* Columna izquierda */}
        <div className='flex flex-col gap-6'>
          {/* Próxima cita */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-proxima-cita-card'
          >
        <div className='mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
            data-node-id='resumen-proxima-cita-title'
          >
            Próxima cita
          </p>
        </div>
        <div className='space-y-[0.5rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
          >
            {patientData.proximaCita.tipo}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {patientData.proximaCita.hora
              ? `${patientData.proximaCita.fecha} - ${patientData.proximaCita.hora}`
              : patientData.proximaCita.fecha}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {patientData.proximaCita.doctora}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {patientData.proximaCita.duracion}
          </p>
          <span className='inline-block px-[0.75rem] py-[0.25rem] bg-[#E9FBF9] text-[0.875rem] text-[var(--color-brand-700)] rounded-full'>
            {patientData.proximaCita.estado}
          </span>
        </div>
      </div>

          {/* Información crítica */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-info-critica-card'
          >
        <div className='mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Información crítica
          </p>
        </div>
        <div className='space-y-4'>
          {/* Alergias */}
          <div>
            <div className='flex items-center gap-1.5 mb-2'>
              <span className='material-symbols-rounded text-base text-red-500'>emergency</span>
              <p className='font-medium text-sm text-[#24282c]'>Alergias</p>
            </div>
            {patientData.informacionCritica.alergias.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {patientData.informacionCritica.alergias.map((alergia, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getAlertTagClasses(
                      alergia.severity
                    )}`}
                  >
                    {alergia.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-[#aeb8c2] italic'>Sin alergias registradas</p>
            )}
          </div>

          <hr className='border-[var(--color-neutral-100)]' />

          {/* Enfermedades */}
          <div>
            <div className='flex items-center gap-1.5 mb-2'>
              <span className='material-symbols-rounded text-base text-amber-500'>cardiology</span>
              <p className='font-medium text-sm text-[#24282c]'>Enfermedades</p>
            </div>
            {patientData.informacionCritica.enfermedades.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {patientData.informacionCritica.enfermedades.map((enfermedad, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getAlertTagClasses(
                      enfermedad.severity
                    )}`}
                  >
                    {enfermedad.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-[#aeb8c2] italic'>Sin enfermedades registradas</p>
            )}
          </div>

          <hr className='border-[var(--color-neutral-100)]' />

          {/* Medicación actual */}
          <div>
            <div className='flex items-center gap-1.5 mb-2'>
              <span className='material-symbols-rounded text-base text-blue-500'>medication</span>
              <p className='font-medium text-sm text-[#24282c]'>Medicación actual</p>
            </div>
            {patientData.informacionCritica.medicacion.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {patientData.informacionCritica.medicacion.map((med, idx) => (
                  <span
                    key={idx}
                    className='inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium bg-[#EFF6FF] text-[#1D4ED8]'
                  >
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-[#aeb8c2] italic'>Sin medicación registrada</p>
            )}
          </div>

          <hr className='border-[var(--color-neutral-100)]' />

          {/* Notas */}
          <div>
            <div className='flex items-center gap-1.5 mb-2'>
              <span className='material-symbols-rounded text-base text-[var(--color-neutral-500)]'>sticky_note_2</span>
              <p className='font-medium text-sm text-[#24282c]'>Notas</p>
            </div>
            <p className='text-sm leading-relaxed italic text-[#aeb8c2]'>
              {patientData.informacionCritica.notas}
            </p>
          </div>
          </div>
        </div>

          {/* Tratamientos pendientes */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-tratamientos-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Tratamientos pendientes
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <button
              type='button'
              className='flex items-center gap-[0.25rem] px-[0.75rem] py-[0.25rem] bg-[#E9FBF9] border border-[var(--color-brand-400)] rounded-full hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
              onClick={() => onNavigateToTreatments?.(true)}
            >
              <AddRounded className='w-4 h-4 text-[var(--color-brand-700)]' />
              <span className="font-['Inter:Medium',_sans-serif] font-medium text-[0.75rem] text-[var(--color-brand-700)]">
                Añadir
              </span>
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[var(--color-brand-600)] text-[0.875rem] hover:underline ml-[0.5rem]"
              onClick={() => onNavigateToTreatments?.()}
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className='space-y-[0.75rem]'>
          {patientData.tratamientosPendientes.map((tratamiento, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <div className='flex-1'>
                <p
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {tratamiento.nombre}
                </p>
                <div className='flex items-center gap-[0.75rem] mt-[0.25rem]'>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.fecha}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.doctora}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.precio}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-[0.5rem]'>
                <span className='inline-block px-[0.75rem] py-[0.25rem] bg-[#FEF3C7] text-[0.875rem] text-[#D97706] rounded-full font-medium'>
                  {tratamiento.estado}
                </span>
                <button
                  type='button'
                  className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                  aria-label='Más opciones'
                >
                  <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
                </button>
              </div>
            </div>
          ))}
        </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className='flex flex-col gap-6'>
          {/* Saldo pendiente */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-saldo-card'
          >
        <div className='flex items-center justify-between'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Saldo pendiente
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <button
              type='button'
              className='flex items-center gap-[0.25rem] px-[0.75rem] py-[0.25rem] bg-[#E9FBF9] border border-[var(--color-brand-400)] rounded-full hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
              onClick={() => onNavigateToFinances?.(true)}
            >
              <AddRounded className='w-4 h-4 text-[var(--color-brand-700)]' />
              <span className="font-['Inter:Medium',_sans-serif] font-medium text-[0.75rem] text-[var(--color-brand-700)]">
                Presupuesto
              </span>
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[var(--color-brand-600)] text-[0.875rem] hover:underline"
              onClick={() => onNavigateToFinances?.()}
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className='mt-[1rem] flex justify-end'>
          <button
            type='button'
            onClick={() => onNavigateToFinances?.()}
            className='inline-block px-[1rem] py-[0.5rem] bg-[#f7b7ba] text-[1.125rem] text-red-700 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity'
          >
            {patientData.saldoPendiente}
          </button>
        </div>
      </div>

          {/* Documentos pendientes */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-documentos-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Documentos pendientes
          </p>
          <span
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-red-700 text-[0.875rem]"
          >
            {patientData.documentosPendientes.length} documentos pendientes
          </span>
        </div>
        <div className='space-y-[0.75rem]'>
          {patientData.documentosPendientes.map((doc, idx) => (
            <button
              key={idx}
              type='button'
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg w-full text-left cursor-pointer'
              onClick={() => {
                if (doc.tipo === 'Consentimiento') {
                  onNavigateToConsents?.()
                } else if (doc.tipo === 'Receta') {
                  onNavigateToPrescriptions?.()
                }
              }}
            >
              <div className='flex-1'>
                <p
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {doc.tipo}
                </p>
                <p
                  className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mt-[0.25rem]"
                >
                  {doc.descripcion}
                </p>
              </div>
              <div
                className='w-6 h-6 hover:opacity-70 transition-opacity'
                aria-label='Más opciones'
              >
                <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
              </div>
            </button>
          ))}
        </div>
      </div>

          {/* Facturas vencidas */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-facturas-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Facturas vencidas
          </p>
          <span
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-red-700 text-[0.875rem]"
          >
            {patientData.facturasVencidas.length} facturas vencidas
          </span>
        </div>
        <div className='space-y-[0.75rem]'>
          {patientData.facturasVencidas.map((factura, idx) => (
            <button
              key={idx}
              type='button'
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg w-full text-left cursor-pointer'
              onClick={() => onNavigateToFinances?.()}
            >
              <div className='flex-1'>
                <div className='flex items-center gap-[0.75rem]'>
                  <span
                    className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                  >
                    {factura.numero}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {factura.descripcion}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-[0.5rem]'>
                <span
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {factura.importe}
                </span>
                <div
                  className='w-6 h-6 hover:opacity-70 transition-opacity'
                  aria-label='Más opciones'
                >
                  <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

          {/* Historial reciente */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-historial-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Historial reciente
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <select
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] border border-[var(--color-neutral-300)] rounded px-[0.5rem] py-[0.25rem] bg-white"
            >
              <option>6 meses</option>
            </select>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded'
              aria-label='Vista de lista'
            >
              <div className='w-full h-full border border-[var(--color-neutral-300)] rounded' />
            </button>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded bg-[var(--color-brand-50)]'
              aria-label='Vista de cuadrícula'
            >
              <AppsRounded className='w-6 h-6 text-[#24282c]' />
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[var(--color-brand-600)] text-[0.875rem] hover:underline ml-[0.5rem]"
              onClick={() => onNavigateToClinicalHistory?.()}
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className='space-y-[0.75rem]'>
          {patientData.historialReciente.map((item, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
              >
                {item.descripcion}
              </p>
              <button
                type='button'
                className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                aria-label='Más opciones'
              >
                <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
              </button>
            </div>
          ))}
        </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
