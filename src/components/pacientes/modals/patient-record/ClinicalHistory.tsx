'use client'
import SelectorCard from '@/components/pacientes/SelectorCard'
import { useUserRole } from '@/context/role-context'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { getSignedUrl } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import ImageRounded from '@mui/icons-material/ImageRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import React from 'react'

type ClinicalHistoryProps = {
  onClose?: () => void
  patientId?: string
}

type AppointmentRecord = {
  id: string
  clinic_id: string
  status: string
  scheduled_start_time: string
  scheduled_end_time?: string | null
  service_id?: number | null
  service_type?: string | null
  source?: string | null
  source_hold_id?: number | null
  box_id?: string | null
  notes?: string | null
  public_ref?: string | null
  service_catalog?: { name?: string | null; category?: string | null } | null
  service_catalog?: { name?: string | null; category?: string | null } | null
}

type AppointmentHoldRecord = {
  id: string
  clinic_id: string
  patient_id: string
  status: string
  start_time: string
  end_time: string
  hold_expires_at?: string | null
  notes?: string | null
  public_ref?: string | null
  summary_text?: string | null
  summary_json?: Record<string, any> | null
  suggested_service_id?: number | null
  service_catalog?: { name?: string | null } | null
  box_id?: string | null
  held_by_call_id?: number | null
}

type HoldStaffAssignment = {
  staffId: string | null
  roleKey: string | null
  customRole: string
}

type HoldFormState = {
  boxId: string | null
  serviceId: number | null
  notes: string
  staffAssignments: HoldStaffAssignment[]
}

const STAFF_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'doctor', label: 'Doctor/a' },
  { value: 'higienista', label: 'Higienista' }
]

const createEmptyStaffAssignment = (): HoldStaffAssignment => ({
  staffId: null,
  roleKey: null,
  customRole: ''
})

const createInitialHoldFormState = (): HoldFormState => ({
  boxId: null,
  serviceId: null,
  notes: '',
  staffAssignments: []
})

const resolveAssignmentRole = (assignment: HoldStaffAssignment): string | null => {
  if (assignment.roleKey === 'custom') {
    return assignment.customRole.trim() ? assignment.customRole.trim() : null
  }
  if (!assignment.roleKey) return null
  const option = STAFF_ROLE_OPTIONS.find((opt) => opt.value === assignment.roleKey)
  return option?.label ?? assignment.roleKey
}

const parseSummary = (value: any): string | null => {
  if (value == null) {
    return null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.length) return null
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseSummary(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }
    return trimmed
  }
  if (typeof value === 'object') {
    const summaryFields = ['summary', 'notes', 'description', 'text']
    for (const field of summaryFields) {
      const fieldValue = (value as Record<string, any>)[field]
      if (typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
        return fieldValue.trim()
      }
    }
    if (Array.isArray((value as any).highlights)) {
      const highlights = (value as any).highlights
        .map((item: any) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
      if (highlights.length) {
        return highlights.join('\n')
      }
    }
  }
  return null
}

const getServiceLabel = (record?: {
  service_catalog?: { name?: string | null } | null
  service_type?: string | null
}): string => {
  if (!record) return 'Consulta'
  return record.service_catalog?.name || record.service_type || 'Consulta'
}

