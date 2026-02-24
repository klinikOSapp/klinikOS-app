/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  AddRounded,
  AttachEmailRounded,
  BarChartRounded,
  CalendarMonthRounded,
  CancelRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteRounded,
  DescriptionRounded,
  DownloadRounded,
  EditRounded,
  ElectricBoltRounded,
  EuroRounded,
  FirstPageRounded,
  KeyboardArrowDownRounded,
  LastPageRounded,
  MoreVertRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  SearchRounded,
  TimelineRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import {
  addBudgetType,
  convertBudgetTypeToTreatmentsV2,
  type BudgetTypeData
} from '@/components/pacientes/shared/budgetTypeData'
import type { TreatmentV2 } from '@/components/pacientes/shared/treatmentTypes'
import { useClinic } from '@/context/ClinicContext'
import { usePatients, type PatientTreatment } from '@/context/PatientsContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { BudgetInstallmentPlan, BudgetPayment } from '@/types/payments'
import { setPendingAppointmentData } from '@/utils/appointmentPrefill'
import {
  downloadBlob,
  formatBudgetFilename,
  formatReceiptFilename,
  generateBudgetPDF,
  generateDocumentPDF,
  generatePaymentReceiptPDF,
  generateReceiptNumber
} from '@/utils/exportUtils'
import { useRouter } from 'next/navigation'
import React from 'react'
import { createPortal } from 'react-dom'
import AddProductionModal from './AddProductionModal'
import AddTreatmentsToBudgetModal from './AddTreatmentsToBudgetModal'
import BudgetDetailsModal from './BudgetDetailsModal'
import BudgetQuickPaymentModal, {
  type QuickPaymentFormData
} from './BudgetQuickPaymentModal'
import BudgetTypeListModal from './BudgetTypeListModal'
import EditBudgetModal from './EditBudgetModal'
import EditProductionModal from './EditProductionModal'
import InvoiceDetailsModal from './InvoiceDetailsModal'
import InvoiceProductionModal from './InvoiceProductionModal'
import MarkAsProducedModal from './MarkAsProducedModal'
import PaymentDetailsModal from './PaymentDetailsModal'
import ProductionDetailsModal from './ProductionDetailsModal'
import RegisterPaymentModal from './RegisterPaymentModal'
import TraceabilityModal from './TraceabilityModal'

type BudgetsPaymentsProps = {
  onClose?: () => void
  openBudgetCreation?: boolean
  onBudgetCreationOpened?: () => void
  patientId?: string
  patientName?: string
  // Shared state props (optional - uses local state if not provided)
  budgetRows?: BudgetRow[]
  onAddBudget?: (budget: BudgetRow) => void
  onUpdateBudgetRows?: (rows: BudgetRow[]) => void
}

type ActionMenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

type ActionsMenuProps = {
  rowId: string
  status: StatusType
  onAction: (rowId: string, action: string) => void
}

