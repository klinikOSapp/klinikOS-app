'use client'

import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { useUserRole } from '@/context/role-context'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

type InvoiceStatus = 'Aceptado' | 'Enviado'
type ProductionState = 'Hecho' | 'Pendiente'
type PaymentCategory = 'Efectivo' | 'TPV' | 'Transferencia' | 'Financiación'
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

const TABLE_WIDTH_REM = 101 // 1616px ÷ 16
const TABLE_HEIGHT_REM = 27.5 // 440px ÷ 16
const SEARCH_WIDTH_REM = 23 // 368px ÷ 16
const CONTROL_HEIGHT_REM = 2 // 32px ÷ 16

const COLUMN_WIDTHS_REM = {
  time: 5.4, // 86.4px (90% of 96px)
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

const columns: ColumnDefinition[] = [
  {
    id: 'time',
    label: 'Día',
    widthRem: COLUMN_WIDTHS_REM.time,
    render: (movement) => {
      // Show DD/MM/YYYY (v2.0)
      const [y, m, d] = movement.day.split('-')
      return d && m && y ? `${d}/${m}/${y}` : movement.day
    }
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
  return `${borders} py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)] ${textAlign}`
}

const getBodyCellClasses = (index: number, align: 'left' | 'right' = 'left') => {
  const borders =
    index < totalColumns - 1 ? 'border-hairline-b border-hairline-r' : 'border-hairline-b'
  const textAlign = align === 'right' ? 'text-right' : 'text-left'
  return `${borders} py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900 ${textAlign}`
}

const PAYMENT_FILTERS: PaymentCategory[] = [
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
    }
    payments?: Array<{
      id: string
      amount: number
      transactionDate: string
      paymentMethod: string
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
    amount: string
    method: string
    notes: string
    isSaving: boolean
    error: string | null
  }>({
    open: false,
    movement: null,
    amount: '',
    method: 'TPV',
    notes: '',
    isSaving: false,
    error: null
  })

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
      fetch(`/api/caja/patients-search?q=${encodeURIComponent(q)}`, {
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
  }, [query])

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
      openInvoiceModal(movement)
    }
    window.addEventListener('caja:open-invoice', handler as EventListener)
    return () => window.removeEventListener('caja:open-invoice', handler as EventListener)
  }, [movements])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openModifyPaymentModal(movement)
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
    if (!silent) setIsLoading(true)
    const params = new URLSearchParams()
    params.set('date', formatMadridDate(date))
    params.set('timeScale', timeScale)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    if (query.trim()) params.set('patient', query.trim())
    if (paymentMethod) params.set('paymentMethod', paymentMethod)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)

    fetch(`/api/caja/movements?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const next = Array.isArray(data.movements) ? (data.movements as CashMovement[]) : []
        const nextHash = hashMovements(next)
        if (nextHash !== lastHashRef.current) {
          lastHashRef.current = nextHash
          setMovements(next)
        }
        if (!silent) setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching movements:', error)
        if (!silent) setIsLoading(false)
      })
  }

  // Fetch movements from API
  useEffect(() => {
    setCurrentPage(1)
    fetchMovements({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus])

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
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus, query])

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

  const openModifyPaymentModal = async (movement: CashMovement) => {
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
        paymentMethod: first?.paymentMethod ? String(first.paymentMethod) : 'TPV'
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
      movement,
      amount: '',
      method: movement.paymentCategory || 'TPV',
      notes: '',
      isSaving: false,
      error: null
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

  const submitRegisterPayment = async () => {
    const movement = registerPaymentModal.movement
    if (!movement) return
    const amount = Number(registerPaymentModal.amount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setRegisterPaymentModal((p) => ({ ...p, error: 'Introduce un importe válido' }))
      return
    }

    setRegisterPaymentModal((p) => ({ ...p, isSaving: true, error: null }))
    try {
      const res = await fetch('/api/caja/register-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: movement.invoiceId,
          amount,
          paymentMethod: registerPaymentModal.method,
          notes: registerPaymentModal.notes || null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setRegisterPaymentModal((p) => ({ ...p, isSaving: false, error: data?.error || 'Error' }))
        return
      }
      setRegisterPaymentModal((p) => ({ ...p, isSaving: false, open: false }))
      // refresh movements and payment history silently
      fetchMovements({ silent: true })
      if (paymentsModal.open && paymentsModal.movement?.invoiceId === movement.invoiceId) {
        openPaymentsModal(movement)
      }
    } catch (e: any) {
      setRegisterPaymentModal((p) => ({ ...p, isSaving: false, error: e?.message || 'Error' }))
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
      <div className='flex flex-wrap items-center gap-gapsm'>
        <SearchInput
          value={query}
          onChange={setQuery}
          suggestions={patientSuggestions}
          loading={isSuggesting}
          onPickSuggestion={(name) => setQuery(name)}
        />
        <div className='flex flex-wrap items-center gap-gapsm'>
          <DateField label='Desde' value={fromDate} onChange={setFromDate} />
          <DateField label='Hasta' value={toDate} onChange={setToDate} />
        </div>
        <div className='ml-auto flex flex-wrap items-center gap-gapsm'>
          <SelectField
            label='Método'
            value={paymentMethod}
            options={[
              { value: '', label: 'Todos' },
              ...PAYMENT_FILTERS.map((v) => ({ value: v, label: v }))
            ]}
            onChange={(v) => setPaymentMethod(v as any)}
          />
          <SelectField
            label='Estado'
            value={paymentStatus}
            options={[
              { value: '', label: 'Todos' },
              ...COLLECTION_STATUS_FILTERS.map((v) => ({ value: v, label: v }))
            ]}
            onChange={(v) => setPaymentStatus(v as any)}
          />
          <SelectField
            label='Filas'
            value={String(pageSize)}
            options={[
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' }
            ]}
            onChange={(v) => setPageSize(Number(v))}
          />
        </div>
      </div>

      <div ref={tableContainerRef} className='mt-6 flex-1 overflow-hidden rounded-lg'>
        <div className='h-full overflow-y-auto overflow-x-hidden'>
          <table className='w-full table-fixed border-collapse text-left'>
            <thead>
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

      {invoiceModal.open && (
        <div
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/30'
          role='dialog'
          aria-modal='true'
        >
          <div className='w-[min(44rem,92vw)] rounded-lg bg-surface shadow-elevation-card p-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-title-sm font-medium text-fg'>Invoice</h3>
              <button
                type='button'
                className='size-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100'
                onClick={() => setInvoiceModal({ open: false, movement: null, loading: false })}
                aria-label='Cerrar'
              >
                <span className='material-symbols-rounded text-[1.25rem]'>close</span>
              </button>
            </div>

            {invoiceModal.loading ? (
              <div className='py-6 text-neutral-600'>Loading…</div>
            ) : (
              <>
                <div className='mt-4 grid grid-cols-3 gap-3 text-body-sm text-neutral-700'>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Invoice #</div>
                    <div className='font-medium'>{invoiceModal.invoice?.invoiceNumber ?? '—'}</div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Total</div>
                    <div className='font-medium'>
                      {invoiceModal.invoice?.totalAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Outstanding</div>
                    <div className='font-medium'>
                      {invoiceModal.invoice?.outstandingAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                </div>

                <div className='mt-4 rounded-md border border-border overflow-hidden'>
                  <div className='grid grid-cols-3 bg-neutral-50 px-4 py-2 text-label-sm text-neutral-600'>
                    <div>Date</div>
                    <div>Method</div>
                    <div className='text-right'>Amount</div>
                  </div>
                  {(invoiceModal.payments || []).length === 0 ? (
                    <div className='px-4 py-4 text-neutral-600'>No payments for this invoice.</div>
                  ) : (
                    (invoiceModal.payments || []).map((p) => (
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

      {registerPaymentModal.open && (
        <div className='fixed inset-0 z-[80] bg-black/30' onClick={() => setRegisterPaymentModal((p) => ({ ...p, open: false }))}>
          <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
            <div
              className='w-[min(34rem,95vw)] rounded-xl bg-surface shadow-elevation-popover overflow-hidden'
              onClick={(e) => e.stopPropagation()}
              role='dialog'
              aria-modal='true'
              aria-label='Registrar pago'
            >
              <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
                <p className='text-title-md font-medium text-fg'>Registrar pago</p>
                <button
                  type='button'
                  className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  onClick={() => setRegisterPaymentModal((p) => ({ ...p, open: false }))}
                  aria-label='Cerrar'
                >
                  <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
                </button>
              </header>
              <div className='p-[1.25rem] space-y-[1rem]'>
                <div className='text-body-sm text-neutral-600'>
                  Factura <span className='font-medium text-fg'>#{registerPaymentModal.movement?.invoiceId}</span>
                </div>
                <div className='grid grid-cols-2 gap-[0.75rem]'>
                  <label className='flex flex-col gap-[0.25rem] text-body-sm text-fg'>
                    Importe (€)
                    <input
                      value={registerPaymentModal.amount}
                      onChange={(e) => setRegisterPaymentModal((p) => ({ ...p, amount: e.target.value }))}
                      className='rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                      inputMode='decimal'
                      placeholder='0,00'
                    />
                  </label>
                  <label className='flex flex-col gap-[0.25rem] text-body-sm text-fg'>
                    Método
                    <select
                      value={registerPaymentModal.method}
                      onChange={(e) => setRegisterPaymentModal((p) => ({ ...p, method: e.target.value }))}
                      className='rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                    >
                      {PAYMENT_FILTERS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className='flex flex-col gap-[0.25rem] text-body-sm text-fg'>
                  Nota (opcional)
                  <textarea
                    value={registerPaymentModal.notes}
                    onChange={(e) => setRegisterPaymentModal((p) => ({ ...p, notes: e.target.value }))}
                    className='min-h-[5rem] rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                    placeholder='Ej: Pago parcial en recepción...'
                  />
                </label>
                {registerPaymentModal.error ? (
                  <div className='text-body-sm text-error-600'>{registerPaymentModal.error}</div>
                ) : null}
                <div className='flex items-center justify-end gap-[0.75rem]'>
                  <button
                    type='button'
                    className='rounded-full border border-border bg-surface px-[1rem] py-[0.5rem] text-title-sm text-fg hover:bg-neutral-50'
                    onClick={() => setRegisterPaymentModal((p) => ({ ...p, open: false }))}
                    disabled={registerPaymentModal.isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type='button'
                    className='rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 hover:bg-brand-400 disabled:opacity-50'
                    onClick={submitRegisterPayment}
                    disabled={registerPaymentModal.isSaving}
                  >
                    {registerPaymentModal.isSaving ? 'Guardando…' : 'Guardar pago'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  const icon = isDone ? 'check_box' : 'check_box_outline_blank'

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
      className='flex items-center gap-[0.25rem] disabled:opacity-50 disabled:cursor-not-allowed'
      aria-label='Cambiar estado de producción'
    >
      <span
        className={`material-symbols-rounded text-[1.25rem] ${
          isDone ? 'text-success-800' : 'text-neutral-500'
        }`}
      >
        {icon}
      </span>
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

  useEffect(() => {
    if (!open) return
    const onDoc = () => setOpen(false)
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])

  const canRegisterPayment = can('payments', 'create')
  const canEditCash = can('cash', 'edit')
  const canDeleteCash = can('cash', 'delete')
  const isPorCobrar = movement.collectionStatus === 'Por cobrar'

  return (
    <div className='relative flex justify-end'>
      <button
        type='button'
        aria-label='Acciones'
        className='size-8 inline-flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <span className='material-symbols-rounded text-[1.25rem] leading-5'>more_vert</span>
      </button>

      {open && (
        <div
          className='absolute right-0 top-[2.25rem] z-[50] w-[14rem] rounded-xl border border-border bg-surface shadow-elevation-popover overflow-hidden'
          role='menu'
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50'
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(
                new CustomEvent('caja:open-invoice-payments', { detail: { invoiceId: movement.invoiceId } })
              )
            }}
          >
            Payment history
          </button>

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent'
            disabled={!canRegisterPayment || !isPorCobrar}
            onClick={() => {
              setOpen(false)
              // bubble up via event to table component
              window.dispatchEvent(new CustomEvent('caja:register-payment', { detail: { invoiceId: movement.invoiceId } }))
            }}
          >
            Register payment
          </button>

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50'
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(new CustomEvent('caja:open-invoice', { detail: { invoiceId: movement.invoiceId } }))
            }}
          >
            View invoice
          </button>

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50'
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(
                new CustomEvent('caja:open-patient-details', {
                  detail: { patientId: movement.patientId ?? null, patientName: movement.patient }
                })
              )
            }}
          >
            View patient details
          </button>

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50'
            onClick={() => {
              setOpen(false)
              if (!movement.quoteId) return
              window.dispatchEvent(
                new CustomEvent('caja:open-treatment-details', {
                  detail: { quoteId: movement.quoteId }
                })
              )
            }}
          >
            View/edit treatment
          </button>

          <div className='h-px bg-border' />

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-fg hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent'
            disabled={!canEditCash}
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(
                new CustomEvent('caja:modify-transaction', { detail: { invoiceId: movement.invoiceId } })
              )
            }}
          >
            Modificar transacción
          </button>

          <button
            type='button'
            className='w-full px-[0.75rem] py-[0.625rem] text-left text-body-sm text-error-600 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent'
            disabled={!canDeleteCash}
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(
                new CustomEvent('caja:delete-transaction', { detail: { invoiceId: movement.invoiceId } })
              )
            }}
          >
            Eliminar transacción
          </button>
        </div>
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