const humanize = (value?: string | null): string => {
  if (!value) return '—'
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

const mapAppointmentRows = (rows: any[]): AppointmentRecord[] =>
  (rows || []).map((appt) => ({
    id: String(appt.id),
    clinic_id: appt.clinic_id,
    status: appt.status,
    scheduled_start_time: appt.scheduled_start_time,
    scheduled_end_time: appt.scheduled_end_time,
    service_id: appt.service_id ?? null,
    service_type: appt.service_type ?? null,
    source: appt.source ?? null,
    source_hold_id:
      appt.source_hold_id == null
        ? null
        : Number.isNaN(Number(appt.source_hold_id))
          ? null
          : Number(appt.source_hold_id),
    box_id: appt.box_id ? String(appt.box_id) : null,
    notes: appt.notes ?? null,
    public_ref: appt.public_ref ?? null,
    service_catalog: Array.isArray(appt.service_catalog)
      ? appt.service_catalog[0] ?? null
      : appt.service_catalog ?? null
  }))

type TimelineEntry =
  | { kind: 'appointment'; record: AppointmentRecord }
  | { kind: 'hold'; record: AppointmentHoldRecord }

export default function ClinicalHistory({ onClose, patientId }: ClinicalHistoryProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { canManageAppointments, canAssignStaff } = useUserRole()
  const appointmentFieldsDisabled = !canManageAppointments
  const resolveCallSourceInfo = React.useCallback(
    async (callId?: number | null): Promise<HoldSourceInfo | null> => {
      if (!callId) return null
      try {
        const { data: call } = await supabase
          .from('calls')
          .select('id, channel, direction, intent_summary, started_at, external_call_id')
          .eq('id', callId)
          .maybeSingle()
        if (!call) {
          return { kind: 'call' }
        }
        const summaryText = parseSummary(call.intent_summary)
        const fetchCallLogBy = async (column: 'id' | 'call_id', value: string | number) => {
          const { data: log } = await supabase
            .from('call_logs')
            .select('id, call_id, call_summary')
            .eq(column, value as any)
            .maybeSingle()
          return log
        }
        let logRecord = await fetchCallLogBy('id', call.id)
        if (!logRecord && call.external_call_id) {
          const numericExternal = Number(call.external_call_id)
          if (!Number.isNaN(numericExternal)) {
            logRecord = await fetchCallLogBy('call_id', numericExternal)
          }
        }
        const callSummaryText =
          logRecord?.call_summary != null ? parseSummary(logRecord.call_summary) : null
        return {
          kind: 'call',
          channel: call.channel,
          summary: summaryText || callSummaryText || null,
          callSummary: callSummaryText ?? summaryText ?? null,
          startedAt: call.started_at,
          direction: call.direction
        }
      } catch (error) {
        console.error('Error loading call info', error)
        return { kind: 'call' }
      }
    },
    [supabase]
  )
  const [notes, setNotes] = React.useState<
    { id: string; created_at: string; note_type: string; content: string }[]
  >([])
  const [cardTitle, setCardTitle] = React.useState('—')
  const [cardDate, setCardDate] = React.useState('—')
  const [activeAppointmentId, setActiveAppointmentId] = React.useState<string | null>(null)
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([])
  const [soapSubjective, setSoapSubjective] = React.useState<string>('—')
  const [soapObjective, setSoapObjective] = React.useState<string>('—')
  const [soapAssessment, setSoapAssessment] = React.useState<string>('—')
  const [soapPlan, setSoapPlan] = React.useState<string>('—')
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editStatus, setEditStatus] = React.useState('scheduled')
  const [editDate, setEditDate] = React.useState('') // YYYY-MM-DDTHH:mm local
  const [editS, setEditS] = React.useState('')
  const [editO, setEditO] = React.useState('')
  const [editA, setEditA] = React.useState('')
  const [editP, setEditP] = React.useState('')
  const [editServiceId, setEditServiceId] = React.useState<number | null>(null)
  const [serviceOptions, setServiceOptions] = React.useState<
    Array<{ id: number; name: string }>
  >([])
  const [staffList, setStaffList] = React.useState<
    Array<{ id: string; name: string; appointmentRole?: string | null; clinicRole?: string | null }>
  >([])
  const [attachments, setAttachments] = React.useState<
    Array<{ id: string; name: string; path?: string; date: string; url?: string }>
  >([])
  const [odontograms, setOdontograms] = React.useState<
    Array<{ id: string; name: string; path?: string; date: string; url?: string }>
  >([])
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null)
  const [activeNoteAuthorId, setActiveNoteAuthorId] = React.useState<string | null>(null)
  const [holds, setHolds] = React.useState<AppointmentHoldRecord[]>([])
  const [activeHold, setActiveHold] = React.useState<AppointmentHoldRecord | null>(null)
  const [isConfirmingHold, setIsConfirmingHold] = React.useState(false)
  const [cancellingEntries, setCancellingEntries] = React.useState<Record<string, boolean>>({})
  const toggleCancellingEntry = React.useCallback((key: string, pending: boolean) => {
    setCancellingEntries((prev) => {
      if (pending) {
        return { ...prev, [key]: true }
      }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])
  const [appointmentSourceInfo, setAppointmentSourceInfo] = React.useState<{
    source?: string | null
    channel?: string | null
    callSummary?: string | null
    summary?: string | null
    startedAt?: string | null
    direction?: string | null
  }>({})
  const [holdForm, setHoldForm] = React.useState<HoldFormState>(() => createInitialHoldFormState())
  const [holdOptions, setHoldOptions] = React.useState<{
    boxes: Array<{ id: string; label: string }>
    services: Array<{ id: number; name: string; category?: string | null }>
    staff: Array<{ id: string; name: string }>
  }>({ boxes: [], services: [], staff: [] })
  const [clinicBoxes, setClinicBoxes] = React.useState<
    Record<string, Array<{ id: string; label: string }>>
  >({})
  type HoldSourceInfo =
    | {
        kind: 'call'
        channel?: string | null
        summary?: string | null
        callSummary?: string | null
        startedAt?: string | null
        direction?: string | null
      }
    | { kind: 'manual' }
    | { kind: 'unknown' }
  const [holdSource, setHoldSource] = React.useState<HoldSourceInfo>({ kind: 'unknown' })
  const addHoldStaffAssignment = React.useCallback(() => {
    if (!canAssignStaff) return
    setHoldForm((prev) => ({
      ...prev,
      staffAssignments: [...prev.staffAssignments, createEmptyStaffAssignment()]
    }))
  }, [canAssignStaff])
  const updateHoldStaffAssignment = React.useCallback(
    (index: number, updates: Partial<HoldStaffAssignment>) => {
      if (!canAssignStaff) return
      setHoldForm((prev) => {
        const next = prev.staffAssignments.map((assignment, idx) =>
          idx === index ? { ...assignment, ...updates } : assignment
        )
        return { ...prev, staffAssignments: next }
      })
    },
    [canAssignStaff]
  )
  const removeHoldStaffAssignment = React.useCallback((index: number) => {
    if (!canAssignStaff) return
    setHoldForm((prev) => ({
      ...prev,
      staffAssignments: prev.staffAssignments.filter((_, idx) => idx !== index)
    }))
  }, [canAssignStaff])
  const renderDetailItem = React.useCallback(
    (label: string, value: React.ReactNode, secondary?: React.ReactNode) => (
      <div className='flex flex-col gap-1'>
        <span className='text-label-sm text-neutral-500'>{label}</span>
        <span className='text-body-md whitespace-pre-line'>{value ?? '—'}</span>
        {secondary}
      </div>
    ),
    []
  )
  const renderHoldDetails = () => {
    if (!activeHold) return null
    const holdCancelKey = `hold-${activeHold.id}`
    const isCancellingHold = Boolean(cancellingEntries[holdCancelKey])
    return (
      <div className='flex flex-col gap-6'>
        <div className='grid gap-6 sm:grid-cols-2'>
          {renderDetailItem(
            'Fecha y hora',
            formatDateTime(activeHold.start_time),
            <span className='text-label-sm text-neutral-500'>
              {formatTimeRange(activeHold.start_time, activeHold.end_time)}
            </span>
          )}
          {renderDetailItem('Estado', humanize(activeHold.status))}
          {activeHold.hold_expires_at
            ? renderDetailItem('Caduca', formatDateTime(activeHold.hold_expires_at))
            : null}
          {activeHold.service_catalog?.name
            ? renderDetailItem('Servicio sugerido', activeHold.service_catalog.name)
            : null}
        </div>
        {holdSource.kind === 'call' ? (
          <div className='flex flex-col gap-1'>
            <span className='text-label-sm text-neutral-500'>Origen</span>
            <span className='text-body-md'>
              {holdSource.channel ? `Canal: ${humanize(holdSource.channel)}` : 'Llamada'}
            </span>
            {holdSource.callSummary ? (
              <span className='text-body-sm text-neutral-600 whitespace-pre-line'>
                {holdSource.callSummary}
              </span>
            ) : holdSource.summary ? (
              <span className='text-body-sm text-neutral-600 whitespace-pre-line'>
                {holdSource.summary}
              </span>
            ) : null}
            {holdSource.startedAt ? (
              <span className='text-label-sm text-neutral-500'>
                Inicio: {formatDateTime(holdSource.startedAt)}
              </span>
            ) : null}
          </div>
        ) : holdSource.kind === 'manual' ? (
          <div className='flex flex-col gap-1'>
            <span className='text-label-sm text-neutral-500'>Origen</span>
            <span className='text-body-sm text-neutral-600'>Creada manualmente</span>
          </div>
        ) : null}
        {(activeHold.summary_text || activeHold.summary_json) &&
          renderDetailItem(
            'Resumen',
            activeHold.summary_text || activeHold.summary_json?.summary || '—'
          )}
        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='flex flex-col gap-2 text-sm text-neutral-700'>
            Gabinete
            <select
              value={holdForm.boxId ?? ''}
              onChange={(e) =>
                setHoldForm((prev) => ({
                  ...prev,
                  boxId: e.target.value ? e.target.value : null
                }))
              }
              disabled={!canManageAppointments}
              className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
            >
              <option value=''>Sin asignar</option>
              {holdOptions.boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.label}
                </option>
              ))}
            </select>
          </label>
          <label className='flex flex-col gap-2 text-sm text-neutral-700'>
            Servicio
            <select
              value={holdForm.serviceId != null ? String(holdForm.serviceId) : ''}
              onChange={(e) =>
                setHoldForm((prev) => ({
                  ...prev,
                  serviceId: e.target.value ? Number(e.target.value) : null
                }))
              }
              disabled={!canManageAppointments}
              className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
            >
              <option value=''>Sin especificar</option>
              {holdOptions.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <div className='sm:col-span-2 flex flex-col gap-3'>
            <span className='text-label-sm text-neutral-500'>Profesionales asignados</span>
            {holdForm.staffAssignments.length === 0 ? (
              <p className='text-body-sm text-neutral-600'>
                Añade uno o más profesionales y especifica su rol en la cita.
              </p>
            ) : (
              holdForm.staffAssignments.map((assignment, index) => (
                <div
                  key={`hold-staff-${index}`}
                  className='flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 md:flex-row md:items-center md:gap-4'
                >
                  <select
                    value={assignment.staffId ?? ''}
                    onChange={(e) =>
                      updateHoldStaffAssignment(index, {
                        staffId: e.target.value ? e.target.value : null
                      })
                    }
                    disabled={!canAssignStaff}
                    className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:min-w-[12rem]'
                  >
                    <option value=''>Seleccionar profesional</option>
                    {holdOptions.staff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                  <div className='flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-3'>
                    <select
                      value={assignment.roleKey ?? ''}
                      onChange={(e) => {
                        const value = e.target.value || null
                        updateHoldStaffAssignment(index, {
                          roleKey: value,
                          customRole: value === 'custom' ? assignment.customRole : ''
                        })
                      }}
                      disabled={!canAssignStaff}
                      className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:min-w-[12rem]'
                    >
                      <option value=''>Seleccionar rol</option>
                      {STAFF_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {assignment.roleKey === 'custom' ? (
                      <input
                        type='text'
                        value={assignment.customRole}
                        onChange={(e) =>
                          updateHoldStaffAssignment(index, { customRole: e.target.value })
                        }
                        placeholder='Describe el rol'
                        disabled={!canAssignStaff}
                        className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:flex-1'
                      />
                    ) : null}
                  </div>
                  <button
                    type='button'
                    onClick={() => removeHoldStaffAssignment(index)}
                    disabled={!canAssignStaff}
                    className='self-start text-sm text-neutral-500 transition hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
            <button
              type='button'
              onClick={addHoldStaffAssignment}
              disabled={!canAssignStaff}
              className='inline-flex items-center gap-2 text-sm font-medium text-brand-500 transition hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <AddRounded className='size-4' />
              Añadir profesional
            </button>
          </div>
          <label className='flex flex-col gap-2 text-sm text-neutral-700 sm:col-span-2'>
            Notas internas
            <textarea
              value={holdForm.notes}
              onChange={(e) =>
                setHoldForm((prev) => ({
                  ...prev,
                  notes: e.target.value
                }))
              }
              disabled={!canManageAppointments}
              className='min-h-[96px] rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
              placeholder='Añade notas relevantes para la reserva'
            />
          </label>
        </div>
        {canManageAppointments ? (
          <div className='flex flex-col gap-2 border-t border-neutral-200 pt-4'>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <button
                type='button'
                onClick={handleConfirmHold}
                disabled={isConfirmingHold || isCancellingHold || activeHold.status !== 'held'}
                className='rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-brand-900 shadow-sm transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isConfirmingHold ? 'Confirmando…' : 'Confirmar reserva'}
              </button>
              <button
                type='button'
                onClick={() => handleCancelHold(activeHold)}
                disabled={isCancellingHold}
                className='rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isCancellingHold ? 'Cancelando…' : 'Cancelar reserva'}
              </button>
            </div>
            <p className='text-label-sm text-neutral-500'>
              Al confirmar se crea una cita y se libera la reserva.
            </p>
          </div>
        ) : null}
      </div>
    )
  }
  const renderAppointmentDetails = () => {
    if (!activeAppointment) {
      return (
        <p className='text-body-sm text-neutral-600'>
          Selecciona una cita para ver los detalles clínicos.
        </p>
      )
    }
    return (
      <div className='flex flex-col gap-8'>
        <div className='grid gap-6 sm:grid-cols-2'>
          {renderDetailItem(
            'Fecha y hora',
            formatDateTime(activeAppointment.scheduled_start_time),
            activeAppointment.scheduled_end_time ? (
              <span className='text-label-sm text-neutral-500'>
                {formatTimeRange(
                  activeAppointment.scheduled_start_time,
                  activeAppointment.scheduled_end_time
                )}
              </span>
            ) : undefined
          )}
          {renderDetailItem('Estado', humanize(activeAppointment.status))}
          {renderDetailItem('Servicio', getServiceLabel(activeAppointment))}
          {renderDetailItem('Origen', humanize(appointmentSourceInfo.source ?? null))}
          {renderDetailItem('Gabinete', appointmentBoxLabel)}
          {activeAppointment.public_ref
            ? renderDetailItem('Referencia pública', activeAppointment.public_ref)
            : null}
        </div>
        {(appointmentSourceInfo.channel ||
          appointmentSourceInfo.callSummary ||
          appointmentSourceInfo.summary ||
          appointmentSourceInfo.startedAt) && (
          <div className='flex flex-col gap-1'>
            <span className='text-label-sm text-neutral-500'>Detalles de origen</span>
            {appointmentSourceInfo.channel ? (
              <span className='text-body-md'>
                Canal: {humanize(appointmentSourceInfo.channel)}
              </span>
            ) : null}
            {appointmentSourceInfo.callSummary ? (
              <span className='text-body-sm text-neutral-600 whitespace-pre-line'>
                {appointmentSourceInfo.callSummary}
              </span>
            ) : appointmentSourceInfo.summary ? (
              <span className='text-body-sm text-neutral-600 whitespace-pre-line'>
                {appointmentSourceInfo.summary}
              </span>
            ) : null}
            {appointmentSourceInfo.startedAt ? (
              <span className='text-label-sm text-neutral-500'>
                Inicio: {formatDateTime(appointmentSourceInfo.startedAt)}
              </span>
            ) : null}
          </div>
        )}
        {activeAppointment.notes
          ? renderDetailItem('Notas internas', activeAppointment.notes)
          : null}
        <section className='flex flex-col gap-3'>
          <h3 className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
            Atendido por
          </h3>
          {staffList.length === 0 ? (
            <p className='text-label-sm text-neutral-600'>—</p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {staffList.map((m) => {
                const roles = [m.appointmentRole, m.clinicRole]
                  .filter(Boolean)
                  .map((role) => humanize(String(role).toLowerCase()))
                const uniqueRoles = Array.from(new Set(roles))
                const roleLabel = uniqueRoles.length > 0 ? uniqueRoles.join(' · ') : '—'
                return (
                  <div
                    key={m.id}
                    className='flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2'
                  >
                    <div className='relative grid size-9 place-items-center rounded-full bg-neutral-100 text-neutral-400'>
                      <AccountCircleRounded className='size-6' />
                    </div>
                    <div className="flex flex-col font-['Inter:Regular',_sans-serif] gap-0.5 text-neutral-900">
                      <span className='text-body-sm'>
                        {roleLabel !== '—' ? `${roleLabel} · ${m.name}` : m.name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h3 className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Archivos adjuntos
            </h3>
            <button
              type='button'
              className='inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition hover:text-brand-400'
              onClick={() => document.getElementById('history-upload-input')?.click()}
            >
              <AddRounded className='size-4' />
              Subir documento
            </button>
          </div>
          <input
            id='history-upload-input'
            type='file'
            className='hidden'
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f || !patientId) return
              try {
                const { uploadPatientFile } = await import('@/lib/storage')
                const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
                const supa = createSupabaseBrowserClient()
                const { path } = await uploadPatientFile({ patientId, file: f, kind: 'rx' })
                await supa.from('clinical_attachments').insert({
                  patient_id: patientId,
                  appointment_id: activeAppointmentId,
                  staff_id: (await supa.auth.getUser()).data.user?.id,
                  file_name: f.name,
                  file_type: f.type,
                  storage_path: path
                })
                const { data: atts } = await supa
                  .from('clinical_attachments')
                  .select('id, file_name, storage_path, created_at')
                  .eq('appointment_id', activeAppointmentId)
                  .order('created_at', { ascending: false })
                  .limit(10)
                const mapped = await Promise.all(
                  (atts || []).map(async (r: any) => ({
                    id: String(r.id),
                    name: r.file_name || 'archivo',
                    path: r.storage_path || undefined,
                    date: new Date(r.created_at).toLocaleDateString(DEFAULT_LOCALE, {
                      timeZone: DEFAULT_TIMEZONE
                    }),
                    url: r.storage_path ? await getSignedUrl(r.storage_path) : undefined
                  }))
                )
                setAttachments(mapped)
              } finally {
                if (e.target) e.target.value = ''
              }
            }}
          />
          {attachments.length === 0 ? (
            <p className='text-label-sm text-neutral-600'>—</p>
          ) : (
            <div className='grid gap-3'>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className='flex items-center justify-between rounded-lg border border-neutral-300 px-3 py-2'
                >
                  <span className='text-body-sm text-neutral-700'>{att.name}</span>
                  <button
                    type='button'
                    className='grid size-6 place-items-center text-neutral-700 transition hover:text-neutral-900'
                    onClick={() =>
                      att.url && window.open(att.url, '_blank', 'noopener,noreferrer')
                    }
                    aria-label='Descargar'
                  >
                    <DownloadRounded className='size-5' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h3 className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Odontograma
            </h3>
            <button
              type='button'
              className='inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition hover:text-brand-400'
              onClick={() => document.getElementById('odontogram-upload-input')?.click()}
            >
              <AddRounded className='size-4' />
              Subir odontograma
            </button>
          </div>
          <input
            id='odontogram-upload-input'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f || !patientId) return
              try {
                const { uploadPatientFile } = await import('@/lib/storage')
                const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
                const supa = createSupabaseBrowserClient()
                const { path } = await uploadPatientFile({
                  patientId,
                  file: f,
                  kind: 'orthodontics'
                })
                const { data: inserted, error } = await supa
                  .from('clinical_attachments')
                  .insert({
                  patient_id: patientId,
                  appointment_id: activeAppointmentId,
                  staff_id: (await supa.auth.getUser()).data.user?.id,
                  file_name: f.name,
                  file_type: f.type,
                    storage_path: path
                  })
                  .select('id, created_at')
                  .single()
                if (error) throw error
                let signedUrl: string | undefined
                try {
                  signedUrl = await getSignedUrl(path)
                } catch {
                  signedUrl = undefined
                }
                setOdontograms((prev) => [
                  {
                    id: String(inserted?.id ?? path),
                    name: f.name,
                    path,
                    date: new Date(inserted?.created_at ?? Date.now()).toLocaleDateString(
                      DEFAULT_LOCALE,
                      { timeZone: DEFAULT_TIMEZONE }
                    ),
                    url: signedUrl
                  },
                  ...prev
                ])
              } finally {
                if (e.target) e.target.value = ''
              }
            }}
          />
          {odontograms.length === 0 ? (
            <div className='flex h-[10.875rem] w-[14.1875rem] items-center justify-center rounded-[calc(var(--radius-xl)/2)] border border-neutral-300 bg-neutral-100 text-neutral-400'>
              <ImageRounded className='size-12' />
            </div>
          ) : (
            <div className='flex flex-wrap gap-3'>
              {odontograms.map((odo) => (
                <button
                  key={odo.id}
                  type='button'
                  className='relative h-[10.875rem] w-[14.1875rem] overflow-hidden rounded-[calc(var(--radius-xl)/2)] border border-neutral-200 shadow-sm transition hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-brand-300'
                  onClick={() => odo.url && window.open(odo.url, '_blank', 'noopener,noreferrer')}
                >
                  {odo.url ? (
                    <img
                      src={odo.url}
                      alt={odo.name}
                      className='h-full w-full object-cover'
                      loading='lazy'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400'>
                      <ImageRounded className='size-10' />
                    </div>
                  )}
                  <span className='absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white'>
                    {odo.date}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className='grid gap-6 md:grid-cols-2'>
          <div className='flex flex-col gap-1'>
            <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Subjetivo
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-500 text-label-sm">
              ¿Por qué viene?
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm whitespace-pre-line">
              {soapSubjective}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Objetivo
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-500 text-label-sm">
              ¿Qué tiene?
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm whitespace-pre-line">
              {soapObjective}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Evaluación
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-500 text-label-sm">
              ¿Qué le hacemos?
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm whitespace-pre-line">
              {soapAssessment}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
              Plan
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-500 text-label-sm">
              Tratamiento a seguir
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm whitespace-pre-line">
              {soapPlan}
            </p>
          </div>
        </section>
      </div>
    )
  }
  const activeAppointment = React.useMemo(() => {
    if (!activeAppointmentId) return null
    return (
      appointments.find((appt) => String(appt.id) === String(activeAppointmentId)) ?? null
    )
  }, [appointments, activeAppointmentId])
  const appointmentBoxLabel = React.useMemo(() => {
    if (!activeAppointment?.box_id) return 'Sin asignar'
    const boxes = clinicBoxes[activeAppointment.clinic_id] ?? []
    const match = boxes.find((box) => box.id === activeAppointment.box_id)
    return match?.label ?? 'Sin asignar'
  }, [activeAppointment, clinicBoxes])

  const formatDateShort = React.useCallback((date: Date) => {
    return date.toLocaleDateString(DEFAULT_LOCALE, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: DEFAULT_TIMEZONE
    })
  }, [])

  const formatDateTime = React.useCallback((iso: string) => {
    return new Date(iso).toLocaleString(DEFAULT_LOCALE, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE
    })
  }, [])

  const formatTimeRange = React.useCallback((startIso: string, endIso: string) => {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const startLabel = start.toLocaleTimeString(DEFAULT_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DEFAULT_TIMEZONE
    })
    const endLabel = end.toLocaleTimeString(DEFAULT_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DEFAULT_TIMEZONE
    })
    return `${startLabel} - ${endLabel}`
  }, [])

  const formatTimeLabel = React.useCallback(
    (startIso: string, endIso?: string | null) => {
      if (endIso) {
        return formatTimeRange(startIso, endIso)
      }
      return new Date(startIso).toLocaleTimeString(DEFAULT_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: DEFAULT_TIMEZONE
      })
    },
    [formatTimeRange]
  )

  const getEntriesForFilter = React.useCallback(
    (
      f: Filter,
      overrides?: { appointments?: AppointmentRecord[]; holds?: AppointmentHoldRecord[] }
    ): TimelineEntry[] => {
      const now = Date.now()
      const appointmentSource = overrides?.appointments ?? appointments
      const filteredAppointments = appointmentSource.filter(
        (appt) => appt.status !== 'cancelled'
      )
      const holdSource = overrides?.holds ?? holds
      const entryStartTime = (entry: TimelineEntry) =>
        entry.kind === 'appointment'
          ? new Date(entry.record.scheduled_start_time).getTime()
          : new Date(entry.record.start_time).getTime()

      if (f === 'proximas') {
        const appointmentEntries = filteredAppointments
          .filter((a) => new Date(a.scheduled_start_time).getTime() > now)
          .map((record) => ({ kind: 'appointment', record } as TimelineEntry))
        const holdEntries = holdSource
          .filter((h) => h.status === 'held' && new Date(h.start_time).getTime() > now)
          .map((record) => ({ kind: 'hold', record } as TimelineEntry))
        return [...appointmentEntries, ...holdEntries].sort(
          (a, b) => entryStartTime(a) - entryStartTime(b)
        )
      }
      if (f === 'pasadas') {
        return filteredAppointments
          .filter((a) => new Date(a.scheduled_start_time).getTime() <= now)
          .map((record) => ({ kind: 'appointment', record } as TimelineEntry))
          .sort((a, b) => entryStartTime(b) - entryStartTime(a))
      }
      if (f === 'confirmadas') {
        return filteredAppointments
          .filter((a) => a.status === 'confirmed')
          .map((record) => ({ kind: 'appointment', record } as TimelineEntry))
          .sort((a, b) => entryStartTime(b) - entryStartTime(a))
      }
      if (f === 'inaxistencia') {
        return filteredAppointments
          .filter((a) => a.status === 'no_show')
          .map((record) => ({ kind: 'appointment', record } as TimelineEntry))
          .sort((a, b) => entryStartTime(b) - entryStartTime(a))
      }
      return filteredAppointments
        .map((record) => ({ kind: 'appointment', record } as TimelineEntry))
        .sort((a, b) => entryStartTime(b) - entryStartTime(a))
    },
    [appointments, holds]
  )

  React.useEffect(() => {
    async function load() {
      if (!patientId) return
      // Load appointments for left list (with service name + ref)
      const { data: appts } = await supabase
        .from('appointments')
        .select(
          'id, clinic_id, box_id, status, scheduled_start_time, scheduled_end_time, service_id, service_type, source, source_hold_id, public_ref, notes, service_catalog:service_id(name, category)'
        )
        .eq('patient_id', patientId)
        .order('scheduled_start_time', { ascending: false })
        .limit(10)
      const hasAppointments = Array.isArray(appts) && appts.length > 0
      if (hasAppointments) {
        const mappedAppointments = mapAppointmentRows(appts as any[])
        setAppointments(mappedAppointments)
        const a0 = mappedAppointments[0]
        const d = new Date(a0.scheduled_start_time)
        const service = getServiceLabel(a0)
        const ref = a0.public_ref ? ` · ${a0.public_ref}` : ''
        setCardTitle(`${service}${ref}`)
        setCardDate(formatDateShort(d))
        setActiveAppointmentId(String(a0.id))
        setEditStatus(a0.status)
        setEditServiceId(a0.service_id ?? null)
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setEditDate(iso)
        await fetchAndSetAppointmentNote(a0.id)
      }
      const { data } = await supabase
        .from('clinical_notes')
        .select('id, created_at, note_type, content')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (Array.isArray(data)) {
        setNotes(
          data.map((n: any) => ({
            id: String(n.id),
            created_at: n.created_at,
            note_type: n.note_type ?? 'Nota',
            content: n.content ?? ''
          }))
        )
        if (data[0] && !hasAppointments) {
          const d = new Date(data[0].created_at)
          setCardTitle(data[0].note_type ?? 'Nota clínica')
          setCardDate(formatDateShort(d))
          setSoapSubjective('—')
          setSoapObjective('—')
          setSoapAssessment('—')
          setSoapPlan('—')
        }
      }

      const { data: holdRows } = await supabase
        .from('appointment_holds')
        .select(
          'id, clinic_id, patient_id, box_id, held_by_call_id, status, start_time, end_time, hold_expires_at, notes, public_ref, summary_text, summary_json, suggested_service_id, service_catalog:suggested_service_id(name, category)'
        )
        .eq('patient_id', patientId)
        .order('start_time', { ascending: true })
        .limit(20)
      if (Array.isArray(holdRows)) {
        const sanitizedHolds = holdRows.filter((hold: any) => hold.status !== 'used')
        setHolds(
          sanitizedHolds.map((hold: any) => ({
            id: String(hold.id),
            clinic_id: hold.clinic_id,
            patient_id: hold.patient_id,
            box_id: hold.box_id ? String(hold.box_id) : null,
            held_by_call_id:
              hold.held_by_call_id == null
                ? null
                : Number.isNaN(Number(hold.held_by_call_id))
                  ? null
                  : Number(hold.held_by_call_id),
            status: hold.status,
            start_time: hold.start_time,
            end_time: hold.end_time,
            hold_expires_at: hold.hold_expires_at,
            notes: hold.notes,
            public_ref: hold.public_ref,
            summary_text: hold.summary_text,
            summary_json: hold.summary_json,
            suggested_service_id: hold.suggested_service_id,
            service_catalog: Array.isArray(hold.service_catalog)
              ? hold.service_catalog[0] ?? null
              : hold.service_catalog ?? null
          }))
        )
      }
    }
    void load()
  }, [formatDateShort, patientId, supabase])
  React.useEffect(() => {
    if (!activeHold) return
    const hold = activeHold
    setHoldForm({
      boxId: hold.box_id ? String(hold.box_id) : null,
      serviceId: hold.suggested_service_id ?? null,
      notes: hold.notes ?? '',
      staffAssignments: []
    })
    setHoldSource({ kind: 'unknown' })
    async function loadHoldMetadata() {
      try {
        const [boxesRes, staffRes, servicesRes] = await Promise.all([
          supabase.rpc('get_clinic_boxes', { clinic: hold.clinic_id }),
          supabase.rpc('get_clinic_staff', { clinic: hold.clinic_id }),
          supabase.rpc('get_clinic_services', { clinic: hold.clinic_id })
        ])
        const boxes = (boxesRes.data || []).map((box: any) => ({
          id: String(box.id),
          label: box.name || 'Sin nombre'
        }))
        const staffOptions = (staffRes.data || [])
          .map((row: any) => ({
            id: row.id,
            name: row.full_name || row.id
          }))
          .filter((opt: any) => opt.id)
        const services = (servicesRes.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category ?? null
        }))
        setHoldOptions({ boxes, services, staff: staffOptions })
        setClinicBoxes((prev) => ({
          ...prev,
          [hold.clinic_id]: boxes
        }))
      } catch (error) {
        console.error('Error loading hold metadata', error)
        setHoldOptions({ boxes: [], services: [], staff: [] })
      }

      if (hold.held_by_call_id) {
        const info = await resolveCallSourceInfo(hold.held_by_call_id)
        if (info) {
          setHoldSource(info)
        } else {
          setHoldSource({ kind: 'call' })
        }
      } else {
        setHoldSource(hold.notes ? { kind: 'manual' } : { kind: 'unknown' })
      }
    }
    void loadHoldMetadata()
  }, [activeHold, resolveCallSourceInfo, supabase])

  React.useEffect(() => {
    async function loadAppointmentMetadata() {
      if (!activeAppointment) {
        setServiceOptions([])
        setAppointmentSourceInfo({})
        return
      }

      setEditServiceId(activeAppointment.service_id ?? null)
      setAppointmentSourceInfo({ source: activeAppointment.source ?? null })

      try {
        const { data: servicesRes } = await supabase.rpc('get_clinic_services', {
          clinic: activeAppointment.clinic_id
        })
        const options =
          servicesRes?.map((svc: any) => ({ id: svc.id, name: svc.name })) ?? []
        setServiceOptions(options)
      } catch (error) {
        console.error('Error loading services for appointment', error)
        setServiceOptions([])
      }

      if (!clinicBoxes[activeAppointment.clinic_id]) {
        try {
          const { data: boxesRes } = await supabase.rpc('get_clinic_boxes', {
            clinic: activeAppointment.clinic_id
          })
          const mappedBoxes =
            boxesRes?.map((box: any) => ({
              id: String(box.id),
              label: box.name || 'Sin nombre'
            })) ?? []
          setClinicBoxes((prev) => ({
            ...prev,
            [activeAppointment.clinic_id]: mappedBoxes
          }))
        } catch (error) {
          console.error('Error loading boxes for appointment', error)
        }
      }

      if (activeAppointment.source_hold_id) {
        try {
          const { data: holdRow } = await supabase
            .from('appointment_holds')
            .select('held_by_call_id')
            .eq('id', activeAppointment.source_hold_id)
            .maybeSingle()
          if (holdRow?.held_by_call_id) {
            const info = await resolveCallSourceInfo(holdRow.held_by_call_id)
            if (info) {
              setAppointmentSourceInfo((prev) => ({
                ...prev,
                ...info,
                source: activeAppointment.source ?? prev.source ?? null
              }))
            }
          }
        } catch (error) {
          console.error('Error loading source hold for appointment', error)
        }
      }
    }
    void loadAppointmentMetadata()
  }, [activeAppointment, clinicBoxes, resolveCallSourceInfo, supabase])

  const fetchAndSetAppointmentNote = React.useCallback(
    async (appointmentId: string | number | null | undefined) => {
      if (!appointmentId) {
        setSoapSubjective('—')
        setSoapObjective('—')
        setSoapAssessment('—')
        setSoapPlan('—')
        setEditS('')
        setEditO('')
        setEditA('')
        setEditP('')
        setActiveNoteId(null)
        setActiveNoteAuthorId(null)
        return
      }
      const numericId =
        typeof appointmentId === 'number' ? appointmentId : Number(appointmentId)
      const filterValue = Number.isNaN(numericId) ? appointmentId : numericId
      const { data, error } = await supabase
        .from('appointment_notes')
        .select('id, content, content_json, note_type, created_at, staff_id')
        .eq('appointment_id', filterValue as any)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) {
        console.error('Error loading appointment notes', error)
        setSoapSubjective('—')
        setSoapObjective('—')
        setSoapAssessment('—')
        setSoapPlan('—')
        setActiveNoteId(null)
        setActiveNoteAuthorId(null)
        return
      }
      if (Array.isArray(data) && data[0]) {
        setActiveNoteId(String(data[0].id))
        setActiveNoteAuthorId((data[0] as any).staff_id ?? null)
        const rawJson = (data[0] as any).content_json
        let cj:
          | {
              s?: string | null
              o?: string | null
              a?: string | null
              p?: string | null
            }
          | null
          | undefined
        if (typeof rawJson === 'string') {
          try {
            cj = JSON.parse(rawJson)
          } catch {
            cj = null
          }
        } else if (rawJson && typeof rawJson === 'object') {
          cj = rawJson as any
        }
        const legacyContent = String((data[0] as any).content ?? '')
        let s: string | undefined = cj?.s ?? undefined
        let o: string | undefined = cj?.o ?? undefined
        let a: string | undefined = cj?.a ?? undefined
        let p: string | undefined = cj?.p ?? undefined
        if ((!s || !o || !a || !p) && legacyContent) {
          const matchS = legacyContent.match(/S:\s*([^O]*)/i)?.[1]?.trim()
          const matchO = legacyContent.match(/O:\s*([^A]*)/i)?.[1]?.trim()
          const matchA = legacyContent.match(/A:\s*([^P]*)/i)?.[1]?.trim()
          const matchP = legacyContent.match(/P:\s*(.*)$/i)?.[1]?.trim()
          s = s ?? matchS
          o = o ?? matchO
          a = a ?? matchA
          p = p ?? matchP
        }
        setSoapSubjective(s && s.length > 0 ? s : '—')
        setSoapObjective(o && o.length > 0 ? o : '—')
        setSoapAssessment(a && a.length > 0 ? a : '—')
        setSoapPlan(p && p.length > 0 ? p : '—')
        setEditS(s || '')
        setEditO(o || '')
        setEditA(a || '')
        setEditP(p || '')
      } else {
        setSoapSubjective('—')
        setSoapObjective('—')
        setSoapAssessment('—')
        setSoapPlan('—')
        setEditS('')
        setEditO('')
        setEditA('')
        setEditP('')
        setActiveNoteId(null)
        setActiveNoteAuthorId(null)
      }
    },
    [supabase]
  )

  const loadAppointmentNote = React.useCallback(async () => {
    await fetchAndSetAppointmentNote(activeAppointmentId)
  }, [activeAppointmentId, fetchAndSetAppointmentNote])

  // Load appointment_notes for the active appointment
  React.useEffect(() => {
    void loadAppointmentNote()
  }, [loadAppointmentNote])
  const [filter, setFilter] = React.useState<
    'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  >('proximas')

  const [selectedCardId, setSelectedCardId] = React.useState<string>('c1')

  type Filter = 'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  const orderedFilters: Filter[] = [
    'proximas',
    'pasadas',
    'confirmadas',
    'inaxistencia'
  ]
  const pickByFilter = React.useCallback(
    (
      f: Filter,
      overrides?: { appointments?: AppointmentRecord[]; holds?: AppointmentHoldRecord[] }
    ) => {
      const entries = getEntriesForFilter(f, overrides)
      if (entries.length === 0) {
        setActiveAppointmentId(null)
        setActiveHold(null)
        return
      }
      const first = entries[0]
      if (first.kind === 'appointment') {
        const pick = first.record
        const d = new Date(pick.scheduled_start_time)
        setActiveHold(null)
        setActiveAppointmentId(String(pick.id))
        const service = getServiceLabel(pick)
        const ref = pick.public_ref ? ` · ${pick.public_ref}` : ''
        setCardTitle(`${service}${ref}`)
        setCardDate(formatDateShort(d))
        setEditStatus(pick.status)
        setEditServiceId(pick.service_id ?? null)
        setAppointmentSourceInfo({
          source: pick.source ?? null
        })
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setEditDate(iso)
      } else {
        const hold = first.record
        const d = new Date(hold.start_time)
        setActiveAppointmentId(null)
        setActiveHold(hold)
        setActiveNoteId(null)
        setAttachments([])
        setStaffList([])
        const service = hold.service_catalog?.name || hold.summary_text || 'Reserva pendiente'
        const ref = hold.public_ref ? ` · ${hold.public_ref}` : ''
        setCardTitle(`${service}${ref}`)
        setCardDate(formatDateShort(d))
        setSoapSubjective(hold.summary_text || hold.summary_json?.subjective || '—')
        setSoapObjective('—')
        setSoapAssessment('—')
        setSoapPlan('—')
      }
    },
    [formatDateShort, getEntriesForFilter]
  )

  React.useEffect(() => {
    pickByFilter(filter)
  }, [filter, pickByFilter])
  // Load staff linked to appointment + attachments list
  React.useEffect(() => {
    async function loadStaffAndAttachments() {
      if (!activeAppointmentId) return
      const numericActiveId = Number(activeAppointmentId)
      const appointmentFilter = Number.isNaN(numericActiveId)
        ? activeAppointmentId
        : numericActiveId
      const clinicIdForStaff = activeAppointment?.clinic_id ?? null
      const { data: staffLinks } = await supabase
        .from('appointment_staff')
        .select('staff_id, role_in_appointment')
        .eq('appointment_id', appointmentFilter as any)
      const staffIds = (staffLinks || [])
        .map((link: any) => link.staff_id)
        .filter(Boolean)
      let staff: Array<{ id: string; name: string; role?: string | null }> = []
      let clinicRoleMap = new Map<string, string | null>()
      if (clinicIdForStaff && staffIds.length) {
        const { data: clinicRoles, error: clinicRoleError } = await supabase
          .from('staff_clinics')
          .select('staff_id, role')
          .eq('clinic_id', clinicIdForStaff)
          .in('staff_id', staffIds as any)
        if (clinicRoleError) {
          console.error('Error loading staff clinic roles', clinicRoleError)
        } else if (Array.isArray(clinicRoles)) {
          clinicRoleMap = new Map(
            clinicRoles.map((row: any) => [row.staff_id, row.role ?? null])
          )
        }
      }
      if (staffIds.length) {
        try {
          const { data: profiles } = await supabase.rpc('get_staff_names', {
            staff_ids: staffIds
          })
          const nameById = new Map<string, { name: string; clinic_id?: string | null }>()
          for (const profile of profiles || []) {
            if (profile?.id) {
              nameById.set(profile.id, {
                name: profile.full_name ?? profile.id,
                clinic_id: profile.clinic_id ?? null
              })
            }
          }
          staff = (staffLinks || []).map((link: any) => ({
            id: link.staff_id,
            name: nameById.get(link.staff_id)?.name ?? link.staff_id,
            appointmentRole: link.role_in_appointment ?? null,
            clinicRole: clinicRoleMap.get(link.staff_id) ?? null
          }))
        } catch (rpcError) {
          console.error('Error loading staff names', rpcError)
          staff = (staffLinks || []).map((link: any) => ({
            id: link.staff_id,
            name: link.staff_id,
            appointmentRole: link.role_in_appointment ?? null,
            clinicRole: clinicRoleMap.get(link.staff_id) ?? null
          }))
        }
      }
      setStaffList(staff)

      const { data: atts } = await supabase
        .from('clinical_attachments')
        .select('id, file_name, storage_path, created_at')
        .eq('appointment_id', appointmentFilter as any)
        .order('created_at', { ascending: false })
        .limit(10)
      const mapped: Array<{ id: string; name: string; path?: string; date: string; url?: string }> =
        await Promise.all(
          (atts || []).map(async (r: any) => {
            let url: string | undefined
            if (r.storage_path) {
              try {
                url = await getSignedUrl(r.storage_path)
              } catch {
                url = undefined
              }
            }
            return {
              id: String(r.id),
              name: r.file_name || 'archivo',
              path: r.storage_path || undefined,
              date: new Date(r.created_at).toLocaleDateString(DEFAULT_LOCALE, {
                timeZone: DEFAULT_TIMEZONE
              }),
              url
            }
          })
        )
      setAttachments(mapped)
      setOdontograms(mapped.filter((item) => item.path?.includes('/orthodontics/')))
    }
    void loadStaffAndAttachments()
  }, [activeAppointmentId, activeAppointment, supabase])
  const handleKeyDown = (current: Filter) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFilter(current)
      return
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const idx = orderedFilters.indexOf(filter)
      const nextIdx =
        e.key === 'ArrowRight'
          ? (idx + 1) % orderedFilters.length
          : (idx - 1 + orderedFilters.length) % orderedFilters.length
      setFilter(orderedFilters[nextIdx])
    }
  }

  const timelineEntries = React.useMemo(() => getEntriesForFilter(filter), [getEntriesForFilter, filter])

  const handleCancelHold = React.useCallback(
    async (hold: AppointmentHoldRecord | null) => {
      if (!hold || !canManageAppointments) return
      const entryKey = `hold-${hold.id}`
      toggleCancellingEntry(entryKey, true)
      try {
        await supabase.from('appointment_holds').update({ status: 'cancelled' }).eq('id', hold.id)
        const nextHolds = holds.filter((h) => h.id !== hold.id)
        setHolds(nextHolds)
        if (activeHold?.id === hold.id) {
          setActiveHold(null)
          setHoldForm(createInitialHoldFormState())
        }
        pickByFilter(filter, { holds: nextHolds })
      } catch (error) {
        console.error('Error cancelling appointment hold', error)
        alert('No se pudo cancelar la reserva. Intenta nuevamente.')
      } finally {
        toggleCancellingEntry(entryKey, false)
      }
    },
    [activeHold, filter, holds, pickByFilter, supabase, toggleCancellingEntry, canManageAppointments]
  )

  const handleCancelAppointment = React.useCallback(
    async (appointment: AppointmentRecord | null) => {
      if (!appointment || !canManageAppointments) return
      const entryKey = `appt-${appointment.id}`
      toggleCancellingEntry(entryKey, true)
      try {
        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointment.id)
        const nextAppointments = appointments.map((appt) =>
          appt.id === appointment.id ? { ...appt, status: 'cancelled' } : appt
        )
        setAppointments(nextAppointments)
        if (activeAppointmentId === String(appointment.id)) {
          setActiveAppointmentId(null)
          setEditStatus('cancelled')
        }
        pickByFilter(filter, { appointments: nextAppointments })
      } catch (error) {
        console.error('Error cancelling appointment', error)
        alert('No se pudo cancelar la cita. Intenta nuevamente.')
      } finally {
        toggleCancellingEntry(entryKey, false)
      }
    },
    [
      activeAppointmentId,
      appointments,
      filter,
      pickByFilter,
      supabase,
      toggleCancellingEntry,
      canManageAppointments
    ]
  )

  const handleConfirmHold = React.useCallback(async () => {
    if (!activeHold || !canManageAppointments) return
    const hold = activeHold
    setIsConfirmingHold(true)
    try {
      const selectedBoxId = holdForm.boxId || hold.box_id || null
      const selectedServiceId = holdForm.serviceId ?? hold.suggested_service_id ?? null
      const notesToUse = holdForm.notes?.trim() || hold.notes || null
      let selectedServiceMeta =
        selectedServiceId != null
          ? holdOptions.services.find((s) => s.id === selectedServiceId) ?? null
          : null
      if (selectedServiceId && !selectedServiceMeta) {
        try {
          const { data: svcMeta } = await supabase
            .from('service_catalog')
            .select('id, name, category')
            .eq('id', selectedServiceId)
            .maybeSingle()
          if (svcMeta) {
            selectedServiceMeta = {
              id: selectedServiceId,
              name: svcMeta.name,
              category: svcMeta.category ?? null
            }
          }
        } catch (svcError) {
          console.warn('No se pudo cargar el servicio seleccionado', svcError)
        }
      }
      const selectedServiceName =
        selectedServiceMeta?.name ||
        hold.service_catalog?.name ||
        hold.summary_text ||
        'Consulta'
      const serviceName = selectedServiceName || hold.service_catalog?.name || 'Consulta'
      const serviceTypeSnapshot =
        selectedServiceMeta?.category ||
        hold.service_catalog?.category ||
        (typeof hold.summary_json?.service_type === 'string'
          ? hold.summary_json?.service_type
          : null) ||
        selectedServiceName ||
        'Consulta'
      const publicRef =
        hold.public_ref ?? `APPT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      await supabase
        .from('appointment_holds')
        .update({
          box_id: selectedBoxId,
          notes: notesToUse,
          suggested_service_id: selectedServiceId
        })
        .eq('id', hold.id)
      const { data: inserted, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: hold.clinic_id,
          patient_id: hold.patient_id,
          box_id: selectedBoxId,
          status: 'confirmed',
          scheduled_start_time: hold.start_time,
          scheduled_end_time: hold.end_time,
          notes: notesToUse,
          source: 'manual',
          service_id: selectedServiceId,
          service_type: serviceTypeSnapshot,
          public_ref: publicRef,
          source_hold_id: hold.id
        })
        .select(
          'id, clinic_id, box_id, status, scheduled_start_time, scheduled_end_time, service_id, service_type, source, source_hold_id, public_ref, notes, service_catalog:service_id(name, category)'
        )
        .maybeSingle()
      if (error) {
        throw error
      }
      await supabase
        .from('appointment_holds')
        .update({ status: 'used' })
        .eq('id', hold.id)
      if (inserted) {
        const insertedServiceCatalog = Array.isArray(inserted.service_catalog)
          ? inserted.service_catalog[0]
          : inserted.service_catalog
        const record: AppointmentRecord = {
          id: String(inserted.id),
          clinic_id: inserted.clinic_id,
          status: inserted.status,
          scheduled_start_time: inserted.scheduled_start_time,
          scheduled_end_time: inserted.scheduled_end_time,
          service_id: inserted.service_id ?? selectedServiceId ?? null,
          service_type: inserted.service_type ?? serviceTypeSnapshot,
          source: inserted.source ?? 'manual',
          source_hold_id:
            inserted.source_hold_id == null
              ? null
              : Number.isNaN(Number(inserted.source_hold_id))
                ? null
                : Number(inserted.source_hold_id),
          box_id: inserted.box_id ? String(inserted.box_id) : null,
          notes: inserted.notes ?? notesToUse ?? null,
          public_ref: inserted.public_ref,
          service_catalog: insertedServiceCatalog ?? null
        }
        setAppointments((prev) => {
          const next = [...prev, record]
          return next.sort(
            (a, b) =>
              new Date(b.scheduled_start_time).getTime() -
              new Date(a.scheduled_start_time).getTime()
          )
        })
        const staffAssignmentsToInsert = holdForm.staffAssignments
          .map((assignment) => ({
            staffId: assignment.staffId,
            role: resolveAssignmentRole(assignment)
          }))
          .filter((assignment) => assignment.staffId)
        if (inserted.id && staffAssignmentsToInsert.length) {
          const payload = staffAssignmentsToInsert.map((assignment) => ({
            staff_id: assignment.staffId as string,
            role: assignment.role
          }))
          const staffNameMap = new Map(
            holdOptions.staff.map((staff) => [staff.id, staff.name])
          )
          let staffPersisted = false
          try {
            await supabase.rpc('assign_staff_to_appointment', {
              appointment_id: Number(inserted.id),
              assignments: payload
            })
            staffPersisted = true
          } catch (staffError) {
            console.error('Error asignando staff con RPC, aplicando respaldo', staffError)
          }
          if (!staffPersisted) {
            try {
              await supabase.from('appointment_staff').upsert(
                payload.map((assignment) => ({
                  appointment_id: Number(inserted.id),
                  staff_id: assignment.staff_id,
                  role_in_appointment: assignment.role
                }))
              )
              staffPersisted = true
            } catch (fallbackError) {
              console.error('No se pudo asignar staff tras confirmar la cita', fallbackError)
            }
          }
          if (staffPersisted) {
            setStaffList(
              payload.map((assignment) => ({
                id: assignment.staff_id,
                name: staffNameMap.get(assignment.staff_id) ?? assignment.staff_id,
                role: assignment.role ?? null
              }))
            )
          }
        } else {
          setStaffList([])
        }
        setHolds((prev) => prev.filter((h) => h.id !== hold.id))
        setActiveHold(null)
        setActiveAppointmentId(String(inserted.id))
        setHoldForm(createInitialHoldFormState())
        const startDate = new Date(inserted.scheduled_start_time)
        const serviceLabel = getServiceLabel({
          service_catalog: insertedServiceCatalog ?? null,
          service_type: inserted.service_type ?? null
        })
        const ref = inserted.public_ref ? ` · ${inserted.public_ref}` : ''
        setCardTitle(`${serviceLabel}${ref}`)
        setCardDate(formatDateShort(startDate))
        setEditStatus(inserted.status)
        const iso = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setEditDate(iso)
        setSoapSubjective('—')
        setSoapObjective('—')
        setSoapAssessment('—')
        setSoapPlan('—')
      }
      pickByFilter(filter)
    } catch (error) {
      console.error('Error confirming appointment hold', error)
      alert('No se pudo confirmar la reserva. Intenta nuevamente.')
    } finally {
      setIsConfirmingHold(false)
    }
  }, [
    activeHold,
    filter,
    formatDateShort,
    pickByFilter,
    supabase,
    holdForm,
    holdOptions.services,
    holdOptions.staff,
    canManageAppointments
  ])
  return (
    <div
      className='bg-neutral-50 relative w-full max-w-[74.75rem] h-full min-h-[56.25rem] overflow-hidden'
      data-node-id='426:934'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-6 top-[var(--spacing-gapmd)] right-[var(--spacing-plnav)] cursor-pointer'
        data-name='close'
        data-node-id='426:935'
      >
        <CloseRounded className='size-6 text-neutral-900' />
      </button>

      <div className='absolute left-[var(--spacing-plnav)] top-[10.25rem] flex items-center gap-[var(--spacing-gapmd)]'>
        <div
          role='tab'
          aria-selected={filter === 'proximas'}
          onClick={() => setFilter('proximas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'proximas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1016'
          tabIndex={0}
          onKeyDown={handleKeyDown('proximas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'proximas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Próximas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'pasadas'}
          onClick={() => setFilter('pasadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'pasadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1017'
          tabIndex={0}
          onKeyDown={handleKeyDown('pasadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'pasadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Pasadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'confirmadas'}
          onClick={() => setFilter('confirmadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'confirmadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1019'
          tabIndex={0}
          onKeyDown={handleKeyDown('confirmadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'confirmadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Confirmadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'inaxistencia'}
          onClick={() => setFilter('inaxistencia')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'inaxistencia' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1021'
          tabIndex={0}
          onKeyDown={handleKeyDown('inaxistencia')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'inaxistencia' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Inaxistencia
          </p>
        </div>
      </div>

      {/* Timeline cards left (selectable) */}
      <div
        className='absolute w-[19.625rem] overflow-y-auto pr-4'
        style={{ left: 'calc(6.25% + 10.25px)', top: '12.75rem', bottom: 'var(--spacing-plnav)' }}
      >
        <div className='flex flex-col gap-[1rem] pb-8'>
          {(() => {
            const timelineNow = Date.now()
            return timelineEntries.map((entry, index) => {
              const isAppointment = entry.kind === 'appointment'
              const entryKey = isAppointment
                ? `appt-${entry.record.id}`
                : `hold-${entry.record.id}`
              const startDate = new Date(
                isAppointment ? entry.record.scheduled_start_time : entry.record.start_time
              )
              const isFuture = startDate.getTime() > timelineNow
              const canCancel =
                canManageAppointments &&
                (isAppointment
                  ? isFuture && entry.record.status !== 'cancelled'
                  : entry.record.status === 'held' && isFuture)
              const isCancelling = Boolean(cancellingEntries[entryKey])
              const dotClass = isAppointment
                ? 'bg-brand-500 border-brand-100'
                : 'bg-amber-400 border-amber-200'
              const lineClass = isAppointment ? 'bg-brand-100' : 'bg-amber-100'
              const cancelHandler = () =>
                isAppointment
                  ? handleCancelAppointment(entry.record)
                  : handleCancelHold(entry.record)

              if (isAppointment) {
                const appt = entry.record
                const service = getServiceLabel(appt)
                const ref = appt.public_ref ? ` · ${appt.public_ref}` : ''
                const title = `${service}${ref}`
                const dateStr = formatDateShort(startDate)
                const appointmentTime = formatTimeLabel(
                  appt.scheduled_start_time,
                  appt.scheduled_end_time ?? null
                )
                const statusLabel = humanize(appt.status)
                const isSelected = !activeHold && String(appt.id) === activeAppointmentId
                return (
                  <div key={entryKey} className='flex items-stretch gap-4'>
                    <div className='flex min-h-full w-6 flex-col items-center pt-3'>
                      <span className={`size-3 rounded-full border-2 ${dotClass}`} />
                      {index < timelineEntries.length - 1 && (
                        <span className={`mt-1 w-[2px] flex-1 rounded-full ${lineClass}`} />
                      )}
                    </div>
                    <div className='flex-1 flex flex-col gap-2'>
                      <SelectorCard
                        title={title}
                        selected={isSelected}
                        className='w-full'
                        onClick={() => {
                          setSelectedCardId(String(appt.id))
                          setActiveHold(null)
                          setActiveAppointmentId(String(appt.id))
                          setCardTitle(title)
                          setCardDate(dateStr)
                          setSoapSubjective('—')
                          setSoapObjective('—')
                          setSoapAssessment('—')
                          setSoapPlan('—')
                        }}
                        lines={[
                          {
                            icon: <CalendarMonthRounded className='size-6 text-neutral-700' />,
                            text: `${dateStr} · ${appointmentTime}`
                          },
                          {
                            icon: <PlaceRounded className='size-6 text-neutral-700' />,
                            text: `Estado: ${statusLabel}`
                          }
                        ]}
                      />
                      {canCancel ? (
                        <button
                          type='button'
                          onClick={cancelHandler}
                          disabled={isCancelling}
                          className='self-start rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          {isCancelling ? 'Cancelando…' : 'Cancelar'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              }

              const hold = entry.record
              const title = `${hold.service_catalog?.name || hold.summary_text || 'Reserva pendiente'}${
                hold.public_ref ? ` · ${hold.public_ref}` : ''
              }`
              const dateStr = formatDateShort(startDate)
              const isSelected = activeHold?.id === hold.id
              return (
                <div key={entryKey} className='flex items-stretch gap-4'>
                  <div className='flex min-h-full w-6 flex-col items-center pt-3'>
                    <span className={`size-3 rounded-full border-2 ${dotClass}`} />
                    {index < timelineEntries.length - 1 && (
                      <span className={`mt-1 w-[2px] flex-1 rounded-full ${lineClass}`} />
                    )}
                  </div>
                  <div className='flex-1 flex flex-col gap-2'>
                    <SelectorCard
                      title={title}
                      selected={isSelected}
                      variant='hold'
                      className='w-full'
                      onClick={() => {
                        setSelectedCardId(`hold-${hold.id}`)
                        setActiveAppointmentId(null)
                        setActiveHold(hold)
                        setActiveNoteId(null)
                        setAttachments([])
                        setStaffList([])
                        const serviceLabel =
                          hold.service_catalog?.name || hold.summary_text || 'Reserva pendiente'
                        const ref = hold.public_ref ? ` · ${hold.public_ref}` : ''
                        setCardTitle(`${serviceLabel}${ref}`)
                        setCardDate(dateStr)
                        setSoapSubjective(hold.summary_text || hold.summary_json?.subjective || '—')
                        setSoapObjective('—')
                        setSoapAssessment('—')
                        setSoapPlan('—')
                      }}
                      lines={[
                        {
                          icon: <CalendarMonthRounded className='size-6 text-neutral-700' />,
                          text: `${dateStr} · ${formatTimeRange(hold.start_time, hold.end_time)}`
                        },
                        {
                          icon: <PlaceRounded className='size-6 text-neutral-700' />,
                          text: hold.status === 'held' ? 'Reserva pendiente' : `Reserva ${hold.status}`
                        }
                      ]}
                    />
                    {canCancel ? (
                      <button
                        type='button'
                        onClick={cancelHandler}
                        disabled={isCancelling}
                        className='self-start rounded-full border border-dashed border-amber-300 px-3 py-1 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {isCancelling ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Header */}
      <div
        className='absolute bg-neutral-50 content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start left-[var(--spacing-plnav)] top-[2.5rem] w-[35.5rem]'
        data-name='Header'
      >
        <div className='content-stretch flex gap-[var(--spacing-gapsm)] items-center relative shrink-0'>
          <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-900 text-title-lg text-nowrap whitespace-pre">
            Historial clínico
          </p>
        </div>
        <p className="font-['Inter:Regular',_sans-serif] min-w-full relative shrink-0 text-neutral-900 text-body-sm w-[min-content]">
          Filtra el historial clínico, consulta los detalles y sube imágenes y
          documentos.
        </p>
      </div>

      {/* Right details card */}
      <div
        className='absolute bg-white border border-neutral-200 border-solid rounded-[calc(var(--radius-xl)/2)]'
        style={{
          left: 'calc(31.25% + 4.078rem)',
          right: 'var(--spacing-plnav)',
          top: '10.25rem',
          bottom: 'var(--spacing-plnav)'
        }}
      >
        <div className='h-full overflow-y-auto rounded-[inherit]'>
          <div className='flex min-h-full flex-col gap-8 px-[var(--spacing-plnav)] pr-[var(--spacing-plnav)] pb-[var(--spacing-plnav)] pt-[2.5rem] text-neutral-900'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='flex flex-col gap-1'>
                <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-title-lg">
                  {cardTitle}
                </p>
                <span className='text-label-sm text-neutral-500'>{cardDate}</span>
              </div>
              {!activeHold && (
                <button
                  type='button'
                  aria-label='Editar'
                  onClick={() => setIsEditOpen(true)}
                  className='grid size-8 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-100'
                >
                  <EditRounded className='size-5 text-neutral-700' />
                </button>
              )}
            </div>
            {activeHold ? renderHoldDetails() : renderAppointmentDetails()}
          </div>
        </div>
      </div>
      {isEditOpen && (
        <div className='fixed inset-0 z-[120] bg-black/50 grid place-items-center'>
          <div className='bg-white rounded-xl border border-neutral-300 w-[min(92vw,520px)] p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-title-sm text-neutral-900'>Editar cita</p>
              <button className='text-neutral-700' onClick={() => setIsEditOpen(false)}>
                ×
              </button>
                </div>
            <div className='mt-4 grid gap-3'>
              <label className='grid gap-1'>
                <span className='text-label-sm text-neutral-700'>Servicio</span>
                <select
                  value={editServiceId != null ? String(editServiceId) : ''}
                  onChange={(e) =>
                    setEditServiceId(e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={appointmentFieldsDisabled}
                  className='border border-neutral-300 rounded px-2 py-1 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed'
                >
                  <option value=''>Sin especificar</option>
                  {serviceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className='grid gap-1'>
                <span className='text-label-sm text-neutral-700'>Estado</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={appointmentFieldsDisabled}
                  className='border border-neutral-300 rounded px-2 py-1 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed'
                >
                  <option value='scheduled'>scheduled</option>
                  <option value='confirmed'>confirmed</option>
                  <option value='completed'>completed</option>
                  <option value='canceled'>canceled</option>
                  <option value='no_show'>no_show</option>
                </select>
              </label>
              <label className='grid gap-1'>
                <span className='text-label-sm text-neutral-700'>Fecha y hora</span>
                <input
                  type='datetime-local'
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={appointmentFieldsDisabled}
                  className='border border-neutral-300 rounded px-2 py-1 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed'
                />
              </label>
              <div className='grid grid-cols-2 gap-3'>
                <label className='grid gap-1'>
                  <span className='text-label-sm text-neutral-700'>Subjetivo</span>
                  <textarea className='border border-neutral-300 rounded px-2 py-1' rows={3} value={editS} onChange={(e)=>setEditS(e.target.value)} />
                </label>
                <label className='grid gap-1'>
                  <span className='text-label-sm text-neutral-700'>Objetivo</span>
                  <textarea className='border border-neutral-300 rounded px-2 py-1' rows={3} value={editO} onChange={(e)=>setEditO(e.target.value)} />
                </label>
                <label className='grid gap-1'>
                  <span className='text-label-sm text-neutral-700'>Evaluación</span>
                  <textarea className='border border-neutral-300 rounded px-2 py-1' rows={3} value={editA} onChange={(e)=>setEditA(e.target.value)} />
                </label>
                <label className='grid gap-1'>
                  <span className='text-label-sm text-neutral-700'>Plan</span>
                  <textarea className='border border-neutral-300 rounded px-2 py-1' rows={3} value={editP} onChange={(e)=>setEditP(e.target.value)} />
                </label>
              </div>
              <div className='flex justify-end gap-2 mt-2'>
                <button
                  type='button'
                  className='px-3 py-2 rounded border border-neutral-300'
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  className='px-3 py-2 rounded bg-[var(--color-brand-500)] text-[var(--color-brand-900)]'
                  onClick={async () => {
                    if (!activeAppointmentId) return
                    if (canManageAppointments) {
                      const local = new Date(editDate)
                      if (Number.isNaN(local.getTime())) {
                        console.warn('Invalid date selected for appointment update')
                        return
                      }
                      const utc = new Date(local.getTime() + local.getTimezoneOffset() * 60000)
                      const { error: updateError } = await supabase
                        .from('appointments')
                        .update({
                          status: editStatus,
                          service_id: editServiceId,
                          scheduled_start_time: utc.toISOString(),
                          scheduled_end_time: new Date(utc.getTime() + 60 * 60 * 1000).toISOString()
                        })
                        .eq('id', activeAppointmentId)
                      if (updateError) {
                        console.error('Error updating appointment', updateError)
                        alert('No se pudo guardar la cita. Intenta nuevamente.')
                        return
                      }
                    }
                    const { data: userData, error: userError } = await supabase.auth.getUser()
                    if (userError) {
                      console.error('Error obteniendo usuario', userError)
                    }
                    const staffId = userData?.user?.id
                    if (staffId) {
                      const appointmentIdFilter = Number.isNaN(Number(activeAppointmentId))
                        ? activeAppointmentId
                        : Number(activeAppointmentId)
                      const { data: apptRow, error: apptError } = await supabase
                        .from('appointments')
                        .select('patient_id')
                        .eq('id', appointmentIdFilter as any)
                        .maybeSingle()
                      if (apptError) {
                        console.error('Error obtaining patient for appointment', apptError)
                      } else if (apptRow?.patient_id) {
                        const apptIdNumber = Number(activeAppointmentId)
                        const targetAppointmentId = Number.isNaN(apptIdNumber)
                          ? activeAppointmentId
                          : apptIdNumber
                        const payload = {
                          appointment_id: targetAppointmentId,
                          patient_id: apptRow.patient_id,
                          staff_id: staffId,
                          note_type: 'SOAP' as const,
                          content: `S: ${editS}\nO: ${editO}\nA: ${editA}\nP: ${editP}`,
                          content_json: { s: editS, o: editO, a: editA, p: editP }
                        }
                        const canUpdateExistingNote =
                          Boolean(activeNoteId) && activeNoteAuthorId === staffId
                        if (canUpdateExistingNote) {
                          const noteIdFilter = Number.isNaN(Number(activeNoteId))
                            ? activeNoteId
                            : Number(activeNoteId)
                          const { error: noteUpdateError } = await supabase
                            .from('appointment_notes')
                            .update(payload)
                            .eq('id', noteIdFilter as any)
                            .eq('appointment_id', targetAppointmentId)
                          if (noteUpdateError) {
                            console.error('Error updating appointment note', noteUpdateError)
                            alert('No se pudo actualizar la nota clínica. Revisa los permisos/RLS.')
                          }
                        } else {
                          const { data: insertedNote, error: noteInsertError } = await supabase
                            .from('appointment_notes')
                            .insert(payload)
                            .select('id')
                            .maybeSingle()
                          if (noteInsertError) {
                            console.error('Error saving appointment note', noteInsertError)
                            alert('No se pudo guardar la nota clínica. Revisa los permisos/RLS.')
                          } else if (insertedNote?.id) {
                            setActiveNoteId(String(insertedNote.id))
                            setActiveNoteAuthorId(staffId)
                          }
                        }
                        await loadAppointmentNote()
                      }
                    }
                    setIsEditOpen(false)
                    const { data: ap } = await supabase
                      .from('appointments')
        .select(
          'id, clinic_id, box_id, status, scheduled_start_time, scheduled_end_time, service_id, service_type, source, source_hold_id, public_ref, notes, service_catalog:service_id(name, category)'
        )
                      .eq('patient_id', patientId)
                      .order('scheduled_start_time', { ascending: false })
                      .limit(10)
                    if (Array.isArray(ap)) setAppointments(mapAppointmentRows(ap as any[]))
                    pickByFilter(filter)
                  }}
                >
                  Guardar
                </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}


