'use client'

import {
  AddRounded,
  CallRounded,
  EditRounded,
  MailRounded,
  MoreVertRounded,
  SearchRounded,
  FilterListRounded,
  AppsRounded
} from '@/components/icons/md3'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
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
    alergias: string[]
    enfermedades: string[]
    medicacion: string[]
    notas: string
  }
  tratamientosPendientes: PendingTreatment[]
  saldoPendiente: string
  documentosPendientes: PendingDocument[]
  facturasVencidas: OverdueInvoice[]
  historialReciente: RecentHistoryItem[]
}

const DEFAULT_PATIENT_DATA: ResumenPatientData = {
  nombre: '—',
  edad: '—',
  email: '—',
  telefono: '—',
  proximaCita: {
    tipo: 'Sin próxima cita',
    fecha: '—',
    hora: '—',
    doctora: '—',
    duracion: '—',
    estado: 'Pendiente'
  },
  informacionCritica: {
    alergias: [],
    enfermedades: [],
    medicacion: [],
    notas: '—'
  },
  tratamientosPendientes: [],
  saldoPendiente: '0,00 €',
  documentosPendientes: [],
  facturasVencidas: [],
  historialReciente: []
}

export default function Resumen({
  onClose,
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
  const [patientData, setPatientData] = React.useState<ResumenPatientData>(() => ({
    ...DEFAULT_PATIENT_DATA,
    nombre: patientName || DEFAULT_PATIENT_DATA.nombre
  }))
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
    let isMounted = true

    async function hydrateResumen() {
      if (!patientId) return
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('id, first_name, last_name, email, phone_number, date_of_birth')
          .eq('id', patientId)
          .maybeSingle()

        if (!isMounted || !patient) return

        const fullName =
          [patient.first_name, patient.last_name].filter(Boolean).join(' ') ||
          patientName ||
          DEFAULT_PATIENT_DATA.nombre
        const years = patient.date_of_birth
          ? Math.max(
              0,
              new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
            )
          : null

        const nowIso = new Date().toISOString()

        const [
          { data: nextAppointments },
          { data: alerts },
          { data: pendingConsents },
          { data: openInvoices },
          { data: pendingTreatments }
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('scheduled_start_time, scheduled_end_time, status, notes')
            .eq('patient_id', patientId)
            .gte('scheduled_start_time', nowIso)
            .order('scheduled_start_time', { ascending: true })
            .limit(1),
          supabase
            .from('patient_medical_alerts')
            .select('alert_type, description')
            .eq('patient_id', patientId)
            .limit(50),
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

        const nextAppointment = nextAppointments?.[0]
        const startAt = nextAppointment?.scheduled_start_time
          ? new Date(nextAppointment.scheduled_start_time)
          : null
        const endAt = nextAppointment?.scheduled_end_time
          ? new Date(nextAppointment.scheduled_end_time)
          : null
        const nextDuration =
          startAt && endAt
            ? `${Math.max(
                15,
                Math.round((endAt.getTime() - startAt.getTime()) / 60000)
              )} minutos`
            : DEFAULT_PATIENT_DATA.proximaCita.duracion

        const debt = (openInvoices || []).reduce((sum, inv) => {
          return sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0))
        }, 0)

        if (!isMounted) return
        setPatientData((prev) => ({
          ...prev,
          nombre: fullName,
          edad: years !== null ? `${years} años` : prev.edad,
          email: patient.email || prev.email,
          telefono: patient.phone_number || prev.telefono,
          proximaCita: startAt
            ? {
                ...prev.proximaCita,
                tipo: nextAppointment?.notes || prev.proximaCita.tipo,
                fecha: startAt.toLocaleDateString(DEFAULT_LOCALE, {
                  timeZone: DEFAULT_TIMEZONE
                }),
                hora: startAt.toLocaleTimeString(DEFAULT_LOCALE, {
                  timeZone: DEFAULT_TIMEZONE,
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                duracion: nextDuration,
                estado:
                  nextAppointment?.status === 'confirmed'
                    ? 'Confirmado'
                    : nextAppointment?.status === 'completed'
                    ? 'Completado'
                    : 'Pendiente'
              }
            : prev.proximaCita,
          informacionCritica: {
            ...prev.informacionCritica,
            alergias:
              alerts
                ?.filter((a) => a.alert_type === 'allergy')
                .map((a) => a.description)
                .slice(0, 4) || prev.informacionCritica.alergias,
            enfermedades:
              alerts
                ?.filter((a) => a.alert_type !== 'allergy')
                .map((a) => a.description)
                .slice(0, 4) || prev.informacionCritica.enfermedades
          },
          tratamientosPendientes:
            pendingTreatments?.map((t) => ({
              nombre: t.treatment_name || 'Tratamiento',
              fecha: t.scheduled_date
                ? new Date(t.scheduled_date).toLocaleDateString(DEFAULT_LOCALE, {
                    timeZone: DEFAULT_TIMEZONE
                  })
                : '—',
              doctora: prev.proximaCita.doctora,
              precio: `${Number(t.final_amount || 0).toFixed(2)}€`,
              estado: t.status === 'in_progress' ? 'En curso' : 'Pendiente'
            })) || prev.tratamientosPendientes,
          saldoPendiente: `${debt.toLocaleString(DEFAULT_LOCALE, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} €`,
          documentosPendientes:
            pendingConsents?.map((c) => ({
              tipo: 'Consentimiento',
              descripcion: c.consent_type
            })) || prev.documentosPendientes,
          facturasVencidas:
            openInvoices
              ?.filter((inv) => inv.status === 'overdue')
              .map((inv) => ({
                numero: inv.invoice_number || 'Factura',
                descripcion: 'Factura pendiente',
                importe: `${(
                  Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)
                ).toFixed(2)}€`
              })) || prev.facturasVencidas
        }))
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
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
            data-node-id='resumen-proxima-cita-title'
          >
            Próxima cita
          </p>
          <button
            type='button'
            className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
            aria-label='Editar próxima cita'
          >
            <EditRounded className='w-6 h-6 text-[#24282c]' />
          </button>
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
            {patientData.proximaCita.fecha} - {patientData.proximaCita.hora}
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
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Información crítica
          </p>
          <button
            type='button'
            className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
            aria-label='Editar información crítica'
            onClick={() => onNavigateToInfo?.(true)}
          >
            <EditRounded className='w-6 h-6 text-[#24282c]' />
          </button>
        </div>
        <div className='space-y-[1rem]'>
          {/* Alergias */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Alergias
            </p>
            <div className='flex flex-wrap gap-[0.5rem]'>
              {patientData.informacionCritica.alergias.map((alergia, idx) => (
                <span
                  key={idx}
                  className='inline-block px-[0.75rem] py-[0.375rem] bg-[#f7b7ba] text-[0.75rem] text-red-700 rounded-full font-medium'
                >
                  {alergia}
                </span>
              ))}
            </div>
          </div>

          {/* Enfermedades */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Enfermedades
            </p>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
            >
              {patientData.informacionCritica.enfermedades.join(', ')}
            </p>
          </div>

          {/* Medicación actual */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Medicación actual
            </p>
            <div className='flex flex-wrap gap-[0.5rem]'>
              {patientData.informacionCritica.medicacion.map((med, idx) => (
                <span
                  key={idx}
                  className={`inline-block px-[0.75rem] py-[0.375rem] text-[0.75rem] rounded-full font-medium ${
                    idx === 0
                      ? 'bg-[#f7b7ba] text-red-700'
                      : 'bg-[var(--color-neutral-200)] text-[#24282c]'
                  }`}
                >
                  {med}
                </span>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Notas
            </p>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] italic text-[#aeb8c2] text-[0.875rem]"
            >
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
