'use client'

import { CloseRounded, FilePresentRounded } from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import React from 'react'
import BudgetsPayments, {
  INITIAL_BUDGET_ROWS,
  type BudgetRow
} from './BudgetsPayments'
import ClientSummary from './ClientSummary'
import ClinicalHistory from './ClinicalHistory'
import Documents from './Documents'
import Recetas from './Recetas'
import Resumen from './Resumen'
import RxImages from './RxImages'
import Treatments from './Treatments'

export type PatientRecordTab =
  | 'Resumen'
  | 'Información General'
  | 'Historial clínico'
  | 'Tratamientos'
  | 'Imágenes RX'
  | 'Finanzas'
  | 'Documentos'
  | 'Recetas'

type PatientRecordModalProps = {
  open: boolean
  onClose: () => void
  initialTab?: PatientRecordTab
  openBudgetCreation?: boolean
  openInEditMode?: boolean
  openPrescriptionCreation?: boolean
  openClinicalHistoryEdit?: boolean
  patientId?: string
  patientName?: string
}

export default function PatientRecordModal({
  open,
  onClose,
  initialTab = 'Resumen',
  openBudgetCreation = false,
  openInEditMode = false,
  openPrescriptionCreation = false,
  openClinicalHistoryEdit = false,
  patientId,
  patientName
}: PatientRecordModalProps) {
  const [active, setActive] = React.useState<PatientRecordTab>(initialTab)
  const [sidebarVisible, setSidebarVisible] = React.useState(true)
  const [sidebarHovered, setSidebarHovered] = React.useState(false)
  const [shouldOpenBudget, setShouldOpenBudget] =
    React.useState(openBudgetCreation)
  const [shouldOpenEdit, setShouldOpenEdit] = React.useState(openInEditMode)
  const [shouldOpenPrescription, setShouldOpenPrescription] = React.useState(
    openPrescriptionCreation
  )
  const [shouldOpenClinicalEdit, setShouldOpenClinicalEdit] = React.useState(
    openClinicalHistoryEdit
  )
  const [shouldOpenAddTreatment, setShouldOpenAddTreatment] =
    React.useState(false)

  // === Shared budget state (elevated from BudgetsPayments) ===
  const [budgetRows, setBudgetRows] =
    React.useState<BudgetRow[]>(INITIAL_BUDGET_ROWS)

  // Handler to add a new budget (shared between Treatments and BudgetsPayments)
  const handleAddBudget = React.useCallback((budget: BudgetRow) => {
    setBudgetRows((prev) => [budget, ...prev])
  }, [])

  // Handler to update all budget rows
  const handleUpdateBudgetRows = React.useCallback((rows: BudgetRow[]) => {
    setBudgetRows(rows)
  }, [])

  React.useEffect(() => {
    if (open && openBudgetCreation) {
      setShouldOpenBudget(true)
    }
  }, [open, openBudgetCreation])

  React.useEffect(() => {
    if (open && openInEditMode) {
      setShouldOpenEdit(true)
    }
  }, [open, openInEditMode])

  React.useEffect(() => {
    if (open && openPrescriptionCreation) {
      setShouldOpenPrescription(true)
    }
  }, [open, openPrescriptionCreation])

  React.useEffect(() => {
    if (open && openClinicalHistoryEdit) {
      setShouldOpenClinicalEdit(true)
    }
  }, [open, openClinicalHistoryEdit])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  React.useEffect(() => {
    if (open) {
      setActive(initialTab)
    }
  }, [initialTab, open])

  if (!open) return null

  const items: Array<{ title: typeof active; body: string }> = [
    {
      title: 'Resumen',
      body: 'Vista general del paciente con información clave y estadísticas.'
    },
    {
      title: 'Información General',
      body: 'Datos básicos de consulta, alertas, próximas citas, deuda, ...'
    },
    {
      title: 'Historial clínico',
      body: 'Notas SOAP, odontograma, actos y adjuntos.'
    },
    {
      title: 'Tratamientos',
      body: 'Tratamientos pendientes e historial de tratamientos.'
    },
    {
      title: 'Imágenes RX',
      body: 'capturas intraorales/fotos antes-después y escáner 3D.'
    },
    {
      title: 'Finanzas',
      body: 'Cobros, financiación embebida, facturas/recibos y conciliación.'
    },
    {
      title: 'Documentos',
      body: 'Accede a todos los documentos y consentimientos de los pacientes.'
    },
    {
      title: 'Recetas',
      body: 'Consulta las recetas emitidas al paciente.'
    }
  ]

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 bg-black/30 overflow-hidden'
        onClick={onClose}
        aria-hidden
      >
        <div className='absolute inset-0 flex items-center justify-center px-8'>
          <div
            role='dialog'
            aria-modal='true'
            className='bg-white rounded-xl shadow-xl overflow-hidden w-[93.75rem] h-[56.25rem] max-w-[92vw] max-h-[85vh]'
            onClick={(e) => e.stopPropagation()}
            style={{
              width:
                'calc(93.75rem * min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))',
              height:
                'calc(56.25rem * min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))'
            }}
          >
            {/* Scaled content to always fit within 85vh without scroll */}
            <div
              className='w-[93.75rem] h-[56.25rem]'
              style={{
                transform:
                  'scale(min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))',
                transformOrigin: 'top left'
              }}
            >
              {/* Header with patient name */}
              <div className='h-14 border-b border-[var(--color-neutral-200)] flex items-center justify-between px-6 bg-white'>
                <p className='text-title-lg text-[var(--color-neutral-900)]'>
                  <span className='text-[var(--color-neutral-600)]'>
                    Ficha de{' '}
                  </span>
                  <span className='text-[var(--color-brand-600)]'>
                    {patientName || 'Paciente'}
                  </span>
                </p>
                <button
                  type='button'
                  aria-label='Cerrar'
                  onClick={onClose}
                  className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                >
                  <CloseRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                </button>
              </div>
              {/* Content split: left navigation (320px) + right summary */}
              <div className='flex' style={{ height: 'calc(100% - 3.5rem)' }}>
                {/* Left navigation */}
                <div
                  className={[
                    'shrink-0 border-r border-[var(--color-neutral-200)] box-border overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out',
                    sidebarVisible
                      ? 'w-[19rem]'
                      : 'w-0 border-r-0 overflow-hidden'
                  ].join(' ')}
                >
                  {/* Icono del sidebar arriba a la izquierda - Toggle button */}
                  <div className='px-6 pt-6 pb-4'>
                    <button
                      type='button'
                      onClick={() => setSidebarVisible(!sidebarVisible)}
                      className='cursor-pointer hover:opacity-70 transition-opacity'
                      aria-label={
                        sidebarVisible ? 'Ocultar sidebar' : 'Mostrar sidebar'
                      }
                    >
                      <FilePresentRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                    </button>
                  </div>
                  <ul className='h-auto'>
                    {items.map((it) => {
                      const selected = active === it.title
                      return (
                        <li key={it.title}>
                          <button
                            className={[
                              'w-full text-left px-6 pt-6 pb-4 cursor-pointer',
                              selected ? 'bg-[#E9FBF9]' : ''
                            ].join(' ')}
                            onClick={() => setActive(it.title)}
                          >
                            <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                              {it.title}
                            </p>
                            <p className='text-body-sm text-[var(--color-neutral-900)]'>
                              {it.body}
                            </p>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                {/* Right content: vertical scroll only; never horizontal (except for RxImages which handles its own scroll) */}
                <div
                  className={`flex-1 min-w-0 box-border transition-all duration-300 ease-in-out ${
                    active === 'Imágenes RX'
                      ? 'overflow-hidden'
                      : 'overflow-y-auto overflow-x-hidden'
                  }`}
                >
                  {/* Toggle button when sidebar is hidden - shows sidebar on hover */}
                  {!sidebarVisible && (
                    <div
                      className='absolute left-0 top-0 z-20'
                      onMouseEnter={() => setSidebarHovered(true)}
                      onMouseLeave={() => setSidebarHovered(false)}
                    >
                      {/* Icon button */}
                      <button
                        type='button'
                        onClick={() => {
                          setSidebarVisible(true)
                          setSidebarHovered(false)
                        }}
                        className='absolute left-4 top-4 z-30 cursor-pointer hover:opacity-70 transition-opacity bg-white p-2 rounded-lg shadow-md border border-[var(--color-neutral-200)]'
                        aria-label='Mostrar sidebar'
                      >
                        <FilePresentRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                      </button>

                      {/* Sidebar overlay on hover */}
                      {sidebarHovered && (
                        <div
                          className='absolute left-0 top-0 w-[19rem] bg-white rounded-tr-lg rounded-br-lg shadow-[-2px_-2px_4px_0px_rgba(0,0,0,0.1),2px_2px_4px_0px_rgba(0,0,0,0.1)] border-r-2 border-[var(--color-neutral-100)] overflow-y-auto overflow-x-hidden'
                          style={{ height: 'calc(56.25rem - 3.5rem)' }}
                        >
                          {/* Toggle button inside overlay */}
                          <div className='px-6 pt-6 pb-4'>
                            <button
                              type='button'
                              onClick={() => {
                                setSidebarVisible(true)
                                setSidebarHovered(false)
                              }}
                              className='cursor-pointer hover:opacity-70 transition-opacity'
                              aria-label='Fijar sidebar'
                            >
                              <FilePresentRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                            </button>
                          </div>
                          {/* Navigation items */}
                          <ul className='h-auto overflow-y-auto'>
                            {items.map((it) => {
                              const selected = active === it.title
                              return (
                                <li key={it.title}>
                                  <button
                                    className={[
                                      'w-full text-left px-6 pt-6 pb-4 cursor-pointer',
                                      selected ? 'bg-[#E9FBF9]' : ''
                                    ].join(' ')}
                                    onClick={() => {
                                      setActive(it.title)
                                      setSidebarHovered(false)
                                    }}
                                  >
                                    <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                                      {it.title}
                                    </p>
                                    <p className='text-body-sm text-[var(--color-neutral-900)]'>
                                      {it.body}
                                    </p>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {active === 'Resumen' && (
                    <Resumen
                      patientId={patientId}
                      patientName={patientName}
                      onClose={onClose}
                      onNavigateToTreatments={(withAddAction) => {
                        setActive('Tratamientos')
                        if (withAddAction) setShouldOpenAddTreatment(true)
                      }}
                      onNavigateToFinances={(withBudgetCreation) => {
                        setActive('Finanzas')
                        if (withBudgetCreation) setShouldOpenBudget(true)
                      }}
                      onNavigateToInfo={(withEditMode) => {
                        setActive('Información General')
                        if (withEditMode) setShouldOpenEdit(true)
                      }}
                      onNavigateToClinicalHistory={() => {
                        setActive('Historial clínico')
                      }}
                      onNavigateToConsents={() => {
                        setActive('Documentos')
                      }}
                      onNavigateToPrescriptions={() => {
                        setActive('Recetas')
                      }}
                    />
                  )}
                  {active === 'Información General' && (
                    <ClientSummary
                      onClose={onClose}
                      patientId={patientId}
                      initialEditMode={shouldOpenEdit}
                      onEditModeOpened={() => setShouldOpenEdit(false)}
                    />
                  )}
                  {active === 'Historial clínico' && (
                    <ClinicalHistory
                      onClose={onClose}
                      initialEditMode={shouldOpenClinicalEdit}
                      onEditModeOpened={() => setShouldOpenClinicalEdit(false)}
                      patientId={patientId}
                      patientName={patientName}
                    />
                  )}
                  {active === 'Tratamientos' && (
                    <Treatments
                      onClose={onClose}
                      patientId={patientId}
                      patientName={patientName}
                      onAddBudget={handleAddBudget}
                      openAddTreatment={shouldOpenAddTreatment}
                      onAddTreatmentOpened={() =>
                        setShouldOpenAddTreatment(false)
                      }
                    />
                  )}
                  {active === 'Imágenes RX' && (
                    <RxImages onClose={onClose} patientId={patientId} />
                  )}
                  {active === 'Finanzas' && (
                    <BudgetsPayments
                      onClose={onClose}
                      openBudgetCreation={shouldOpenBudget}
                      onBudgetCreationOpened={() => setShouldOpenBudget(false)}
                      patientName={patientName}
                      budgetRows={budgetRows}
                      onAddBudget={handleAddBudget}
                      onUpdateBudgetRows={handleUpdateBudgetRows}
                    />
                  )}
                  {active === 'Documentos' && (
                    <Documents onClose={onClose} patientId={patientId} />
                  )}
                  {active === 'Recetas' && (
                    <Recetas
                      patientId={patientId}
                      onClose={onClose}
                      openPrescriptionCreation={shouldOpenPrescription}
                      onPrescriptionCreationOpened={() =>
                        setShouldOpenPrescription(false)
                      }
                      patientName={patientName}
                    />
                  )}
                  {active !== 'Resumen' &&
                    active !== 'Información General' &&
                    active !== 'Historial clínico' &&
                    active !== 'Tratamientos' &&
                    active !== 'Imágenes RX' &&
                    active !== 'Documentos' &&
                    active !== 'Finanzas' &&
                    active !== 'Recetas' && (
                      <div className='p-6 text-body-md text-[var(--color-neutral-900)]'>
                        {active}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