function ActionsMenu({ rowId, status, onAction }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const [openUpward, setOpenUpward] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate position and check if menu should open upward
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 280 // Approximate menu height
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setOpenUpward(shouldOpenUpward)
      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 205 // Menu width is ~205px, align to right
      })
    }
    setIsOpen(!isOpen)
  }

  // Define actions based on status
  const getMenuItems = (): ActionMenuItem[] => {
    // Actions for "Producido" status
    if (status === 'Producido') {
      return [
        {
          id: 'facturar',
          label: 'Facturar',
          icon: <EuroRounded className='size-6' />,
          onClick: () => onAction(rowId, 'facturar')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'editar',
          label: 'Editar fecha/notas',
          icon: <EditRounded className='size-6' />,
          onClick: () => onAction(rowId, 'editar')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'marcar-producido',
          label: 'Marcar como producido',
          icon: <CheckCircleRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-producido')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Facturado" status
    if (status === 'Facturado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'ver-factura',
          label: 'Ver factura',
          icon: <EuroRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-factura')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[12.8125rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
            data-node-id='3092:10033'
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === BUDGET ACTIONS MENU ===
type BudgetActionsMenuProps = {
  rowId: string
  status: BudgetStatusType
  onAction: (rowId: string, action: string) => void
}

function BudgetActionsMenu({
  rowId,
  status,
  onAction
}: BudgetActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 380
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 250
      })
    }
    setIsOpen(!isOpen)
  }

  const getBudgetMenuItems = (): ActionMenuItem[] => {
    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'marcar-aceptado',
          label: 'Marcar como aceptado',
          icon: <CheckCircleRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-aceptado')
        },
        {
          id: 'marcar-rechazado',
          label: 'Marcar como rechazado',
          icon: <CancelRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-rechazado')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'editar',
          label: 'Editar',
          icon: <EditRounded className='size-6' />,
          onClick: () => onAction(rowId, 'editar')
        },
        {
          id: 'duplicar',
          label: 'Duplicar',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'duplicar')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar email',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Aceptado" status
    if (status === 'Aceptado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-produccion',
          label: 'Ver producción',
          icon: <BarChartRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-produccion')
        },
        {
          id: 'crear-citas',
          label: 'Crear citas',
          icon: <CalendarMonthRounded className='size-6' />,
          onClick: () => onAction(rowId, 'crear-citas')
        },
        {
          id: 'convertir-factura',
          label: 'Convertir a factura',
          icon: <ReceiptLongRounded className='size-6' />,
          onClick: () => onAction(rowId, 'convertir-factura')
        },
        {
          id: 'duplicar',
          label: 'Duplicar',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'duplicar')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar email',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Rechazado" status
    if (status === 'Rechazado') {
      return [
        {
          id: 'reabrir',
          label: 'Reabrir presupuesto',
          icon: <CheckCircleRounded className='size-6' />,
          onClick: () => onAction(rowId, 'reabrir')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'duplicar',
          label: 'Duplicar',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'duplicar')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getBudgetMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[15.625rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === PRODUCCIÓN TYPES ===
type StatusType = 'Producido' | 'Pendiente' | 'Facturado'

const STATUS_OPTIONS: StatusType[] = ['Producido', 'Pendiente', 'Facturado']

type ProductionRow = {
  id: string
  date: string
  description: string
  amount: string
  status: StatusType
  professional: string
  // Referencias para conexión a DB
  budgetId?: string
  quoteId?: number
  patientId?: string
}

// === PRESUPUESTOS TYPES (exported for shared state) ===
export type BudgetStatusType = 'Aceptado' | 'Pendiente' | 'Rechazado'

export const BUDGET_STATUS_OPTIONS: BudgetStatusType[] = [
  'Aceptado',
  'Pendiente',
  'Rechazado'
]

// Tipo para tratamientos incluidos en un presupuesto
export type BudgetTreatment = {
  pieza?: number
  cara?: string
  codigo?: string
  tratamiento: string
  precio: string
  porcentajeDescuento?: number
  descuento: string
  importe: string
  doctor?: string
}

// Tipo para historial de cambios del presupuesto
export type BudgetHistoryEntry = {
  date: string
  action: string
  user?: string
}

// Tipo para descuento general
export type BudgetGeneralDiscount = {
  type: 'percentage' | 'fixed'
  value: number
}

export type BudgetRow = {
  id: string
  description: string
  amount: string
  date: string
  status: BudgetStatusType
  professional: string
  insurer?: string
  // Referencias para conexión a DB
  patientId?: string
  patientName?: string
  quoteId?: number
  planId?: number
  // Campos extendidos para detalles
  treatments?: BudgetTreatment[]
  generalDiscount?: BudgetGeneralDiscount
  subtotal?: number
  validUntil?: string
  history?: BudgetHistoryEntry[]
  // Campos para pagos fraccionados
  installmentPlan?: BudgetInstallmentPlan
  payments?: BudgetPayment[]
}

// === FACTURAS TYPES ===
type InvoiceStatusType = 'Cobrado' | 'Pendiente'

const INVOICE_STATUS_OPTIONS: InvoiceStatusType[] = ['Cobrado', 'Pendiente']

type InvoiceRow = {
  id: string
  description: string
  amount: string
  date: string
  status: InvoiceStatusType
  paymentMethod: string
  insurer: string
  dbInvoiceId?: number
  quoteId?: number
  amountNumber?: number
  amountPaidNumber?: number
  issueTimestamp?: string
}

type DbQuoteRow = {
  id: number
  plan_id: number | null
  quote_number: string | null
  status: string | null
  total_amount: number | null
  issue_date: string | null
  expiry_date: string | null
  signed_at: string | null
  production_status: string | null
  production_date: string | null
}

type DbQuoteItemRow = {
  id: number
  quote_id: number | null
  service_id: number | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  discount_percentage: number | null
  final_price: number | null
}

type DbTreatmentPlanRow = {
  id: number
  name: string | null
}

type DbTreatmentPlanItemRow = {
  id: number
  plan_id: number | null
  service_id: number | null
  tooth_number: number | null
  notes: string | null
}

type DbServiceCatalogRow = {
  id: number
  treatment_code: string | null
  name: string | null
}

type DbInvoiceRow = {
  id: number
  quote_id: number | null
  invoice_number: string | null
  status: string | null
  issue_date: string | null
  issue_timestamp: string | null
  total_amount: number | null
  amount_paid: number | null
}

type DbPaymentRow = {
  id: number
  invoice_id: number | null
  payment_method: string | null
  amount: number | null
  transaction_date: string | null
}

function formatEuroAmount(value: number): string {
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} €`
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

function mapDbQuoteStatusToUi(status: string | null | undefined): BudgetStatusType {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'accepted' || normalized === 'signed' || normalized === 'approved') {
    return 'Aceptado'
  }
  if (
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'declined' ||
    normalized === 'void'
  ) {
    return 'Rechazado'
  }
  return 'Pendiente'
}

function mapUiBudgetStatusToDb(status: BudgetStatusType): string {
  switch (status) {
    case 'Aceptado':
      return 'accepted'
    case 'Rechazado':
      return 'rejected'
    case 'Pendiente':
    default:
      return 'sent'
  }
}

function mapDbInvoiceStatusToUi(status: string | null | undefined): InvoiceStatusType {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'paid' || normalized === 'accepted' ? 'Cobrado' : 'Pendiente'
}

function mapDbPaymentMethodToUi(method: string | null | undefined): string {
  const normalized = String(method || '').toLowerCase().trim()
  if (!normalized) return ''
  if (normalized.includes('efectivo') || normalized.includes('cash')) return 'Efectivo'
  if (normalized.includes('tarjeta') || normalized.includes('card') || normalized.includes('tpv')) {
    return 'Tarjeta'
  }
  if (normalized.includes('transfer')) return 'Transferencia'
  if (normalized.includes('financi')) return 'Financiación'
  return method || ''
}

function mapDbProductionStatusToUi(status: string | null | undefined): StatusType {
  return status === 'Done' ? 'Producido' : 'Pendiente'
}

function parseEuroAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (!value) return 0

  const normalized = String(value)
    .replace(/[€\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parsePlanItemNotes(
  value: string | null | undefined
): {
  cara?: string
  doctor?: string
  codigo?: string
  importeSeguro?: string
} {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return {
      cara: typeof parsed.cara === 'string' ? parsed.cara : undefined,
      doctor: typeof parsed.doctor === 'string' ? parsed.doctor : undefined,
      codigo: typeof parsed.codigo === 'string' ? parsed.codigo : undefined,
      importeSeguro:
        typeof parsed.importeSeguro === 'string'
          ? parsed.importeSeguro
          : undefined
    }
  } catch {
    return {}
  }
}

function convertPatientTreatmentToBudgetTreatment(
  treatment: PatientTreatment
): TreatmentV2 {
  const toothNumber = treatment.tooth
    ? parseInt(String(treatment.tooth).split(',')[0].trim(), 10)
    : undefined

  return {
    _internalId: treatment.id,
    pieza: Number.isFinite(toothNumber) ? toothNumber : undefined,
    cara: (treatment.toothFace as TreatmentV2['cara']) || undefined,
    codigo: treatment.code || '',
    tratamiento: treatment.description || 'Tratamiento',
    precio: treatment.amountFormatted || '0 €',
    importe: treatment.amountFormatted || '0 €',
    descuento: '0 €',
    porcentajeDescuento: 0,
    descripcionAnotaciones: treatment.notes || '',
    doctor: treatment.professional || 'Sin asignar',
    selected: Boolean(treatment.markedForNextAppointment)
  }
}

const INITIAL_INVOICE_ROWS: InvoiceRow[] = [
  {
    id: 'F-001',
    description: 'Operación mandíbula',
    amount: '2.300 €',
    date: '22/12/25',
    status: 'Cobrado',
    paymentMethod: 'Efectivo',
    insurer: 'Adeslas'
  },
  {
    id: 'F-002',
    description: 'Consulta inicial',
    amount: '150 €',
    date: '18/12/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-003',
    description: 'Radiografía',
    amount: '100 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'Sanitas'
  },
  {
    id: 'F-004',
    description: 'Extracción de muela',
    amount: '500 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'DKV'
  },
  {
    id: 'F-005',
    description: 'Implante dental',
    amount: '1.200 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Transferencia',
    insurer: 'Adelas'
  },
  {
    id: 'F-006',
    description: 'Férula de descarga',
    amount: '300 €',
    date: '01/12/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-007',
    description: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'DKV'
  },
  {
    id: 'F-008',
    description: 'Consulta de seguimiento',
    amount: '100 €',
    date: '30/08/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-009',
    description: 'Blanqueamiento dental',
    amount: '400 €',
    date: '11/03/25',
    status: 'Cobrado',
    paymentMethod: 'Efectivo',
    insurer: 'Sanitas'
  }
]

// ─────────────────────────────────────────────────────────────
// PRESUPUESTOS VINCULADOS A PACIENTES REALES
// IDs: budget-{patId}-{seq} para trazabilidad
// ─────────────────────────────────────────────────────────────
export const INITIAL_BUDGET_ROWS: BudgetRow[] = [
  // Carlos Rodríguez (pat-002) - Endodoncia + Corona
  {
    id: 'budget-002-01',
    patientId: 'pat-002',
    patientName: 'Carlos Rodríguez Fernández',
    description: 'Endodoncia y corona molar 36',
    amount: '770 €',
    date: '10/01/26',
    status: 'Aceptado',
    professional: 'Dr. Francisco Moreno',
    subtotal: 770,
    validUntil: '10/02/26',
    treatments: [
      {
        pieza: 36,
        tratamiento: 'Endodoncia molar',
        precio: '320 €',
        descuento: '0 €',
        importe: '320 €',
        doctor: 'Dr. Francisco Moreno'
      },
      {
        pieza: 36,
        tratamiento: 'Corona zirconio',
        precio: '450 €',
        descuento: '0 €',
        importe: '450 €',
        doctor: 'Dr. Antonio Ruiz'
      }
    ],
    history: [
      {
        date: '10/01/26 10:30',
        action: 'Presupuesto creado',
        user: 'Dr. Antonio Ruiz'
      },
      {
        date: '10/01/26 11:00',
        action: 'Aceptado - Financiación 3 cuotas',
        user: 'Sistema'
      }
    ],
    // Plan de cuotas: 3 cuotas de 256.67€ - 1 pagada, 2 pendientes
    installmentPlan: {
      totalInstallments: 3,
      amountPerInstallment: 256.67,
      totalAmount: 770,
      createdAt: '2026-01-10T11:00:00Z',
      installments: [
        {
          id: 'inst-002-01-1',
          installmentNumber: 1,
          amount: 256.67,
          status: 'paid' as const,
          paidAmount: 256.67,
          dueDate: '2026-01-10'
        },
        {
          id: 'inst-002-01-2',
          installmentNumber: 2,
          amount: 256.67,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-02-10'
        },
        {
          id: 'inst-002-01-3',
          installmentNumber: 3,
          amount: 256.66,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-03-10'
        }
      ]
    },
    payments: [
      {
        id: 'pay-002-01-1',
        budgetId: 'budget-002-01',
        date: '2026-01-10',
        amount: 256.67,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-002-01-1'],
        receiptGenerated: true,
        createdAt: '2026-01-10T11:15:00Z',
        createdBy: 'Recepción'
      }
    ]
  },
  // Ana Martínez VIP (pat-003) - Invisalign
  {
    id: 'budget-003-01',
    patientId: 'pat-003',
    patientName: 'Ana Martínez Sánchez',
    description: 'Tratamiento Invisalign completo',
    amount: '3.500 €',
    date: '01/09/25',
    status: 'Aceptado',
    professional: 'Dra. Elena Navarro',
    subtotal: 3500,
    generalDiscount: { type: 'percentage', value: 0 },
    validUntil: '01/10/25',
    treatments: [
      {
        tratamiento: 'Invisalign Full - 20 alineadores',
        precio: '3.500 €',
        descuento: '0 €',
        importe: '3.500 €',
        doctor: 'Dra. Elena Navarro'
      }
    ],
    history: [
      {
        date: '01/09/25 09:00',
        action: 'Presupuesto creado',
        user: 'Dra. Elena Navarro'
      },
      {
        date: '01/09/25 10:00',
        action: 'Aceptado - Financiación 10 cuotas',
        user: 'Sistema'
      }
    ],
    // Plan de cuotas: 10 cuotas de 350€ - 5 pagadas (desde sept 2025 a ene 2026)
    installmentPlan: {
      totalInstallments: 10,
      amountPerInstallment: 350,
      totalAmount: 3500,
      createdAt: '2025-09-01T10:00:00Z',
      installments: [
        {
          id: 'inst-003-01-1',
          installmentNumber: 1,
          amount: 350,
          status: 'paid' as const,
          paidAmount: 350,
          dueDate: '2025-09-01'
        },
        {
          id: 'inst-003-01-2',
          installmentNumber: 2,
          amount: 350,
          status: 'paid' as const,
          paidAmount: 350,
          dueDate: '2025-10-01'
        },
        {
          id: 'inst-003-01-3',
          installmentNumber: 3,
          amount: 350,
          status: 'paid' as const,
          paidAmount: 350,
          dueDate: '2025-11-01'
        },
        {
          id: 'inst-003-01-4',
          installmentNumber: 4,
          amount: 350,
          status: 'paid' as const,
          paidAmount: 350,
          dueDate: '2025-12-01'
        },
        {
          id: 'inst-003-01-5',
          installmentNumber: 5,
          amount: 350,
          status: 'paid' as const,
          paidAmount: 350,
          dueDate: '2026-01-01'
        },
        {
          id: 'inst-003-01-6',
          installmentNumber: 6,
          amount: 350,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-02-01'
        },
        {
          id: 'inst-003-01-7',
          installmentNumber: 7,
          amount: 350,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-03-01'
        },
        {
          id: 'inst-003-01-8',
          installmentNumber: 8,
          amount: 350,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-04-01'
        },
        {
          id: 'inst-003-01-9',
          installmentNumber: 9,
          amount: 350,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-05-01'
        },
        {
          id: 'inst-003-01-10',
          installmentNumber: 10,
          amount: 350,
          status: 'pending' as const,
          paidAmount: 0,
          dueDate: '2026-06-01'
        }
      ]
    },
    payments: [
      {
        id: 'pay-003-01-1',
        budgetId: 'budget-003-01',
        date: '2025-09-01',
        amount: 350,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-003-01-1'],
        receiptGenerated: true,
        createdAt: '2025-09-01T10:15:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-003-01-2',
        budgetId: 'budget-003-01',
        date: '2025-10-01',
        amount: 350,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-003-01-2'],
        receiptGenerated: true,
        createdAt: '2025-10-01T09:30:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-003-01-3',
        budgetId: 'budget-003-01',
        date: '2025-11-03',
        amount: 350,
        paymentMethod: 'transferencia' as const,
        installmentIds: ['inst-003-01-3'],
        receiptGenerated: true,
        createdAt: '2025-11-03T11:00:00Z',
        createdBy: 'Sistema'
      },
      {
        id: 'pay-003-01-4',
        budgetId: 'budget-003-01',
        date: '2025-12-02',
        amount: 350,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-003-01-4'],
        receiptGenerated: true,
        createdAt: '2025-12-02T10:00:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-003-01-5',
        budgetId: 'budget-003-01',
        date: '2026-01-02',
        amount: 350,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-003-01-5'],
        receiptGenerated: true,
        createdAt: '2026-01-02T09:45:00Z',
        createdBy: 'Recepción'
      }
    ]
  },
  // Laura Fernández (pat-005) - Invisalign
  {
    id: 'budget-005-01',
    patientId: 'pat-005',
    patientName: 'Laura Fernández Ruiz',
    description: 'Tratamiento Invisalign Lite',
    amount: '2.800 €',
    date: '01/06/25',
    status: 'Aceptado',
    professional: 'Dra. Elena Navarro',
    subtotal: 2800,
    validUntil: '01/07/25',
    treatments: [
      {
        tratamiento: 'Invisalign Lite - 14 alineadores',
        precio: '2.800 €',
        descuento: '0 €',
        importe: '2.800 €',
        doctor: 'Dra. Elena Navarro'
      }
    ],
    history: [
      {
        date: '01/06/25 11:00',
        action: 'Presupuesto creado',
        user: 'Dra. Elena Navarro'
      },
      {
        date: '01/06/25 12:00',
        action: 'Aceptado - Financiación',
        user: 'Sistema'
      }
    ],
    // Plan de cuotas: 6 cuotas de 466.67€ - 5 pagadas, 1 parcialmente pagada
    installmentPlan: {
      totalInstallments: 6,
      amountPerInstallment: 466.67,
      totalAmount: 2800,
      createdAt: '2025-06-01T12:00:00Z',
      installments: [
        {
          id: 'inst-005-01-1',
          installmentNumber: 1,
          amount: 466.67,
          status: 'paid' as const,
          paidAmount: 466.67,
          dueDate: '2025-06-01'
        },
        {
          id: 'inst-005-01-2',
          installmentNumber: 2,
          amount: 466.67,
          status: 'paid' as const,
          paidAmount: 466.67,
          dueDate: '2025-07-01'
        },
        {
          id: 'inst-005-01-3',
          installmentNumber: 3,
          amount: 466.67,
          status: 'paid' as const,
          paidAmount: 466.67,
          dueDate: '2025-08-01'
        },
        {
          id: 'inst-005-01-4',
          installmentNumber: 4,
          amount: 466.67,
          status: 'paid' as const,
          paidAmount: 466.67,
          dueDate: '2025-09-01'
        },
        {
          id: 'inst-005-01-5',
          installmentNumber: 5,
          amount: 466.67,
          status: 'paid' as const,
          paidAmount: 466.67,
          dueDate: '2025-10-01'
        },
        {
          id: 'inst-005-01-6',
          installmentNumber: 6,
          amount: 466.65,
          status: 'partial' as const,
          paidAmount: 200,
          dueDate: '2025-11-01'
        }
      ]
    },
    payments: [
      {
        id: 'pay-005-01-1',
        budgetId: 'budget-005-01',
        date: '2025-06-01',
        amount: 466.67,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-005-01-1'],
        receiptGenerated: true,
        createdAt: '2025-06-01T12:30:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-005-01-2',
        budgetId: 'budget-005-01',
        date: '2025-07-02',
        amount: 466.67,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-005-01-2'],
        receiptGenerated: true,
        createdAt: '2025-07-02T10:00:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-005-01-3',
        budgetId: 'budget-005-01',
        date: '2025-08-01',
        amount: 466.67,
        paymentMethod: 'transferencia' as const,
        installmentIds: ['inst-005-01-3'],
        receiptGenerated: true,
        createdAt: '2025-08-01T11:00:00Z',
        createdBy: 'Sistema'
      },
      {
        id: 'pay-005-01-4',
        budgetId: 'budget-005-01',
        date: '2025-09-02',
        amount: 466.67,
        paymentMethod: 'tarjeta' as const,
        installmentIds: ['inst-005-01-4'],
        receiptGenerated: true,
        createdAt: '2025-09-02T09:30:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-005-01-5',
        budgetId: 'budget-005-01',
        date: '2025-10-01',
        amount: 466.67,
        paymentMethod: 'efectivo' as const,
        installmentIds: ['inst-005-01-5'],
        receiptGenerated: true,
        createdAt: '2025-10-01T10:15:00Z',
        createdBy: 'Recepción'
      },
      {
        id: 'pay-005-01-6',
        budgetId: 'budget-005-01',
        date: '2025-11-05',
        amount: 200,
        paymentMethod: 'efectivo' as const,
        installmentIds: ['inst-005-01-6'],
        receiptGenerated: true,
        notes: 'Pago parcial - resto pendiente',
        createdAt: '2025-11-05T11:00:00Z',
        createdBy: 'Recepción'
      }
    ]
  },
  // Javier Moreno (pat-006) - Periodontal
  {
    id: 'budget-006-01',
    patientId: 'pat-006',
    patientName: 'Javier Moreno Torres',
    description: 'Tratamiento periodontal 4 cuadrantes',
    amount: '480 €',
    date: '14/01/26',
    status: 'Aceptado',
    professional: 'Dra. Carmen Díaz',
    subtotal: 480,
    validUntil: '14/02/26',
    treatments: [
      {
        tratamiento: 'Raspado y alisado Q1',
        precio: '120 €',
        descuento: '0 €',
        importe: '120 €',
        doctor: 'Dra. Carmen Díaz'
      },
      {
        tratamiento: 'Raspado y alisado Q2',
        precio: '120 €',
        descuento: '0 €',
        importe: '120 €',
        doctor: 'Dra. Carmen Díaz'
      },
      {
        tratamiento: 'Raspado y alisado Q3',
        precio: '120 €',
        descuento: '0 €',
        importe: '120 €',
        doctor: 'Dra. Carmen Díaz'
      },
      {
        tratamiento: 'Raspado y alisado Q4',
        precio: '120 €',
        descuento: '0 €',
        importe: '120 €',
        doctor: 'Dra. Carmen Díaz'
      }
    ],
    history: [
      {
        date: '14/01/26 12:30',
        action: 'Presupuesto creado',
        user: 'Dra. Carmen Díaz'
      },
      {
        date: '14/01/26 13:00',
        action: 'Aceptado por el paciente',
        user: 'Sistema'
      }
    ]
  },
  // Sofía Navarro (pat-007) - Implante
  {
    id: 'budget-007-01',
    patientId: 'pat-007',
    patientName: 'Sofía Navarro Díaz',
    description: 'Implante unitario pieza 36',
    amount: '1.200 €',
    date: '08/01/26',
    status: 'Aceptado',
    professional: 'Dr. Miguel Á. Torres',
    subtotal: 1200,
    validUntil: '08/02/26',
    treatments: [
      {
        pieza: 36,
        tratamiento: 'Implante Straumann 4.1x10mm',
        precio: '800 €',
        descuento: '0 €',
        importe: '800 €',
        doctor: 'Dr. Miguel Á. Torres'
      },
      {
        pieza: 36,
        tratamiento: 'Corona sobre implante',
        precio: '400 €',
        descuento: '0 €',
        importe: '400 €',
        doctor: 'Dr. Miguel Á. Torres'
      }
    ],
    history: [
      {
        date: '08/01/26 12:30',
        action: 'Presupuesto creado',
        user: 'Dr. Miguel Á. Torres'
      },
      {
        date: '15/01/26 10:00',
        action: 'Aceptado por el paciente',
        user: 'Sistema'
      }
    ]
  },
  // Miguel Gómez (pat-008) - Implante + Corona
  {
    id: 'budget-008-01',
    patientId: 'pat-008',
    patientName: 'Miguel Gómez Hernández',
    description: 'Implante y rehabilitación pieza 46',
    amount: '1.450 €',
    date: '01/06/25',
    status: 'Aceptado',
    professional: 'Dr. Miguel Á. Torres',
    subtotal: 1450,
    generalDiscount: { type: 'percentage', value: 5 },
    validUntil: '01/07/25',
    treatments: [
      {
        pieza: 46,
        tratamiento: 'Implante Straumann',
        precio: '800 €',
        descuento: '0 €',
        importe: '800 €',
        doctor: 'Dr. Miguel Á. Torres'
      },
      {
        pieza: 46,
        tratamiento: 'Corona sobre implante',
        precio: '650 €',
        descuento: '0 €',
        importe: '650 €',
        doctor: 'Dr. Miguel Á. Torres'
      }
    ],
    history: [
      {
        date: '01/06/25 10:00',
        action: 'Presupuesto creado',
        user: 'Dr. Miguel Á. Torres'
      },
      {
        date: '01/06/25 11:00',
        action: 'Aceptado - Financiación 12 cuotas',
        user: 'Sistema'
      }
    ]
  },
  // Elena Vega (pat-009) - Blanqueamiento
  {
    id: 'budget-009-01',
    patientId: 'pat-009',
    patientName: 'Elena Vega Castillo',
    description: 'Blanqueamiento LED profesional',
    amount: '250 €',
    date: '20/01/26',
    status: 'Aceptado',
    professional: 'Laura Sánchez (Higienista)',
    subtotal: 250,
    validUntil: '20/02/26',
    treatments: [
      {
        tratamiento: 'Blanqueamiento LED - 2 sesiones',
        precio: '250 €',
        descuento: '0 €',
        importe: '250 €',
        doctor: 'Laura Sánchez'
      }
    ],
    history: [
      {
        date: '20/01/26 09:30',
        action: 'Presupuesto creado',
        user: 'Dr. Antonio Ruiz'
      },
      {
        date: '20/01/26 10:00',
        action: 'Aceptado por el paciente',
        user: 'Sistema'
      }
    ]
  },
  // David Sánchez (pat-011) - Periodontal
  {
    id: 'budget-011-01',
    patientId: 'pat-011',
    patientName: 'David Sánchez Martín',
    description: 'Tratamiento periodontal fase 1',
    amount: '180 €',
    date: '01/10/25',
    status: 'Aceptado',
    professional: 'Dra. Carmen Díaz',
    subtotal: 180,
    validUntil: '01/11/25',
    treatments: [
      {
        tratamiento: 'Periodontal fase 1',
        precio: '180 €',
        descuento: '0 €',
        importe: '180 €',
        doctor: 'Dra. Carmen Díaz'
      }
    ],
    history: [
      {
        date: '01/10/25 12:00',
        action: 'Presupuesto creado',
        user: 'Dra. Carmen Díaz'
      },
      {
        date: '01/10/25 12:30',
        action: 'Aceptado - Pago parcial',
        user: 'Sistema'
      }
    ]
  },
  // Fernando Díaz (pat-014) - Férula
  {
    id: 'budget-014-01',
    patientId: 'pat-014',
    patientName: 'Fernando Díaz Ortega',
    description: 'Férula de descarga Michigan',
    amount: '350 €',
    date: '13/01/26',
    status: 'Aceptado',
    professional: 'Dr. Antonio Ruiz',
    subtotal: 350,
    validUntil: '13/02/26',
    treatments: [
      {
        tratamiento: 'Férula Michigan + impresiones',
        precio: '350 €',
        descuento: '0 €',
        importe: '350 €',
        doctor: 'Dr. Antonio Ruiz'
      }
    ],
    history: [
      {
        date: '13/01/26 18:30',
        action: 'Presupuesto creado',
        user: 'Dr. Antonio Ruiz'
      },
      {
        date: '13/01/26 19:00',
        action: 'Aceptado por el paciente',
        user: 'Sistema'
      }
    ]
  },
  // Presupuesto pendiente - Antonio Pérez (pat-010)
  {
    id: 'budget-010-01',
    patientId: 'pat-010',
    patientName: 'Antonio Pérez Molina',
    description: 'Extracción + Prótesis parcial',
    amount: '450 €',
    date: '15/01/26',
    status: 'Pendiente',
    professional: 'Dr. Antonio Ruiz',
    subtotal: 450,
    validUntil: '15/02/26',
    treatments: [
      {
        pieza: 47,
        tratamiento: 'Extracción molar',
        precio: '90 €',
        descuento: '0 €',
        importe: '90 €',
        doctor: 'Dr. Antonio Ruiz'
      },
      {
        tratamiento: 'Prótesis parcial removible',
        precio: '360 €',
        descuento: '0 €',
        importe: '360 €',
        doctor: 'Dr. Antonio Ruiz'
      }
    ],
    history: [
      {
        date: '15/01/26 17:00',
        action: 'Presupuesto creado',
        user: 'Dr. Antonio Ruiz'
      }
    ]
  }
]

// ─────────────────────────────────────────────────────────────
// PRODUCCIÓN VINCULADA A PRESUPUESTOS Y PACIENTES REALES
// ─────────────────────────────────────────────────────────────
const INITIAL_PRODUCTION_ROWS: ProductionRow[] = [
  // Carlos Rodríguez - Endodoncia completada
  {
    id: 'prod-002-01',
    budgetId: 'budget-002-01',
    patientId: 'pat-002',
    date: '24/01/26',
    description: 'Endodoncia molar 36 - Completada',
    amount: '320 €',
    status: 'Producido',
    professional: 'Dr. Francisco Moreno'
  },
  // Carlos Rodríguez - Corona pendiente
  {
    id: 'prod-002-02',
    budgetId: 'budget-002-01',
    patientId: 'pat-002',
    date: '',
    description: 'Corona zirconio 36',
    amount: '450 €',
    status: 'Pendiente',
    professional: 'Dr. Antonio Ruiz'
  },
  // Sofía Navarro - Implante completado
  {
    id: 'prod-007-01',
    budgetId: 'budget-007-01',
    patientId: 'pat-007',
    date: '22/01/26',
    description: 'Implante Straumann 36',
    amount: '800 €',
    status: 'Producido',
    professional: 'Dr. Miguel Á. Torres'
  },
  // Sofía Navarro - Corona pendiente
  {
    id: 'prod-007-02',
    budgetId: 'budget-007-01',
    patientId: 'pat-007',
    date: '',
    description: 'Corona sobre implante 36',
    amount: '400 €',
    status: 'Pendiente',
    professional: 'Dr. Miguel Á. Torres'
  },
  // Miguel Gómez - Implante completado
  {
    id: 'prod-008-01',
    budgetId: 'budget-008-01',
    patientId: 'pat-008',
    date: '03/01/26',
    description: 'Implante 46 - Fase 1',
    amount: '800 €',
    status: 'Producido',
    professional: 'Dr. Miguel Á. Torres'
  },
  // Miguel Gómez - Corona pendiente
  {
    id: 'prod-008-02',
    budgetId: 'budget-008-01',
    patientId: 'pat-008',
    date: '',
    description: 'Corona sobre implante 46',
    amount: '650 €',
    status: 'Pendiente',
    professional: 'Dr. Miguel Á. Torres'
  },
  // Fernando Díaz - Férula completada
  {
    id: 'prod-014-01',
    budgetId: 'budget-014-01',
    patientId: 'pat-014',
    date: '31/01/26',
    description: 'Férula Michigan - Entrega',
    amount: '350 €',
    status: 'Pendiente',
    professional: 'Dr. Antonio Ruiz'
  },
  // Javier Moreno - Q1 completado, Q2-Q4 pendientes
  {
    id: 'prod-006-01',
    budgetId: 'budget-006-01',
    patientId: 'pat-006',
    date: '28/01/26',
    description: 'Raspado cuadrante 1',
    amount: '120 €',
    status: 'Producido',
    professional: 'Dra. Carmen Díaz'
  },
  {
    id: 'prod-006-02',
    budgetId: 'budget-006-01',
    patientId: 'pat-006',
    date: '',
    description: 'Raspado cuadrante 2',
    amount: '120 €',
    status: 'Pendiente',
    professional: 'Dra. Carmen Díaz'
  },
  // David Sánchez - Periodontal fase 1 completada
  {
    id: 'prod-011-01',
    budgetId: 'budget-011-01',
    patientId: 'pat-011',
    date: '20/01/26',
    description: 'Periodontal fase 1',
    amount: '180 €',
    status: 'Producido',
    professional: 'Dra. Carmen Díaz'
  },
  // Elena - Blanqueamiento pendiente
  {
    id: 'prod-009-01',
    budgetId: 'budget-009-01',
    patientId: 'pat-009',
    date: '',
    description: 'Blanqueamiento LED sesión 1',
    amount: '125 €',
    status: 'Pendiente',
    professional: 'Laura Sánchez'
  },
  {
    id: 'prod-009-02',
    budgetId: 'budget-009-01',
    patientId: 'pat-009',
    date: '',
    description: 'Blanqueamiento LED sesión 2',
    amount: '125 €',
    status: 'Pendiente',
    professional: 'Laura Sánchez'
  }
]

// === PRODUCTION STATUS STYLES ===
function getStatusStyles(status: StatusType) {
  switch (status) {
    case 'Producido':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    case 'Facturado':
      return 'border-[#0088FF] text-[#0088FF]'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === BUDGET STATUS STYLES ===
function getBudgetStatusStyles(status: BudgetStatusType) {
  switch (status) {
    case 'Aceptado':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    case 'Rechazado':
      return 'border-error-600 text-error-600'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === INVOICE STATUS STYLES ===
function getInvoiceStatusStyles(status: InvoiceStatusType) {
  switch (status) {
    case 'Cobrado':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === INVOICE STATUS BADGE ===
type InvoiceStatusBadgeProps = {
  status: InvoiceStatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: InvoiceStatusType) => void
}

function InvoiceStatusBadge({
  status,
  rowId,
  onStatusChange
}: InvoiceStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: InvoiceStatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getInvoiceStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {INVOICE_STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getInvoiceStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === INVOICE ACTIONS MENU ===
type InvoiceActionsMenuProps = {
  rowId: string
  status: InvoiceStatusType
  onAction: (rowId: string, action: string) => void
}

function InvoiceActionsMenu({
  rowId,
  status,
  onAction
}: InvoiceActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 320
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 220
      })
    }
    setIsOpen(!isOpen)
  }

  const getInvoiceMenuItems = (): ActionMenuItem[] => {
    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'registrar-pago',
          label: 'Registrar pago',
          icon: <ReceiptLongRounded className='size-6' />,
          onClick: () => onAction(rowId, 'registrar-pago')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-trazabilidad',
          label: 'Ver trazabilidad',
          icon: <TimelineRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-trazabilidad')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar por Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Cobrado" status
    if (status === 'Cobrado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-trazabilidad',
          label: 'Ver trazabilidad',
          icon: <TimelineRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-trazabilidad')
        },
        {
          id: 'ver-pago-registrado',
          label: 'Ver pago registrado',
          icon: <ReceiptLongRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-pago-registrado')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar por Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getInvoiceMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[13.75rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === BUDGET STATUS BADGE ===
type BudgetStatusBadgeProps = {
  status: BudgetStatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: BudgetStatusType) => void
}

function BudgetStatusBadge({
  status,
  rowId,
  onStatusChange
}: BudgetStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: BudgetStatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getBudgetStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {BUDGET_STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getBudgetStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type StatusBadgeProps = {
  status: StatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: StatusType) => void
}

function StatusBadge({ status, rowId, onStatusChange }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: StatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BudgetsPayments({
  onClose,
  openBudgetCreation = false,
  onBudgetCreationOpened,
  patientId,
  patientName,
  budgetRows: externalBudgetRows,
  onAddBudget,
  onUpdateBudgetRows
}: BudgetsPaymentsProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { getPendingTreatments } = usePatients()
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const shouldUseDbSource = Boolean(patientId && activeClinicId)

  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'Paciente'
  type TabKey = 'Presupuestos' | 'Producción' | 'Facturas' | 'Cuotas'
  const [activeTab, setActiveTab] = React.useState<TabKey>('Presupuestos')
  const [notice, setNotice] = React.useState<{
    message: string
    variant: 'success' | 'error' | 'info'
  } | null>(null)
  const noticeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const showNotice = React.useCallback(
    (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current)
      }
      setNotice({ message, variant })
      noticeTimerRef.current = setTimeout(() => {
        setNotice(null)
      }, 3200)
    },
    []
  )

  React.useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current)
      }
    }
  }, [])

  // Estado para modal de pago rápido de cuotas
  const [showQuickPaymentModal, setShowQuickPaymentModal] =
    React.useState(false)
  const [showBudgetTypeModal, setShowBudgetTypeModal] = React.useState(false)
  const [showAddTreatmentsModal, setShowAddTreatmentsModal] =
    React.useState(false)
  const [showAddProductionModal, setShowAddProductionModal] =
    React.useState(false)
  const [showMarkAsProducedModal, setShowMarkAsProducedModal] =
    React.useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false)
  const [showRegisterPaymentModal, setShowRegisterPaymentModal] =
    React.useState(false)
  const [showTraceabilityModal, setShowTraceabilityModal] =
    React.useState(false)
  const [showBudgetDetailsModal, setShowBudgetDetailsModal] =
    React.useState(false)
  // New modal states for quick actions
  const [showProductionDetailsModal, setShowProductionDetailsModal] =
    React.useState(false)
  const [showEditProductionModal, setShowEditProductionModal] =
    React.useState(false)
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] =
    React.useState(false)
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] =
    React.useState(false)
  const [showEditBudgetModal, setShowEditBudgetModal] = React.useState(false)
  const [selectedProductionRow, setSelectedProductionRow] =
    React.useState<ProductionRow | null>(null)
  const [selectedInvoiceRow, setSelectedInvoiceRow] =
    React.useState<InvoiceRow | null>(null)
  const [selectedBudgetRow, setSelectedBudgetRow] =
    React.useState<BudgetRow | null>(null)

  // Separate state for each tab
  const [productionRows, setProductionRows] = React.useState<ProductionRow[]>(
    INITIAL_PRODUCTION_ROWS
  )
  // Use external budgetRows if provided, otherwise use local state
  const [localBudgetRows, setLocalBudgetRows] =
    React.useState<BudgetRow[]>(INITIAL_BUDGET_ROWS)
  const budgetRows =
    shouldUseDbSource ? localBudgetRows : externalBudgetRows ?? localBudgetRows
  const setBudgetRows = React.useCallback(
    (newRows: BudgetRow[] | ((prev: BudgetRow[]) => BudgetRow[])) => {
      if (shouldUseDbSource) {
        setLocalBudgetRows((prevRows) =>
          typeof newRows === 'function' ? newRows(prevRows) : newRows
        )
        return
      }

      if (typeof newRows === 'function') {
        const updatedRows = newRows(budgetRows)
        if (onUpdateBudgetRows) onUpdateBudgetRows(updatedRows)
        else setLocalBudgetRows(updatedRows)
        return
      }

      if (onUpdateBudgetRows) onUpdateBudgetRows(newRows)
      else setLocalBudgetRows(newRows)
    },
    [budgetRows, onUpdateBudgetRows, shouldUseDbSource]
  )
  const [invoiceRows, setInvoiceRows] =
    React.useState<InvoiceRow[]>(INITIAL_INVOICE_ROWS)
  const [isHydrating, setIsHydrating] = React.useState(false)

  const refreshFinanceData = React.useCallback(async () => {
    if (!shouldUseDbSource || !patientId || !activeClinicId || !isClinicInitialized) {
      return
    }

    setIsHydrating(true)
    try {
      const [{ data: quoteRows }, { data: invoiceRowsDb }, { data: insuranceRows }] =
        await Promise.all([
          supabase
            .from('quotes')
            .select(
              'id, plan_id, quote_number, status, total_amount, issue_date, expiry_date, signed_at, production_status, production_date'
            )
            .eq('clinic_id', activeClinicId)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false }),
          supabase
            .from('invoices')
            .select(
              'id, quote_id, invoice_number, status, issue_date, issue_timestamp, total_amount, amount_paid'
            )
            .eq('clinic_id', activeClinicId)
            .eq('patient_id', patientId)
            .order('issue_timestamp', { ascending: false }),
          supabase
            .from('patient_insurances')
            .select('provider, is_primary, created_at')
            .eq('patient_id', patientId)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
        ])

      const typedQuotes = (quoteRows || []) as DbQuoteRow[]
      const typedInvoices = (invoiceRowsDb || []) as DbInvoiceRow[]
      const invoiceIds = typedInvoices.map((row) => row.id)
      const insurer = String(insuranceRows?.[0]?.provider || '').trim()
      const quoteIds = typedQuotes
        .map((row) => Number(row.id))
        .filter((id) => Number.isFinite(id))
      const planIds = typedQuotes
        .map((row) => Number(row.plan_id))
        .filter((id) => Number.isFinite(id))

      let typedPayments: DbPaymentRow[] = []
      if (invoiceIds.length > 0) {
        const { data: paymentRows } = await supabase
          .from('payments')
          .select('id, invoice_id, payment_method, amount, transaction_date')
          .eq('clinic_id', activeClinicId)
          .in('invoice_id', invoiceIds)
          .is('voided_at', null)
          .order('transaction_date', { ascending: false })
        typedPayments = (paymentRows || []) as DbPaymentRow[]
      }

      const [{ data: quoteItemRows }, { data: planRows }, { data: planItemRows }] =
        await Promise.all([
        quoteIds.length > 0
          ? supabase
              .from('quote_items')
              .select(
                'id, quote_id, service_id, description, quantity, unit_price, discount_percentage, final_price'
              )
              .in('quote_id', quoteIds)
              .order('id', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        planIds.length > 0
          ? supabase.from('treatment_plans').select('id, name').in('id', planIds)
          : Promise.resolve({ data: [], error: null }),
        planIds.length > 0
          ? supabase
              .from('treatment_plan_items')
              .select('id, plan_id, service_id, tooth_number, notes')
              .in('plan_id', planIds)
              .order('id', { ascending: true })
          : Promise.resolve({ data: [], error: null })
      ])

      const serviceIds = ((quoteItemRows || []) as DbQuoteItemRow[])
        .map((item) => Number(item.service_id))
        .filter((id) => Number.isFinite(id))
      const { data: serviceRows } =
        serviceIds.length > 0
          ? await supabase
              .from('service_catalog')
              .select('id, treatment_code, name')
              .in('id', serviceIds)
          : { data: [] as DbServiceCatalogRow[] }

      const quoteItemsByQuoteId = new Map<number, DbQuoteItemRow[]>()
      ;((quoteItemRows || []) as DbQuoteItemRow[]).forEach((item) => {
        const quoteId = Number(item.quote_id)
        if (!Number.isFinite(quoteId)) return
        const currentRows = quoteItemsByQuoteId.get(quoteId) || []
        currentRows.push(item)
        quoteItemsByQuoteId.set(quoteId, currentRows)
      })

      const planNameById = new Map<number, string>()
      ;((planRows || []) as DbTreatmentPlanRow[]).forEach((plan) => {
        const planId = Number(plan.id)
        if (!Number.isFinite(planId)) return
        const name = String(plan.name || '').trim()
        if (name) planNameById.set(planId, name)
      })

      const planItemsByPlanId = new Map<number, DbTreatmentPlanItemRow[]>()
      ;((planItemRows || []) as DbTreatmentPlanItemRow[]).forEach((row) => {
        const planId = Number(row.plan_id)
        if (!Number.isFinite(planId)) return
        const currentRows = planItemsByPlanId.get(planId) || []
        currentRows.push(row)
        planItemsByPlanId.set(planId, currentRows)
      })

      const serviceById = new Map<number, DbServiceCatalogRow>()
      ;((serviceRows || []) as DbServiceCatalogRow[]).forEach((row) => {
        const serviceId = Number(row.id)
        if (!Number.isFinite(serviceId)) return
        serviceById.set(serviceId, row)
      })

      const paymentsByInvoice = new Map<number, DbPaymentRow[]>()
      for (const payment of typedPayments) {
        const invoiceId = Number(payment.invoice_id)
        if (!Number.isFinite(invoiceId)) continue
        const currentRows = paymentsByInvoice.get(invoiceId) || []
        currentRows.push(payment)
        paymentsByInvoice.set(invoiceId, currentRows)
      }

      const invoiceRowsMapped: InvoiceRow[] = typedInvoices.map((invoice) => {
        const invoicePayments = paymentsByInvoice.get(invoice.id) || []
        const paidFromPayments = invoicePayments.reduce(
          (sum, row) => sum + Number(row.amount || 0),
          0
        )
        const totalAmount = Number(invoice.total_amount || 0)
        const fallbackPaidAmount = Number(invoice.amount_paid || 0)
        const paidAmount = paidFromPayments > 0 ? paidFromPayments : fallbackPaidAmount
        const effectiveStatus =
          invoice.status || (paidAmount + 0.009 >= totalAmount ? 'paid' : 'open')
        const latestPayment = invoicePayments[0]

        return {
          id: invoice.invoice_number || `FAC-${invoice.id}`,
          description: invoice.quote_id
            ? `Factura presupuesto #${invoice.quote_id}`
            : `Factura #${invoice.id}`,
          amount: formatEuroAmount(totalAmount),
          date: formatShortDate(invoice.issue_timestamp || invoice.issue_date) || '—',
          status: mapDbInvoiceStatusToUi(effectiveStatus),
          paymentMethod: mapDbPaymentMethodToUi(latestPayment?.payment_method),
          insurer,
          dbInvoiceId: invoice.id,
          quoteId: invoice.quote_id || undefined,
          amountNumber: totalAmount,
          amountPaidNumber: paidAmount,
          issueTimestamp: invoice.issue_timestamp || null || undefined
        }
      })

      const invoicesByQuoteId = new Map<number, InvoiceRow[]>()
      for (const row of invoiceRowsMapped) {
        if (!row.quoteId) continue
        const list = invoicesByQuoteId.get(row.quoteId) || []
        list.push(row)
        invoicesByQuoteId.set(row.quoteId, list)
      }

      const budgetRowsMapped: BudgetRow[] = typedQuotes.map((quote) => {
        const budgetInvoices = invoicesByQuoteId.get(quote.id) || []
        const hasAcceptedInvoice = budgetInvoices.some((invoice) => invoice.status === 'Cobrado')
        const planName =
          (quote.plan_id ? planNameById.get(Number(quote.plan_id)) : undefined) || ''
        const quoteItems = quoteItemsByQuoteId.get(quote.id) || []
        const planItemsForQuote =
          quote.plan_id && Number.isFinite(Number(quote.plan_id))
            ? planItemsByPlanId.get(Number(quote.plan_id)) || []
            : []
        const planItemsQueueByServiceId = new Map<number, DbTreatmentPlanItemRow[]>()
        planItemsForQuote.forEach((planItem) => {
          const serviceId = Number(planItem.service_id)
          if (!Number.isFinite(serviceId)) return
          const currentRows = planItemsQueueByServiceId.get(serviceId) || []
          currentRows.push(planItem)
          planItemsQueueByServiceId.set(serviceId, currentRows)
        })
        const mappedTreatments: BudgetTreatment[] = quoteItems.map((item) => {
          const serviceId = Number(item.service_id)
          const matchingPlanItems = Number.isFinite(serviceId)
            ? planItemsQueueByServiceId.get(serviceId) || []
            : []
          const matchedPlanItem = matchingPlanItems.shift()
          if (Number.isFinite(serviceId)) {
            planItemsQueueByServiceId.set(serviceId, matchingPlanItems)
          }
          const notes = parsePlanItemNotes(matchedPlanItem?.notes)
          const service = Number.isFinite(serviceId)
            ? serviceById.get(serviceId)
            : undefined
          const quantity = Number(item.quantity || 1)
          const unitPrice = Number(item.unit_price || 0)
          const finalPrice =
            Number(item.final_price ?? quantity * unitPrice) || 0
          const discountPct = Number(item.discount_percentage || 0)
          const discountAmount = Math.max(quantity * unitPrice - finalPrice, 0)
          return {
            pieza:
              matchedPlanItem && Number.isFinite(Number(matchedPlanItem.tooth_number))
                ? Number(matchedPlanItem.tooth_number)
                : undefined,
            cara: notes.cara,
            codigo: notes.codigo || String(service?.treatment_code || '').trim() || undefined,
            tratamiento:
              String(item.description || '').trim() ||
              String(service?.name || '').trim() ||
              'Tratamiento',
            precio: formatEuroAmount(quantity * unitPrice),
            porcentajeDescuento: discountPct,
            descuento: formatEuroAmount(discountAmount),
            importe: formatEuroAmount(finalPrice),
            doctor: notes.doctor
          }
        })
        const subtotalFromItems = mappedTreatments.reduce(
          (sum, item) => sum + parseEuroAmount(item.importe),
          0
        )
        const subtotal =
          mappedTreatments.length > 0
            ? subtotalFromItems
            : Number(quote.total_amount || 0)

        return {
          id: quote.quote_number || `PRE-${quote.id}`,
          quoteId: quote.id,
          planId: Number.isFinite(Number(quote.plan_id)) ? Number(quote.plan_id) : undefined,
          description:
            planName ||
            (quote.quote_number
              ? `Presupuesto ${quote.quote_number}`
              : `Presupuesto #${quote.id}`),
          amount: formatEuroAmount(Number(quote.total_amount || 0)),
          date: formatShortDate(quote.issue_date || quote.signed_at) || '—',
          status: hasAcceptedInvoice
            ? 'Aceptado'
            : mapDbQuoteStatusToUi(quote.status),
          professional: 'Sin asignar',
          insurer,
          patientId,
          patientName: displayPatientName,
          treatments: mappedTreatments,
          subtotal,
          validUntil: formatShortDate(quote.expiry_date) || undefined
        }
      })

      const productionRowsMapped: ProductionRow[] = typedQuotes.map((quote) => {
        const quoteInvoices = invoicesByQuoteId.get(quote.id) || []
        const hasPaidInvoice = quoteInvoices.some((invoice) => invoice.status === 'Cobrado')

        return {
          id: `prod-quote-${quote.id}`,
          quoteId: quote.id,
          budgetId: quote.quote_number || `PRE-${quote.id}`,
          patientId,
          date: formatShortDate(quote.production_date || quote.signed_at) || '',
          description: quote.quote_number
            ? `Producción ${quote.quote_number}`
            : `Producción presupuesto #${quote.id}`,
          amount: formatEuroAmount(Number(quote.total_amount || 0)),
          status: hasPaidInvoice
            ? 'Facturado'
            : mapDbProductionStatusToUi(quote.production_status),
          professional: 'Sin asignar'
        }
      })

      setLocalBudgetRows(budgetRowsMapped)
      setProductionRows(productionRowsMapped)
      setInvoiceRows(invoiceRowsMapped)
    } catch (error) {
      console.warn('Finanzas hydration failed, keeping local state', error)
    } finally {
      setIsHydrating(false)
    }
  }, [
    activeClinicId,
    displayPatientName,
    isClinicInitialized,
    patientId,
    shouldUseDbSource,
    supabase
  ])

  React.useEffect(() => {
    void refreshFinanceData()
  }, [refreshFinanceData])

  const createQuoteWithItems = React.useCallback(
    async ({
      selectedTreatments,
      totalAmount,
      productionPending = false,
      budgetName
    }: {
      selectedTreatments: TreatmentV2[]
      totalAmount: number
      productionPending?: boolean
      budgetName?: string
    }): Promise<{ ok: true; quoteId: number } | { ok: false; error: string }> => {
      if (!activeClinicId || !patientId) {
        return { ok: false, error: 'Missing clinic/patient context' }
      }

      const issueDate = new Date().toISOString().slice(0, 10)
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
      const quoteNumber = `PRE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const normalizedBudgetName = String(budgetName || '').trim()

      let planId: number | null = null
      let planFailureMessage: string | null = null
      try {
        if (!normalizedBudgetName) {
          const { data: latestPlan, error: latestPlanError } = await supabase
            .from('treatment_plans')
            .select('id')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (latestPlanError) {
            planFailureMessage = latestPlanError.message
          }

          if (latestPlan?.id) {
            planId = Number((latestPlan as { id: number }).id)
          }
        }

        if (!planId) {
          const {
            data: { user }
          } = await supabase.auth.getUser()
          if (!user?.id) {
            return {
              ok: false,
              error: 'No authenticated user available to create treatment plan'
            }
          }

          if (user?.id) {
            const { data: createdPlan, error: createPlanError } = await supabase
              .from('treatment_plans')
              .insert({
                patient_id: patientId,
                staff_id: user.id,
                name: normalizedBudgetName || `Plan ${quoteNumber}`,
                status: 'draft'
              })
              .select('id')
              .single()
            if (createPlanError) {
              return {
                ok: false,
                error: `No se pudo crear plan de tratamiento: ${createPlanError.message}`
              }
            }

            if (!createPlanError && createdPlan?.id) {
              planId = Number((createdPlan as { id: number }).id)
            }
          }
        }
      } catch (error) {
        planFailureMessage =
          error instanceof Error ? error.message : 'Unknown plan creation error'
      }

      if (!planId) {
        return {
          ok: false,
          error:
            planFailureMessage ||
            'No se pudo obtener un plan de tratamiento (quotes.plan_id es obligatorio)'
        }
      }

      const quotePayload: Record<string, unknown> = {
        clinic_id: activeClinicId,
        patient_id: patientId,
        quote_number: quoteNumber,
        status: 'sent',
        total_amount: Number.isFinite(totalAmount) ? totalAmount : 0,
        issue_date: issueDate,
        expiry_date: expiryDate
      }

      if (productionPending) {
        quotePayload.production_status = 'Pending'
      }
      if (planId) {
        quotePayload.plan_id = planId
      }

      const { data: createdQuote, error: createQuoteError } = await supabase
        .from('quotes')
        .insert(quotePayload)
        .select('id')
        .single()

      if (createQuoteError || !createdQuote?.id) {
        return {
          ok: false,
          error: createQuoteError?.message || 'No quote id returned after insert'
        }
      }

      const quoteId = Number((createdQuote as { id: number }).id)
      if (!Number.isFinite(quoteId)) {
        return { ok: false, error: 'Invalid quote id returned after insert' }
      }

      const normalizedCodes = Array.from(
        new Set(
          selectedTreatments
            .map((t) => String(t.codigo || '').trim())
            .filter((code) => code.length > 0)
        )
      )
      const normalizedNames = Array.from(
        new Set(
          selectedTreatments
            .map((t) => String(t.tratamiento || '').trim())
            .filter((name) => name.length > 0)
        )
      )

      const [servicesByCode, servicesByName] = await Promise.all([
        normalizedCodes.length
          ? supabase
              .from('service_catalog')
              .select('id, treatment_code, name')
              .in('treatment_code', normalizedCodes)
          : Promise.resolve({ data: [], error: null }),
        normalizedNames.length
          ? supabase
              .from('service_catalog')
              .select('id, treatment_code, name')
              .in('name', normalizedNames)
          : Promise.resolve({ data: [], error: null })
      ])

      const serviceByCode = new Map<string, number>()
      const serviceByName = new Map<string, number>()
      ;(servicesByCode.data || []).forEach((row: any) => {
        if (row?.treatment_code) serviceByCode.set(String(row.treatment_code), Number(row.id))
        if (row?.name) serviceByName.set(String(row.name), Number(row.id))
      })
      ;(servicesByName.data || []).forEach((row: any) => {
        if (row?.treatment_code) serviceByCode.set(String(row.treatment_code), Number(row.id))
        if (row?.name) serviceByName.set(String(row.name), Number(row.id))
      })

      const resolvedTreatmentRows = selectedTreatments
        .map((treatment) => {
          const treatmentCode = String(treatment.codigo || '').trim()
          const treatmentName = String(treatment.tratamiento || '').trim()
          const serviceId =
            serviceByCode.get(treatmentCode) ?? serviceByName.get(treatmentName) ?? null
          if (!serviceId) return null

          const unitPrice = parseEuroAmount(treatment.precio || treatment.importe)
          const discountPercentage =
            Number.isFinite(Number(treatment.porcentajeDescuento))
              ? Number(treatment.porcentajeDescuento)
              : 0
          const toothNumber = Number(treatment.pieza)
          const notesPayload = {
            cara: treatment.cara ? String(treatment.cara) : undefined,
            doctor: treatment.doctor ? String(treatment.doctor) : undefined,
            codigo: treatmentCode || undefined,
            importeSeguro: treatment.importeSeguro
              ? String(treatment.importeSeguro)
              : undefined
          }
          const notesJson = JSON.stringify(notesPayload)

          return {
            service_id: serviceId,
            quoteItem: {
              quote_id: quoteId,
              service_id: serviceId,
              description: treatmentName || treatmentCode || 'Tratamiento',
              quantity: 1,
              unit_price: unitPrice,
              discount_percentage: discountPercentage
            },
            planItem: {
              plan_id: planId,
              service_id: serviceId,
              tooth_number: Number.isFinite(toothNumber) && toothNumber > 0 ? toothNumber : null,
              notes: notesJson
            }
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      const quoteItems = resolvedTreatmentRows.map((row) => row.quoteItem)
      const planItems = resolvedTreatmentRows.map((row) => row.planItem)

      if (selectedTreatments.length > 0 && quoteItems.length === 0) {
        return {
          ok: false,
          error:
            'No se pudieron vincular los tratamientos al catálogo (service_catalog). Revisa códigos/nombres de tratamientos.'
        }
      }

      if (quoteItems.length > 0) {
        const { error: insertItemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
        if (insertItemsError) {
          return { ok: false, error: insertItemsError.message }
        }
      }

      if (planItems.length > 0) {
        const { error: insertPlanItemsError } = await supabase
          .from('treatment_plan_items')
          .insert(planItems)
        if (insertPlanItemsError) {
          return { ok: false, error: insertPlanItemsError.message }
        }
      }

      return { ok: true, quoteId }
    },
    [activeClinicId, patientId, supabase]
  )

  const resolvePatientEmail = React.useCallback(async (): Promise<string | null> => {
    if (!patientId) return null

    const { data: patient } = await supabase
      .from('patients')
      .select('email, primary_contact_id')
      .eq('id', patientId)
      .maybeSingle()

    const directEmail = String(patient?.email || '').trim()
    if (directEmail) return directEmail

    const primaryContactId = String(patient?.primary_contact_id || '').trim()
    if (!primaryContactId) return null

    const { data: contact } = await supabase
      .from('contacts')
      .select('email')
      .eq('id', primaryContactId)
      .maybeSingle()

    const contactEmail = String(contact?.email || '').trim()
    return contactEmail || null
  }, [patientId, supabase])

  const openEmailComposer = React.useCallback(
    async (subject: string, body: string) => {
      try {
        const email = await resolvePatientEmail()
        if (!email) {
          showNotice('No hay email configurado para este paciente', 'error')
          return false
        }

        const mailto = `mailto:${email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`
        window.location.href = mailto
        showNotice('Se abrió el cliente de correo', 'success')
        return true
      } catch (error) {
        console.warn('No se pudo abrir cliente de correo', error)
        showNotice('No se pudo abrir el cliente de correo', 'error')
        return false
      }
    },
    [resolvePatientEmail, showNotice]
  )

  // === FILTER STATES ===
  // Search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showSearchInput, setShowSearchInput] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Status filters (multi-select) - Default to "Pendiente" for all tabs
  const [selectedProductionStatuses, setSelectedProductionStatuses] =
    React.useState<StatusType[]>(['Pendiente'])
  const [selectedBudgetStatuses, setSelectedBudgetStatuses] = React.useState<
    BudgetStatusType[]
  >(['Pendiente'])
  const [selectedInvoiceStatuses, setSelectedInvoiceStatuses] = React.useState<
    InvoiceStatusType[]
  >(['Pendiente'])

  // Professional filter
  const [selectedProfessional, setSelectedProfessional] = React.useState('')

  // Insurer filter
  const [selectedInsurer, setSelectedInsurer] = React.useState('')

  // Payment method filter (facturas only)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('')

  // Date range filter
  const [dateFrom, setDateFrom] = React.useState<Date | null>(null)
  const [dateTo, setDateTo] = React.useState<Date | null>(null)

  // Quick filters
  const [quickFilter, setQuickFilter] = React.useState<
    'all' | 'this-week' | 'this-month'
  >('all')

  // Dropdown visibility states
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false)
  const [showProfessionalDropdown, setShowProfessionalDropdown] =
    React.useState(false)
  const [showInsurerDropdown, setShowInsurerDropdown] = React.useState(false)
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] =
    React.useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] =
    React.useState(false)

  // Extract unique professionals and insurers from data
  const professionals = React.useMemo(() => {
    const prods = productionRows.map((r) => r.professional)
    const budgets = budgetRows.map((r) => r.professional)
    return [...new Set([...prods, ...budgets])].filter(Boolean)
  }, [productionRows, budgetRows])

  const insurers = React.useMemo(() => {
    const budgets = budgetRows.map((r) => r.insurer)
    const invoices = invoiceRows.map((r) => r.insurer)
    return [...new Set([...budgets, ...invoices])].filter((x): x is string =>
      Boolean(x)
    )
  }, [budgetRows, invoiceRows])

  const paymentMethods = React.useMemo(() => {
    return [...new Set(invoiceRows.map((r) => r.paymentMethod))].filter(Boolean)
  }, [invoiceRows])

  // Parse date string dd/mm/yy to Date
  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10) + 2000
    return new Date(year, month, day)
  }

  // Check if date is within range
  const isDateInRange = (
    dateStr: string,
    from: Date | null,
    to: Date | null
  ): boolean => {
    if (!from && !to) return true
    const date = parseDate(dateStr)
    if (!date) return true
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }

  // Check if date is this week
  const isThisWeek = (dateStr: string): boolean => {
    const date = parseDate(dateStr)
    if (!date) return true
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    return date >= startOfWeek && date <= endOfWeek
  }

  // Check if date is this month
  const isThisMonth = (dateStr: string): boolean => {
    const date = parseDate(dateStr)
    if (!date) return true
    const now = new Date()
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  // === FILTERED DATA ===
  const filteredProductionRows = React.useMemo(() => {
    return productionRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedProductionStatuses.length > 0 &&
        !selectedProductionStatuses.includes(row.status)
      )
        return false
      // Professional filter
      if (selectedProfessional && row.professional !== selectedProfessional)
        return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    productionRows,
    searchQuery,
    selectedProductionStatuses,
    selectedProfessional,
    dateFrom,
    dateTo,
    quickFilter
  ])

  const filteredBudgetRows = React.useMemo(() => {
    return budgetRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedBudgetStatuses.length > 0 &&
        !selectedBudgetStatuses.includes(row.status)
      )
        return false
      // Professional filter
      if (selectedProfessional && row.professional !== selectedProfessional)
        return false
      // Insurer filter
      if (selectedInsurer && row.insurer !== selectedInsurer) return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    budgetRows,
    searchQuery,
    selectedBudgetStatuses,
    selectedProfessional,
    selectedInsurer,
    dateFrom,
    dateTo,
    quickFilter
  ])

  const filteredInvoiceRows = React.useMemo(() => {
    return invoiceRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedInvoiceStatuses.length > 0 &&
        !selectedInvoiceStatuses.includes(row.status)
      )
        return false
      // Insurer filter
      if (selectedInsurer && row.insurer !== selectedInsurer) return false
      // Payment method filter
      if (selectedPaymentMethod && row.paymentMethod !== selectedPaymentMethod)
        return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    invoiceRows,
    searchQuery,
    selectedInvoiceStatuses,
    selectedInsurer,
    selectedPaymentMethod,
    dateFrom,
    dateTo,
    quickFilter
  ])

  // Clear all filters (reset to defaults with "Pendiente" status)
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedProductionStatuses(['Pendiente'])
    setSelectedBudgetStatuses(['Pendiente'])
    setSelectedInvoiceStatuses(['Pendiente'])
    setSelectedProfessional('')
    setSelectedInsurer('')
    setSelectedPaymentMethod('')
    setDateFrom(null)
    setDateTo(null)
    setQuickFilter('all')
  }

  // Check if any filter is active (beyond the default "Pendiente")
  const isDefaultStatusFilter = (statuses: string[]) =>
    statuses.length === 1 && statuses[0] === 'Pendiente'

  const hasActiveFilters =
    searchQuery ||
    !isDefaultStatusFilter(selectedProductionStatuses) ||
    !isDefaultStatusFilter(selectedBudgetStatuses) ||
    !isDefaultStatusFilter(selectedInvoiceStatuses) ||
    selectedProfessional ||
    selectedInsurer ||
    selectedPaymentMethod ||
    dateFrom ||
    dateTo ||
    quickFilter !== 'all'

  // Focus search input when opened
  React.useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchInput])

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-filter-dropdown]')) {
        setShowStatusDropdown(false)
        setShowProfessionalDropdown(false)
        setShowInsurerDropdown(false)
        setShowPaymentMethodDropdown(false)
        setShowDateRangeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-open AddTreatmentsToBudgetModal if openBudgetCreation is true
  React.useEffect(() => {
    if (openBudgetCreation && !showAddTreatmentsModal) {
      setShowAddTreatmentsModal(true)
      onBudgetCreationOpened?.()
    }
  }, [openBudgetCreation, showAddTreatmentsModal, onBudgetCreationOpened])

  // State for budget type treatments and name (when selecting from preset templates)
  const [budgetTypeTreatments, setBudgetTypeTreatments] = React.useState<
    TreatmentV2[] | undefined
  >(undefined)
  const [budgetTypeName, setBudgetTypeName] = React.useState<string>('')

  const pendingTreatmentsForBudgetModal = React.useMemo(() => {
    if (!patientId) return []
    return getPendingTreatments(patientId).map(
      convertPatientTreatmentToBudgetTreatment
    )
  }, [getPendingTreatments, patientId])

  // Handler for selecting a budget type from the list modal
  const handleBudgetTypeSelect = React.useCallback(
    (budgetType: BudgetTypeData) => {
      // Convert budget type treatments to TreatmentV2 format
      const treatments = convertBudgetTypeToTreatmentsV2(budgetType)
      setBudgetTypeTreatments(treatments)
      setBudgetTypeName(budgetType.name)
      setShowBudgetTypeModal(false)
      setShowAddTreatmentsModal(true)
    },
    []
  )

  // State for creating new budget type
  const [showCreateBudgetTypeModal, setShowCreateBudgetTypeModal] =
    React.useState(false)

  // Handler for opening the create new budget type modal
  const handleCreateNewBudgetType = React.useCallback(() => {
    setShowBudgetTypeModal(false)
    setShowCreateBudgetTypeModal(true)
  }, [])

  // Handler for saving the new budget type
  const handleSaveBudgetType = React.useCallback(
    (budgetType: Omit<BudgetTypeData, 'id'>) => {
      addBudgetType(budgetType)
      setShowCreateBudgetTypeModal(false)
    },
    []
  )

  // Handler to update production row status
  const handleProductionStatusChange = (
    rowId: string,
    newStatus: StatusType
  ) => {
    setProductionRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )

    if (!shouldUseDbSource) return
    const target = productionRows.find((row) => row.id === rowId)
    if (!target?.quoteId) return

    void (async () => {
      try {
        const response = await fetch('/api/caja/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId: String(target.quoteId),
            productionStatus: newStatus === 'Producido' ? 'Done' : 'Pending'
          })
        })

        if (!response.ok) {
          throw new Error('No se pudo actualizar el estado de producción')
        }
      } catch (error) {
        console.warn('Error updating production status', error)
      } finally {
        await refreshFinanceData()
      }
    })()
  }

  // Handler to update budget row status
  const handleBudgetStatusChange = (
    rowId: string,
    newStatus: BudgetStatusType
  ) => {
    setBudgetRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )

    if (!shouldUseDbSource || !activeClinicId) return
    const target = budgetRows.find((row) => row.id === rowId)
    if (!target?.quoteId) return

    void (async () => {
      try {
        const payload: Record<string, unknown> = {
          status: mapUiBudgetStatusToDb(newStatus)
        }
        if (newStatus === 'Aceptado') {
          payload.signed_at = new Date().toISOString()
        }

        const { error } = await supabase
          .from('quotes')
          .update(payload)
          .eq('id', target.quoteId)
          .eq('clinic_id', activeClinicId)

        if (error) {
          throw error
        }
      } catch (error) {
        console.warn('Error updating quote status', error)
      } finally {
        await refreshFinanceData()
      }
    })()
  }

  // Handler to update invoice row status
  const handleInvoiceStatusChange = (
    rowId: string,
    newStatus: InvoiceStatusType
  ) => {
    setInvoiceRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )

    if (!shouldUseDbSource || !activeClinicId) return
    const target = invoiceRows.find((row) => row.id === rowId)
    if (!target?.dbInvoiceId) return

    void (async () => {
      try {
        const totalAmount = Number(target.amountNumber || 0)
        const payload: Record<string, unknown> =
          newStatus === 'Cobrado'
            ? { status: 'paid', amount_paid: totalAmount }
            : { status: 'open' }

        const { error } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', target.dbInvoiceId)
          .eq('clinic_id', activeClinicId)

        if (error) {
          throw error
        }
      } catch (error) {
        console.warn('Error updating invoice status', error)
      } finally {
        await refreshFinanceData()
      }
    })()
  }

  // Handler for invoice action menu items
  const handleInvoiceAction = (rowId: string, action: string) => {
    console.log(`Invoice Action: ${action} on row: ${rowId}`)

    switch (action) {
      case 'registrar-pago': {
        // Find the invoice row and open the modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowRegisterPaymentModal(true)
        }
        break
      }
      case 'eliminar':
        setInvoiceRows((prevRows) => prevRows.filter((row) => row.id !== rowId))
        if (shouldUseDbSource && activeClinicId) {
          const row = invoiceRows.find((item) => item.id === rowId)
          if (row?.dbInvoiceId) {
            void (async () => {
              try {
                const { error } = await supabase
                  .from('invoices')
                  .delete()
                  .eq('id', row.dbInvoiceId)
                  .eq('clinic_id', activeClinicId)
                if (error) throw error
              } catch (error) {
                console.warn('Error deleting invoice', error)
              } finally {
                await refreshFinanceData()
              }
            })()
          }
        }
        break
      case 'ver-trazabilidad': {
        // Find the invoice row and open the traceability modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowTraceabilityModal(true)
        }
        break
      }
      case 'ver-detalles': {
        // Find the invoice row and open the details modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowInvoiceDetailsModal(true)
        }
        break
      }
      case 'ver-pago-registrado': {
        // Find the invoice row and open the payment details modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowPaymentDetailsModal(true)
        }
        break
      }
      case 'enviar-mail': {
        // Find invoice row and open email client with prefilled content
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          void openEmailComposer(
            `Factura ${row.id} - ${displayPatientName}`,
            [
              `Hola ${displayPatientName},`,
              '',
              `Adjuntamos la factura ${row.id}.`,
              `Concepto: ${row.description}`,
              `Importe: ${row.amount}`,
              `Fecha: ${row.date}`,
              '',
              'Gracias.'
            ].join('\n')
          )
        }
        break
      }
      case 'descargar-pdf': {
        // Find the invoice row and generate PDF
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          handleDownloadInvoicePdf(row)
        }
        break
      }
      default:
        break
    }
  }

  // Helper function to download invoice PDF
  const handleDownloadInvoicePdf = (invoice: InvoiceRow) => {
    try {
      const html = [
        `<h2>Factura ${invoice.id}</h2>`,
        `<p><strong>Paciente:</strong> ${displayPatientName}</p>`,
        `<p><strong>Fecha:</strong> ${invoice.date}</p>`,
        `<p><strong>Descripción:</strong> ${invoice.description}</p>`,
        `<p><strong>Estado:</strong> ${invoice.status}</p>`,
        `<p><strong>Método de pago:</strong> ${invoice.paymentMethod || '-'}</p>`,
        `<p><strong>Aseguradora:</strong> ${invoice.insurer || '-'}</p>`,
        `<p><strong>Importe:</strong> ${invoice.amount}</p>`
      ].join('')

      const blob = generateDocumentPDF({
        title: `Factura ${invoice.id}`,
        content: html,
        patientName: displayPatientName,
        documentDate: invoice.issueTimestamp ? new Date(invoice.issueTimestamp) : new Date()
      })
      const safeId = String(invoice.id).replace(/[^\w.-]/g, '_')
      downloadBlob(blob, `Factura_${safeId}.pdf`)
      showNotice(`Factura ${invoice.id} descargada`, 'success')
    } catch (error) {
      console.warn('No se pudo generar PDF de factura', error)
      showNotice('No se pudo descargar la factura', 'error')
    }
  }

  // Export invoices to CSV
  const handleExportInvoicesCSV = () => {
    // CSV header
    const headers = [
      'ID',
      'Descripción',
      'Importe',
      'Fecha',
      'Estado',
      'Método de pago',
      'Aseguradora'
    ]

    // Convert rows to CSV format
    const csvRows = [
      headers.join(';'),
      ...invoiceRows.map((row) =>
        [
          row.id,
          `"${row.description}"`,
          row.amount,
          row.date,
          row.status,
          row.paymentMethod || '',
          row.insurer || ''
        ].join(';')
      )
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facturas-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handler for production action menu items
  const handleProductionAction = (rowId: string, action: string) => {
    console.log(`Action: ${action} on row: ${rowId}`)

    switch (action) {
      case 'facturar': {
        // Find the row and open the invoice modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowInvoiceModal(true)
        }
        break
      }
      case 'marcar-producido': {
        // Find the row and open the modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowMarkAsProducedModal(true)
        }
        break
      }
      case 'ver-detalles': {
        // Find the row and open the details modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowProductionDetailsModal(true)
        }
        break
      }
      case 'ver-presupuesto': {
        // Find the row and switch to Presupuestos tab, showing the related budget
        const row = productionRows.find((r) => r.id === rowId)
        if (row && row.budgetId) {
          // Find the related budget
          const budget = budgetRows.find((b) => b.id === row.budgetId)
          if (budget) {
            setSelectedBudgetRow(budget)
            setShowBudgetDetailsModal(true)
          }
        } else {
          showNotice('No hay presupuesto asociado a esta producción', 'error')
        }
        break
      }
      case 'ver-factura': {
        // Find the row and show the related invoice
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          // Find related invoice by quote reference first, fallback by legacy pattern
          const relatedInvoice = invoiceRows.find(
            (inv) =>
              (row.quoteId && inv.quoteId === row.quoteId) ||
              inv.description === row.description ||
              inv.id === `F-${row.id.replace('PR-', '')}`
          )
          if (relatedInvoice) {
            setSelectedInvoiceRow(relatedInvoice)
            setShowInvoiceDetailsModal(true)
          } else {
            showNotice('No se encontró la factura asociada', 'error')
          }
        }
        break
      }
      case 'editar': {
        // Find the row and open the edit modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowEditProductionModal(true)
        }
        break
      }
      case 'eliminar':
        if (shouldUseDbSource) {
          const row = productionRows.find((item) => item.id === rowId)
          if (row?.quoteId) {
            void (async () => {
              try {
                await fetch('/api/caja/production', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    quoteId: String(row.quoteId),
                    productionStatus: 'Pending'
                  })
                })
              } catch (error) {
                console.warn('Error resetting production status', error)
              } finally {
                await refreshFinanceData()
              }
            })()
          }
        } else {
          setProductionRows((prevRows) =>
            prevRows.filter((row) => row.id !== rowId)
          )
        }
        break
      default:
        break
    }
  }

  // Handler for editing production
  const handleSaveProductionEdit = (data: { date: string; notes: string }) => {
    if (selectedProductionRow) {
      setProductionRows((prevRows) =>
        prevRows.map((row) =>
          row.id === selectedProductionRow.id
            ? { ...row, date: data.date }
            : row
        )
      )

      if (shouldUseDbSource && activeClinicId && selectedProductionRow.quoteId) {
        const parsedDate =
          data.date && data.date.trim().length > 0
            ? new Date(data.date)
            : null
        const isoDate =
          parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : null

        void (async () => {
          try {
            const { error } = await supabase
              .from('quotes')
              .update({
                production_date: isoDate
              })
              .eq('id', selectedProductionRow.quoteId)
              .eq('clinic_id', activeClinicId)
            if (error) throw error
          } catch (error) {
            console.warn('Error editing production date', error)
          } finally {
            await refreshFinanceData()
          }
        })()
      }
    }
  }

  // Handler functions for budget actions
  const handleDuplicateBudget = (budget: BudgetRow) => {
    const newId = `PRE-${Date.now().toString().slice(-6)}`
    const duplicatedBudget: BudgetRow = {
      ...budget,
      id: newId,
      description: `${budget.description} (copia)`,
      status: 'Pendiente',
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }),
      validUntil: undefined,
      history: [
        {
          date: new Date().toLocaleString('es-ES'),
          action: 'Presupuesto duplicado',
          user: 'Sistema'
        }
      ]
    }
    if (shouldUseDbSource && activeClinicId && patientId) {
      void (async () => {
        try {
          const parsedAmount = Number(
            String(budget.amount || '0')
              .replace(/[€\s.]/g, '')
              .replace(',', '.')
          )
          const { error } = await supabase.from('quotes').insert({
            clinic_id: activeClinicId,
            patient_id: patientId,
            quote_number: null,
            status: 'sent',
            total_amount: Number.isFinite(parsedAmount) ? parsedAmount : 0
          })
          if (error) throw error
        } catch (error) {
          console.warn('Error duplicating quote', error)
        } finally {
          await refreshFinanceData()
        }
      })()
      setShowBudgetDetailsModal(false)
      return
    }

    // Add the duplicated budget to the list
    if (onAddBudget) onAddBudget(duplicatedBudget)
    else setBudgetRows((prev) => [duplicatedBudget, ...prev])

    // Close details modal if open and open edit modal with the duplicated budget
    setShowBudgetDetailsModal(false)
    setSelectedBudgetRow(duplicatedBudget)
    setShowEditBudgetModal(true)
  }

  const handleDownloadBudgetPdf = (budget: BudgetRow) => {
    try {
      const treatmentsForPdf =
        budget.treatments && budget.treatments.length > 0
          ? budget.treatments.map((treatment) => ({
              pieza: treatment.pieza,
              cara: treatment.cara,
              codigo: treatment.codigo || '',
              tratamiento: treatment.tratamiento,
              precio: treatment.precio,
              porcentajeDescuento: treatment.porcentajeDescuento || 0,
              descuento: treatment.descuento || '0 €',
              importe: treatment.importe,
              doctor: treatment.doctor || budget.professional || 'Sin asignar'
            }))
          : [
              {
                codigo: budget.id,
                tratamiento: budget.description,
                precio: budget.amount,
                porcentajeDescuento: 0,
                descuento: '0 €',
                importe: budget.amount,
                doctor: budget.professional || 'Sin asignar'
              }
            ]

      const subtotal =
        typeof budget.subtotal === 'number'
          ? budget.subtotal
          : parseEuroAmount(budget.amount)
      const generalDiscountAmount =
        budget.generalDiscount?.type === 'fixed'
          ? budget.generalDiscount.value
          : budget.generalDiscount?.type === 'percentage'
          ? (subtotal * budget.generalDiscount.value) / 100
          : 0
      const totalFinal = Math.max(0, subtotal - generalDiscountAmount)

      const blob = generateBudgetPDF(treatmentsForPdf, displayPatientName, {
        budgetName: budget.description,
        generalDiscount: budget.generalDiscount,
        subtotal,
        generalDiscountAmount,
        totalFinal
      })
      const filename = formatBudgetFilename(displayPatientName, budget.description)
      downloadBlob(blob, filename)
      showNotice(`Presupuesto ${budget.id} descargado`, 'success')
    } catch (error) {
      console.warn('No se pudo generar el PDF del presupuesto', error)
      showNotice('No se pudo descargar el presupuesto', 'error')
    }
  }

  const handleSendBudgetEmail = (budget: BudgetRow) => {
    void openEmailComposer(
      `Presupuesto ${budget.id} - ${displayPatientName}`,
      [
        `Hola ${displayPatientName},`,
        '',
        `Adjuntamos el presupuesto ${budget.id}.`,
        `Concepto: ${budget.description}`,
        `Importe: ${budget.amount}`,
        `Estado: ${budget.status}`,
        '',
        'Gracias.'
      ].join('\n')
    )
  }

  const handleCreateAppointments = (budget: BudgetRow) => {
    const linkedTreatments =
      budget.treatments && budget.treatments.length > 0
        ? budget.treatments.map((treatment, index) => ({
            id:
              treatment.codigo ||
              `${budget.id}-${index}-${String(treatment.tratamiento || '').slice(0, 12)}`,
            description: treatment.tratamiento || budget.description,
            amount: treatment.importe || treatment.precio || budget.amount
          }))
        : [
            {
              id: budget.id,
              description: budget.description,
              amount: budget.amount
            }
          ]

    setPendingAppointmentData({
      paciente: displayPatientName,
      pacienteId: patientId,
      observaciones: `Cita desde presupuesto ${budget.id}\nEstado: ${budget.status}`,
      linkedTreatments
    })
    showNotice('Redirigiendo a Agenda con el presupuesto precargado', 'info')
    router.push('/agenda')
  }

  const handleConvertToInvoice = (budget: BudgetRow) => {
    if (!shouldUseDbSource || !activeClinicId || !patientId) {
      const newInvoice: InvoiceRow = {
        id: `FAC-${Date.now().toString().slice(-6)}`,
        description: budget.description,
        amount: budget.amount,
        date: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }),
        status: 'Pendiente',
        paymentMethod: '',
        insurer: budget.insurer || ''
      }
      setInvoiceRows((prev) => [newInvoice, ...prev])
      setActiveTab('Facturas')
      showNotice(`Presupuesto ${budget.id} convertido a factura`, 'success')
      return
    }

    void (async () => {
      try {
        const { data: invoiceNumberData } = await supabase.rpc(
          'get_next_invoice_number',
          {
            p_clinic_id: activeClinicId,
            p_series_id: null
          }
        )
        const payload = (invoiceNumberData || {}) as Record<string, unknown>
        const invoiceNumber =
          typeof payload.invoice_number === 'string'
            ? payload.invoice_number
            : `TMP-${Date.now()}`
        const seriesId =
          typeof payload.series_id === 'number' ? payload.series_id : null

        const totalAmount = Number(budget.subtotal || 0)
        const { error } = await supabase.from('invoices').insert({
          clinic_id: activeClinicId,
          patient_id: patientId,
          quote_id: budget.quoteId || null,
          invoice_number: invoiceNumber,
          status: 'open',
          total_amount: totalAmount,
          amount_paid: 0,
          issue_timestamp: new Date().toISOString(),
          series_id: seriesId
        })

        if (error) {
          throw error
        }
      } catch (error) {
        console.warn('Error converting quote to invoice', error)
      } finally {
        await refreshFinanceData()
      }
    })()
  }

  const handleDeleteBudget = (budgetId: string) => {
    const budget = budgetRows.find((row) => row.id === budgetId)
    setBudgetRows((prevRows) => prevRows.filter((row) => row.id !== budgetId))

    if (!shouldUseDbSource || !activeClinicId || !budget?.quoteId) return

    void (async () => {
      try {
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', budget.quoteId)
          .eq('clinic_id', activeClinicId)
        if (error) {
          throw error
        }
      } catch (error) {
        console.warn('Error deleting quote', error)
      } finally {
        await refreshFinanceData()
      }
    })()
  }

  // Handler for budget action menu items
  const handleBudgetAction = (rowId: string, action: string) => {
    console.log(`Budget Action: ${action} on row: ${rowId}`)
    const budget = budgetRows.find((r) => r.id === rowId)

    switch (action) {
      case 'marcar-aceptado':
        handleBudgetStatusChange(rowId, 'Aceptado')
        break
      case 'marcar-rechazado':
        handleBudgetStatusChange(rowId, 'Rechazado')
        break
      case 'reabrir':
        handleBudgetStatusChange(rowId, 'Pendiente')
        break
      case 'eliminar':
        handleDeleteBudget(rowId)
        break
      case 'ver-detalles':
        if (budget) {
          setSelectedBudgetRow(budget)
          setShowBudgetDetailsModal(true)
        }
        break
      case 'duplicar':
        if (budget) handleDuplicateBudget(budget)
        break
      case 'descargar-pdf':
        if (budget) handleDownloadBudgetPdf(budget)
        break
      case 'enviar-mail':
        if (budget) handleSendBudgetEmail(budget)
        break
      case 'crear-citas':
        if (budget) handleCreateAppointments(budget)
        break
      case 'convertir-factura':
        if (budget) handleConvertToInvoice(budget)
        break
      case 'ver-produccion':
        // Placeholder for future implementation
        console.log(`Action ${action} not yet implemented`)
        break
      case 'editar':
        if (budget) {
          setSelectedBudgetRow(budget)
          setShowEditBudgetModal(true)
        }
        break
      default:
        break
    }
  }

  // Column widths for PRODUCCIÓN - flexible layout
  const PROD_COL_FECHA = 'w-24 shrink-0' // Fixed
  const PROD_COL_DESC = 'flex-1 min-w-0' // Flexible - expands
  const PROD_COL_MONTO = 'w-24 shrink-0' // Fixed
  const PROD_COL_ESTADO = 'w-28 shrink-0' // Fixed
  const PROD_COL_PROFESIONAL = 'w-32 shrink-0' // Fixed
  const PROD_COL_ID = 'w-24 shrink-0' // Fixed

  // Column widths for PRESUPUESTOS - flexible layout
  const BUDGET_COL_ID = 'w-20 shrink-0' // Fixed
  const BUDGET_COL_DESC = 'flex-1 min-w-0' // Flexible - expands
  const BUDGET_COL_MONTO = 'w-24 shrink-0' // Fixed
  const BUDGET_COL_FECHA = 'w-24 shrink-0' // Fixed
  const BUDGET_COL_ESTADO = 'w-28 shrink-0' // Fixed
  const BUDGET_COL_PROFESIONAL = 'w-32 shrink-0' // Fixed
  const BUDGET_COL_INSURER = 'w-28 shrink-0' // Fixed

  return (
    <div
      className='w-full h-full bg-neutral-50 flex flex-col p-8 overflow-hidden'
      data-node-id='3092:10807'
    >
      {/* Header */}
      <div className='flex flex-col gap-2 mb-6' data-node-id='3092:10815'>
        <p className='text-headline-sm text-neutral-900'>Finanzas</p>
        <p className='text-body-sm text-neutral-900'>
          Cobros, financiación embebida, facturas/recibos y conciliación.
        </p>
      </div>

      {/* KPIs - calculated dynamically */}
      {(() => {
        // Calculate pending balance from invoices with status "Pendiente"
        const pendingBalance = invoiceRows
          .filter((row) => row.status === 'Pendiente')
          .reduce((sum, row) => {
            // Parse amount like "150 €" or "1.200 €" to number
            const amountStr = row.amount
              .replace(/[€\s.]/g, '')
              .replace(',', '.')
            return sum + (parseFloat(amountStr) || 0)
          }, 0)

        // Count pending invoices (could represent "vencidas" in a real scenario)
        const pendingCount = invoiceRows.filter(
          (row) => row.status === 'Pendiente'
        ).length

        // Format balance with Spanish locale
        const formattedBalance = pendingBalance.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })

        return (
          <div className='flex gap-16 mb-6'>
            <div data-node-id='3092:10811'>
              <p className='text-title-md text-neutral-900'>Saldo pendiente</p>
              <p
                className='mt-[0.4375rem] text-neutral-900'
                style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
                data-node-id='3092:10813'
              >
                {formattedBalance} €
              </p>
            </div>
            <div data-node-id='3092:10812'>
              <p className='text-title-md text-neutral-900'>
                Facturas vencidas
              </p>
              <p
                className='mt-[0.4375rem] text-warning-600'
                style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
                data-node-id='3092:10814'
              >
                {String(pendingCount).padStart(2, '0')}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Main Card */}
      <div
        className='flex-1 bg-white rounded-lg border border-neutral-200 overflow-hidden relative'
        data-node-id='3092:10816'
      >
        {/* Tabs */}
        <div
          className='absolute left-8 top-4 flex items-center gap-6'
          data-node-id='3092:10964'
        >
          {(
            ['Presupuestos', 'Producción', 'Facturas', 'Cuotas'] as TabKey[]
          ).map((tab) => {
            // Calcular badge para tab de Cuotas
            const pendingInstallmentsCount = budgetRows
              .filter((b) => b.installmentPlan)
              .reduce((count, b) => {
                const pending =
                  b.installmentPlan?.installments.filter(
                    (i) => i.status === 'pending' || i.status === 'partial'
                  ).length ?? 0
                return count + pending
              }, 0)

            return (
              <button
                key={tab}
                type='button'
                className={[
                  'h-10 px-2 flex items-center gap-2 text-title-md cursor-pointer transition-colors',
                  activeTab === tab
                    ? 'border-b border-brand-500 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                ].join(' ')}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'Cuotas' && pendingInstallmentsCount > 0 && (
                  <span className='inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full'>
                    {pendingInstallmentsCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Action buttons - change based on active tab */}
        {activeTab === 'Presupuestos' ? (
          <>
            {/* Presupuesto tipo button */}
            <button
              className='absolute top-4 right-[15rem] flex items-center gap-2 rounded-[8.5rem] px-4 py-2 text-body-md text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer'
              type='button'
              onClick={() => setShowBudgetTypeModal(true)}
            >
              <ElectricBoltRounded className='size-6 text-brand-500' />
              <span className='font-medium'>Presupuesto tipo</span>
            </button>
            {/* Crear presupuesto button */}
            <button
              className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
              type='button'
              onClick={() => setShowAddTreatmentsModal(true)}
            >
              <AddRounded className='size-6' />
              <span className='font-medium'>Crear presupuesto</span>
            </button>
          </>
        ) : activeTab === 'Producción' ? (
          <button
            className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
            type='button'
            onClick={() => setShowAddProductionModal(true)}
            data-node-id='3092:10817'
          >
            <AddRounded className='size-6' />
            <span className='font-medium'>Añadir producción</span>
          </button>
        ) : activeTab === 'Facturas' ? (
          <button
            className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
            type='button'
            onClick={handleExportInvoicesCSV}
          >
            <DownloadRounded className='size-6' />
            <span className='font-medium'>Exportar CSV</span>
          </button>
        ) : activeTab === 'Cuotas' ? (
          <button
            className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-brand-500 text-white text-body-md hover:bg-brand-600 active:bg-brand-700 transition-colors cursor-pointer shadow-md'
            type='button'
            onClick={() => setShowQuickPaymentModal(true)}
          >
            <PaymentsRounded className='size-6' />
            <span className='font-medium'>Cobrar cuota</span>
          </button>
        ) : null}

        {/* Search + Filters */}
        <div
          className='absolute top-[4.4375rem] left-8 right-8 flex items-center justify-between gap-2'
          data-node-id='3092:10999'
        >
          {/* Left side: Quick filters */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setQuickFilter('all')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'all'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Todos
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('this-week')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'this-week'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Esta semana
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('this-month')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'this-month'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Este mes
            </button>
          </div>

          {/* Right side: Search and filter dropdowns */}
          <div className='flex items-center gap-2'>
            {/* Search */}
            {showSearchInput ? (
              <div className='flex items-center gap-1 h-8 px-2 rounded-full border border-neutral-700 bg-white'>
                <SearchRounded className='size-5 text-neutral-600' />
                <input
                  ref={searchInputRef}
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Buscar...'
                  className='w-32 text-body-sm bg-transparent outline-none'
                />
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchInput(false)
                  }}
                  className='text-neutral-500 hover:text-neutral-700'
                >
                  <CloseRounded className='size-4' />
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => setShowSearchInput(true)}
                className='flex items-center h-8 px-2 py-1 rounded-full border border-neutral-300 text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors'
              >
                <SearchRounded className='size-5' />
              </button>
            )}

            {/* Status Filter */}
            <div className='relative' data-filter-dropdown>
              <button
                type='button'
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowProfessionalDropdown(false)
                  setShowInsurerDropdown(false)
                  setShowPaymentMethodDropdown(false)
                  setShowDateRangeDropdown(false)
                }}
                className={[
                  'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                  (activeTab === 'Producción' &&
                    selectedProductionStatuses.length > 0) ||
                  (activeTab === 'Presupuestos' &&
                    selectedBudgetStatuses.length > 0) ||
                  (activeTab === 'Facturas' &&
                    selectedInvoiceStatuses.length > 0)
                    ? 'bg-brand-100 border border-brand-500 text-brand-700'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                ].join(' ')}
              >
                <span>Estado</span>
                <KeyboardArrowDownRounded className='size-4' />
              </button>
              {showStatusDropdown && (
                <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                  {activeTab === 'Producción' &&
                    STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedProductionStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductionStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedProductionStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                  {activeTab === 'Presupuestos' &&
                    BUDGET_STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedBudgetStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBudgetStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedBudgetStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                  {activeTab === 'Facturas' &&
                    INVOICE_STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedInvoiceStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedInvoiceStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            {/* Professional Filter (not for Facturas) */}
            {activeTab !== 'Facturas' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowProfessionalDropdown(!showProfessionalDropdown)
                    setShowStatusDropdown(false)
                    setShowInsurerDropdown(false)
                    setShowPaymentMethodDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedProfessional
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>{selectedProfessional || 'Profesional'}</span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showProfessionalDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedProfessional('')
                        setShowProfessionalDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todos
                    </button>
                    {professionals.map((prof) => (
                      <button
                        key={prof}
                        type='button'
                        onClick={() => {
                          setSelectedProfessional(prof)
                          setShowProfessionalDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedProfessional === prof
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {prof}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insurer Filter (not for Producción) */}
            {activeTab !== 'Producción' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowInsurerDropdown(!showInsurerDropdown)
                    setShowStatusDropdown(false)
                    setShowProfessionalDropdown(false)
                    setShowPaymentMethodDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedInsurer
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>{selectedInsurer || 'Aseguradora'}</span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showInsurerDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedInsurer('')
                        setShowInsurerDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todas
                    </button>
                    {insurers.map((ins) => (
                      <button
                        key={ins}
                        type='button'
                        onClick={() => {
                          setSelectedInsurer(ins)
                          setShowInsurerDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedInsurer === ins
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {ins}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Filter (Facturas only) */}
            {activeTab === 'Facturas' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowPaymentMethodDropdown(!showPaymentMethodDropdown)
                    setShowStatusDropdown(false)
                    setShowProfessionalDropdown(false)
                    setShowInsurerDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedPaymentMethod
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>{selectedPaymentMethod || 'Método pago'}</span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showPaymentMethodDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedPaymentMethod('')
                        setShowPaymentMethodDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todos
                    </button>
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        type='button'
                        onClick={() => {
                          setSelectedPaymentMethod(method)
                          setShowPaymentMethodDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedPaymentMethod === method
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Range Filter */}
            <div className='relative' data-filter-dropdown>
              <button
                type='button'
                onClick={() => {
                  setShowDateRangeDropdown(!showDateRangeDropdown)
                  setShowStatusDropdown(false)
                  setShowProfessionalDropdown(false)
                  setShowInsurerDropdown(false)
                  setShowPaymentMethodDropdown(false)
                }}
                className={[
                  'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                  dateFrom || dateTo
                    ? 'bg-brand-100 border border-brand-500 text-brand-700'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                ].join(' ')}
              >
                <CalendarMonthRounded className='size-4' />
                <span>
                  {dateFrom || dateTo
                    ? `${
                        dateFrom
                          ? dateFrom.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })
                          : '...'
                      } - ${
                        dateTo
                          ? dateTo.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })
                          : '...'
                      }`
                    : 'Fechas'}
                </span>
                <KeyboardArrowDownRounded className='size-4' />
              </button>
              {showDateRangeDropdown && (
                <div className='absolute right-0 top-10 z-50 w-72 bg-white rounded-lg border border-neutral-200 shadow-lg p-4'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-col gap-1'>
                      <label className='text-body-sm text-neutral-600'>
                        Desde
                      </label>
                      <input
                        type='date'
                        value={
                          dateFrom ? dateFrom.toISOString().split('T')[0] : ''
                        }
                        onChange={(e) =>
                          setDateFrom(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className='h-10 px-3 rounded-lg border border-neutral-300 text-body-sm'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-body-sm text-neutral-600'>
                        Hasta
                      </label>
                      <input
                        type='date'
                        value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                          setDateTo(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className='h-10 px-3 rounded-lg border border-neutral-300 text-body-sm'
                      />
                    </div>
                    <div className='flex justify-between pt-2'>
                      <button
                        type='button'
                        onClick={() => {
                          setDateFrom(null)
                          setDateTo(null)
                        }}
                        className='text-body-sm text-neutral-600 hover:text-neutral-900'
                      >
                        Limpiar
                      </button>
                      <button
                        type='button'
                        onClick={() => setShowDateRangeDropdown(false)}
                        className='px-3 py-1 rounded-full bg-brand-500 text-body-sm text-brand-900'
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                type='button'
                onClick={clearAllFilters}
                className='flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm text-error-600 border border-error-300 hover:bg-error-50 cursor-pointer transition-colors'
              >
                <CloseRounded className='size-4' />
                <span>Limpiar</span>
              </button>
            )}

            {/* Results count indicator */}
            {hasActiveFilters && (
              <span className='text-body-sm text-neutral-500 ml-2'>
                {activeTab === 'Presupuestos' &&
                  `${filteredBudgetRows.length} de ${budgetRows.length}`}
                {activeTab === 'Producción' &&
                  `${filteredProductionRows.length} de ${productionRows.length}`}
                {activeTab === 'Facturas' &&
                  `${filteredInvoiceRows.length} de ${invoiceRows.length}`}
              </span>
            )}
          </div>
        </div>

        {/* Table Container - PRESUPUESTOS */}
        {activeTab === 'Presupuestos' && (
          <div
            className='absolute left-8 right-8 top-[7.4375rem]'
            data-node-id='3092:10352'
          >
            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div
                className={`${BUDGET_COL_ID} px-2 py-1 text-body-md text-neutral-600`}
              >
                ID
              </div>
              <div
                className={`${BUDGET_COL_DESC} px-2 py-1 text-body-md text-neutral-600`}
              >
                Descripción
              </div>
              <div
                className={`${BUDGET_COL_MONTO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Monto
              </div>
              <div
                className={`${BUDGET_COL_FECHA} px-2 py-1 text-body-md text-neutral-600`}
              >
                Fecha
              </div>
              <div
                className={`${BUDGET_COL_ESTADO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Estado
              </div>
              <div
                className={`${BUDGET_COL_PROFESIONAL} px-2 py-1 text-body-md text-neutral-600`}
              >
                Profesional
              </div>
              <div
                className={`${BUDGET_COL_INSURER} px-2 py-1 text-body-md text-neutral-600`}
              >
                Aseguradora
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredBudgetRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron presupuestos</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredBudgetRows.map((row) => (
                  <div
                    key={row.id}
                    className='flex items-center border-b border-neutral-300 h-10 group hover:bg-neutral-100 cursor-pointer transition-colors'
                    onClick={() => {
                      setSelectedBudgetRow(row)
                      setShowBudgetDetailsModal(true)
                    }}
                  >
                    <div
                      className={`${BUDGET_COL_ID} px-2 text-body-md font-semibold text-brand-700`}
                    >
                      {row.id}
                    </div>
                    <div
                      className={`${BUDGET_COL_DESC} px-2 text-body-md text-neutral-900`}
                    >
                      {row.description}
                    </div>
                    <div
                      className={`${BUDGET_COL_MONTO} px-2 text-body-md text-neutral-900`}
                    >
                      {row.amount}
                    </div>
                    <div
                      className={`${BUDGET_COL_FECHA} px-2 text-body-md text-neutral-900`}
                    >
                      {row.date}
                    </div>
                    <div
                      className={`${BUDGET_COL_ESTADO} px-2`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BudgetStatusBadge
                        status={row.status}
                        rowId={row.id}
                        onStatusChange={handleBudgetStatusChange}
                      />
                    </div>
                    <div
                      className={`${BUDGET_COL_PROFESIONAL} px-2 text-body-md text-neutral-900`}
                    >
                      {row.professional}
                    </div>
                    <div
                      className={`${BUDGET_COL_INSURER} px-2 text-body-md text-neutral-900`}
                    >
                      {row.insurer}
                    </div>
                    {/* More actions menu */}
                    <div
                      className='ml-auto'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BudgetActionsMenu
                        rowId={row.id}
                        status={row.status}
                        onAction={handleBudgetAction}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Table Container - PRODUCCIÓN */}
        {activeTab === 'Producción' && (
          <div
            className='absolute left-8 right-8 top-[7.4375rem]'
            data-node-id='3092:10838'
          >
            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div
                className={`${PROD_COL_FECHA} px-2 py-1 text-body-md text-neutral-600`}
              >
                Fecha
              </div>
              <div
                className={`${PROD_COL_DESC} px-2 py-1 text-body-md text-neutral-600`}
              >
                Descripción
              </div>
              <div
                className={`${PROD_COL_MONTO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Monto
              </div>
              <div
                className={`${PROD_COL_ESTADO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Estado
              </div>
              <div
                className={`${PROD_COL_PROFESIONAL} px-2 py-1 text-body-md text-neutral-600`}
              >
                Profesional
              </div>
              <div
                className={`${PROD_COL_ID} px-2 py-1 text-body-md text-neutral-600`}
              >
                ID
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredProductionRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron producciones</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredProductionRows.map((row) => (
                  <div
                    key={row.id}
                    className='flex items-center border-b border-neutral-300 h-10 group'
                  >
                    <div
                      className={`${PROD_COL_FECHA} px-2 text-body-md text-neutral-900`}
                    >
                      {row.date}
                    </div>
                    <div
                      className={`${PROD_COL_DESC} px-2 text-body-md text-neutral-900`}
                    >
                      {row.description}
                    </div>
                    <div
                      className={`${PROD_COL_MONTO} px-2 text-body-md text-neutral-900`}
                    >
                      {row.amount}
                    </div>
                    <div className={`${PROD_COL_ESTADO} px-2`}>
                      <StatusBadge
                        status={row.status}
                        rowId={row.id}
                        onStatusChange={handleProductionStatusChange}
                      />
                    </div>
                    <div
                      className={`${PROD_COL_PROFESIONAL} px-2 text-body-md text-neutral-900`}
                    >
                      {row.professional}
                    </div>
                    <div
                      className={`${PROD_COL_ID} px-2 text-body-md font-semibold text-brand-700`}
                    >
                      {row.id}
                    </div>
                    {/* More actions menu */}
                    <div className='ml-auto'>
                      <ActionsMenu
                        rowId={row.id}
                        status={row.status}
                        onAction={handleProductionAction}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Table Container - FACTURAS */}
        {activeTab === 'Facturas' && (
          <div
            className='absolute left-8 right-8 top-[7.4375rem]'
            data-node-id='facturas-table'
          >
            {/* Column widths from Figma */}
            {/* ID: 96px = 6rem, Desc: 310px = 19.375rem, Monto: 110px = 6.875rem */}
            {/* Fecha: 113px = 7.0625rem, Estado: 122px = 7.625rem */}
            {/* Método: 145px = 9.0625rem, Aseguradora: 149px = 9.3125rem */}

            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div className='w-20 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                ID
              </div>
              <div className='flex-1 min-w-0 px-2 py-1 text-body-md text-neutral-600'>
                Descripción
              </div>
              <div className='w-24 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                Monto
              </div>
              <div className='w-24 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                Fecha fact.
              </div>
              <div className='w-28 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                Estado cobro
              </div>
              <div className='w-28 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                Método pago
              </div>
              <div className='w-28 shrink-0 px-2 py-1 text-body-md text-neutral-600'>
                Aseguradora
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredInvoiceRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron facturas</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredInvoiceRows.map((row) => (
                  <div
                    key={row.id}
                    className='flex items-center border-b border-neutral-300 h-10 group'
                  >
                    <div className='w-20 shrink-0 px-2 text-body-md text-neutral-900'>
                      {row.id}
                    </div>
                    <div className='flex-1 min-w-0 px-2 text-body-md text-neutral-900 truncate'>
                      {row.description}
                    </div>
                    <div className='w-24 shrink-0 px-2 text-body-md text-neutral-900'>
                      {row.amount}
                    </div>
                    <div className='w-24 shrink-0 px-2 text-body-md text-neutral-900'>
                      {row.date}
                    </div>
                    <div className='w-28 shrink-0 px-2'>
                      <InvoiceStatusBadge
                        status={row.status}
                        rowId={row.id}
                        onStatusChange={handleInvoiceStatusChange}
                      />
                    </div>
                    <div className='w-28 shrink-0 px-2 text-body-md text-neutral-900'>
                      {row.paymentMethod}
                    </div>
                    <div className='w-28 shrink-0 px-2 text-body-md text-neutral-900'>
                      {row.insurer}
                    </div>
                    {/* More actions menu */}
                    <div className='ml-auto'>
                      <InvoiceActionsMenu
                        rowId={row.id}
                        status={row.status}
                        onAction={handleInvoiceAction}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Table Container - CUOTAS */}
        {activeTab === 'Cuotas' && (
          <div
            className='absolute left-8 right-8 top-[7.4375rem]'
            data-node-id='cuotas-table'
          >
            {/* Budgets with installment plans */}
            <div className='max-h-[24.5rem] overflow-y-auto space-y-4'>
              {budgetRows.filter((b) => b.installmentPlan).length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <PaymentsRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No hay presupuestos con cuotas</p>
                  <p className='text-body-sm text-neutral-400 mt-1'>
                    Crea un plan de cuotas al aceptar un presupuesto
                  </p>
                </div>
              ) : (
                budgetRows
                  .filter((b) => b.installmentPlan)
                  .map((budget) => {
                    const plan = budget.installmentPlan!
                    const paidCount = plan.installments.filter(
                      (i) => i.status === 'paid'
                    ).length
                    const pendingCount = plan.installments.filter(
                      (i) => i.status === 'pending' || i.status === 'partial'
                    ).length
                    const totalPaid =
                      budget.payments?.reduce((sum, p) => sum + p.amount, 0) ??
                      0
                    const totalPending = plan.totalAmount - totalPaid

                    return (
                      <div
                        key={budget.id}
                        className='bg-white border border-neutral-200 rounded-xl overflow-hidden'
                      >
                        {/* Budget Header */}
                        <div className='p-4 bg-neutral-50 border-b border-neutral-200'>
                          <div className='flex items-start justify-between'>
                            <div>
                              <h3 className='text-title-md text-neutral-900'>
                                {budget.description}
                              </h3>
                              <p className='text-body-sm text-neutral-500 mt-0.5'>
                                {budget.treatments
                                  ?.map((t) => t.tratamiento)
                                  .join(', ')}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-title-md text-neutral-900'>
                                {plan.totalAmount.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2
                                })}{' '}
                                €
                              </p>
                              <p className='text-body-sm text-amber-600'>
                                {pendingCount} cuota
                                {pendingCount !== 1 ? 's' : ''} pendiente
                                {pendingCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className='mt-3'>
                            <div className='h-2 bg-neutral-200 rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-brand-500 rounded-full transition-all'
                                style={{
                                  width: `${
                                    (totalPaid / plan.totalAmount) * 100
                                  }%`
                                }}
                              />
                            </div>
                            <div className='flex justify-between mt-1'>
                              <span className='text-body-xs text-neutral-500'>
                                Pagado:{' '}
                                {totalPaid.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2
                                })}{' '}
                                €
                              </span>
                              <span className='text-body-xs text-neutral-500'>
                                Pendiente:{' '}
                                {totalPending.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2
                                })}{' '}
                                €
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Installments Grid */}
                        <div className='p-4'>
                          <div className='grid grid-cols-3 gap-2'>
                            {plan.installments.map((inst) => {
                              const isPaid = inst.status === 'paid'
                              const isPartial = inst.status === 'partial'
                              const isPending = inst.status === 'pending'

                              return (
                                <div
                                  key={inst.id}
                                  className={[
                                    'p-3 rounded-lg border text-center',
                                    isPaid
                                      ? 'bg-green-50 border-green-200'
                                      : isPartial
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-amber-50 border-amber-200'
                                  ].join(' ')}
                                >
                                  <p className='text-body-xs text-neutral-500'>
                                    Cuota {inst.installmentNumber}
                                  </p>
                                  <p
                                    className={[
                                      'text-title-sm font-medium',
                                      isPaid
                                        ? 'text-green-700'
                                        : isPartial
                                        ? 'text-blue-700'
                                        : 'text-amber-700'
                                    ].join(' ')}
                                  >
                                    {inst.amount.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2
                                    })}{' '}
                                    €
                                  </p>
                                  <p
                                    className={[
                                      'text-body-xs mt-0.5',
                                      isPaid
                                        ? 'text-green-600'
                                        : isPartial
                                        ? 'text-blue-600'
                                        : 'text-amber-600'
                                    ].join(' ')}
                                  >
                                    {isPaid
                                      ? 'Pagada'
                                      : isPartial
                                      ? `Parcial (${inst.paidAmount.toLocaleString(
                                          'es-ES'
                                        )} €)`
                                      : 'Pendiente'}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Payment History */}
                        {budget.payments && budget.payments.length > 0 && (
                          <div className='border-t border-neutral-200 p-4'>
                            <p className='text-title-sm text-neutral-700 mb-2'>
                              Historial de pagos
                            </p>
                            <div className='space-y-2'>
                              {budget.payments.map((payment) => (
                                <div
                                  key={payment.id}
                                  className='flex items-center justify-between p-2 bg-neutral-50 rounded-lg'
                                >
                                  <div className='flex items-center gap-2'>
                                    <ReceiptLongRounded className='w-4 h-4 text-neutral-400' />
                                    <div>
                                      <p className='text-body-sm text-neutral-700'>
                                        {payment.amount.toLocaleString(
                                          'es-ES',
                                          {
                                            minimumFractionDigits: 2
                                          }
                                        )}{' '}
                                        €
                                      </p>
                                      <p className='text-body-xs text-neutral-500'>
                                        {payment.paymentMethod
                                          .charAt(0)
                                          .toUpperCase() +
                                          payment.paymentMethod.slice(1)}{' '}
                                        · Cuotas {payment.installmentIds.length}
                                      </p>
                                    </div>
                                  </div>
                                  <span className='text-body-sm text-neutral-500'>
                                    {new Date(payment.date).toLocaleDateString(
                                      'es-ES',
                                      {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit'
                                      }
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick pay button for this budget */}
                        {pendingCount > 0 && (
                          <div className='border-t border-neutral-200 p-4 bg-neutral-50'>
                            <button
                              type='button'
                              onClick={() => setShowQuickPaymentModal(true)}
                              className='w-full py-2.5 rounded-lg bg-brand-500 text-white text-title-sm hover:bg-brand-600 transition-colors cursor-pointer'
                            >
                              Cobrar cuota
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div
          className='absolute bottom-2 right-8 inline-flex items-center gap-3 text-neutral-900'
          data-node-id='3092:10818'
        >
          <div className='inline-flex items-center'>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Primera página'
            >
              <FirstPageRounded className='size-6' />
            </button>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Página anterior'
            >
              <ChevronLeftRounded className='size-6' />
            </button>
          </div>
          <div
            className='inline-flex items-center gap-2 text-body-sm'
            data-node-id='3092:10826'
          >
            <span className='underline font-bold'>1</span>
            <span>2</span>
            <span>...</span>
            <span>12</span>
          </div>
          <div className='inline-flex items-center'>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Página siguiente'
            >
              <ChevronRightRounded className='size-6' />
            </button>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Última página'
            >
              <LastPageRounded className='size-6' />
            </button>
          </div>
        </div>
      </div>

      <AddTreatmentsToBudgetModal
        open={showAddTreatmentsModal}
        onClose={() => {
          setShowAddTreatmentsModal(false)
          // Clear budget type data when modal closes
          setBudgetTypeTreatments(undefined)
          setBudgetTypeName('')
        }}
        treatments={budgetTypeTreatments || pendingTreatmentsForBudgetModal}
        initialBudgetName={budgetTypeName}
        onCreateBudget={(selectedTreatments, budgetInfo) => {
          if (shouldUseDbSource && activeClinicId && patientId) {
            void (async () => {
              try {
                const result = await createQuoteWithItems({
                  selectedTreatments,
                  totalAmount: Number(budgetInfo.total || 0),
                  budgetName: budgetInfo.name
                })
                if (!result.ok) throw new Error(result.error)
                showNotice('Presupuesto guardado en base de datos', 'success')
                setShowAddTreatmentsModal(false)
              } catch (error) {
                console.warn('Error creating quote', error)
                const message =
                  error instanceof Error
                    ? error.message
                    : 'No se pudo guardar el presupuesto'
                showNotice(message, 'error')
              } finally {
                await refreshFinanceData()
              }
            })()
            return
          }

          // Calculate validity date (30 days from now)
          const validUntilDate = new Date()
          validUntilDate.setDate(validUntilDate.getDate() + 30)

          // Create new budget row with extended fields
          const newBudget: BudgetRow = {
            id: `PRE-${Date.now().toString().slice(-6)}`,
            description: budgetInfo.name,
            amount: `${budgetInfo.total.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} €`,
            date: new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }),
            status: 'Pendiente',
            professional: selectedTreatments[0]?.doctor || '',
            insurer: '',
            // Extended fields
            subtotal: budgetInfo.subtotal,
            generalDiscount:
              budgetInfo.generalDiscountAmount > 0
                ? { type: 'fixed', value: budgetInfo.generalDiscountAmount }
                : undefined,
            validUntil: validUntilDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }),
            treatments: selectedTreatments.map((t) => ({
              pieza: t.pieza,
              cara: t.cara,
              codigo: t.codigo,
              tratamiento: t.tratamiento,
              precio: t.precio,
              porcentajeDescuento: t.porcentajeDescuento,
              descuento: t.descuento || '0 €',
              importe: t.importe,
              doctor: t.doctor
            })),
            history: [
              {
                date: new Date().toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                action: 'Presupuesto creado',
                user: selectedTreatments[0]?.doctor || 'Sistema'
              }
            ]
          }

          // Add to budget rows (uses shared state via onAddBudget if available)
          if (onAddBudget) {
            onAddBudget(newBudget)
          } else {
            setBudgetRows((prev) => [newBudget, ...prev])
          }

          setShowAddTreatmentsModal(false)
        }}
      />
      <BudgetTypeListModal
        open={showBudgetTypeModal}
        onClose={() => setShowBudgetTypeModal(false)}
        onSelect={handleBudgetTypeSelect}
        onCreateNew={handleCreateNewBudgetType}
      />
      {/* Modal para crear nuevo presupuesto tipo */}
      <AddTreatmentsToBudgetModal
        open={showCreateBudgetTypeModal}
        onClose={() => setShowCreateBudgetTypeModal(false)}
        onCreateBudget={() => {}}
        onCreateBudgetType={handleSaveBudgetType}
        treatments={pendingTreatmentsForBudgetModal}
        mode='budgetType'
      />
      <AddProductionModal
        open={showAddProductionModal}
        onClose={() => setShowAddProductionModal(false)}
        onSubmit={(data) => {
          if (shouldUseDbSource && activeClinicId && patientId) {
            const parsedAmount = Number(
              String(data.price || '')
                .replace(/[€\s.]/g, '')
                .replace(',', '.')
            )
            void (async () => {
              try {
                const result = await createQuoteWithItems({
                  selectedTreatments: [],
                  totalAmount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
                  productionPending: true
                })
                if (!result.ok) {
                  throw new Error(result.error)
                }
                showNotice('Producción creada en base de datos', 'success')
                setShowAddProductionModal(false)
              } catch (error) {
                console.warn('Error creating production quote', error)
                showNotice('No se pudo crear la producción', 'error')
              } finally {
                await refreshFinanceData()
              }
            })()
            return
          }
          setShowAddProductionModal(false)
        }}
      />
      <MarkAsProducedModal
        open={showMarkAsProducedModal}
        onClose={() => {
          setShowMarkAsProducedModal(false)
          setSelectedProductionRow(null)
        }}
        onSubmit={(data) => {
          if (selectedProductionRow) {
            if (shouldUseDbSource && selectedProductionRow.quoteId && activeClinicId) {
              void (async () => {
                try {
                  await fetch('/api/caja/production', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      quoteId: String(selectedProductionRow.quoteId),
                      productionStatus: 'Done'
                    })
                  })
                  if (data.productionDate) {
                    const { error } = await supabase
                      .from('quotes')
                      .update({ production_date: data.productionDate.toISOString() })
                      .eq('id', selectedProductionRow.quoteId)
                      .eq('clinic_id', activeClinicId)
                    if (error) throw error
                  }
                } catch (error) {
                  console.warn('Error marking production as done', error)
                } finally {
                  await refreshFinanceData()
                }
              })()
            }

            // Format the selected date or use today as fallback
            const formattedDate = data.productionDate
              ? data.productionDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })
              : new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })

            // 1. Update the production row: set date and change status to "Producido"
            setProductionRows((prevRows) =>
              prevRows.map((row) =>
                row.id === selectedProductionRow.id
                  ? {
                      ...row,
                      status: 'Producido' as StatusType,
                      date: formattedDate,
                      professional:
                        data.professional === 'dr-guillermo'
                          ? 'Dr. Guillermo'
                          : data.professional === 'dra-andrea'
                          ? 'Dra. Andrea'
                          : row.professional
                    }
                  : row
              )
            )
          }
          setShowMarkAsProducedModal(false)
          setSelectedProductionRow(null)
        }}
        budgetCode={selectedProductionRow?.id ?? ''}
        treatment={selectedProductionRow?.description ?? ''}
        amount={selectedProductionRow?.amount ?? ''}
      />
      <InvoiceProductionModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedProductionRow(null)
        }}
        onSubmit={(data) => {
          if (selectedProductionRow) {
            if (shouldUseDbSource && activeClinicId && patientId) {
              void (async () => {
                try {
                  const invoiceDateIso = data.invoiceDate
                    ? data.invoiceDate.toISOString()
                    : new Date().toISOString()
                  const amountNumber = Number(
                    selectedProductionRow.amount
                      .replace(/[€\s.]/g, '')
                      .replace(',', '.')
                  )
                  const { error } = await supabase.from('invoices').insert({
                    clinic_id: activeClinicId,
                    patient_id: patientId,
                    quote_id: selectedProductionRow.quoteId || null,
                    invoice_number: data.invoiceNumber,
                    status: 'open',
                    total_amount: Number.isFinite(amountNumber) ? amountNumber : 0,
                    amount_paid: 0,
                    issue_timestamp: invoiceDateIso
                  })
                  if (error) throw error

                  if (selectedProductionRow.quoteId) {
                    await fetch('/api/caja/production', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        quoteId: String(selectedProductionRow.quoteId),
                        productionStatus: 'Done'
                      })
                    })
                  }
                } catch (error) {
                  console.warn('Error creating invoice from production', error)
                } finally {
                  await refreshFinanceData()
                }
              })()
            }

            // Format the selected date or use today as fallback
            const formattedDate = data.invoiceDate
              ? data.invoiceDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })
              : new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })

            // 1. Change production status to "Facturado"
            handleProductionStatusChange(selectedProductionRow.id, 'Facturado')

            // 2. Create new invoice with status "Pendiente"
            const newInvoice: InvoiceRow = {
              id: data.invoiceNumber,
              description: selectedProductionRow.description,
              amount: selectedProductionRow.amount,
              date: formattedDate,
              status: 'Pendiente',
              paymentMethod: '',
              insurer: ''
            }
            setInvoiceRows((prev) => [newInvoice, ...prev])
          }
          setShowInvoiceModal(false)
          setSelectedProductionRow(null)
        }}
        treatment={selectedProductionRow?.description ?? ''}
        productionDate={selectedProductionRow?.date ?? ''}
        amount={selectedProductionRow?.amount ?? ''}
      />
      <RegisterPaymentModal
        open={showRegisterPaymentModal}
        onClose={() => {
          setShowRegisterPaymentModal(false)
          setSelectedInvoiceRow(null)
        }}
        onSubmit={(data) => {
          if (selectedInvoiceRow?.dbInvoiceId && shouldUseDbSource) {
            return (async () => {
              try {
                const response = await fetch('/api/caja/register-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    invoiceId: String(selectedInvoiceRow.dbInvoiceId),
                    amount: data.amountToPay,
                    paymentMethod: data.paymentMethod,
                    transactionDate: data.paymentDate?.toISOString(),
                    transactionId: data.reference || null,
                    notes: selectedInvoiceRow.description
                  })
                })
                const responseBody = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null
                if (!response.ok) {
                  return {
                    ok: false,
                    error: responseBody?.error || 'No se pudo registrar el pago'
                  }
                }

                await refreshFinanceData()
                setShowRegisterPaymentModal(false)
                setSelectedInvoiceRow(null)
                return { ok: true }
              } catch (error) {
                return {
                  ok: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'No se pudo registrar el pago'
                }
              }
            })()
          }

          if (selectedInvoiceRow) {
            // Legacy local fallback
            setInvoiceRows((prevRows) =>
              prevRows.map((row) =>
                row.id === selectedInvoiceRow.id
                  ? {
                      ...row,
                      status: 'Cobrado' as InvoiceStatusType,
                      paymentMethod:
                        data.paymentMethod === 'efectivo'
                          ? 'Efectivo'
                          : data.paymentMethod === 'tarjeta'
                          ? 'Tarjeta'
                          : data.paymentMethod === 'transferencia'
                          ? 'Transferencia'
                          : row.paymentMethod
                    }
                  : row
              )
            )
          }

          setShowRegisterPaymentModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        treatment={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
      />
      <TraceabilityModal
        open={showTraceabilityModal}
        onClose={() => {
          setShowTraceabilityModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        treatment={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
        invoiceDate={selectedInvoiceRow?.date ?? ''}
        invoiceStatus={selectedInvoiceRow?.status ?? ''}
        paymentMethod={selectedInvoiceRow?.paymentMethod ?? ''}
        insurer={selectedInvoiceRow?.insurer ?? ''}
      />
      <BudgetDetailsModal
        open={showBudgetDetailsModal}
        onClose={() => {
          setShowBudgetDetailsModal(false)
          setSelectedBudgetRow(null)
        }}
        budget={selectedBudgetRow}
        patientName={displayPatientName}
        onStatusChange={(budgetId, newStatus) => {
          handleBudgetStatusChange(budgetId, newStatus)
        }}
        onDuplicate={handleDuplicateBudget}
        onDelete={(budgetId) => {
          handleDeleteBudget(budgetId)
        }}
        onDownloadPdf={handleDownloadBudgetPdf}
        onSendEmail={handleSendBudgetEmail}
        onCreateAppointments={handleCreateAppointments}
        onConvertToInvoice={handleConvertToInvoice}
        onEdit={(budget) => {
          setSelectedBudgetRow(budget)
          setShowBudgetDetailsModal(false)
          setShowEditBudgetModal(true)
        }}
      />
      {/* Edit Budget Modal */}
      <EditBudgetModal
        open={showEditBudgetModal}
        onClose={() => {
          setShowEditBudgetModal(false)
          setSelectedBudgetRow(null)
        }}
        budget={selectedBudgetRow}
        onSave={(updatedBudget) => {
          setBudgetRows((prev) =>
            prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b))
          )

          if (shouldUseDbSource && activeClinicId && updatedBudget.quoteId) {
            void (async () => {
              try {
                const totalAmount =
                  parseEuroAmount(updatedBudget.amount) ||
                  Number(updatedBudget.subtotal || 0)
                const response = await fetch('/api/pacientes/budgets/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clinicId: activeClinicId,
                    quoteId: updatedBudget.quoteId,
                    status: mapUiBudgetStatusToDb(updatedBudget.status),
                    totalAmount,
                    validUntil: updatedBudget.validUntil || null,
                    planId: updatedBudget.planId || null,
                    planName: String(updatedBudget.description || '').trim(),
                    treatments: updatedBudget.treatments || []
                  })
                })

                const payload: { ok?: boolean; error?: string } =
                  await response.json().catch(() => ({}))

                if (!response.ok || !payload?.ok) {
                  throw new Error(payload?.error || 'No se pudo actualizar el presupuesto')
                }
                showNotice('Presupuesto actualizado en base de datos', 'success')
              } catch (error) {
                console.warn('Error updating quote', error)
                const message =
                  error instanceof Error
                    ? error.message
                    : 'No se pudo actualizar el presupuesto'
                showNotice(message, 'error')
              } finally {
                await refreshFinanceData()
              }
            })()
          }
        }}
      />
      <BudgetQuickPaymentModal
        open={showQuickPaymentModal}
        onClose={() => setShowQuickPaymentModal(false)}
        onPaymentSubmit={(data: QuickPaymentFormData) => {
          if (shouldUseDbSource) {
            void refreshFinanceData()
          }
          setShowQuickPaymentModal(false)
        }}
        patientName={displayPatientName}
        patientId={patientId || ''}
        budgets={budgetRows.filter((b) => b.installmentPlan)}
      />
      {/* Production Details Modal */}
      <ProductionDetailsModal
        open={showProductionDetailsModal}
        onClose={() => {
          setShowProductionDetailsModal(false)
          setSelectedProductionRow(null)
        }}
        productionId={selectedProductionRow?.id ?? ''}
        description={selectedProductionRow?.description ?? ''}
        amount={selectedProductionRow?.amount ?? ''}
        date={selectedProductionRow?.date ?? ''}
        status={selectedProductionRow?.status ?? 'Pendiente'}
        professional={selectedProductionRow?.professional ?? ''}
        patientName={displayPatientName}
        budgetId={selectedProductionRow?.budgetId}
        onViewBudget={() => {
          if (selectedProductionRow?.budgetId) {
            const budget = budgetRows.find(
              (b) => b.id === selectedProductionRow.budgetId
            )
            if (budget) {
              setShowProductionDetailsModal(false)
              setSelectedBudgetRow(budget)
              setShowBudgetDetailsModal(true)
            }
          }
        }}
        onViewInvoice={() => {
          const relatedInvoice = invoiceRows.find(
            (inv) =>
              (selectedProductionRow?.quoteId &&
                inv.quoteId === selectedProductionRow.quoteId) ||
              inv.description === selectedProductionRow?.description ||
              inv.id === `F-${selectedProductionRow?.id.replace('PR-', '')}`
          )
          if (relatedInvoice) {
            setShowProductionDetailsModal(false)
            setSelectedInvoiceRow(relatedInvoice)
            setShowInvoiceDetailsModal(true)
          }
        }}
      />
      {/* Edit Production Modal */}
      <EditProductionModal
        open={showEditProductionModal}
        onClose={() => {
          setShowEditProductionModal(false)
          setSelectedProductionRow(null)
        }}
        productionId={selectedProductionRow?.id ?? ''}
        description={selectedProductionRow?.description ?? ''}
        currentDate={selectedProductionRow?.date ?? ''}
        professional={selectedProductionRow?.professional ?? ''}
        onSave={handleSaveProductionEdit}
      />
      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={showInvoiceDetailsModal}
        onClose={() => {
          setShowInvoiceDetailsModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        description={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
        date={selectedInvoiceRow?.date ?? ''}
        status={selectedInvoiceRow?.status ?? 'Pendiente'}
        paymentMethod={selectedInvoiceRow?.paymentMethod ?? ''}
        insurer={selectedInvoiceRow?.insurer ?? ''}
        patientName={displayPatientName}
        onDownloadPdf={() => {
          if (selectedInvoiceRow) {
            handleDownloadInvoicePdf(selectedInvoiceRow)
          }
        }}
        onSendEmail={() => {
          if (selectedInvoiceRow) {
            void openEmailComposer(
              `Factura ${selectedInvoiceRow.id} - ${displayPatientName}`,
              [
                `Hola ${displayPatientName},`,
                '',
                `Adjuntamos la factura ${selectedInvoiceRow.id}.`,
                `Concepto: ${selectedInvoiceRow.description}`,
                `Importe: ${selectedInvoiceRow.amount}`,
                `Fecha: ${selectedInvoiceRow.date}`,
                '',
                'Gracias.'
              ].join('\n')
            )
          }
        }}
      />
      {/* Payment Details Modal */}
      <PaymentDetailsModal
        open={showPaymentDetailsModal}
        onClose={() => {
          setShowPaymentDetailsModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        description={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
        invoiceDate={selectedInvoiceRow?.date ?? ''}
        paymentMethod={selectedInvoiceRow?.paymentMethod ?? ''}
        paymentDate={selectedInvoiceRow?.date ?? ''}
        patientName={displayPatientName}
        insurer={selectedInvoiceRow?.insurer}
        onDownloadReceipt={() => {
          if (selectedInvoiceRow) {
            try {
              const receiptNumber = generateReceiptNumber()
              const totalAmount =
                selectedInvoiceRow.amountNumber ??
                parseEuroAmount(selectedInvoiceRow.amount)
              const amountPaid =
                selectedInvoiceRow.amountPaidNumber ??
                (selectedInvoiceRow.status === 'Cobrado' ? totalAmount : 0)
              const remainingBalance = Math.max(0, totalAmount - amountPaid)
              const receiptBlob = generatePaymentReceiptPDF({
                receiptNumber,
                paymentDate: selectedInvoiceRow.issueTimestamp
                  ? new Date(selectedInvoiceRow.issueTimestamp)
                  : new Date(),
                patientName: displayPatientName,
                invoiceNumber: selectedInvoiceRow.id,
                treatment: selectedInvoiceRow.description,
                amountPaid,
                paymentMethod:
                  selectedInvoiceRow.paymentMethod?.toLowerCase() || 'efectivo',
                totalAmount,
                previousPaid: 0,
                remainingBalance
              })
              const filename = formatReceiptFilename(
                displayPatientName,
                receiptNumber
              )
              downloadBlob(receiptBlob, filename)
              showNotice(`Recibo ${receiptNumber} descargado`, 'success')
            } catch (error) {
              console.warn('No se pudo generar el recibo', error)
              showNotice('No se pudo descargar el recibo', 'error')
            }
          }
        }}
      />
      {notice && (
        <div className='fixed right-4 bottom-4 z-[200]'>
          <div
            className={[
              'min-w-[240px] max-w-[360px] rounded-lg border shadow-[var(--shadow-cta)] px-3 py-2 flex items-start gap-2',
              notice.variant === 'success'
                ? 'bg-[var(--color-success-50)] border-[var(--color-success-200)] text-[var(--color-success-800)]'
                : notice.variant === 'error'
                ? 'bg-[var(--color-error-50)] border-[var(--color-error-200)] text-[var(--color-error-800)]'
                : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-200)] text-[var(--color-neutral-900)]'
            ].join(' ')}
          >
            <p className='text-body-md flex-1'>{notice.message}</p>
            <button
              type='button'
              aria-label='Cerrar aviso'
              className='ml-2 leading-none text-body-md'
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
