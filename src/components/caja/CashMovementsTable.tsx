'use client'

import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import InvoiceDetailsModal from '@/components/pacientes/modals/patient-record/InvoiceDetailsModal'
import Portal from '@/components/ui/Portal'
import { useClinic } from '@/context/ClinicContext'
import { useUserRole } from '@/context/role-context'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PaymentMethod } from '@/types/payments'

import NewPaymentModal, { type NewPaymentFormData } from './NewPaymentModal'
import ReceiptPreviewModal from './ReceiptPreviewModal'

type InvoiceStatus = 'Aceptado' | 'Enviado'
type ProductionState = 'Hecho' | 'Pendiente'
type PaymentCategory =
  | 'Efectivo'
  | 'TPV'
  | 'Transferencia'
  | 'Financiación'
  | 'Pendiente'
type CollectionStatus = 'Cobrado' | 'Por cobrar'

type CashMovement = {
  id: string // Unique identifier for React keys
  invoiceId: string
  patientId?: string | null
  day: string
  time: string
  patient: string
  concept: string
  amount: string
  status: InvoiceStatus
  collectionStatus: CollectionStatus
  outstandingAmount: number
  produced: ProductionState
  method: string
  insurer: string
  paymentCategory: PaymentCategory
  quoteId?: string | null
  productionStatus?: 'Done' | 'Pending' | null
  productionDate?: string | null
}

// MOVEMENTS removed - now fetched from API

const TABLE_WIDTH_REM = 104.3125 // total of column widths in rem
const TABLE_HEIGHT_REM = 27.5 // 440px ÷ 16
const SEARCH_WIDTH_REM = 17 // closer to /dev layout
const CONTROL_HEIGHT_REM = 2 // 32px ÷ 16

const COLUMN_WIDTHS_REM = {
  time: 8.5, // keeps full DD MMM. YYYY date visible
  patient: 17.875, // 286px
  concept: 25.75, // 412px
  amount: 10.375, // 166px
  status: 7.0625, // 113px
  produced: 10.5625, // 169px
  method: 12.5, // 200px
  insurer: 8.6875, // 139px
  actions: 3 // ~48px
} as const

type ColumnId =
  | 'time'
  | 'patient'
  | 'concept'
  | 'amount'
  | 'status'
  | 'produced'
  | 'method'
  | 'insurer'
  | 'actions'

type ColumnDefinition = {
  id: ColumnId
  label: string
  widthRem: number
  align?: 'left' | 'right'
  render: (movement: CashMovement) => React.ReactNode
}

function formatMovementDay(day: string) {
  const [y, m, d] = day.split('-').map((v) => Number(v))
  if (!y || !m || !d) return day
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const monthShort = new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    timeZone: 'Europe/Madrid'
  }).format(date)
  const monthNormalized = monthShort.endsWith('.') ? monthShort : `${monthShort}.`
  const monthLabel =
    monthNormalized.charAt(0).toUpperCase() + monthNormalized.slice(1)
  return `${String(d).padStart(2, '0')} ${monthLabel} ${y}`
}

const columns: ColumnDefinition[] = [
  {
    id: 'time',
    label: 'Día',
    widthRem: COLUMN_WIDTHS_REM.time,
    render: (movement) => (
      <span className='whitespace-nowrap'>{formatMovementDay(movement.day)}</span>
    )
  },
  {
    id: 'patient',
    label: 'Paciente',
    widthRem: COLUMN_WIDTHS_REM.patient,
    render: (movement) => movement.patient
  },
  {
    id: 'concept',
    label: 'Concepto',
    widthRem: COLUMN_WIDTHS_REM.concept,
    render: (movement) => movement.concept
  },
  {
    id: 'amount',
    label: 'Cantidad',
    widthRem: COLUMN_WIDTHS_REM.amount,
    render: (movement) => movement.amount
  },
  {
    id: 'status',
    label: 'Estado',
    widthRem: COLUMN_WIDTHS_REM.status,
    render: (movement) => <StatusCell movement={movement} />
  },
  {
    id: 'produced',
    label: 'Producido',
    widthRem: COLUMN_WIDTHS_REM.produced,
    render: (movement) => <ProductionBadge movement={movement} />
  },
  {
    id: 'method',
    label: 'Método',
    widthRem: COLUMN_WIDTHS_REM.method,
    render: (movement) => movement.method
  },
  {
    id: 'insurer',
    label: 'Aseguradora',
    widthRem: COLUMN_WIDTHS_REM.insurer,
    render: (movement) => movement.insurer?.trim() ? movement.insurer : 'N/A'
  },
  {
    id: 'actions',
    label: '',
    widthRem: COLUMN_WIDTHS_REM.actions,
    align: 'right',
    render: (movement) => <ActionsMenu movement={movement} />
  }
]

const totalColumns = columns.length

const getHeaderCellClasses = (index: number, align: 'left' | 'right' = 'left') => {
  const borders =
    index < totalColumns - 1 ? 'border-hairline-b border-hairline-r' : 'border-hairline-b'
  const textAlign = align === 'right' ? 'text-right' : 'text-left'
  return `${borders} overflow-hidden py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)] ${textAlign}`
}

const getBodyCellClasses = (index: number, align: 'left' | 'right' = 'left') => {
  const borders =
    index < totalColumns - 1 ? 'border-hairline-b border-hairline-r' : 'border-hairline-b'
  const textAlign = align === 'right' ? 'text-right' : 'text-left'
  return `${borders} overflow-hidden py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900 ${textAlign}`
}

const PAYMENT_FILTERS: Array<Exclude<PaymentCategory, 'Pendiente'>> = [
  'Efectivo',
  'TPV',
  'Transferencia',
  'Financiación'
]

const COLLECTION_STATUS_FILTERS: CollectionStatus[] = ['Cobrado', 'Por cobrar']

type CashMovementsTableProps = {
  date: Date
  timeScale: 'day' | 'week' | 'month' | 'year'
}

