'use client'

import {
  AddRounded,
  ArrowBackRounded,
  AttachEmailRounded,
  CloseRounded,
  DownloadRounded,
  ImageRounded,
  MoreVertRounded,
  OpenInNewRounded,
  PictureAsPdfRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import { usePatientFiles } from '@/context/PatientFilesContext'
import { type DocumentTemplate } from '@/context/ConfigurationContext'
import { type GeneratedDocument } from '@/utils/exportUtils'
import React from 'react'
import PatientDocumentEditor from './PatientDocumentEditor'
import TemplateSelectionModal from './TemplateSelectionModal'
import UploadConsentModal from './UploadConsentModal'

type DocumentsProps = {
  onClose?: () => void
  patientId?: string
}

// HU-020: Extended consent status to include 'Pendiente'
type ConsentStatus = 'Firmado' | 'Enviado' | 'Pendiente'

type ConsentRow = {
  id: string
  name: string
  sentAt: string
  status: ConsentStatus
  // HU-020: Treatment type this consent is linked to
  linkedTreatmentType?: string
  mandatory?: boolean
}

// HU-020: Mapping of treatment types to required consents
export const TREATMENT_CONSENT_REQUIREMENTS: Record<string, string[]> = {
  // Dental procedures
  corona: ['Consentimiento general', 'Consentimiento prótesis'],
  endodoncia: ['Consentimiento general', 'Consentimiento endodoncia'],
  ortodoncia: ['Consentimiento general', 'Consentimiento ortodoncia'],
  periodoncia: ['Consentimiento general', 'Consentimiento periodontal'],
  cirugia: ['Consentimiento general', 'Consentimiento cirugía'],
  estetica: ['Consentimiento general', 'Consentimiento estética'],
  protesis: ['Consentimiento general', 'Consentimiento prótesis'],
  implante: [
    'Consentimiento general',
    'Consentimiento implantología',
    'Consentimiento cirugía'
  ],
  extraccion: ['Consentimiento general', 'Consentimiento extracción'],
  blanqueamiento: ['Consentimiento general', 'Consentimiento blanqueamiento'],
  // Default - all treatments require general consent
  general: ['Consentimiento general']
}

// HU-020: List of all available consent types
export const CONSENT_TYPES = [
  { id: 'general', name: 'Consentimiento general', mandatory: true },
  { id: 'datos', name: 'Tratamiento de datos personales', mandatory: true },
  { id: 'cirugia', name: 'Consentimiento cirugía', mandatory: false },
  { id: 'endodoncia', name: 'Consentimiento endodoncia', mandatory: false },
  { id: 'ortodoncia', name: 'Consentimiento ortodoncia', mandatory: false },
  { id: 'periodoncia', name: 'Consentimiento periodontal', mandatory: false },
  { id: 'implante', name: 'Consentimiento implantología', mandatory: false },
  { id: 'extraccion', name: 'Consentimiento extracción', mandatory: false },
  {
    id: 'blanqueamiento',
    name: 'Consentimiento blanqueamiento',
    mandatory: false
  },
  { id: 'estetica', name: 'Consentimiento estética', mandatory: false },
  { id: 'protesis', name: 'Consentimiento prótesis', mandatory: false },
  { id: 'imagen', name: 'Uso de imagen', mandatory: false },
  { id: 'menores', name: 'Consentimiento menores', mandatory: false }
]

// HU-020: Function to check if patient has required consents for a treatment
export function checkTreatmentConsents(
  treatmentType: string,
  patientConsents: ConsentRow[]
): { hasAll: boolean; missing: string[] } {
  const requiredConsents =
    TREATMENT_CONSENT_REQUIREMENTS[treatmentType.toLowerCase()] ||
    TREATMENT_CONSENT_REQUIREMENTS['general']

  const signedConsents = patientConsents
    .filter((c) => c.status === 'Firmado')
    .map((c) => c.name.toLowerCase())

  const missing = requiredConsents.filter(
    (req) =>
      !signedConsents.some((signed) => signed.includes(req.toLowerCase()))
  )

  return {
    hasAll: missing.length === 0,
    missing
  }
}

const MOCK_ROWS: ConsentRow[] = [
  {
    id: 'c1',
    name: 'Consentimiento general.pdf',
    sentAt: '19/08/2024',
    status: 'Firmado',
    linkedTreatmentType: 'general',
    mandatory: true
  },
  {
    id: 'c2',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Firmado',
    mandatory: true
  },
  {
    id: 'c3',
    name: 'Consentimiento ortodoncia.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado',
    linkedTreatmentType: 'ortodoncia'
  },
  {
    id: 'c4',
    name: 'Consentimiento implantología.pdf',
    sentAt: '-',
    status: 'Pendiente',
    linkedTreatmentType: 'implante'
  }
]

function StatusBadge({
  status,
  mandatory
}: {
  status: ConsentStatus
  mandatory?: boolean
}) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Firmado':
        return 'border-brand-500 text-brand-500 bg-brand-50'
      case 'Enviado':
        return 'border-info-200 text-info-600 bg-info-50'
      case 'Pendiente':
        return mandatory
          ? 'border-error-400 text-error-600 bg-error-50'
          : 'border-warning-400 text-warning-600 bg-warning-50'
      default:
        return 'border-neutral-300 text-neutral-600'
    }
  }

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-label-sm border font-medium',
        getStatusStyles()
      ].join(' ')}
    >
      {status}
      {mandatory && status === 'Pendiente' && ' ⚠'}
    </span>
  )
}

