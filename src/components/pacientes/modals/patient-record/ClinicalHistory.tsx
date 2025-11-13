'use client'
import SelectorCard from '@/components/pacientes/SelectorCard'
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

export default function ClinicalHistory({ onClose, patientId }: ClinicalHistoryProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [notes, setNotes] = React.useState<
    { id: string; created_at: string; note_type: string; content: string }[]
  >([])
  const [cardTitle, setCardTitle] = React.useState('—')
  const [cardDate, setCardDate] = React.useState('—')
  const [activeAppointmentId, setActiveAppointmentId] = React.useState<string | null>(null)
  const [appointments, setAppointments] = React.useState<
    { id: string; status: string; scheduled_start_time: string; service_type?: string | null; public_ref?: string | null; service_catalog?: { name?: string | null } | null }[]
  >([])
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
  const [staffList, setStaffList] = React.useState<
    Array<{ id: string; name: string; role?: string | null }>
  >([])
  const [attachments, setAttachments] = React.useState<
    Array<{ id: string; name: string; path?: string; date: string; url?: string }>
  >([])
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!patientId) return
      // Load appointments for left list (with service name + ref)
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, status, scheduled_start_time, service_type, public_ref, service_catalog(name)')
        .eq('patient_id', patientId)
        .order('scheduled_start_time', { ascending: false })
        .limit(10)
      const hasAppointments = Array.isArray(appts) && appts.length > 0
      if (hasAppointments) {
        setAppointments(appts as any)
        const a0 = appts[0] as any
        const d = new Date(a0.scheduled_start_time)
        const service = a0.service_catalog?.name || a0.service_type || 'Consulta'
        const ref = a0.public_ref ? ` · ${a0.public_ref}` : ''
        setCardTitle(`${service}${ref}`)
        setCardDate(
          `${String(d.getDate()).padStart(2, '0')}/${String(
            d.getMonth() + 1
          ).padStart(2, '0')}/${d.getFullYear()}`
        )
        setActiveAppointmentId(String(a0.id))
        setEditStatus(a0.status)
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
          setCardDate(
            `${String(d.getDate()).padStart(2, '0')}/${String(
              d.getMonth() + 1
            ).padStart(2, '0')}/${d.getFullYear()}`
          )
          setSoapSubjective('—')
          setSoapObjective('—')
          setSoapAssessment('—')
          setSoapPlan('—')
        }
      }
    }
    void load()
  }, [patientId, supabase])

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
        return
      }
      const numericId =
        typeof appointmentId === 'number' ? appointmentId : Number(appointmentId)
      const filterValue = Number.isNaN(numericId) ? appointmentId : numericId
      const { data, error } = await supabase
        .from('appointment_notes')
        .select('id, content, content_json, note_type, created_at')
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
        return
      }
      if (Array.isArray(data) && data[0]) {
        setActiveNoteId(String(data[0].id))
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
  function pickByFilter(f: Filter) {
    const now = new Date().getTime()
    const pick =
      f === 'proximas'
        ? appointments.find((a) => new Date(a.scheduled_start_time).getTime() > now)
        : f === 'pasadas'
        ? appointments.find((a) => new Date(a.scheduled_start_time).getTime() <= now)
        : f === 'confirmadas'
        ? appointments.find((a) => a.status === 'confirmed')
        : f === 'inaxistencia'
        ? appointments.find(
            (a) =>
              a.status === 'no_show' &&
              new Date(a.scheduled_start_time).getTime() <= now
          )
        : undefined
    if (pick) {
      const d = new Date(pick.scheduled_start_time)
      setActiveAppointmentId(String(pick.id))
      const service = pick.service_catalog?.name || pick.service_type || 'Consulta'
      const ref = pick.public_ref ? ` · ${pick.public_ref}` : ''
      setCardTitle(`${service}${ref}`)
      setCardDate(
        `${String(d.getDate()).padStart(2, '0')}/${String(
          d.getMonth() + 1
        ).padStart(2, '0')}/${d.getFullYear()}`
      )
      setEditStatus(pick.status)
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setEditDate(iso)
      void fetchAndSetAppointmentNote(pick.id)
    }
  }
  React.useEffect(() => {
    pickByFilter(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, JSON.stringify(appointments)])
  // Load staff linked to appointment + attachments list
  React.useEffect(() => {
    async function loadStaffAndAttachments() {
      if (!activeAppointmentId) return
      const numericActiveId = Number(activeAppointmentId)
      const appointmentFilter = Number.isNaN(numericActiveId)
        ? activeAppointmentId
        : numericActiveId
      const { data: staffLinks } = await supabase
        .from('appointment_staff')
        .select('staff_id, role_in_appointment')
        .eq('appointment_id', appointmentFilter as any)
      const staffIds = (staffLinks || [])
        .map((link: any) => link.staff_id)
        .filter(Boolean)
      let staff: Array<{ id: string; name: string; role?: string | null }> = []
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
            role: link.role_in_appointment ?? null
          }))
        } catch (rpcError) {
          console.error('Error loading staff names', rpcError)
          staff = (staffLinks || []).map((link: any) => ({
            id: link.staff_id,
            name: link.staff_id,
            role: link.role_in_appointment ?? null
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
              date: new Date(r.created_at).toLocaleDateString(),
              url
            }
          })
        )
      setAttachments(mapped)
    }
    void loadStaffAndAttachments()
  }, [activeAppointmentId, supabase])
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
      <div className='absolute top-[inherit] w-[19.625rem]' style={{ left: 'calc(6.25% + 10.25px)', top: '12.75rem' }}>
        <div className='flex flex-col gap-[1rem]'>
          {(() => {
            const now = new Date().getTime()
            const list =
              filter === 'proximas'
                ? appointments.filter((a) => new Date(a.scheduled_start_time).getTime() > now)
                : filter === 'pasadas'
                ? appointments.filter((a) => new Date(a.scheduled_start_time).getTime() <= now)
                : filter === 'confirmadas'
                ? appointments.filter((a) => a.status === 'confirmed')
                : filter === 'inaxistencia'
                ? appointments.filter(
                    (a) =>
                      a.status === 'no_show' &&
                      new Date(a.scheduled_start_time).getTime() <= now
                  )
                : appointments
            return list
          })().map((a) => {
            const d = new Date(a.scheduled_start_time)
            const service = a.service_catalog?.name || a.service_type || 'Consulta'
            const ref = a.public_ref ? ` · ${a.public_ref}` : ''
            const title = `${service}${ref}`
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(
              d.getMonth() + 1
            ).padStart(2, '0')}/${d.getFullYear()}`
            const isSelected = String(a.id) === activeAppointmentId
            return (
          <SelectorCard
                key={a.id}
                title={title}
                selected={isSelected}
                onClick={() => {
                  setSelectedCardId(String(a.id))
                  setActiveAppointmentId(String(a.id))
                  setCardTitle(title)
                  setCardDate(dateStr)
                  void fetchAndSetAppointmentNote(a.id)
                }}
            lines={[
              {
                    icon: <CalendarMonthRounded className='size-6 text-neutral-700' />,
                    text: dateStr
              },
              {
                icon: <PlaceRounded className='size-6 text-neutral-700' />,
                    text: 'KlinikOS'
              }
            ]}
          />
            )
          })}
        </div>
      </div>
      {/* MD3 Variant A: Vertical dividers with badge */}
      <div
        className='absolute h-[6.375rem] w-6 left-[2.8125rem] top-[12.75rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-6 bottom-0 w-[0.125rem] bg-brand-500' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-0 -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
        </div>
      </div>
      <div
        className='absolute h-[13.3125rem] w-6 left-[2.8125rem] top-[19.125rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-0 w-[0.125rem] bg-brand-500 h-[2.6875rem]' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-[2.6875rem] -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
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

      {/* Right details card - pin to right instead of fixed width */}
      <div
        className='absolute bg-white border border-neutral-200 border-solid rounded-[calc(var(--radius-xl)/2)]'
        style={{
          left: 'calc(31.25% + 4.078rem)',
          right: 'var(--spacing-plnav)',
          top: '10.25rem',
          bottom: 'var(--spacing-plnav)'
        }}
      >
        <div
          className='relative rounded-[inherit] overflow-y-auto px-0 py-fluid-md'
          style={{ height: '100%' }}
        >
          <p className="absolute font-['Inter:Medium',_sans-serif] left-plnav not-italic text-neutral-900 text-title-lg text-nowrap top-[1.5rem] whitespace-pre">
            {cardTitle}
          </p>
          <div
            className='absolute size-6'
            style={{ left: '42.3125rem', top: 'var(--spacing-gapmd)' }}
          >
            <button
              type='button'
              aria-label='Editar'
              onClick={() => setIsEditOpen(true)}
              className='grid place-items-center'
          >
            <EditRounded className='size-6 text-neutral-900' />
            </button>
          </div>

          {/* Attachments */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapmd)] items-start left-plnav top-[36.75rem] w-[42.3125rem]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-neutral-900 text-body-md text-nowrap whitespace-pre">
                Archivos adjuntos
              </p>
              <div
                className='content-stretch flex gap-[0.25rem] items-center relative shrink-0 cursor-pointer'
                onClick={() => document.getElementById('history-upload-input')?.click()}
              >
                <div className='relative shrink-0 size-6'>
                  <AddRounded className='size-6 text-brand-400' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-brand-400 text-body-sm text-nowrap whitespace-pre">
                  Subir documento
                </p>
              </div>
            </div>
            <input id='history-upload-input' type='file' className='hidden' onChange={async (e) => {
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
                    date: new Date(r.created_at).toLocaleDateString(),
                    url: r.storage_path ? await getSignedUrl(r.storage_path) : undefined
                  }))
                )
                setAttachments(mapped)
              } finally {
                if (e.target) e.target.value = ''
              }
            }}/>
            {attachments.length === 0 ? (
              <p className='text-label-sm text-neutral-600'>—</p>
            ) : (
              attachments.map((att) => (
                <div key={att.id} className='border border-neutral-300 border-solid box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-between px-[0.75rem] py-[var(--spacing-gapsm)] relative rounded-[calc(var(--radius-xl)/2)] shrink-0'>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm text-nowrap whitespace-pre">
                    {att.name}
                  </p>
                  <button
                    type='button'
                    className='relative shrink-0 size-6 grid place-items-center'
                    onClick={() => att.url && window.open(att.url, '_blank', 'noopener,noreferrer')}
                    aria-label='Descargar'
                  >
                <DownloadRounded className='size-6 text-neutral-700' />
                  </button>
              </div>
              ))
            )}
          </div>

          {/* Odontograma */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start left-plnav top-[43.75rem] w-[42.3125rem]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-neutral-900 text-body-md text-nowrap whitespace-pre">
                Odontograma
              </p>
              <div
                className='content-stretch flex gap-[0.25rem] items-center relative shrink-0 cursor-pointer'
                onClick={() => document.getElementById('odontogram-upload-input')?.click()}
              >
                <div className='relative shrink-0 size-6'>
                  <AddRounded className='size-6 text-brand-400' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-brand-400 text-body-sm text-nowrap whitespace-pre">
                  Subir odontograma
                </p>
              </div>
            </div>
            <input id='odontogram-upload-input' type='file' accept='image/*' className='hidden' onChange={async (e) => {
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
              } finally {
                if (e.target) e.target.value = ''
              }
            }}/>
            <div className='border border-neutral-400 border-solid h-[10.875rem] relative rounded-[calc(var(--radius-xl)/2)] shrink-0 w-[14.1875rem]'>
              <div className='h-[10.875rem] overflow-clip relative rounded-[inherit] w-[14.1875rem]'>
                <div className='absolute inset-0 grid place-items-center pointer-events-none'>
                  <ImageRounded className='text-neutral-400 size-12' />
                </div>
              </div>
            </div>
          </div>

          {/* SOAP sections */}
          <div className='absolute content-stretch flex flex-col gap-[1.5rem] items-start left-plnav top-[5rem] w-[42.3125rem]'>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Subjetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Por qué viene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                {soapSubjective}
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Objetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Qué tiene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                {soapObjective}
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Evaluación
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Qué le hacemos?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                {soapAssessment}
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Plan
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  Tratamiento a seguir
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                {soapPlan}
              </p>
            </div>
          </div>

          {/* Attended by */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapmd)] items-start left-[var(--spacing-plnav)] top-[29.75rem] w-[21.0625rem]'>
            <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
              Atendido Por:
            </p>
            <div className='content-stretch flex gap-[2.0625rem] items-center relative shrink-0 w-full'>
              {staffList.length === 0 ? (
                <p className='text-label-sm text-neutral-600'>—</p>
              ) : (
                staffList.map((m) => {
                  const roleLabel = m.role
                    ? m.role
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (ch) => ch.toUpperCase())
                    : '—'
                  return (
                    <div key={m.id} className='content-stretch flex gap-[0.75rem] items-center relative shrink-0 w-[9.5rem]'>
                <div className='relative rounded-full shrink-0 size-9'>
                        <div aria-hidden='true' className='absolute inset-0 pointer-events-none rounded-full'>
                    <div className='absolute bg-white inset-0 rounded-full' />
                    <div className='absolute inset-0 overflow-hidden rounded-full'>
                      <div className='absolute inset-0 grid place-items-center'>
                        <AccountCircleRounded className='text-neutral-400 size-6' />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[0.25rem] items-start relative shrink-0 w-[6rem]">
                        <p className='relative shrink-0 text-[#24282c] text-body-sm w-full'>{m.name}</p>
                        <p className='relative shrink-0 text-[#cbd3d9] text-label-sm w-full'>{roleLabel}</p>
                      </div>
                    </div>
                  )
                })
              )}
                      </div>
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
                <span className='text-label-sm text-neutral-700'>Consulta</span>
                <input
                  type='text'
                  value={cardTitle}
                  readOnly
                  className='border border-neutral-300 rounded px-2 py-1 bg-neutral-50'
                />
              </label>
              <label className='grid gap-1'>
                <span className='text-label-sm text-neutral-700'>Estado</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className='border border-neutral-300 rounded px-2 py-1'
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
                  className='border border-neutral-300 rounded px-2 py-1'
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
                        scheduled_start_time: utc.toISOString(),
                        scheduled_end_time: new Date(utc.getTime() + 60 * 60 * 1000).toISOString()
                      })
                      .eq('id', activeAppointmentId)
                    if (updateError) {
                      console.error('Error updating appointment', updateError)
                      alert('No se pudo guardar la cita. Intenta nuevamente.')
                      return
                    }
                    const { data: userData, error: userError } = await supabase.auth.getUser()
                    if (userError) {
                      console.error('Error obteniendo usuario', userError)
                    }
                    const staffId = userData?.user?.id
                    if (staffId) {
                      const { data: apptRow, error: apptError } = await supabase
                        .from('appointments')
                        .select('patient_id')
                        .eq('id', activeAppointmentId)
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
                        if (activeNoteId) {
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
                          }
                        }
                        await loadAppointmentNote()
                      }
                    }
                    setIsEditOpen(false)
                    const { data: ap } = await supabase
                      .from('appointments')
                      .select('id, status, scheduled_start_time, service_type, public_ref, service_catalog(name)')
                      .eq('patient_id', patientId)
                      .order('scheduled_start_time', { ascending: false })
                      .limit(10)
                    if (Array.isArray(ap)) setAppointments(ap as any)
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


