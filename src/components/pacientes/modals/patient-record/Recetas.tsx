'use client'

import {
  AddRounded,
  AttachEmailRounded,
  CloseRounded,
  DownloadRounded,
  MoreVertRounded,
  PictureAsPdfRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import { useConfiguration } from '@/context/ConfigurationContext'
import {
  downloadPrescriptionPDF,
  type PrescriptionData
} from '@/utils/exportUtils'
import React from 'react'
import PrescriptionCreationModal from './PrescriptionCreationModal'
import PrescriptionPdfPreview from './PrescriptionPdfPreview'

type PrescriptionRow = {
  id: string
  name: string
  sentAt: string
  status: 'Firmado' | 'Enviado'
  url?: string
  // Prescription data for preview
  medicamento?: string
  especialista?: string
  frecuencia?: string
  duracion?: string
  administracion?: string
}

type ToastVariant = 'success' | 'error'

const MOCK_ROWS: PrescriptionRow[] = [
  {
    id: 'r1',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Firmado'
  },
  {
    id: 'r2',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  },
  {
    id: 'r3',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  },
  {
    id: 'r4',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  }
]

function StatusBadge({ status }: { status: PrescriptionRow['status'] }) {
  const isSigned = status === 'Firmado'
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full px-2 py-1 text-label-sm',
        isSigned
          ? 'border border-brand-500 text-brand-500'
          : 'border border-info-200 text-info-200'
      ].join(' ')}
    >
      {status}
    </span>
  )
}

type RecetasProps = {
  onClose?: () => void
  openPrescriptionCreation?: boolean
  onPrescriptionCreationOpened?: () => void
  patientName?: string
}

