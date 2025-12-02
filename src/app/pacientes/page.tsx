'use client'

import ClientLayout from '@/app/client-layout'
import AddPatientModal from '@/components/pacientes/modals/add-patient/AddPatientModal'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import DeleteRounded from '@mui/icons-material/DeleteRounded'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { useRouter } from 'next/navigation'
import React from 'react'

function KpiCard({
  title,
  value,
  badge
}: {
  title: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className='bg-white rounded-[8px] p-[min(1rem,1.5vw)] h-[min(8rem,12vw)] flex flex-col justify-between shadow-[1px_1px_2px_0_rgba(0,0,0,0.05)] border border-[var(--color-neutral-200)]'>
      <p className='text-title-sm font-medium text-[var(--color-neutral-600)]'>
        {title}
      </p>
      <div className='flex items-baseline justify-between'>
        <p className='text-kpi text-[var(--color-neutral-900)]'>{value}</p>
        {badge}
      </div>
    </div>
  )
}

function Chip({
  children,
  color = 'teal',
  rounded = 'lg',
  size = 'sm'
}: {
  children: React.ReactNode
  color?: 'teal' | 'sky' | 'green' | 'gray'
  rounded?: 'lg' | 'full'
  size?: 'xs' | 'sm' | 'md'
}) {
  const styles = {
    teal: 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-[var(--color-success-200)] text-[var(--color-success-800)]',
    gray: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]'
  }[color]
  const radius = rounded === 'full' ? 'rounded-[80px]' : 'rounded-[4px]'
  const sizeClass =
    size === 'xs'
      ? 'text-label-sm font-normal'
      : size === 'md'
      ? 'text-body-md'
      : 'text-body-sm'

  return (
    <span className={['px-2 py-0.5', sizeClass, styles, radius].join(' ')}>
      {children}
    </span>
  )
}

function StatusPill({ type }: { type: 'Activo' | 'Hecho' }) {
  if (type === 'Activo') {
    return (
      <span className='inline-flex items-center'>
        <Chip color='sky' size='md'>
          Activo
        </Chip>
      </span>
    )
  }
  return (
    <span className='inline-flex items-center'>
      <Chip color='green' rounded='full' size='md'>
        Hecho
      </Chip>
    </span>
  )
}

