'use client'

import ClientLayout from '@/app/client-layout'
import AddPatientModal from '@/components/pacientes/modals/add-patient/AddPatientModal'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { useClinic } from '@/context/ClinicContext'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import CircleRounded from '@mui/icons-material/CircleRounded'
import DeleteRounded from '@mui/icons-material/DeleteRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PaymentsRounded from '@mui/icons-material/PaymentsRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
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

function PatientActionsMenu({
  onClose,
  onViewFile,
  onCreateBudget,
  onEdit,
  onDelete,
  triggerRect
}: {
  onClose: () => void
  onViewFile: () => void
  onCreateBudget: () => void
  onEdit: () => void
  onDelete: () => void
  triggerRect?: DOMRect
}) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<{
    top?: number
    bottom?: number
    right?: number
  }>({})

  React.useEffect(() => {
    if (!menuRef.current || !triggerRect) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 8

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    if (spaceBelow >= menuRect.height + margin) {
      setPosition({
        top: triggerRect.bottom + margin,
        right: window.innerWidth - triggerRect.right
      })
      return
    }

    if (spaceAbove >= menuRect.height + margin) {
      setPosition({
        bottom: viewportHeight - triggerRect.top + margin,
        right: window.innerWidth - triggerRect.right
      })
      return
    }

    const centeredTop = Math.max(
      margin,
      Math.min(
        viewportHeight - menuRect.height - margin,
        triggerRect.top + triggerRect.height / 2 - menuRect.height / 2
      )
    )

    setPosition({
      top: centeredTop,
      right: window.innerWidth - triggerRect.right
    })
  }, [triggerRect])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[14rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={{
        top: position.top,
        bottom: position.bottom,
        right: position.right
      }}
      role='menu'
      aria-label='Acciones rápidas de paciente'
    >
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={onViewFile}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <FolderOpenRounded className='size-[1.125rem] text-[var(--color-neutral-600)]' />
          <span>Ver ficha</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={onCreateBudget}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <ReceiptLongRounded className='size-[1.125rem] text-[var(--color-neutral-600)]' />
          <span>Crear presupuesto</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={onEdit}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <EditRounded className='size-[1.125rem] text-[var(--color-neutral-600)]' />
          <span>Editar datos</span>
        </button>
      </div>

      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={onDelete}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-error-600)] transition-colors hover:bg-[var(--color-error-50)] focus:bg-[var(--color-error-50)] focus:outline-none'
        >
          <DeleteRounded className='size-[1.125rem] text-[var(--color-error-600)]' />
          <span>Eliminar paciente</span>
        </button>
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
      <Chip color='gray' size='md'>
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

function TableBodyCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <td
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] align-middle text-body-md text-[var(--color-neutral-900)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </td>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Inactivo'
  phone: string
  email: string
  hasFinancing: boolean
  debt: string
  debtAmount: number
  tags: Array<'deuda' | 'activo' | 'financiacion'>
}

type DbPatient = {
  id: string
  first_name: string
  last_name: string
  phone_number: string | null
  email: string | null
  status?: string | null
  patient_status?: string | null
  registration_status?: string | null
  onboarding_status?: string | null
  pre_registration_complete?: boolean | null
  created_at?: string | null
  preferred_financing_option?: string | null
  national_id?: string | null
  primary_contact_id?: string | null
  contacts?:
    | { phone_primary: string | null; email: string | null }
    | Array<{ phone_primary: string | null; email: string | null }>
    | null
}

type DbFinancingRequest = {
  patient_id: string
  status: string | null
}

const PAGE_SIZE = 15

function buildPageItems(
  totalPages: number,
  currentPage: number
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ]
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages
  ]
}