type ToastVariant = 'success' | 'error'

// Extended row with URL for actions
type ConsentRowExtended = ConsentRow & {
  url?: string
}

export default function Documents({ onClose, patientId }: DocumentsProps) {
  const { getConsentsByPatient } = usePatientFiles()
  const [openMenuRowId, setOpenMenuRowId] = React.useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] =
    React.useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<DocumentTemplate | null>(null)
  const [localRows, setLocalRows] =
    React.useState<ConsentRowExtended[]>(MOCK_ROWS)
  const [toast, setToast] = React.useState<{
    message: string
    variant: ToastVariant
  } | null>(null)
  // State for document preview
  const [previewDocument, setPreviewDocument] =
    React.useState<ConsentRowExtended | null>(null)

  // Get documents from context (uploaded from clinical history)
  const contextFiles = patientId ? getConsentsByPatient(patientId) : []

  // Convert context files to ConsentRow format
  const contextRows: ConsentRowExtended[] = contextFiles.map((file) => ({
    id: file.id,
    name: file.name,
    sentAt:
      file.consentSentAt ||
      new Date(file.uploadedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
    status: file.consentStatus || 'Enviado',
    mandatory: false,
    url: file.url
  }))

  // Action handlers
  const handleViewDocument = (row: ConsentRowExtended) => {
    setPreviewDocument(row)
  }

  // Open document in a new window (for PDF viewing/printing)
  const handlePrintDocument = React.useCallback((row: ConsentRowExtended) => {
    if (!row.url) {
      setToast({
        message: 'Archivo no disponible',
        variant: 'error'
      })
      window.setTimeout(() => setToast(null), 3000)
      return
    }

    // Open document in new window (works for PDFs and images)
    window.open(row.url, '_blank')
  }, [])

  const handleDownloadDocument = (row: ConsentRowExtended) => {
    if (row.url) {
      // Create a link and trigger download
      const link = document.createElement('a')
      link.href = row.url
      link.download = row.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setToast({ message: `Descargando ${row.name}...`, variant: 'success' })
    } else {
      setToast({
        message: 'Archivo no disponible para descargar',
        variant: 'error'
      })
    }
    setOpenMenuRowId(null)
    window.setTimeout(() => setToast(null), 3000)
  }

  const handleSendDocument = (row: ConsentRowExtended) => {
    // Simulate sending document via email
    setToast({
      message: `Documento "${row.name}" enviado al paciente`,
      variant: 'success'
    })
    setOpenMenuRowId(null)
    // Update status to 'Enviado' if it was 'Pendiente'
    if (row.status === 'Pendiente') {
      setLocalRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: 'Enviado' as const,
                sentAt: new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              }
            : r
        )
      )
    }
    window.setTimeout(() => setToast(null), 3000)
  }

  // Combine local rows with context rows (avoid duplicates by id)
  const rows = React.useMemo(() => {
    const localIds = new Set(localRows.map((r) => r.id))
    const uniqueContextRows = contextRows.filter((r) => !localIds.has(r.id))
    return [...localRows, ...uniqueContextRows]
  }, [localRows, contextRows])

  // HU-020: Calculate pending mandatory consents
  const pendingMandatory = rows.filter(
    (r) => r.mandatory && r.status === 'Pendiente'
  )
  const pendingNonMandatory = rows.filter(
    (r) => !r.mandatory && r.status === 'Pendiente'
  )
  const hasPendingMandatory = pendingMandatory.length > 0

  React.useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!openMenuRowId) return
      const target = e.target as HTMLElement
      const insideMenu = target.closest('[data-consents-menu="true"]')
      const insideTrigger = target.closest('[data-consents-trigger="true"]')
      if (!insideMenu && !insideTrigger) {
        setOpenMenuRowId(null)
      }
    }
    document.addEventListener('mousedown', handleGlobalClick)
    return () => document.removeEventListener('mousedown', handleGlobalClick)
  }, [openMenuRowId])
  return (
    <div className='w-full h-full bg-neutral-50 flex flex-col p-8 overflow-hidden'>
      {/* Header */}
      <div className='mb-6'>
        <p className='font-inter text-headline-sm text-neutral-900'>
          Documentos
        </p>
        <p className='text-body-sm text-neutral-900 mt-2'>
          Gestiona todos los documentos y consentimientos de los pacientes.
        </p>
      </div>

      {/* HU-020: Warning banner for pending mandatory consents */}
      {hasPendingMandatory && (
        <div className='mb-4 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3'>
          <div className='w-6 h-6 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0 mt-0.5'>
            <span className='text-error-600 text-body-md font-bold'>!</span>
          </div>
          <div className='flex-1'>
            <p className='text-body-md font-medium text-error-800'>
              Consentimientos obligatorios pendientes
            </p>
            <p className='text-body-sm text-error-700 mt-1'>
              {pendingMandatory.length === 1
                ? `Hay 1 consentimiento obligatorio sin firmar: ${pendingMandatory[0].name}`
                : `Hay ${pendingMandatory.length} consentimientos obligatorios sin firmar`}
            </p>
            <p className='text-label-sm text-error-600 mt-2'>
              Estos consentimientos son necesarios antes de realizar ciertos
              tratamientos.
            </p>
          </div>
        </div>
      )}

      {/* Card / List */}
      <div className='flex-1 bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden'>
        {/* Add button */}
        <div className='flex justify-end p-4'>
          <button
            onClick={() => setIsTemplateSelectionOpen(true)}
            className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-neutral-900 bg-neutral-50 border border-neutral-300 hover:bg-brand-100 hover:border-brand-300 active:bg-brand-900 active:text-neutral-50 active:border-brand-900 transition-colors cursor-pointer'
          >
            <AddRounded className='size-5' />
            <span className='font-medium'>Añadir documento</span>
          </button>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-y-auto px-4'>
          {/* Column headers */}
          <div className='grid grid-cols-[1fr_150px_150px_100px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Consentimiento</p>
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
                  {row.name.toLowerCase().endsWith('.pdf') ? (
                    <PictureAsPdfRounded className='text-neutral-900' />
                  ) : (
                    <ImageRounded className='text-neutral-900' />
                  )}
                </div>
                <div className='flex flex-col justify-center text-neutral-900'>
                  <p className='text-body-md'>{row.name}</p>
                  <p className='text-label-sm'>{row.sentAt}</p>
                </div>
              </div>

              {/* Status */}
              <div className='flex items-center p-2'>
                <StatusBadge status={row.status} mandatory={row.mandatory} />
              </div>

              {/* Sent date */}
              <div className='flex items-center p-2'>
                <p className='text-body-md text-neutral-900'>{row.sentAt}</p>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2 p-2'>
                <button
                  type='button'
                  onClick={() => handleViewDocument(row)}
                  className='cursor-pointer hover:opacity-70 transition-opacity'
                  aria-label='Ver documento'
                  title='Ver documento'
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
                    data-consents-trigger='true'
                    aria-label='Más opciones'
                  >
                    <MoreVertRounded className='size-6 text-neutral-900' />
                  </button>

                  {openMenuRowId === row.id && (
                    <div
                      role='menu'
                      className='absolute right-0 top-full mt-2 w-64 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] border border-[var(--color-neutral-200)] p-2 z-10'
                      data-consents-menu='true'
                    >
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => handleSendDocument(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <AttachEmailRounded className='size-5' />
                        <span className='text-body-md'>Enviar Documento</span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        disabled={row.status !== 'Firmado'}
                        onClick={() => {
                          if (row.status === 'Firmado') {
                            handleSendDocument(row)
                          }
                        }}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left ${
                          row.status === 'Firmado'
                            ? 'hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                            : 'text-[var(--color-neutral-400)] cursor-not-allowed'
                        }`}
                      >
                        <AttachEmailRounded className='size-5' />
                        <span className='text-body-md'>
                          Enviar copia firmada
                        </span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => {
                          handlePrintDocument(row)
                          setOpenMenuRowId(null)
                        }}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <OpenInNewRounded className='size-5' />
                        <span className='text-body-md'>Abrir en nueva ventana</span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => handleDownloadDocument(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <DownloadRounded className='size-5' />
                        <span className='text-body-md'>Descargar original</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <UploadConsentModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onError={(msg) => {
          setToast({ message: msg, variant: 'error' })
          window.setTimeout(() => setToast(null), 3500)
        }}
        onFileSelected={(f) => {
          const d = new Date()
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = d.getFullYear()
          const url = URL.createObjectURL(f)
          const newRow: ConsentRowExtended = {
            id: `new-${Date.now()}`,
            name: f.name || 'documento.pdf',
            sentAt: `${dd}/${mm}/${yyyy}`,
            status: 'Enviado',
            url
          }
          setLocalRows((prev) => [newRow, ...prev])
          setToast({ message: 'Documento añadido', variant: 'success' })
          window.setTimeout(() => setToast(null), 3000)
          setIsUploadOpen(false)
        }}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        open={isTemplateSelectionOpen}
        onClose={() => setIsTemplateSelectionOpen(false)}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template)
          setIsTemplateSelectionOpen(false)
        }}
      />

      {/* Patient Document Editor */}
      <PatientDocumentEditor
        open={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        template={selectedTemplate}
        patientData={{
          nombre: 'María García López', // TODO: Get from patient context
          dni: '12345678A',
          email: 'maria@example.com',
          telefono: '612345678',
          direccion: 'Calle Mayor 1, Valencia',
          fecha_nacimiento: '15/03/1985',
          edad: '40',
          sexo: 'Mujer'
        }}
        onSave={(document: GeneratedDocument) => {
          // Add the PDF document to the list
          const d = new Date()
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = d.getFullYear()

          const newRow: ConsentRowExtended = {
            id: `doc-${Date.now()}`,
            name: document.filename,
            sentAt: `${dd}/${mm}/${yyyy}`,
            status: 'Enviado',
            url: document.url
          }
          setLocalRows((prev) => [newRow, ...prev])
          setToast({ message: 'Documento PDF creado correctamente', variant: 'success' })
          window.setTimeout(() => setToast(null), 3000)
        }}
      />

      {/* Document Preview Modal - Same style as Budget Preview */}
      {previewDocument && (
        <div className='fixed inset-0 z-[150] bg-black/60 grid place-items-center'>
          <div className='bg-white rounded-xl shadow-xl w-[min(95vw,1000px)] h-[min(90vh,800px)] flex flex-col overflow-hidden'>
            {/* Preview Header */}
            <div className='flex items-center justify-between px-6 py-3 border-b border-[#E2E7EA] bg-[#F8FAFB]'>
              <div className='flex items-center gap-4'>
                <button
                  type='button'
                  onClick={() => setPreviewDocument(null)}
                  className='flex items-center gap-1 text-[0.875rem] text-[#535C66] hover:text-[#24282C] transition-colors cursor-pointer'
                >
                  <ArrowBackRounded className='w-[1.25rem] h-[1.25rem]' />
                  <span>Volver</span>
                </button>
                <div className='h-5 w-px bg-[#CBD3D9]' />
                <span className='text-[1rem] font-medium text-[#24282C]'>
                  Vista previa del documento
                </span>
              </div>
            </div>

            {/* Document info bar */}
            <div className='flex items-center justify-between px-6 py-2 border-b border-[#E2E7EA] bg-white'>
              <div className='flex items-center gap-3'>
                {previewDocument.name.toLowerCase().endsWith('.pdf') ? (
                  <PictureAsPdfRounded className='w-[1.5rem] h-[1.5rem] text-[#E53935]' />
                ) : previewDocument.name.toLowerCase().endsWith('.html') ? (
                  <PictureAsPdfRounded className='w-[1.5rem] h-[1.5rem] text-[var(--color-brand-500)]' />
                ) : (
                  <ImageRounded className='w-[1.5rem] h-[1.5rem] text-[#1976D2]' />
                )}
                <div>
                  <p className='text-[0.875rem] font-medium text-[#24282C]'>
                    {previewDocument.name}
                  </p>
                  <p className='text-[0.75rem] text-[#535C66]'>
                    Estado: {previewDocument.status} • Fecha: {previewDocument.sentAt}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {/* Open in new window */}
                <button
                  type='button'
                  onClick={() => handlePrintDocument(previewDocument)}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F7F9] border border-[#CBD3D9] text-[0.875rem] font-medium text-[#535C66] hover:bg-[#E2E7EA] transition-colors cursor-pointer'
                >
                  <OpenInNewRounded className='w-[1rem] h-[1rem]' />
                  <span>Abrir</span>
                </button>
                {/* Download */}
                <button
                  type='button'
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9FBF9] border border-[var(--color-brand-300)] text-[0.875rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
                >
                  <DownloadRounded className='w-[1rem] h-[1rem]' />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className='flex-1 bg-[#E2E7EA] p-4 overflow-auto'>
              {previewDocument.url ? (
                previewDocument.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDocument.url}
                    className='w-full h-full rounded-lg shadow-lg bg-white'
                    title={previewDocument.name}
                  />
                ) : previewDocument.name.toLowerCase().endsWith('.html') ? (
                  <iframe
                    src={previewDocument.url}
                    className='w-full h-full rounded-lg shadow-lg bg-white'
                    title={previewDocument.name}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg'>
                    <img
                      src={previewDocument.url}
                      alt={previewDocument.name}
                      className='max-w-full max-h-full object-contain'
                    />
                  </div>
                )
              ) : (
                <div className='w-full h-full flex flex-col items-center justify-center text-[#535C66] bg-white rounded-lg shadow-lg'>
                  <PictureAsPdfRounded className='size-16 mb-4 text-[#CBD3D9]' />
                  <p className='text-[1rem] font-medium'>Vista previa no disponible</p>
                  <p className='text-[0.875rem] mt-1'>
                    El archivo no tiene una URL asociada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
              className='ml-2 leading-none text-body-md'
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
