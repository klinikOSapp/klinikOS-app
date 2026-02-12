'use client'

import ClientLayout from '@/app/client-layout'
import AddPatientModal from '@/components/pacientes/modals/add-patient/AddPatientModal'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { useClinic } from '@/context/ClinicContext'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export default function PacientesPage() {
  // Next.js 15 requires useSearchParams() to be under a Suspense boundary.
  return (
    <React.Suspense
      fallback={
        <ClientLayout>
          <div className='p-6 text-neutral-600'>Cargando…</div>
        </ClientLayout>
      }
    >
      <PacientesPageInner />
    </React.Suspense>
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

function StatusPill({ type }: { type: 'Activo' | 'Inactivo' }) {
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
      <Chip color='gray' rounded='full' size='md'>
        Inactivo
      </Chip>
    </span>
  )
}

function TableHeaderCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope='col'
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Inactivo'
  phone: string
  financing: 'Sí' | 'No'
  debt: string
  debtAmount: number
  tags: Array<'deuda' | 'activo' | 'financiacion'>
}

function PacientesPageInner() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'activos' | 'financiacion'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<PatientRow[]>([])
  const [activePatientId, setActivePatientId] = React.useState<string | null>(
    null
  )
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    async function init() {
      if (!isClinicInitialized) return

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
      const clinicId = activeClinicId
      if (!clinicId) {
        setRows([])
        setIsLoading(false)
        return
      }

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
          }
        }

        // Last visit within past year for Active/Inactive
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        const { data: pastAppts } = await supabase
          .from('appointments')
          .select('patient_id, scheduled_start_time')
          .in('patient_id', patientIds)
          .lt('scheduled_start_time', nowIso)
          .order('scheduled_start_time', { ascending: false })
        const lastVisitByPatient = new Map<string, Date>()
        if (Array.isArray(pastAppts)) {
          for (const appt of pastAppts) {
            if (!lastVisitByPatient.has(appt.patient_id)) {
              lastVisitByPatient.set(appt.patient_id, new Date(appt.scheduled_start_time))
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

        // Map rows - prefer contact phone over patient phone (new schema)
        const mapped: PatientRow[] = patients.map((p) => {
          const debt = debtByPatient.get(p.id)
          const hasDebt = typeof debt === 'number' && debt > 0
          const lastVisit = lastVisitByPatient.get(p.id)
          const isActive =
            lastVisit !== undefined ? lastVisit.getTime() >= oneYearAgo.getTime() : false
          const status: 'Activo' | 'Inactivo' = isActive ? 'Activo' : 'Inactivo'
          const tags: PatientRow['tags'] = ['deuda', 'activo', 'financiacion'].filter(
            (tag) => {
              if (tag === 'deuda') return hasDebt
              if (tag === 'activo') return status === 'Activo'
              return false
            }
          ) as PatientRow['tags']

          const debtAmount = hasDebt ? Number(debt!.toFixed(2)) : 0

          return {
            id: p.id,
            name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
            phone: (p.contacts as any)?.phone_primary ?? p.phone_number ?? '—',
            nextDate: nextByPatient.get(p.id) ?? '—',
            status,
            financing: 'No',
            debt: hasDebt ? `${debtAmount.toFixed(0)} €` : '0 €',
            debtAmount,
            tags
          }
        })
        setRows(mapped)
      }
      setIsLoading(false)
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClinicId, isClinicInitialized])

  // Allow deep-linking into Pacientes from other modules (e.g., Caja actions menu).
  React.useEffect(() => {
    const q = (searchParams.get('q') || '').trim()
    if (q) setQuery(q)
    const patientId = (searchParams.get('patientId') || '').trim()
    if (patientId) {
      setActivePatientId(patientId)
      setIsFichaModalOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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

      {/* Table Section - Flexible container */}
      <div className='flex-1 flex flex-col mt-8 overflow-hidden'>
        <div className='flex-shrink-0 mb-4 flex items-center justify-end'>
          <div className='flex items-center gap-2 flex-wrap'>
            <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
              <SearchRounded className='text-[var(--color-neutral-900)]' />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Buscar por nombre, email'
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
              onClick={() => toggleFilter('financiacion')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('financiacion')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Financiación
            </button>
          </div>
        </div>

        <div className='flex-1 rounded-[8px] overflow-auto border border-[var(--color-neutral-200)]'>
          <table className='w-full table-fixed border-collapse'>
            <thead>
              <tr>
                <TableHeaderCell className='w-[30%]'>
                  <div className='flex items-center gap-2'>
                    <AccountCircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                    <span>Paciente</span>
                  </div>
                </TableHeaderCell>
                <TableHeaderCell className='w-[14%]'>
                  <div className='flex items-center gap-2'>
                    <PhoneRounded className='size-4 text-[var(--color-neutral-700)]' />
                    <span>Teléfono</span>
                  </div>
                </TableHeaderCell>
                <TableHeaderCell className='w-[14%]'>Próxima cita</TableHeaderCell>
                <TableHeaderCell className='w-[11%]'>Estado</TableHeaderCell>
                <TableHeaderCell className='w-[11%]' align='right'>
                  Deuda
                </TableHeaderCell>
                <TableHeaderCell className='w-[4%] text-right'>
                  <span className='sr-only'>Acciones</span>
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
                  return selectedFilters.some((key) => {
                    if (key === 'deuda') return p.debtAmount > 0
                    if (key === 'activos') return p.status === 'Activo'
                    return p.financing === 'Sí'
                  })
                })()
                return Boolean(matchesQuery && matchesFilter)
              }).map((row, i) => (
                <tr
                  key={row.id}
                  className='group hover:bg-[var(--color-neutral-50)]'
                  onClick={() => {
                    setActivePatientId(row.id)
                    setIsFichaModalOpen(true)
                  }}
                >
                  <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                    <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
                      {row.name}
                    </p>
                  </td>
                  <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                    <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
                      {row.phone}
                    </p>
                  </td>
                  <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                    <p className='text-body-md text-[var(--color-neutral-900)]'>
                      {row.nextDate}
                    </p>
                  </td>
                  <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                    <StatusPill type={row.status} />
                  </td>
                  <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-right'>
                    <p className='text-body-md text-[var(--color-neutral-900)]'>
                      {row.debt}
                    </p>
                  </td>
                  <td className='border-hairline-b py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-right'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setActivePatientId(row.id)
                        setIsFichaModalOpen(true)
                      }}
                      className='inline-flex size-8 items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)]'
                      aria-label='Abrir acciones'
                    >
                      <MoreVertRounded className='size-5 text-[var(--color-neutral-700)]' />
                    </button>
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