export default function Recetas({
  onClose,
  openPrescriptionCreation = false,
  onPrescriptionCreationOpened,
  patientName
}: RecetasProps) {
  // Get clinic data from configuration context
  const { clinicInfo } = useConfiguration()

  // Build full clinic address from configuration
  const fullClinicAddress = [
    clinicInfo.direccion,
    clinicInfo.poblacion,
    clinicInfo.codigoPostal
  ]
    .filter(Boolean)
    .join(', ')

  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'María García López'
  const [isCreateOpen, setIsCreateOpen] = React.useState(
    openPrescriptionCreation
  )

  // Abrir modal de creación si se solicita desde props
  React.useEffect(() => {
    if (openPrescriptionCreation && !isCreateOpen) {
      setIsCreateOpen(true)
      onPrescriptionCreationOpened?.()
    }
  }, [openPrescriptionCreation, isCreateOpen, onPrescriptionCreationOpened])
  const [isPdfOpen, setIsPdfOpen] = React.useState(false)
  const [pdfData, setPdfData] = React.useState<{
    medicamento?: string
    especialista?: string
    frecuencia?: string
    duracion?: string
    administracion?: string
  } | null>(null)
  const [rows, setRows] = React.useState<PrescriptionRow[]>(MOCK_ROWS)

  // Action menu state
  const [openMenuRowId, setOpenMenuRowId] = React.useState<string | null>(null)
  // Toast state
  const [toast, setToast] = React.useState<{
    message: string
    variant: ToastVariant
  } | null>(null)
  // Preview state
  const [previewRow, setPreviewRow] = React.useState<PrescriptionRow | null>(
    null
  )

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!openMenuRowId) return
      const target = e.target as HTMLElement
      const insideMenu = target.closest('[data-recetas-menu="true"]')
      const insideTrigger = target.closest('[data-recetas-trigger="true"]')
      if (!insideMenu && !insideTrigger) {
        setOpenMenuRowId(null)
      }
    }
    document.addEventListener('mousedown', handleGlobalClick)
    return () => document.removeEventListener('mousedown', handleGlobalClick)
  }, [openMenuRowId])

  // Action handlers
  const handleViewPrescription = (row: PrescriptionRow) => {
    // If the row has data, use it for preview
    if (row.medicamento) {
      setPdfData({
        medicamento: row.medicamento,
        especialista: row.especialista,
        frecuencia: row.frecuencia,
        duracion: row.duracion,
        administracion: row.administracion
      })
      setIsPdfOpen(true)
    } else {
      // Show a simple preview modal for rows without data
      setPreviewRow(row)
    }
    setOpenMenuRowId(null)
  }

  const handleDownloadPrescription = (row: PrescriptionRow) => {
    // Build prescription data for PDF generation using clinic info from configuration
    const prescriptionData: PrescriptionData = {
      patientName: displayPatientName,
      patientDni: '44556677X',
      patientSex: 'Hombre',
      patientAge: 45,
      doctorName: row.especialista || 'Dr. García López',
      doctorLicense: 'XX 895 895 895',
      clinicName: clinicInfo.nombreComercial || 'Clínica Dental',
      clinicAddress: fullClinicAddress || clinicInfo.direccion || '',
      clinicPhone: clinicInfo.telefono || '',
      prescriptionDate: new Date(),
      caseNotes: '',
      medications: row.medicamento
        ? [
            {
              medicamento: row.medicamento,
              frecuencia: row.frecuencia || '3 por día',
              duracion: row.duracion || '7 días',
              administracion: row.administracion || 'Oral',
              dosis: '500mg'
            }
          ]
        : [
            {
              medicamento: 'Medicamento',
              frecuencia: '3 por día',
              duracion: '7 días',
              administracion: 'Oral',
              dosis: '500mg'
            }
          ]
    }

    // Generate and download PDF
    downloadPrescriptionPDF(prescriptionData, row.medicamento)
    setToast({ message: `Descargando ${row.name}...`, variant: 'success' })
    setOpenMenuRowId(null)
    window.setTimeout(() => setToast(null), 3000)
  }

  const handleSendPrescription = (row: PrescriptionRow) => {
    // Simulate sending via email
    setToast({
      message: `Receta "${row.name}" enviada al paciente`,
      variant: 'success'
    })
    setOpenMenuRowId(null)
    window.setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className='w-full h-full bg-neutral-50 flex flex-col p-8 overflow-hidden'>
      {/* Header */}
      <div className='mb-6'>
        <p className='font-inter text-headline-sm text-neutral-900'>Recetas</p>
        <p className='text-body-sm text-neutral-900 mt-2'>
          Gestiona las recetas del paciente.
        </p>
      </div>

      {/* Card / List */}
      <div className='flex-1 bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden'>
        {/* Add button */}
        <div className='flex justify-end p-4'>
          <button
            onClick={() => setIsCreateOpen(true)}
            className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-neutral-900 bg-neutral-50 border border-neutral-300 hover:bg-brand-100 hover:border-brand-300 active:bg-brand-900 active:text-neutral-50 active:border-brand-900 transition-colors cursor-pointer'
          >
            <AddRounded className='size-5' />
            <span className='font-medium'>Crear receta</span>
          </button>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-y-auto px-4'>
          {/* Column headers */}
          <div className='grid grid-cols-[1fr_150px_150px_100px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Receta</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Estado</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Fecha de envío</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Acciones</p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.id}
              className='grid grid-cols-[1fr_150px_150px_100px] border-b border-neutral-300 items-center'
            >
              {/* File + name + date small */}
              <div className='flex items-center gap-4 p-2 h-[72px]'>
                <div className='flex items-center justify-center w-[42px] h-[49px]'>
                  <PictureAsPdfRounded className='text-neutral-900' />
                </div>
                <div className='flex flex-col justify-center text-neutral-900'>
                  <p className='text-body-md'>{row.name}</p>
                  <p className='text-label-sm'>{'12/05/2024'}</p>
                </div>
              </div>

              {/* Status */}
              <div className='flex items-center p-2'>
                <StatusBadge status={row.status} />
              </div>

              {/* Sent date */}
              <div className='flex items-center p-2'>
                <p className='text-body-md text-neutral-900'>{row.sentAt}</p>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2 p-2'>
                <button
                  type='button'
                  onClick={() => handleViewPrescription(row)}
                  className='cursor-pointer hover:opacity-70 transition-opacity'
                  aria-label='Ver receta'
                  title='Ver receta'
                >
                  <VisibilityRounded className='size-6 text-neutral-900' />
                </button>
                <div className='relative'>
                  <button
                    type='button'
                    aria-haspopup='menu'
                    aria-expanded={openMenuRowId === row.id}
                    onClick={() =>
                      setOpenMenuRowId((prev) =>
                        prev === row.id ? null : row.id
                      )
                    }
                    className='cursor-pointer hover:opacity-70 transition-opacity'
                    data-recetas-trigger='true'
                    aria-label='Más opciones'
                  >
                    <MoreVertRounded className='size-6 text-neutral-900' />
                  </button>

                  {openMenuRowId === row.id && (
                    <div
                      role='menu'
                      className='absolute right-0 top-full mt-2 w-56 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] border border-[var(--color-neutral-200)] p-2 z-10'
                      data-recetas-menu='true'
                    >
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => handleViewPrescription(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <VisibilityRounded className='size-5' />
                        <span className='text-body-md'>Ver receta</span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => handleSendPrescription(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <AttachEmailRounded className='size-5' />
                        <span className='text-body-md'>Enviar por email</span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => handleDownloadPrescription(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <DownloadRounded className='size-5' />
                        <span className='text-body-md'>Descargar PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PrescriptionCreationModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onContinue={(data) => {
          // Create new prescription row
          const d = new Date()
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = d.getFullYear()
          const newRow: PrescriptionRow = {
            id: `new-${Date.now()}`,
            name: `Receta - ${data.medicamento || 'Medicamento'}.pdf`,
            sentAt: `${dd}/${mm}/${yyyy}`,
            status: 'Enviado',
            ...data
          }
          setRows((prev) => [newRow, ...prev])
          setPdfData(data)
          setIsCreateOpen(false)
          setIsPdfOpen(true)
        }}
        patientName={displayPatientName}
      />
      <PrescriptionPdfPreview
        open={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        data={pdfData || undefined}
        patientName={displayPatientName}
        onSave={() => {
          setToast({
            message: 'Receta guardada correctamente',
            variant: 'success'
          })
          window.setTimeout(() => setToast(null), 3000)
        }}
      />

      {/* Simple Preview Modal for rows without data */}
      {previewRow && (
        <div className='fixed inset-0 z-[150] bg-black/60 grid place-items-center'>
          <div className='bg-white rounded-xl shadow-xl w-[min(90vw,600px)] flex flex-col overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
              <div>
                <p className='text-title-lg text-neutral-900'>
                  {previewRow.name}
                </p>
                <p className='text-body-sm text-neutral-600'>
                  Estado: {previewRow.status} • Fecha: {previewRow.sentAt}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => handleDownloadPrescription(previewRow)}
                  className='p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer'
                  title='Descargar'
                >
                  <DownloadRounded className='size-5 text-neutral-700' />
                </button>
                <button
                  type='button'
                  onClick={() => setPreviewRow(null)}
                  className='p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer'
                  aria-label='Cerrar'
                >
                  <CloseRounded className='size-5 text-neutral-700' />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className='p-6 bg-neutral-50'>
              <div className='flex flex-col items-center justify-center py-8 text-neutral-500'>
                <PictureAsPdfRounded className='size-16 mb-4' />
                <p className='text-body-md'>Vista previa de receta</p>
                <p className='text-body-sm mt-2 text-center max-w-md'>
                  Esta receta fue generada el {previewRow.sentAt}.<br />
                  Puedes descargarla o enviarla al paciente desde el menú de
                  acciones.
                </p>
              </div>
              <div className='flex justify-center gap-3 mt-4'>
                <button
                  type='button'
                  onClick={() => {
                    handleSendPrescription(previewRow)
                    setPreviewRow(null)
                  }}
                  className='flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors cursor-pointer'
                >
                  <AttachEmailRounded className='size-5' />
                  <span>Enviar al paciente</span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    handleDownloadPrescription(previewRow)
                    setPreviewRow(null)
                  }}
                  className='flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-900 rounded-lg hover:bg-neutral-300 transition-colors cursor-pointer'
                >
                  <DownloadRounded className='size-5' />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className='fixed right-4 bottom-4 z-[200]'>
          <div
            className={[
              'min-w-[240px] max-w-[360px] rounded-lg border shadow-[var(--shadow-cta)] px-3 py-2 flex items-start gap-2',
              toast.variant === 'success'
                ? 'bg-[var(--color-success-50)] border-[var(--color-success-200)] text-[var(--color-success-800)]'
                : 'bg-[var(--color-error-50)] border-[var(--color-error-200)] text-[var(--color-error-800)]'
            ].join(' ')}
          >
            <p className='text-body-md flex-1'>{toast.message}</p>
            <button
              type='button'
              aria-label='Cerrar aviso'
              className='ml-2 leading-none text-body-md cursor-pointer'
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