function PacientesPageInner() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'activos' | 'financiacion'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [openBudgetCreation, setOpenBudgetCreation] = React.useState(false)
  const [openEditMode, setOpenEditMode] = React.useState(false)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [menuTriggerRect, setMenuTriggerRect] = React.useState<DOMRect | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [rows, setRows] = React.useState<PatientRow[]>([])
  const [selectedPatientForModal, setSelectedPatientForModal] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  const loadPatients = React.useCallback(async () => {
    if (!isClinicInitialized) return
    setIsLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.replace('/login')
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (user) {
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        ([user.user_metadata?.first_name, user.user_metadata?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() ||
          user.email?.split('@')[0] ||
          'Usuario')

      await supabase
        .from('staff')
        .upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' })
    }

    const clinicId = activeClinicId
    if (!clinicId) {
      setRows([])
      setIsLoading(false)
      return
    }

    const { data: patientRows, error: patientsLoadError } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .limit(500)

    if (patientsLoadError) {
      setRows([])
      setIsLoading(false)
      return
    }

    const patients = ((patientRows as unknown as DbPatient[]) ?? []).sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })

    const patientIds = patients.map((patient) => patient.id)

    if (patientIds.length === 0) {
      setRows([])
      setIsLoading(false)
      return
    }

    const nowIso = new Date().toISOString()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [
      { data: futureAppts },
      { data: pastAppts },
      { data: invoices },
      { data: financingRequests }
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select('patient_id, scheduled_start_time')
        .in('patient_id', patientIds)
        .gte('scheduled_start_time', nowIso)
        .order('scheduled_start_time', { ascending: true }),
      supabase
        .from('appointments')
        .select('patient_id, scheduled_start_time')
        .in('patient_id', patientIds)
        .lt('scheduled_start_time', nowIso)
        .order('scheduled_start_time', { ascending: false }),
      supabase
        .from('invoices')
        .select('patient_id, status, total_amount, amount_paid')
        .in('patient_id', patientIds)
        .in('status', ['open', 'overdue']),
      supabase
        .from('financing_requests')
        .select('patient_id, status')
        .in('patient_id', patientIds)
    ])

    const nextByPatient = new Map<string, string>()
    if (Array.isArray(futureAppts)) {
      for (const appointment of futureAppts) {
        if (!nextByPatient.has(appointment.patient_id)) {
          nextByPatient.set(
            appointment.patient_id,
            new Date(appointment.scheduled_start_time).toLocaleDateString(
              DEFAULT_LOCALE,
              { timeZone: DEFAULT_TIMEZONE }
            )
          )
        }
      }
    }

    const lastVisitByPatient = new Map<string, Date>()
    if (Array.isArray(pastAppts)) {
      for (const appointment of pastAppts) {
        if (!lastVisitByPatient.has(appointment.patient_id)) {
          lastVisitByPatient.set(
            appointment.patient_id,
            new Date(appointment.scheduled_start_time)
          )
        }
      }
    }

    const debtByPatient = new Map<string, number>()
    if (Array.isArray(invoices)) {
      for (const invoice of invoices) {
        const previousDebt = debtByPatient.get(invoice.patient_id) ?? 0
        const remainingAmount =
          Number(invoice.total_amount ?? 0) - Number(invoice.amount_paid ?? 0)
        debtByPatient.set(invoice.patient_id, previousDebt + remainingAmount)
      }
    }

    const financingRequestByPatient = new Set<string>()
    const activeFinancingStatuses = new Set([
      'approved',
      'pending',
      'submitted',
      'in_review',
      'active',
      'accepted'
    ])
    if (Array.isArray(financingRequests)) {
      for (const request of financingRequests as DbFinancingRequest[]) {
        const status = (request.status || '').toLowerCase().trim()
        if (activeFinancingStatuses.has(status)) {
          financingRequestByPatient.add(request.patient_id)
        }
      }
    }

    const mappedRows: PatientRow[] = patients.map((patient) => {
      const debt = debtByPatient.get(patient.id)
      const hasDebt = typeof debt === 'number' && debt > 0
      const lastVisit = lastVisitByPatient.get(patient.id)
      const isActive =
        lastVisit !== undefined
          ? lastVisit.getTime() >= oneYearAgo.getTime()
          : false

      const rawStatus = String(
        patient.status ??
          patient.patient_status ??
          patient.registration_status ??
          patient.onboarding_status ??
          ''
      )
        .toLowerCase()
        .trim()
      const statusFromDb: 'Activo' | 'Inactivo' | null = (() => {
        if (!rawStatus) return null
        if (
          rawStatus === 'active' ||
          rawStatus === 'activo' ||
          rawStatus === 'registered'
        ) {
          return 'Activo'
        }
        if (
          rawStatus === 'inactive' ||
          rawStatus === 'inactivo' ||
          rawStatus === 'discharged' ||
          rawStatus === 'alta'
        ) {
          return 'Inactivo'
        }
        if (rawStatus === 'pre_registration' || rawStatus === 'pre-registro') {
          return 'Inactivo'
        }
        return null
      })()

      const createdAtDate = patient.created_at
        ? new Date(patient.created_at)
        : null
      const isRecentlyCreated =
        createdAtDate !== null &&
        !Number.isNaN(createdAtDate.getTime()) &&
        Date.now() - createdAtDate.getTime() <= 1000 * 60 * 60 * 24

      const status: 'Activo' | 'Inactivo' =
        statusFromDb ||
        (isActive
          ? 'Activo'
          : isRecentlyCreated
          ? 'Activo'
          : patient.pre_registration_complete === false
          ? 'Inactivo'
          : 'Inactivo')
      const hasFinancing =
        financingRequestByPatient.has(patient.id) ||
        Boolean(patient.preferred_financing_option?.trim())
      const tags: PatientRow['tags'] = ['deuda', 'activo', 'financiacion'].filter(
        (tag) => {
          if (tag === 'deuda') return hasDebt
          if (tag === 'activo') return status === 'Activo'
          if (tag === 'financiacion') return hasFinancing
          return false
        }
      ) as PatientRow['tags']

      const debtAmount = hasDebt ? Number(debt!.toFixed(2)) : 0

      return {
        id: patient.id,
        name:
          [patient.first_name, patient.last_name].filter(Boolean).join(' ') ||
          'Paciente sin nombre',
        phone: patient.phone_number ?? 'Sin teléfono',
        email: patient.email ?? '',
        nextDate: nextByPatient.get(patient.id) ?? 'Sin cita',
        status,
        hasFinancing,
        debt:
          debtAmount > 0
            ? `${debtAmount.toLocaleString(DEFAULT_LOCALE, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              })} €`
            : '0 €',
        debtAmount,
        tags
      }
    })

    setRows(mappedRows)
    setIsLoading(false)
  }, [activeClinicId, isClinicInitialized, router, supabase])

  React.useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  React.useEffect(() => {
    const q = (searchParams.get('q') || '').trim()
    if (q) {
      setQuery(q)
    }

    if (searchParams.get('openCreate') === '1') {
      setIsAddModalOpen(true)
      router.replace('/pacientes')
      return
    }

    const patientId = (searchParams.get('patientId') || '').trim()
    if (patientId) {
      const patient = rows.find((row) => row.id === patientId)
      setSelectedPatientForModal({ id: patientId, name: patient?.name || '' })
      setIsFichaModalOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rows])

  React.useEffect(() => {
    if (!selectedPatientForModal) return

    const patient = rows.find((row) => row.id === selectedPatientForModal.id)
    if (!patient || patient.name === selectedPatientForModal.name) return

    setSelectedPatientForModal({ id: patient.id, name: patient.name })
  }, [rows, selectedPatientForModal])

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
      prev.includes(key) ? prev.filter((current) => current !== key) : [...prev, key]
    )
  }
  const clearFilters = () => setSelectedFilters([])

  const removeRowsByIds = React.useCallback(
    (ids: string[]) => {
      const selectedIds = new Set(ids)
      setRows((previousRows) =>
        previousRows.filter((row) => !selectedIds.has(row.id))
      )
      setSelectedPatientIds((previousSelected) =>
        previousSelected.filter((id) => !selectedIds.has(id))
      )

      if (selectedPatientForModal && selectedIds.has(selectedPatientForModal.id)) {
        setIsFichaModalOpen(false)
        setSelectedPatientForModal(null)
        setOpenBudgetCreation(false)
        setOpenEditMode(false)
      }
    },
    [selectedPatientForModal]
  )

  const deletePatientsByIds = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || isDeleting) return
      if (!activeClinicId) return

      setIsDeleting(true)
      try {
        const uniqueIds = Array.from(new Set(ids))
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('clinic_id', activeClinicId)
          .in('id', uniqueIds)

        if (error) {
          console.error('Error deleting patients', error)
          alert('No se pudieron eliminar los pacientes seleccionados.')
          return
        }

        removeRowsByIds(uniqueIds)
        void loadPatients()
      } finally {
        setIsDeleting(false)
      }
    },
    [activeClinicId, isDeleting, loadPatients, removeRowsByIds, supabase]
  )

  const filteredRows = React.useMemo(() => {
    if (isLoading) return []

    return rows.filter((row) => {
      const loweredQuery = query.trim().toLowerCase()
      const matchesQuery = loweredQuery
        ? row.name.toLowerCase().includes(loweredQuery) ||
          row.phone.toLowerCase().includes(loweredQuery) ||
          row.email.toLowerCase().includes(loweredQuery)
        : true

      const matchesFilter = (() => {
        if (selectedFilters.length === 0) return true

        return selectedFilters.some((filterKey) => {
          if (filterKey === 'deuda') {
            return row.tags.includes('deuda') || row.debtAmount > 0
          }
          if (filterKey === 'activos') {
            return row.status === 'Activo'
          }
          if (filterKey === 'financiacion') {
            return row.hasFinancing
          }
          return false
        })
      })()

      return Boolean(matchesQuery && matchesFilter)
    })
  }, [isLoading, query, rows, selectedFilters])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [query, selectedFilters, rows.length])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  React.useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages))
  }, [totalPages])

  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredRows])

  const pageItems = React.useMemo(
    () => buildPageItems(totalPages, currentPage),
    [currentPage, totalPages]
  )

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-auto'>
        <AddPatientModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPatientCreated={() => {
            void loadPatients()
          }}
        />

        <PatientRecordModal
          open={isFichaModalOpen}
          onClose={() => {
            setIsFichaModalOpen(false)
            setOpenBudgetCreation(false)
            setOpenEditMode(false)
            setSelectedPatientForModal(null)
            void loadPatients()
          }}
          onPatientUpdated={() => {
            void loadPatients()
          }}
          initialTab={openBudgetCreation ? 'Finanzas' : 'Resumen'}
          openBudgetCreation={openBudgetCreation}
          openInEditMode={openEditMode}
          patientId={selectedPatientForModal?.id}
          patientName={selectedPatientForModal?.name}
        />

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
            </div>
          </div>
          <p className='text-body-sm text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
            Busca y filtra pacientes; confirma asistencias, reprograma citas y
            envía pre-registro, firmas y recordatorios al instante.
          </p>
        </div>

        <div className='flex-1 flex flex-col mt-[min(4.25rem,6vw)] overflow-hidden'>
          <div className='flex-shrink-0 mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {selectedPatientIds.length > 0 && (
                <>
                  <Chip color='teal'>{selectedPatientIds.length} seleccionados</Chip>
                  <button
                    onClick={() => {
                      void deletePatientsByIds(selectedPatientIds)
                    }}
                    className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer hover:bg-[var(--color-error-50)] hover:border-[var(--color-error-300)] hover:text-[var(--color-error-600)] transition-colors'
                    title={`Eliminar ${selectedPatientIds.length} paciente(s)`}
                    disabled={isDeleting}
                  >
                    <DeleteRounded className='size-5' />
                  </button>
                </>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
                <SearchRounded className='size-4 text-[var(--color-neutral-900)]' />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
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

          <div className='flex-1 rounded-[8px] overflow-hidden'>
            <table className='w-full table-fixed border-collapse'>
              <thead>
                <tr>
                  <TableHeaderCell className='w-[3%] min-w-[2rem] pr-1'>
                    <span className='sr-only'>Seleccionar fila</span>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[28%] pr-2'>
                    <div className='flex items-center gap-2'>
                      <AccountCircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                      <span>Paciente</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[16%] pr-2'>
                    <div className='flex items-center gap-2'>
                      <PhoneRounded className='size-4 text-[var(--color-neutral-700)]' />
                      <span>Teléfono</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[18%] pr-2'>
                    <div className='flex items-center gap-2'>
                      <CalendarMonthRounded className='size-4 text-[var(--color-neutral-700)]' />
                      <span>Próxima cita</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[14%] pr-2'>
                    <div className='flex items-center gap-2'>
                      <CircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                      <span>Estado</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[12%] pr-2' align='right'>
                    <div className='flex items-center gap-2 justify-end'>
                      <PaymentsRounded className='size-4 text-[var(--color-neutral-700)]' />
                      <span>Deuda</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[5%] min-w-[2.5rem] pr-2 text-right sticky right-0 bg-[var(--color-surface-app)]'>
                    <span className='sr-only'>Acciones</span>
                  </TableHeaderCell>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='py-4 text-center text-body-sm text-[var(--color-neutral-600)]'
                    >
                      Cargando pacientes…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='py-4 text-center text-body-sm text-[var(--color-neutral-600)]'
                    >
                      No hay pacientes que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className={[
                        'group hover:bg-[var(--color-neutral-50)]',
                        isPatientSelected(row.id) ? 'bg-[#E9FBF9]' : ''
                      ].join(' ')}
                    >
                      <TableBodyCell className='w-[3%] min-w-[2rem] pr-1'>
                        <button
                          type='button'
                          onClick={() => togglePatientSelection(row.id)}
                          aria-pressed={isPatientSelected(row.id)}
                          className='relative size-6 inline-flex items-center justify-center cursor-pointer'
                        >
                          <span className='absolute inset-0 rounded-[4px] border border-[var(--color-neutral-300)] bg-white opacity-0 group-hover:opacity-100 transition-opacity' />
                          <span
                            className={[
                              'absolute inset-0 rounded-[4px] border-2 transition-opacity',
                              isPatientSelected(row.id)
                                ? 'border-[#1E4947] opacity-100'
                                : 'opacity-0'
                            ].join(' ')}
                          />
                          <CheckRounded
                            aria-hidden='true'
                            className={[
                              'size-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1E4947] transition-opacity',
                              isPatientSelected(row.id) ? 'opacity-100' : 'opacity-0'
                            ].join(' ')}
                          />
                          <span className='sr-only'>Seleccionar fila</span>
                        </button>
                      </TableBodyCell>

                      <TableBodyCell className='w-[28%] pr-2'>
                        <button
                          type='button'
                          onClick={() => {
                            setSelectedPatientForModal({
                              id: row.id,
                              name: row.name
                            })
                            setOpenBudgetCreation(false)
                            setOpenEditMode(false)
                            setIsFichaModalOpen(true)
                          }}
                          className='truncate hover:underline cursor-pointer text-left w-full'
                        >
                          {row.name}
                        </button>
                      </TableBodyCell>

                      <TableBodyCell className='w-[16%] pr-2'>
                        <p className='truncate'>{row.phone}</p>
                      </TableBodyCell>

                      <TableBodyCell className='w-[18%] pr-2'>
                        <span className='truncate'>{row.nextDate}</span>
                      </TableBodyCell>

                      <TableBodyCell className='w-[14%] pr-2'>
                        <StatusPill type={row.status} />
                      </TableBodyCell>

                      <TableBodyCell className='w-[12%] pr-2' align='right'>
                        {row.debt}
                      </TableBodyCell>

                      <TableBodyCell
                        className='w-[5%] min-w-[2.5rem] pr-2 sticky right-0 bg-[var(--color-surface-app)] group-hover:bg-[var(--color-neutral-50)]'
                        align='right'
                      >
                        <div className='relative'>
                          <button
                            type='button'
                            onClick={(event) => {
                              if (openMenuId === row.id) {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                              } else {
                                setOpenMenuId(row.id)
                                setMenuTriggerRect(
                                  event.currentTarget.getBoundingClientRect()
                                )
                              }
                            }}
                            aria-label='Abrir acciones'
                            aria-expanded={openMenuId === row.id}
                            className='inline-flex size-8 items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-300)]'
                          >
                            <MoreVertRounded className='size-5 text-[var(--color-neutral-700)]' />
                          </button>

                          {openMenuId === row.id && menuTriggerRect && (
                            <PatientActionsMenu
                              triggerRect={menuTriggerRect}
                              onClose={() => {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                              }}
                              onViewFile={() => {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                                setSelectedPatientForModal({
                                  id: row.id,
                                  name: row.name
                                })
                                setOpenBudgetCreation(false)
                                setOpenEditMode(false)
                                setIsFichaModalOpen(true)
                              }}
                              onCreateBudget={() => {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                                setSelectedPatientForModal({
                                  id: row.id,
                                  name: row.name
                                })
                                setOpenBudgetCreation(true)
                                setOpenEditMode(false)
                                setIsFichaModalOpen(true)
                              }}
                              onEdit={() => {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                                setSelectedPatientForModal({
                                  id: row.id,
                                  name: row.name
                                })
                                setOpenBudgetCreation(false)
                                setOpenEditMode(true)
                                setIsFichaModalOpen(true)
                              }}
                              onDelete={() => {
                                setOpenMenuId(null)
                                setMenuTriggerRect(null)
                                void deletePatientsByIds([row.id])
                              }}
                            />
                          )}
                        </div>
                      </TableBodyCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
            <button
              className='size-6 inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label='Primera página'
            >
              <FirstPageRounded className='size-5' />
            </button>
            <button
              className='size-6 inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label='Página anterior'
            >
              <ChevronLeftRounded className='size-5' />
            </button>
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`}>…</span>
              ) : (
                <button
                  key={`page-${item}`}
                  type='button'
                  className={[
                    'cursor-pointer',
                    item === currentPage ? 'font-bold underline' : ''
                  ].join(' ')}
                  onClick={() => setCurrentPage(item)}
                  aria-label={`Ir a página ${item}`}
                >
                  {item}
                </button>
              )
            )}
            <button
              className='size-6 inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              aria-label='Página siguiente'
            >
              <ChevronRightRounded className='size-5' />
            </button>
            <button
              className='size-6 inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label='Última página'
            >
              <LastPageRounded className='size-5' />
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