export default function CashMovementsTable({ date, timeScale }: CashMovementsTableProps) {
  const router = useRouter()
  const { activeClinicId } = useClinic()
  const { role } = useUserRole()
  const [query, setQuery] = useState('')
  const [patientSuggestions, setPatientSuggestions] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'' | PaymentCategory>('')
  const [paymentStatus, setPaymentStatus] = useState<'' | CollectionStatus>('')
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 50
    const raw = window.localStorage.getItem('caja.movements.pageSize')
    const v = Number(raw)
    return v === 20 || v === 50 || v === 100 ? v : 50
  })
  const lastHashRef = useRef<string>('')
  const [paymentsModal, setPaymentsModal] = useState<{
    open: boolean
    movement: CashMovement | null
    loading: boolean
    invoice?: {
      id: string
      invoiceNumber: string | null
      totalAmount: number
      amountPaid: number
      outstandingAmount: number
    }
    payments?: Array<{
      id: string
      amount: number
      transactionDate: string
      paymentMethod: string
      paymentReference?: string | null
    }>
  }>({ open: false, movement: null, loading: false })

  const [invoiceModal, setInvoiceModal] = useState<{
    open: boolean
    movement: CashMovement | null
    loading: boolean
    invoice?: {
      id: string
      invoiceNumber: string | null
      totalAmount: number
      amountPaid: number
      outstandingAmount: number
      issueDate?: string | null
      patientName?: string
      patientNif?: string
      insurer?: string
      professional?: string
    }
    payments?: Array<{
      id: string
      amount: number
      transactionDate: string
      paymentMethod: string
      paymentReference?: string | null
    }>
  }>({ open: false, movement: null, loading: false })

  const [modifyPaymentModal, setModifyPaymentModal] = useState<{
    open: boolean
    movement: CashMovement | null
    loading: boolean
    paymentId: string
    paymentMethod: string
    error: string | null
    saving: boolean
  }>({
    open: false,
    movement: null,
    loading: false,
    paymentId: '',
    paymentMethod: 'TPV',
    error: null,
    saving: false
  })

  const [deletePaymentModal, setDeletePaymentModal] = useState<{
    open: boolean
    movement: CashMovement | null
    paymentId: string
    deleting: boolean
    error: string | null
  }>({ open: false, movement: null, paymentId: '', deleting: false, error: null })

  const [patientModal, setPatientModal] = useState<{
    open: boolean
    patientId: string | null
  }>({ open: false, patientId: null })

  const [treatmentModal, setTreatmentModal] = useState<{
    open: boolean
    quoteId: string | null
    loading: boolean
    title?: string
    items?: Array<{
      label: string
      quantity?: number
      unitPrice?: number
      finalPrice?: number
      source?: string
    }>
  }>({ open: false, quoteId: null, loading: false })

  const [registerPaymentModal, setRegisterPaymentModal] = useState<{
    open: boolean
    movement: CashMovement | null
  }>({ open: false, movement: null })

  const [receiptModal, setReceiptModal] = useState<{
    open: boolean
    movement: CashMovement | null
    transactionData?: {
      patientName: string
      concept: string
      amount: number
      paymentMethod: PaymentMethod
      date: string
      paymentReference?: string
    }
  }>({ open: false, movement: null })
  const inflightFetchControllerRef = useRef<AbortController | null>(null)
  const fetchRequestIdRef = useRef(0)

  const formatMadridDate = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)

  const computeRangeFromToolbar = (anchor: Date, scale: 'day' | 'week' | 'month' | 'year') => {
    const dateStr = formatMadridDate(anchor) // YYYY-MM-DD (Madrid)
    const start = new Date(`${dateStr}T00:00:00Z`)
    const end = new Date(`${dateStr}T00:00:00Z`)

    if (scale === 'week') {
      const day = start.getUTCDay() // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7
      start.setUTCDate(start.getUTCDate() - diffToMonday)
      end.setUTCDate(start.getUTCDate() + 6)
    } else if (scale === 'month') {
      start.setUTCDate(1)
      const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
      end.setUTCDate(lastDay.getUTCDate())
    } else if (scale === 'year') {
      start.setUTCMonth(0, 1)
      const lastDay = new Date(Date.UTC(start.getUTCFullYear(), 12, 0))
      end.setUTCMonth(11, lastDay.getUTCDate())
    }

    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    }
  }

  const mapMovementMethodToReceiptMethod = (
    method: string,
    paymentCategory: PaymentCategory
  ): PaymentMethod => {
    const value = `${method} ${paymentCategory}`.toLowerCase()
    if (value.includes('efectivo') || value.includes('cash')) return 'efectivo'
    if (value.includes('tpv') || value.includes('tarjeta') || value.includes('card')) return 'tarjeta'
    if (value.includes('transfer')) return 'transferencia'
    if (value.includes('finan')) return 'financiacion'
    return 'otros'
  }

  // Reset date-range when toolbar changes (v2 Phase 1 default behavior)
  useEffect(() => {
    const range = computeRangeFromToolbar(date, timeScale)
    setFromDate(range.from)
    setToDate(range.to)
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale])

  // Trend drilldown (Phase 2.3): clicking chart point sets date range
  useEffect(() => {
    const handler = (e: any) => {
      const from = e?.detail?.from as string | undefined
      const to = e?.detail?.to as string | undefined
      if (!from || !to) return
      setFromDate(from)
      setToDate(to)
      setCurrentPage(1)
      // bring table into view
      setTimeout(() => {
        tableContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    }
    window.addEventListener('caja:trend-drilldown', handler as EventListener)
    return () => window.removeEventListener('caja:trend-drilldown', handler as EventListener)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('caja.movements.pageSize', String(pageSize))
  }, [pageSize])

  // Patient autocomplete (v2 Phase 1): debounce 300ms
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setPatientSuggestions([])
      setIsSuggesting(false)
      return
    }

    const controller = new AbortController()
    setIsSuggesting(true)
    const t = window.setTimeout(() => {
      const clinicQuery = activeClinicId
        ? `&clinicId=${encodeURIComponent(activeClinicId)}`
        : ''
      fetch(`/api/caja/patients-search?q=${encodeURIComponent(q)}${clinicQuery}`, {
        signal: controller.signal
      })
        .then((res) => res.json())
        .then((data) => {
          if (controller.signal.aborted) return
          setPatientSuggestions(Array.isArray(data.patients) ? data.patients : [])
          setIsSuggesting(false)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          console.error('Error fetching patient suggestions:', err)
          setIsSuggesting(false)
        })
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [query, activeClinicId])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openPaymentsModal(movement)
    }
    window.addEventListener('caja:open-invoice-payments', handler as EventListener)
    return () => window.removeEventListener('caja:open-invoice-payments', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      setReceiptModal({ open: true, movement })
    }
    window.addEventListener('caja:print-receipt', handler as EventListener)
    return () => window.removeEventListener('caja:print-receipt', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openInvoiceModal(movement)
    }
    window.addEventListener('caja:open-invoice', handler as EventListener)
    return () => window.removeEventListener('caja:open-invoice', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      const preferredMethod = e?.detail?.method as
        | Exclude<PaymentCategory, 'Pendiente'>
        | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openModifyPaymentModal(movement, preferredMethod)
    }
    window.addEventListener('caja:modify-transaction', handler as EventListener)
    return () => window.removeEventListener('caja:modify-transaction', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openDeletePaymentModal(movement)
    }
    window.addEventListener('caja:delete-transaction', handler as EventListener)
    return () => window.removeEventListener('caja:delete-transaction', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const patientId = e?.detail?.patientId as string | undefined
      const patientName = e?.detail?.patientName as string | undefined
      if (patientId) {
        setPatientModal({ open: true, patientId })
        return
      }
      // Fallback if patientId missing
      if (patientName) {
        router.push(`/pacientes?q=${encodeURIComponent(patientName)}`)
      }
    }
    window.addEventListener('caja:open-patient-details', handler as EventListener)
    return () => window.removeEventListener('caja:open-patient-details', handler as EventListener)
  }, [router])

  useEffect(() => {
    const handler = (e: any) => {
      const quoteId = e?.detail?.quoteId as string | undefined
      if (!quoteId) return
      setTreatmentModal({ open: true, quoteId, loading: true })
      fetch(`/api/caja/treatment-details?quoteId=${encodeURIComponent(quoteId)}`)
        .then((res) => res.json())
        .then((data) => {
          setTreatmentModal((prev) => ({
            ...prev,
            loading: false,
            title: data?.title || 'Treatment details',
            items: Array.isArray(data?.items) ? data.items : []
          }))
        })
        .catch((err) => {
          console.error('Failed to load treatment details', err)
          setTreatmentModal((prev) => ({ ...prev, loading: false }))
        })
    }
    window.addEventListener('caja:open-treatment-details', handler as EventListener)
    return () => window.removeEventListener('caja:open-treatment-details', handler as EventListener)
  }, [])

  const hashMovements = (items: CashMovement[]) =>
    items
      .map((m) => `${m.id}|${m.day}|${m.collectionStatus}|${m.produced}|${m.method}|${m.amount}`)
      .join('||')

  const fetchMovements = (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent)
    if (!silent) {
      setIsLoading(true)
      // Avoid showing stale rows while a new date/filter range is loading.
      setMovements((prev) => (prev.length > 0 ? [] : prev))
      lastHashRef.current = ''
    }
    const requestId = fetchRequestIdRef.current + 1
    fetchRequestIdRef.current = requestId
    inflightFetchControllerRef.current?.abort()
    const controller = new AbortController()
    inflightFetchControllerRef.current = controller

    const params = new URLSearchParams()
    params.set('date', formatMadridDate(date))
    params.set('timeScale', timeScale)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    if (query.trim()) params.set('patient', query.trim())
    if (paymentMethod) params.set('paymentMethod', paymentMethod)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)
    if (activeClinicId) params.set('clinicId', activeClinicId)

    fetch(`/api/caja/movements?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store'
    })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return
        const next = Array.isArray(data.movements) ? (data.movements as CashMovement[]) : []
        const nextHash = hashMovements(next)
        if (nextHash !== lastHashRef.current) {
          lastHashRef.current = nextHash
          setMovements(next)
        }
        if (!silent) setIsLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted || requestId !== fetchRequestIdRef.current) return
        console.error('Error fetching movements:', error)
        if (!silent) setIsLoading(false)
      })
  }

  useEffect(() => {
    return () => {
      inflightFetchControllerRef.current?.abort()
    }
  }, [])

  // Fetch movements from API
  useEffect(() => {
    setCurrentPage(1)
    fetchMovements({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus, activeClinicId])

  // Real-time polling (simple + robust): refresh every 15s and on window focus
  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchMovements({ silent: true })
    }, 60000)

    const onFocus = () => fetchMovements({ silent: true })
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus, query, activeClinicId])

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container || typeof window === 'undefined') return

    const updateScale = () => {
      const { width } = container.getBoundingClientRect()
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const availableRem = width / rootFontSize
      const nextScale = Math.min(1, availableRem / TABLE_WIDTH_REM)

      setScaleFactor((prev) => (Math.abs(prev - nextScale) < 0.001 ? prev : nextScale))
    }

    updateScale()

    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const openPaymentsModal = async (movement: CashMovement) => {
    setPaymentsModal({ open: true, movement, loading: true })
    try {
      const res = await fetch(`/api/caja/invoice-payments?invoiceId=${movement.invoiceId}`)
      const data = await res.json()
      setPaymentsModal((prev) => ({
        ...prev,
        loading: false,
        invoice: data.invoice,
        payments: data.payments || []
      }))
    } catch (e) {
      console.error('Failed to fetch invoice payments', e)
      setPaymentsModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const openInvoiceModal = async (movement: CashMovement) => {
    setInvoiceModal({ open: true, movement, loading: true })
    try {
      const res = await fetch(`/api/caja/invoice-payments?invoiceId=${movement.invoiceId}`)
      const data = await res.json()
      setInvoiceModal((prev) => ({
        ...prev,
        loading: false,
        invoice: data.invoice,
        payments: data.payments || []
      }))
    } catch (e) {
      console.error('Failed to fetch invoice details', e)
      setInvoiceModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const openModifyPaymentModal = async (
    movement: CashMovement,
    preferredMethod?: Exclude<PaymentCategory, 'Pendiente'>
  ) => {
    setModifyPaymentModal((p) => ({
      ...p,
      open: true,
      movement,
      loading: true,
      error: null,
      saving: false
    }))
    try {
      const res = await fetch(`/api/caja/invoice-payments?invoiceId=${movement.invoiceId}`)
      const data = await res.json()
      const payments = Array.isArray(data.payments) ? data.payments : []
      const first = payments[0] || null
      setModifyPaymentModal((p) => ({
        ...p,
        loading: false,
        paymentId: first?.id ? String(first.id) : '',
        paymentMethod: preferredMethod || (first?.paymentMethod ? String(first.paymentMethod) : 'TPV')
      }))
    } catch (e: any) {
      setModifyPaymentModal((p) => ({
        ...p,
        loading: false,
        error: e?.message || 'Failed to load payments'
      }))
    }
  }

  const saveModifiedPayment = async () => {
    if (!modifyPaymentModal.paymentId) {
      setModifyPaymentModal((p) => ({ ...p, error: 'No payment to edit' }))
      return
    }
    setModifyPaymentModal((p) => ({ ...p, saving: true, error: null }))
    try {
      const res = await fetch('/api/caja/payments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: modifyPaymentModal.paymentId,
          paymentMethod: modifyPaymentModal.paymentMethod
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setModifyPaymentModal((p) => ({ ...p, saving: false, error: data?.error || 'Error' }))
        return
      }
      setModifyPaymentModal((p) => ({ ...p, saving: false, open: false }))
      fetchMovements({ silent: true })
      window.dispatchEvent(new CustomEvent('caja:refresh-closing'))
      const movement = modifyPaymentModal.movement
      if (movement && paymentsModal.open && paymentsModal.movement?.invoiceId === movement.invoiceId) {
        openPaymentsModal(movement)
      }
      if (movement && invoiceModal.open && invoiceModal.movement?.invoiceId === movement.invoiceId) {
        openInvoiceModal(movement)
      }
    } catch (e: any) {
      setModifyPaymentModal((p) => ({ ...p, saving: false, error: e?.message || 'Error' }))
    }
  }

  const openDeletePaymentModal = async (movement: CashMovement) => {
    try {
      const res = await fetch(`/api/caja/invoice-payments?invoiceId=${movement.invoiceId}`)
      const data = await res.json()
      const payments = Array.isArray(data.payments) ? data.payments : []
      const first = payments[0] || null
      setDeletePaymentModal({
        open: true,
        movement,
        paymentId: first?.id ? String(first.id) : '',
        deleting: false,
        error: null
      })
    } catch (e: any) {
      setDeletePaymentModal({
        open: true,
        movement,
        paymentId: '',
        deleting: false,
        error: e?.message || 'Failed to load payments'
      })
    }
  }

  const confirmDeletePayment = async () => {
    if (!deletePaymentModal.paymentId) {
      setDeletePaymentModal((p) => ({ ...p, error: 'No payment to delete' }))
      return
    }
    setDeletePaymentModal((p) => ({ ...p, deleting: true, error: null }))
    try {
      const res = await fetch('/api/caja/payments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: deletePaymentModal.paymentId })
      })
      const data = await res.json()
      if (!res.ok) {
        setDeletePaymentModal((p) => ({ ...p, deleting: false, error: data?.error || 'Error' }))
        return
      }
      const movement = deletePaymentModal.movement
      setDeletePaymentModal({ open: false, movement: null, paymentId: '', deleting: false, error: null })
      fetchMovements({ silent: true })
      window.dispatchEvent(new CustomEvent('caja:refresh-closing'))
      if (movement && paymentsModal.open && paymentsModal.movement?.invoiceId === movement.invoiceId) {
        openPaymentsModal(movement)
      }
      if (movement && invoiceModal.open && invoiceModal.movement?.invoiceId === movement.invoiceId) {
        openInvoiceModal(movement)
      }
    } catch (e: any) {
      setDeletePaymentModal((p) => ({ ...p, deleting: false, error: e?.message || 'Error' }))
    }
  }

  const openRegisterPaymentModal = (movement: CashMovement) => {
    setRegisterPaymentModal({
      open: true,
      movement
    })
  }

  // Actions menu: register payment
  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openRegisterPaymentModal(movement)
    }
    window.addEventListener('caja:register-payment', handler as EventListener)
    return () => window.removeEventListener('caja:register-payment', handler as EventListener)
  }, [movements])

  // Actions menu: toggle produced (server enforces gerencia)
  useEffect(() => {
    const handler = async (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      const quoteId = e?.detail?.quoteId as string | undefined
      const produced = e?.detail?.produced as ProductionState | undefined
      if (!invoiceId || !quoteId || !produced) return

      // Optimistic UI update (no waiting for refetch)
      setMovements((prev) =>
        prev.map((m) => {
          if (m.invoiceId !== invoiceId) return m
          const nextProduced: ProductionState = produced === 'Hecho' ? 'Pendiente' : 'Hecho'
          return {
            ...m,
            produced: nextProduced,
            productionStatus: nextProduced === 'Hecho' ? 'Done' : 'Pending'
          }
        })
      )

      const nextStatus = produced === 'Hecho' ? 'Pending' : 'Done'
      try {
        const res = await fetch('/api/caja/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId, productionStatus: nextStatus })
        })
        if (!res.ok) {
          // revert optimistic change on failure
          setMovements((prev) =>
            prev.map((m) =>
              m.invoiceId === invoiceId
                ? {
                    ...m,
                    produced,
                    productionStatus: produced === 'Hecho' ? 'Done' : 'Pending'
                  }
                : m
            )
          )
          return
        }

        // background resync (keeps UI snappy but eventually consistent)
        window.setTimeout(() => fetchMovements({ silent: true }), 1200)
      } catch (err) {
        console.error('Failed to toggle production', err)
        setMovements((prev) =>
          prev.map((m) =>
            m.invoiceId === invoiceId
              ? {
                  ...m,
                  produced,
                  productionStatus: produced === 'Hecho' ? 'Done' : 'Pending'
                }
              : m
          )
        )
      }
    }
    window.addEventListener('caja:toggle-produced', handler as EventListener)
    return () => window.removeEventListener('caja:toggle-produced', handler as EventListener)
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus, query])

  const mapNewPaymentMethodToApi = (
    method: PaymentMethod
  ): 'Efectivo' | 'TPV' | 'Transferencia' | 'Financiación' | 'Otros' => {
    switch (method) {
      case 'efectivo':
        return 'Efectivo'
      case 'tarjeta':
        return 'TPV'
      case 'transferencia':
        return 'Transferencia'
      case 'financiacion':
        return 'Financiación'
      default:
        return 'Otros'
    }
  }

  const submitRegisterPayment = async (
    payload: NewPaymentFormData
  ): Promise<{ ok: boolean; error?: string }> => {
    const movement = registerPaymentModal.movement
    if (!movement) return { ok: false, error: 'No hay factura seleccionada' }

    const amount = Number(payload.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'Introduce un importe válido' }
    }

    try {
      const res = await fetch('/api/caja/register-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: movement.invoiceId,
          amount,
          paymentMethod: mapNewPaymentMethodToApi(payload.paymentMethod),
          transactionId: payload.reference || null,
          notes: null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data?.error || 'No se pudo guardar el pago' }
      }

      setRegisterPaymentModal({ open: false, movement: null })
      fetchMovements({ silent: true })
      window.dispatchEvent(new CustomEvent('caja:refresh-closing'))
      if (paymentsModal.open && paymentsModal.movement?.invoiceId === movement.invoiceId) {
        openPaymentsModal(movement)
      }
      if (invoiceModal.open && invoiceModal.movement?.invoiceId === movement.invoiceId) {
        openInvoiceModal(movement)
      }

      if (payload.generateReceipt) {
        setReceiptModal({
          open: true,
          movement: null,
          transactionData: {
            patientName: movement.patient,
            concept: movement.concept,
            amount,
            paymentMethod: payload.paymentMethod,
            paymentReference: payload.reference,
            date: new Date().toISOString()
          }
        })
      }

      if (payload.generateInvoice) {
        openInvoiceModal(movement)
      }

      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Error inesperado al guardar el pago' }
    }
  }

  const filteredMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return movements.filter((movement) => {
      const matchesQuery = normalizedQuery
        ? [
            movement.patient,
            movement.concept,
            movement.method,
            movement.insurer,
            movement.time
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true

      const matchesMethod = paymentMethod ? movement.paymentCategory === paymentMethod : true
      const matchesPaymentStatus = paymentStatus
        ? movement.collectionStatus === paymentStatus
        : true

      return matchesQuery && matchesMethod && matchesPaymentStatus
    })
  }, [movements, query, paymentMethod, paymentStatus])

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredMovements.slice(start, start + pageSize)
  }, [filteredMovements, page, pageSize])

  return (
    <section
      className='flex h-full flex-col flex-1 overflow-hidden'
      style={{
        marginTop: 'min(0.4375rem, 0.6vh)',
        width: '100%'
      }}
    >
      <div className='flex flex-wrap items-center justify-between gap-gapsm'>
        <div className='flex items-center gap-gapsm'>
          <div className='text-body-sm text-[var(--color-neutral-700)]'>
            Desde&nbsp;&nbsp;DD/MM/AAAA
          </div>
          <div className='text-body-sm text-[var(--color-neutral-700)]'>
            Hasta&nbsp;&nbsp;DD/MM/AAAA
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-gapsm'>
          <SearchInput
            value={query}
            onChange={setQuery}
            suggestions={patientSuggestions}
            loading={isSuggesting}
            onPickSuggestion={(name) => setQuery(name)}
          />
          {[
            { id: '', label: 'Todos' },
            { id: 'Efectivo', label: 'Efectivo' },
            { id: 'TPV', label: 'TPV' },
            { id: 'Transferencia', label: 'Transfer' },
            { id: 'Financiación', label: 'Financiación' }
          ].map((option) => {
            const isActive = paymentMethod === option.id
            return (
              <button
                key={option.label}
                type='button'
                onClick={() =>
                  setPaymentMethod(option.id as '' | PaymentCategory)
                }
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors',
                  isActive
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)] hover:bg-[#D3F7F3] hover:border-[#7DE7DC]'
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div ref={tableContainerRef} className='mt-6 flex-1 overflow-hidden rounded-lg'>
        <div className='h-full overflow-y-auto table-scroll-x'>
          <table className='w-full table-fixed border-collapse text-left'>
            <thead className='sticky top-0 z-10 bg-[var(--color-neutral-50)]'>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.id}
                    className={getHeaderCellClasses(index, column.align)}
                    scope='col'
                    style={{ width: `${column.widthRem * scaleFactor}rem` }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={totalColumns} className='text-center py-8 text-neutral-500'>
                    Cargando movimientos...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className='text-center py-8 text-neutral-500'>
                    No hay movimientos para este período
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => (
                <tr key={movement.id}>
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.id}
                      className={getBodyCellClasses(colIndex, column.align)}
                      style={{ width: `${column.widthRem * scaleFactor}rem` }}
                    >
                      {column.render(movement)}
                    </td>
                  ))}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
        <PaginationIcon
          icon='first_page'
          ariaLabel='Primera página'
          disabled={page <= 1}
          onClick={() => setCurrentPage(1)}
        />
        <PaginationIcon
          icon='chevron_left'
          ariaLabel='Página anterior'
          disabled={page <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        />
        <span className='tabular-nums'>
          {page} / {totalPages}
        </span>
        <PaginationIcon
          icon='chevron_right'
          ariaLabel='Página siguiente'
          disabled={page >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />
        <PaginationIcon
          icon='last_page'
          ariaLabel='Última página'
          disabled={page >= totalPages}
          onClick={() => setCurrentPage(totalPages)}
        />
      </div>

      {paymentsModal.open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'
          role='dialog'
          aria-modal='true'
        >
          <div className='w-[min(40rem,90vw)] rounded-lg bg-surface shadow-elevation-card p-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-title-sm font-medium text-fg'>
                Historial de cobros
              </h3>
              <button
                type='button'
                className='size-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100'
                onClick={() =>
                  setPaymentsModal({ open: false, movement: null, loading: false })
                }
                aria-label='Cerrar'
              >
                <span className='material-symbols-rounded text-[1.25rem]'>close</span>
              </button>
            </div>

            {paymentsModal.loading ? (
              <div className='py-6 text-neutral-600'>Cargando...</div>
            ) : (
              <>
                <div className='mt-4 grid grid-cols-3 gap-3 text-body-sm text-neutral-700'>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Total</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.totalAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Cobrado</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.amountPaid?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Pendiente</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.outstandingAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                </div>

                <div className='mt-4 rounded-md border border-border overflow-hidden'>
                  <div className='grid grid-cols-3 bg-neutral-50 px-4 py-2 text-label-sm text-neutral-600'>
                    <div>Fecha</div>
                    <div>Método</div>
                    <div className='text-right'>Importe</div>
                  </div>
                  {(paymentsModal.payments || []).length === 0 ? (
                    <div className='px-4 py-4 text-neutral-600'>
                      No hay cobros registrados para esta factura.
                    </div>
                  ) : (
                    (paymentsModal.payments || []).map((p) => (
                      <div
                        key={p.id}
                        className='grid grid-cols-3 px-4 py-2 border-t border-border text-body-sm text-neutral-800'
                      >
                        <div>
                          {new Intl.DateTimeFormat('es-ES', {
                            timeZone: 'Europe/Madrid',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          }).format(new Date(p.transactionDate))}
                        </div>
                        <div>{p.paymentMethod}</div>
                        <div className='text-right'>
                          {Number(p.amount).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          €
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {invoiceModal.open && invoiceModal.loading && (
        <div
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/30'
          role='dialog'
          aria-modal='true'
        >
          <div className='rounded-lg bg-surface px-6 py-4 shadow-elevation-card text-neutral-700'>
            Cargando factura...
          </div>
        </div>
      )}

      {invoiceModal.open && !invoiceModal.loading && (
        <InvoiceDetailsModal
          open={invoiceModal.open}
          onClose={() => setInvoiceModal({ open: false, movement: null, loading: false })}
          invoiceId={invoiceModal.invoice?.invoiceNumber || invoiceModal.movement?.invoiceId || '—'}
          description={invoiceModal.movement?.concept || '—'}
          amount={invoiceModal.movement?.amount || '0,00 €'}
          date={
            invoiceModal.invoice?.issueDate
              ? new Date(invoiceModal.invoice.issueDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : invoiceModal.movement?.day
                ? new Date(`${invoiceModal.movement.day}T00:00:00`).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
              : '—'
          }
          status={invoiceModal.movement?.collectionStatus === 'Cobrado' ? 'Cobrado' : 'Pendiente'}
          paymentMethod={invoiceModal.payments?.[0]?.paymentMethod || invoiceModal.movement?.method || '-'}
          insurer={invoiceModal.invoice?.insurer || invoiceModal.movement?.insurer || '-'}
          patientName={invoiceModal.invoice?.patientName || invoiceModal.movement?.patient || '-'}
          patientNIF={invoiceModal.invoice?.patientNif || '-'}
          professional={invoiceModal.invoice?.professional || '-'}
          budgetId={invoiceModal.movement?.quoteId || undefined}
          paymentDate={
            invoiceModal.payments?.[0]?.transactionDate
              ? new Date(invoiceModal.payments[0].transactionDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : undefined
          }
          paymentReference={invoiceModal.payments?.[0]?.paymentReference || undefined}
          onDownloadPdf={() => window.print()}
        />
      )}

      {modifyPaymentModal.open && (
        <div
          className='fixed inset-0 z-[90] bg-black/30'
          onClick={() => setModifyPaymentModal((p) => ({ ...p, open: false }))}
        >
          <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
            <div
              className='w-[min(30rem,95vw)] rounded-xl bg-surface shadow-elevation-popover overflow-hidden'
              onClick={(e) => e.stopPropagation()}
              role='dialog'
              aria-modal='true'
              aria-label='Modify transaction'
            >
              <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
                <p className='text-title-md font-medium text-fg'>Modify transaction</p>
                <button
                  type='button'
                  className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  onClick={() => setModifyPaymentModal((p) => ({ ...p, open: false }))}
                  aria-label='Close'
                >
                  <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
                </button>
              </header>
              <div className='p-[1.25rem] space-y-[1rem]'>
                {modifyPaymentModal.loading ? (
                  <div className='text-neutral-600'>Loading…</div>
                ) : (
                  <>
                    <div className='text-body-sm text-neutral-600'>
                      This updates the <span className='font-medium text-fg'>latest payment</span> method for the invoice.
                    </div>
                    <label className='flex flex-col gap-[0.25rem] text-body-sm text-fg'>
                      Payment method
                      <select
                        value={modifyPaymentModal.paymentMethod}
                        onChange={(e) =>
                          setModifyPaymentModal((p) => ({ ...p, paymentMethod: e.target.value }))
                        }
                        className='rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                      >
                        {PAYMENT_FILTERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    {modifyPaymentModal.error ? (
                      <div className='text-body-sm text-error-600'>{modifyPaymentModal.error}</div>
                    ) : null}
                    <div className='flex items-center justify-end gap-[0.75rem]'>
                      <button
                        type='button'
                        className='rounded-full border border-border bg-surface px-[1rem] py-[0.5rem] text-title-sm text-fg hover:bg-neutral-50'
                        onClick={() => setModifyPaymentModal((p) => ({ ...p, open: false }))}
                        disabled={modifyPaymentModal.saving}
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        className='rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 hover:bg-brand-400 disabled:opacity-50'
                        onClick={saveModifiedPayment}
                        disabled={modifyPaymentModal.saving}
                      >
                        {modifyPaymentModal.saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deletePaymentModal.open && (
        <div
          className='fixed inset-0 z-[95] bg-black/30'
          onClick={() => setDeletePaymentModal((p) => ({ ...p, open: false }))}
        >
          <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
            <div
              className='w-[min(30rem,95vw)] rounded-xl bg-surface shadow-elevation-popover overflow-hidden'
              onClick={(e) => e.stopPropagation()}
              role='dialog'
              aria-modal='true'
              aria-label='Delete transaction'
            >
              <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
                <p className='text-title-md font-medium text-fg'>Delete transaction</p>
                <button
                  type='button'
                  className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  onClick={() => setDeletePaymentModal((p) => ({ ...p, open: false }))}
                  aria-label='Close'
                >
                  <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
                </button>
              </header>
              <div className='p-[1.25rem] space-y-[1rem]'>
                <div className='text-body-sm text-neutral-600'>
                  This will delete the <span className='font-medium text-fg'>latest payment</span> for the invoice.
                </div>
                {deletePaymentModal.error ? (
                  <div className='text-body-sm text-error-600'>{deletePaymentModal.error}</div>
                ) : null}
                <div className='flex items-center justify-end gap-[0.75rem]'>
                  <button
                    type='button'
                    className='rounded-full border border-border bg-surface px-[1rem] py-[0.5rem] text-title-sm text-fg hover:bg-neutral-50'
                    onClick={() => setDeletePaymentModal((p) => ({ ...p, open: false }))}
                    disabled={deletePaymentModal.deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    className='rounded-full bg-error-600 px-[1rem] py-[0.5rem] text-title-sm font-medium text-white hover:bg-error-500 disabled:opacity-50'
                    onClick={confirmDeletePayment}
                    disabled={deletePaymentModal.deleting}
                  >
                    {deletePaymentModal.deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {registerPaymentModal.open && registerPaymentModal.movement && (
        <NewPaymentModal
          open={registerPaymentModal.open}
          onClose={() => setRegisterPaymentModal({ open: false, movement: null })}
          onSubmit={submitRegisterPayment}
          patientId={registerPaymentModal.movement.patientId || ''}
          patientName={registerPaymentModal.movement.patient}
          concept={registerPaymentModal.movement.concept}
          pendingAmount={Math.max(registerPaymentModal.movement.outstandingAmount, 0)}
          originalTransactionId={registerPaymentModal.movement.id}
        />
      )}

      {receiptModal.open && (
        <ReceiptPreviewModal
          open={receiptModal.open}
          onClose={() =>
            setReceiptModal({ open: false, movement: null, transactionData: undefined })
          }
          receipt={null}
          transactionData={
            receiptModal.transactionData
              ? receiptModal.transactionData
              : receiptModal.movement
              ? {
                  patientName: receiptModal.movement.patient,
                  concept: receiptModal.movement.concept,
                  amount: Number(
                    String(receiptModal.movement.amount)
                      .replace(/[^\d,.-]/g, '')
                      .replace(/\./g, '')
                      .replace(',', '.')
                  ) || 0,
                  paymentMethod: mapMovementMethodToReceiptMethod(
                    receiptModal.movement.method,
                    receiptModal.movement.paymentCategory
                  ),
                  date: `${receiptModal.movement.day}T12:00:00.000Z`
                }
              : undefined
          }
        />
      )}

      <PatientRecordModal
        open={patientModal.open}
        patientId={patientModal.patientId || undefined}
        onClose={() => setPatientModal({ open: false, patientId: null })}
      />

      {treatmentModal.open && (
        <div
          className='fixed inset-0 z-[70] flex items-center justify-center bg-black/30'
          role='dialog'
          aria-modal='true'
          onClick={() => setTreatmentModal({ open: false, quoteId: null, loading: false })}
        >
          <div
            className='w-[min(46rem,92vw)] rounded-xl bg-surface shadow-elevation-popover overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
              <p className='text-title-md font-medium text-fg'>
                {treatmentModal.title || 'Treatment details'}
              </p>
              <button
                type='button'
                className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                onClick={() => setTreatmentModal({ open: false, quoteId: null, loading: false })}
                aria-label='Close'
              >
                <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
              </button>
            </header>

            <div className='p-[1.25rem]'>
              {treatmentModal.loading ? (
                <div className='py-6 text-neutral-600'>Loading…</div>
              ) : (treatmentModal.items || []).length === 0 ? (
                <div className='py-6 text-neutral-600'>No services found for this treatment.</div>
              ) : (
                <div className='rounded-md border border-border overflow-hidden'>
                  <div className='grid grid-cols-3 bg-neutral-50 px-4 py-2 text-label-sm text-neutral-600'>
                    <div>Service</div>
                    <div className='text-right'>Qty</div>
                    <div className='text-right'>Price</div>
                  </div>
                  {(treatmentModal.items || []).map((it, idx) => (
                    <div
                      key={`${it.label}-${idx}`}
                      className='grid grid-cols-3 px-4 py-2 border-t border-border text-body-sm text-neutral-800'
                    >
                      <div className='min-w-0'>
                        <div className='truncate'>{it.label}</div>
                        {it.source ? (
                          <div className='text-[0.75rem] text-neutral-500'>Source: {it.source}</div>
                        ) : null}
                      </div>
                      <div className='text-right tabular-nums'>{it.quantity ?? 1}</div>
                      <div className='text-right tabular-nums'>
                        {Number(it.finalPrice ?? it.unitPrice ?? 0).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        €
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function SearchInput({
  value,
  onChange,
  suggestions,
  loading,
  onPickSuggestion
}: {
  value: string
  onChange: (value: string) => void
  suggestions?: Array<{ id: string; name: string }>
  loading?: boolean
  onPickSuggestion?: (name: string) => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className='relative' style={{ width: `min(${SEARCH_WIDTH_REM}rem, 100%)` }}>
      <form
        onSubmit={handleSubmit}
        className='flex items-center rounded-full border border-border bg-surface px-[0.75rem] text-neutral-600 focus-within:ring-2 focus-within:ring-brandSemantic'
        style={{
          width: '100%',
          height: `${CONTROL_HEIGHT_REM}rem`
        }}
      >
        <span className='material-symbols-rounded text-[1rem] text-neutral-500'>search</span>
        <input
          className='ml-[0.5rem] w-full bg-transparent text-body-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none'
          placeholder='Buscar paciente'
          aria-label='Buscar paciente'
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {loading ? (
          <span className='material-symbols-rounded ml-[0.25rem] text-[1rem] text-neutral-400'>
            progress_activity
          </span>
        ) : null}
      </form>

      {onPickSuggestion && (suggestions?.length || 0) > 0 && value.trim().length >= 2 && (
        <div className='absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[30] rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          <ul className='max-h-[14rem] overflow-auto py-[0.25rem]'>
            {suggestions!.map((p) => (
              <li key={p.id}>
                <button
                  type='button'
                  onClick={() => onPickSuggestion(p.name)}
                  className='flex w-full items-center px-[0.75rem] py-[0.5rem] text-left text-body-sm text-neutral-900 hover:bg-neutral-50'
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className='flex items-center gap-[0.5rem] text-label-sm text-neutral-600'>
      <span className='whitespace-nowrap'>{label}</span>
      <input
        type='date'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-full rounded-full border border-border bg-surface px-[0.75rem] text-body-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brandSemantic'
        style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className='flex items-center gap-[0.5rem] text-label-sm text-neutral-600'>
      <span className='whitespace-nowrap'>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-full rounded-full border border-border bg-surface px-[0.75rem] text-body-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brandSemantic'
        style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterChip({
  label,
  icon,
  active,
  onClick
}: {
  label: string
  icon?: string
  active?: boolean
  onClick: () => void
}) {
  const baseClass =
    'inline-flex items-center justify-center gap-[0.375rem] rounded-full border px-[0.75rem] text-label-sm font-medium transition-colors'

  const activeClass = 'border-brand-200 bg-brand-50 text-brand-900'
  const inactiveClass = 'border-border text-neutral-600 hover:bg-neutral-50'

  return (
    <button
      type='button'
      className={`${baseClass} ${active ? activeClass : inactiveClass}`}
      style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon && <span className='material-symbols-rounded text-[1rem]'>{icon}</span>}
      {label}
    </button>
  )
}

function StatusCell({ movement }: { movement: CashMovement }) {
  // Bubble click to table component via event delegation (keeps column API simple)
  const handleClick = () => {
    // v2.0: interaction is only required for "Por cobrar"
    if (movement.collectionStatus !== 'Por cobrar') return
    window.dispatchEvent(
      new CustomEvent('caja:open-invoice-payments', {
        detail: { invoiceId: movement.invoiceId }
      })
    )
  }
  return (
    <button
      type='button'
      onClick={handleClick}
      className='text-left'
      aria-label='Ver historial de cobros'
    >
      <EstadoPill collectionStatus={movement.collectionStatus} />
    </button>
  )
}

function EstadoPill({ collectionStatus }: { collectionStatus: CollectionStatus }) {
  // v2.0: ESTADO column is ONLY payment status (Cobrado / Por cobrar)
  const textClass =
    collectionStatus === 'Cobrado' ? 'text-success-800' : 'text-warning-200'
  const borderClass =
    collectionStatus === 'Cobrado' ? 'border-success-800' : 'border-warning-200'
  const bgClass = collectionStatus === 'Cobrado' ? 'bg-success-50' : 'bg-warning-50'

  return (
    <span
      className={`inline-flex h-[1.75rem] items-center justify-center rounded-full border px-[0.75rem] text-label-sm font-medium ${bgClass} ${borderClass}`}
    >
      <span className={textClass}>{collectionStatus}</span>
    </span>
  )
}

function ProductionBadge({ movement }: { movement: CashMovement }) {
  const { can } = useUserRole()
  const isDone = movement.produced === 'Hecho'
  const badgeClass = isDone
    ? 'bg-success-200 text-success-800'
    : 'bg-neutral-200 text-neutral-700'

  // Per request: only clinical workflow can toggle.
  const canToggleProduced = can('clinical_notes', 'edit')

  const toggle = async () => {
    if (!movement.quoteId) return
    if (!canToggleProduced) return
    // Bubble up so the table can optimistically update the UI.
    window.dispatchEvent(
      new CustomEvent('caja:toggle-produced', {
        detail: { invoiceId: movement.invoiceId, quoteId: movement.quoteId, produced: movement.produced }
      })
    )
  }

  return (
    <button
      type='button'
      onClick={toggle}
      disabled={!movement.quoteId || !canToggleProduced}
      className='inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed'
      aria-label='Cambiar estado de producción'
    >
      <span
        className={`inline-flex h-[1.75rem] items-center rounded-full px-[0.75rem] text-label-sm font-medium ${badgeClass}`}
      >
        {isDone ? 'Hecho' : 'Pendiente'}
      </span>
    </button>
  )
}

function ActionsMenu({ movement }: { movement: CashMovement }) {
  const { can } = useUserRole()
  const [open, setOpen] = useState(false)
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false)
  const [showProducedSubmenu, setShowProducedSubmenu] = useState(false)
  const [showMethodSubmenu, setShowMethodSubmenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top?: number
    bottom?: number
    right: number
  }>({ right: 8, top: 0 })

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (
        (menuRef.current && target && menuRef.current.contains(target)) ||
        (buttonRef.current && target && buttonRef.current.contains(target))
      ) {
        return
      }
      setOpen(false)
      setShowStatusSubmenu(false)
      setShowProducedSubmenu(false)
      setShowMethodSubmenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const calculatePosition = () => {
      if (!buttonRef.current) return
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 420
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const margin = 8
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const right = Math.max(margin, viewportWidth - buttonRect.right)

      if (spaceBelow >= menuHeight + margin) {
        setMenuPosition({ top: buttonRect.bottom + margin, right })
        return
      }
      if (spaceAbove >= menuHeight + margin) {
        setMenuPosition({ bottom: viewportHeight - buttonRect.top + margin, right })
        return
      }
      const centeredTop = Math.max(
        margin,
        Math.min(
          viewportHeight - menuHeight - margin,
          buttonRect.top + buttonRect.height / 2 - menuHeight / 2
        )
      )
      setMenuPosition({ top: centeredTop, right })
    }

    calculatePosition()
    window.addEventListener('scroll', calculatePosition, true)
    window.addEventListener('resize', calculatePosition)
    return () => {
      window.removeEventListener('scroll', calculatePosition, true)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [open])

  const canRegisterPayment = can('payments', 'create')
  const canDeleteCash = can('cash', 'delete')
  const canToggleProduced = can('clinical_notes', 'edit')
  const statusOptions: CollectionStatus[] = ['Cobrado', 'Por cobrar']
  const producedOptions: ProductionState[] = ['Hecho', 'Pendiente']

  const closeMenu = () => {
    setOpen(false)
    setShowStatusSubmenu(false)
    setShowProducedSubmenu(false)
    setShowMethodSubmenu(false)
  }

  return (
    <div className='relative inline-flex' data-actions-dropdown>
      <button
        ref={buttonRef}
        type='button'
        aria-label='Acciones'
        className='mx-auto flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => {
            const next = !v
            if (!next) {
              setShowStatusSubmenu(false)
              setShowProducedSubmenu(false)
              setShowMethodSubmenu(false)
            }
            return next
          })
        }}
      >
        <span className='material-symbols-rounded text-[1.25rem] leading-none'>more_vert</span>
      </button>

      {open && (
        <Portal>
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[18.75rem] overflow-hidden rounded-[1rem] border border-border bg-neutral-0 shadow-elevation-popover'
            style={{ top: menuPosition.top, bottom: menuPosition.bottom, right: menuPosition.right }}
            role='menu'
            onClick={(e) => e.stopPropagation()}
            data-actions-dropdown
          >
          <div className='py-1'>
            <button
              type='button'
              className='flex w-full items-center gap-3 bg-neutral-100 px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-200'
              onClick={() => {
                closeMenu()
                window.dispatchEvent(
                  new CustomEvent('caja:open-patient-details', {
                    detail: { patientId: movement.patientId ?? null, patientName: movement.patient }
                  })
                )
              }}
            >
              <span className='material-symbols-rounded text-[1.4rem] text-neutral-500'>person</span>
              <span>Ver paciente</span>
            </button>

            <button
              type='button'
              className='flex w-full items-center gap-3 px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100'
              onClick={() => {
                closeMenu()
                window.dispatchEvent(new CustomEvent('caja:open-invoice', { detail: { invoiceId: movement.invoiceId } }))
              }}
            >
              <span className='material-symbols-rounded text-[1.4rem] text-neutral-500'>receipt_long</span>
              <span>Ver factura</span>
            </button>

            <button
              type='button'
              disabled={!canRegisterPayment}
              className='flex w-full items-center gap-3 px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
              onClick={() => {
                closeMenu()
                window.dispatchEvent(new CustomEvent('caja:register-payment', { detail: { invoiceId: movement.invoiceId } }))
              }}
            >
              <span className='material-symbols-rounded text-[1.4rem] text-neutral-500'>payments</span>
              <span>Nuevo pago</span>
            </button>

            <button
              type='button'
              className='flex w-full items-center gap-3 px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100'
              onClick={() => {
                closeMenu()
                window.dispatchEvent(new CustomEvent('caja:print-receipt', { detail: { invoiceId: movement.invoiceId } }))
              }}
            >
              <span className='material-symbols-rounded text-[1.4rem] text-neutral-500'>print</span>
              <span>Imprimir recibo</span>
            </button>
          </div>

          <div className='h-px bg-border' />

          <div className='py-1'>
            <button
              type='button'
              className='flex w-full items-center justify-between px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100'
              onClick={() => setShowStatusSubmenu((v) => !v)}
            >
              <div className='flex items-center gap-3'>
                <span
                  className={`size-5 rounded-full ${
                    movement.collectionStatus === 'Cobrado' ? 'bg-brandSemantic' : 'bg-warning-500'
                  }`}
                />
                <span>Estado</span>
              </div>
              <span className='material-symbols-rounded text-[1.3rem] text-neutral-500'>
                {showStatusSubmenu ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            {showStatusSubmenu && (
              <div className='bg-neutral-50 py-1'>
                {statusOptions.map((status) => {
                  const selected = status === movement.collectionStatus
                  return (
                    <button
                      key={status}
                      type='button'
                      disabled={
                        (status === 'Cobrado' && !canRegisterPayment) ||
                        (status === 'Por cobrar' && !canDeleteCash)
                      }
                      className={`flex w-full items-center gap-3 px-5 py-2 text-left text-body-sm ${
                        selected
                          ? 'bg-brand-0 font-medium text-brand-700'
                          : 'text-neutral-800 hover:bg-neutral-100'
                      }`}
                      onClick={() => {
                        if (selected) return
                        closeMenu()
                        if (status === 'Cobrado') {
                          window.dispatchEvent(new CustomEvent('caja:register-payment', { detail: { invoiceId: movement.invoiceId } }))
                          return
                        }
                        window.dispatchEvent(new CustomEvent('caja:delete-transaction', { detail: { invoiceId: movement.invoiceId } }))
                      }}
                    >
                      <span
                        className={`size-2.5 rounded-full ${
                          status === 'Cobrado' ? 'bg-brandSemantic' : 'bg-warning-500'
                        }`}
                      />
                      <span>{status}</span>
                      {selected ? <span className='material-symbols-rounded ml-auto text-[1rem]'>check</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='py-1'>
            <button
              type='button'
              className='flex w-full items-center justify-between px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100'
              onClick={() => setShowProducedSubmenu((v) => !v)}
            >
              <div className='flex items-center gap-3'>
                <span
                  className={`size-5 rounded-full ${
                    movement.produced === 'Hecho' ? 'bg-success-500' : 'bg-neutral-400'
                  }`}
                />
                <span>Producido</span>
              </div>
              <span className='material-symbols-rounded text-[1.3rem] text-neutral-500'>
                {showProducedSubmenu ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            {showProducedSubmenu && (
              <div className='bg-neutral-50 py-1'>
                {producedOptions.map((produced) => {
                  const selected = produced === movement.produced
                  return (
                    <button
                      key={produced}
                      type='button'
                      disabled={!canToggleProduced || !movement.quoteId}
                      className={`flex w-full items-center gap-3 px-5 py-2 text-left text-body-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected ? 'bg-brand-0 font-medium text-brand-700' : 'text-neutral-800 hover:bg-neutral-100'
                      }`}
                      onClick={() => {
                        if (selected || !movement.quoteId) return
                        closeMenu()
                        window.dispatchEvent(
                          new CustomEvent('caja:toggle-produced', {
                            detail: { invoiceId: movement.invoiceId, quoteId: movement.quoteId, produced: movement.produced }
                          })
                        )
                      }}
                    >
                      <span
                        className={`size-2.5 rounded-full ${
                          produced === 'Hecho' ? 'bg-success-500' : 'bg-neutral-400'
                        }`}
                      />
                      <span>{produced}</span>
                      {selected ? <span className='material-symbols-rounded ml-auto text-[1rem]'>check</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='py-1'>
            <button
              type='button'
              className='flex w-full items-center justify-between px-4 py-3 text-left text-title-sm text-neutral-700 hover:bg-neutral-100'
              onClick={() => setShowMethodSubmenu((v) => !v)}
            >
              <div className='flex items-center gap-3'>
                <span className='material-symbols-rounded text-[1.2rem] text-neutral-600'>payments</span>
                <span>Método</span>
              </div>
              <span className='material-symbols-rounded text-[1.3rem] text-neutral-500'>
                {showMethodSubmenu ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            {showMethodSubmenu && (
              <div className='bg-neutral-50 py-1'>
                {PAYMENT_FILTERS.map((method) => {
                  const selected = method === movement.paymentCategory
                  return (
                    <button
                      key={method}
                      type='button'
                      disabled={selected}
                      className={`flex w-full items-center gap-3 px-5 py-2 text-left text-body-sm ${
                        selected ? 'bg-brand-0 font-medium text-brand-700' : 'text-neutral-800 hover:bg-neutral-100'
                      }`}
                      onClick={() => {
                        closeMenu()
                        window.dispatchEvent(
                          new CustomEvent('caja:modify-transaction', {
                            detail: { invoiceId: movement.invoiceId, method }
                          })
                        )
                      }}
                    >
                      <span>{method}</span>
                      {selected ? <span className='material-symbols-rounded ml-auto text-[1rem]'>check</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function PaginationIcon({
  icon,
  ariaLabel,
  disabled,
  onClick
}: {
  icon: string
  ariaLabel: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      aria-label={ariaLabel}
      className='size-6 inline-flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed'
      disabled={disabled}
      onClick={onClick}
    >
      <span className='material-symbols-rounded text-[1rem]'>{icon}</span>
    </button>
  )
}