function TableHeaderCell({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={[
        'text-body-md font-normal text-[var(--color-neutral-600)] text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function Row() {
  const router = useRouter()
  return (
    <tr
      className='cursor-pointer hover:bg-[var(--color-neutral-50)]'
      onClick={() => router.push('/pacientes/ficha')}
    >
      <td className='py-1 pr-2 w-[240px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          Laura Rivas
        </p>
      </td>
      <td className='py-1 pr-2 w-[191px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
      <td className='py-1 pr-2 w-[154px]'>
        <StatusPill type='Activo' />
      </td>
      <td className='py-1 pr-2 w-[196px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          888 888 888
        </p>
      </td>
      <td className='py-1 pr-2 w-[151px]'>
        <StatusPill type='Hecho' />
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>No</p>
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>380€</p>
      </td>
      <td className='py-1 pr-2 w-[204px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
    </tr>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Hecho'
  phone: string
  checkin: 'Hecho' | 'Pendiente'
  financing: 'Sí' | 'No'
  debt: string
  lastContact: string
  tags?: Array<'deuda' | 'activo' | 'recall'>
}

export default function PacientesPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'activos' | 'recall'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<PatientRow[]>([])
  const [selectedClinicId, setSelectedClinicId] = React.useState<string | null>(
    null
  )
  const [kpi, setKpi] = React.useState<{
    today: number
    week: number
    received: number
    confirmed: number
  }>({ today: 0, week: 0, received: 0, confirmed: 0 })
  const [activePatientId, setActivePatientId] = React.useState<string | null>(
    null
  )
  const router = useRouter()

  React.useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.replace('/login')
        return
      }
      // Ensure staff record exists for this user
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (user) {
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          ([user.user_metadata?.first_name, user.user_metadata?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || user.email?.split('@')[0] || 'Usuario')
        await supabase
          .from('staff')
          .upsert(
            { id: user.id, full_name: fullName },
            { onConflict: 'id' }
          )
      }
      // Determine clinic context
      let clinicId: string | null = null
      try {
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        clinicId = Array.isArray(clinics) && clinics.length > 0 ? clinics[0] : null
      } catch {
        clinicId = null
      }
      setSelectedClinicId(clinicId)

      // Fetch patients with primary contact info
      type DbPatient = {
        id: string
        first_name: string
        last_name: string
        phone_number: string | null
        email: string | null
        national_id?: string | null
        primary_contact_id?: string | null
        contacts?: { phone_primary: string | null; email: string | null } | null
      }
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id, first_name, last_name, phone_number, email, national_id, primary_contact_id,
          contacts!primary_contact_id (phone_primary, email)
        `)
        .eq('clinic_id', clinicId)
        .limit(50)
      if (error) {
        // Keep rows empty on error
        // Optionally surface a toast in future
        setRows([])
      } else {
        const patients = (data as unknown as DbPatient[]) ?? []
        const patientIds = patients.map((p) => p.id)

        // Fetch aggregates
        // Next appointment per patient (>= now)
        const nowIso = new Date().toISOString()
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, patient_id, scheduled_start_time, status, actual_check_in_time')
          .in('patient_id', patientIds)
          .gte('scheduled_start_time', nowIso)
          .order('scheduled_start_time', { ascending: true })

        const nextByPatient = new Map<string, string>()
        const checkinByPatient = new Map<string, 'Hecho' | 'Pendiente'>()
        const statusByPatient = new Map<string, 'Activo' | 'Hecho'>()
        if (Array.isArray(appts)) {
          for (const a of appts) {
            if (!nextByPatient.has(a.patient_id)) {
              nextByPatient.set(
                a.patient_id,
                new Date(a.scheduled_start_time).toLocaleDateString(DEFAULT_LOCALE, {
                  timeZone: DEFAULT_TIMEZONE
                })
              )
            }
            // mark check-in if any appointment has check-in time
            if (a.actual_check_in_time) {
              checkinByPatient.set(a.patient_id, 'Hecho')
            }
            if (a.status === 'confirmed') {
              statusByPatient.set(a.patient_id, 'Activo')
            }
          }
        }

        // Debt per patient (invoices open/overdue)
        const { data: invs } = await supabase
          .from('invoices')
          .select('patient_id, status, total_amount, amount_paid')
          .in('patient_id', patientIds)
          .in('status', ['open', 'overdue'])

        const debtByPatient = new Map<string, number>()
        if (Array.isArray(invs)) {
          for (const inv of invs) {
            const prev = debtByPatient.get(inv.patient_id) ?? 0
            const remaining =
              Number(inv.total_amount ?? 0) - Number(inv.amount_paid ?? 0)
            debtByPatient.set(inv.patient_id, prev + remaining)
          }
        }

        // Last contact per patient (communications)
        const { data: comms } = await supabase
          .from('communications')
          .select('patient_id, sent_at')
          .in('patient_id', patientIds)

        const lastContactByPatient = new Map<string, string>()
        if (Array.isArray(comms)) {
          for (const c of comms) {
            const d = new Date(c.sent_at)
            const prev = lastContactByPatient.get(c.patient_id)
            if (!prev || d > new Date(prev)) {
              lastContactByPatient.set(
                c.patient_id,
                d.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE })
              )
            }
          }
        }

        // Map rows - prefer contact phone over patient phone (new schema)
        const mapped: PatientRow[] = patients.map((p, i) => ({
          id: p.id,
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
          phone: (p.contacts as any)?.phone_primary ?? p.phone_number ?? '—',
          nextDate: nextByPatient.get(p.id) ?? '—',
          status: statusByPatient.get(p.id) ?? 'Activo',
          checkin: checkinByPatient.get(p.id) ?? 'Pendiente',
          financing: 'No',
          debt:
            debtByPatient.get(p.id) !== undefined
              ? `${debtByPatient.get(p.id)!.toFixed(2)}€`
              : '—',
          lastContact: lastContactByPatient.get(p.id) ?? '—',
          tags: i % 2 === 0 ? ['activo'] : undefined
        }))
        setRows(mapped)

        // KPIs
        if (clinicId) {
          const startOfDay = new Date()
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date()
          endOfDay.setHours(23, 59, 59, 999)
          const startOfWeek = new Date()
          const day = startOfWeek.getDay() || 7
          startOfWeek.setHours(0, 0, 0, 0)
          startOfWeek.setDate(startOfWeek.getDate() - (day - 1))
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)

          const { data: apptsClinic } = await supabase
            .from('appointments')
            .select('status, actual_check_in_time, scheduled_start_time')
            .eq('clinic_id', clinicId)
            .gte('scheduled_start_time', startOfWeek.toISOString())
            .lte('scheduled_start_time', endOfWeek.toISOString())

          const todayCount =
            apptsClinic?.filter((a) => {
              const t = new Date(a.scheduled_start_time).getTime()
              return (
                t >= startOfDay.getTime() && t <= endOfDay.getTime()
              )
            }).length ?? 0
          const weekCount = apptsClinic?.length ?? 0
          const receivedCount =
            apptsClinic?.filter((a) => Boolean(a.actual_check_in_time))
              .length ?? 0
          const confirmedCount =
            apptsClinic?.filter((a) => a.status === 'confirmed').length ?? 0
          setKpi({
            today: todayCount,
            week: weekCount,
            received: receivedCount,
            confirmed: confirmedCount
          })
        }
      }
      setIsLoading(false)
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isPatientSelected = (patientId: string) =>
    selectedPatientIds.includes(patientId)

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds((prevSelected) =>
      prevSelected.includes(patientId)
        ? prevSelected.filter((id) => id !== patientId)
        : [...prevSelected, patientId]
    )
  }

  const isFilterActive = (key: FilterKey) => selectedFilters.includes(key)
  const toggleFilter = (key: FilterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearFilters = () => setSelectedFilters([])

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-auto'>
      <AddPatientModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <PatientRecordModal
        open={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
        patientId={activePatientId ?? undefined}
      />

      {/* Header Section - Fixed size */}
      <div className='flex-shrink-0'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
              Pacientes
            </h1>
            <Chip color='teal' rounded='full' size='xs'>
              Recepción
            </Chip>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-[var(--color-neutral-900)] bg-[#F8FAFB] border border-[#CBD3D9] hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'
            >
              <AddRounded className='size-5' />
              <span className='font-medium'>Añadir paciente</span>
            </button>
            <button
              className='size-6 grid place-items-center text-[var(--color-neutral-900)] cursor-pointer'
              aria-label='Más opciones'
            >
              <MoreVertRounded className='size-5' />
            </button>
          </div>
        </div>
        <p className='text-body-sm text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
          Busca y filtra pacientes; confirma asistencias, reprograma citas y
          envía pre-registro, firmas y recordatorios al instante.
        </p>
      </div>

      <div
        className='flex-shrink-0 grid gap-[min(1rem,1.5vw)] mt-8'
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(15.5rem, 100%), 1fr))'
        }}
      >
        <KpiCard
          title='Pacientes hoy'
          value={String(kpi.today)}
          badge={
            <span className='text-body-md text-[var(--color-success-600)]'>
              {/* placeholder trend */}
              —
            </span>
          }
        />
        <KpiCard
          title='Pacientes semana'
          value={String(kpi.week)}
          badge={
            <span className='text-body-md text-[var(--color-success-600)]'>
              —
            </span>
          }
        />
        <KpiCard
          title='Pacientes recibidos'
          value={`${kpi.received}/${kpi.week}`}
          badge={<span className='text-body-md text-[#d97706]'>25%</span>}
        />
        <KpiCard
          title='Citas confirmadas'
          value={`${kpi.confirmed}/${kpi.week}`}
          badge={
            <span className='text-body-md text-[var(--color-success-600)]'>
              —
            </span>
          }
        />
      </div>

      {/* Table Section - Flexible container */}
      <div className='flex-1 flex flex-col mt-8 overflow-hidden'>
        <div className='flex-shrink-0 mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {selectedPatientIds.length > 0 && (
              <Chip color='teal'>{selectedPatientIds.length} selected</Chip>
            )}
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
              Estado
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
              Check-in
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
              <DeleteRounded className='size-5' />
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
              <MoreHorizRounded className='size-5' />
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
              <SearchRounded className='text-[var(--color-neutral-900)]' />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Buscar por nombre, email, teléfono,...'
                className='bg-transparent outline-none text-body-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)]'
              />
            </div>
            <button
              onClick={clearFilters}
              className={[
                'flex items-center gap-2 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                selectedFilters.length === 0
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              <FilterListRounded className='size-4' />
              <span>Todos</span>
            </button>
            <button
              onClick={() => toggleFilter('deuda')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('deuda')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              En deuda
            </button>
            <button
              onClick={() => toggleFilter('activos')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('activos')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Activos
            </button>
            <button
              onClick={() => toggleFilter('recall')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active-border-[#1E4947]',
                isFilterActive('recall')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Recall
            </button>
          </div>
        </div>

        <div className='flex-1 rounded-[8px] overflow-auto'>
          <table className='w-full table-fixed'>
            <thead>
              <tr>
                <TableHeaderCell className='py-1 pr-2 w-[40px]'>
                  <span className='sr-only'>Seleccionar fila</span>
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <AccountCircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                    <span>Paciente</span>
                  </div>
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Próxima cita
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[120px]'>
                  Estado
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Teléfono
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Check-in
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Financiación
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Deuda
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Último contacto
                </TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : rows).filter((p) => {
                const q = query.trim().toLowerCase()
                const matchesQuery = q
                  ? p.name.toLowerCase().includes(q) ||
                    p.phone.toLowerCase().includes(q)
                  : true
                const matchesFilter = (() => {
                  if (selectedFilters.length === 0) return true
                  const tagMap: Record<
                    FilterKey,
                    'deuda' | 'activo' | 'recall'
                  > = {
                    deuda: 'deuda',
                    activos: 'activo',
                    recall: 'recall'
                  }
                  return selectedFilters.some((k) =>
                    p.tags?.includes(tagMap[k])
                  )
                })()
                return Boolean(matchesQuery && matchesFilter)
              }).map((row, i) => (
                <tr
                  key={row.id}
                  className='group hover:bg-[var(--color-neutral-50)] cursor-pointer'
                  onClick={() => {
                    setActivePatientId(row.id)
                    setIsFichaModalOpen(true)
                  }}
                >
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[40px]'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePatientSelection(row.id)
                      }}
                      aria-pressed={isPatientSelected(row.id)}
                      className='relative size-6 inline-flex items-center justify-center cursor-pointer'
                    >
                      {/* Outline box on hover */}
                      <span className='absolute inset-0 rounded-[4px] border border-[var(--color-neutral-300)] bg-white opacity-0 group-hover:opacity-100 transition-opacity' />
                      {/* Selected border */}
                      <span
                        className={[
                          'absolute inset-0 rounded-[4px] border-2 transition-opacity',
                          isPatientSelected(row.id)
                            ? 'border-[#1E4947] opacity-100'
                            : 'opacity-0'
                        ].join(' ')}
                      />
                      {/* Check icon when selected */}
                      <CheckRounded
                        aria-hidden='true'
                        className={[
                          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                          'size-4 text-[#1E4947] transition-opacity',
                          isPatientSelected(row.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        ].join(' ')}
                      />
                      <span className='sr-only'>Seleccionar fila</span>
                    </button>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[200px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
                      {row.name}
                    </p>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[140px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)]'>
                      {row.nextDate}
                    </p>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[120px]'>
                    <StatusPill type={row.status} />
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[140px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
                      {row.phone}
                    </p>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[100px]'>
                    <span className='inline-flex items-center'>
                      <Chip color='green' rounded='full'>
                        {row.checkin}
                      </Chip>
                    </span>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[100px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)]'>
                      {row.financing}
                    </p>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[100px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)]'>
                      {row.debt}
                    </p>
                  </td>
                  <td className='py-[calc(var(--spacing-gapsm)/2)] pr-2 w-[140px]'>
                    <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
                      {row.lastContact}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            <FirstPageRounded className='size-5' />
          </button>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            <ChevronLeftRounded className='size-5' />
          </button>
          <span className='font-bold underline'>1</span>
          <span>2</span>
          <span>…</span>
          <span>12</span>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            <ChevronRightRounded className='size-5' />
          </button>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            <LastPageRounded className='size-5' />
          </button>
        </div>
      </div>
      </div>
    </ClientLayout>
  )
}


