'use client'

import {
  AddRounded,
  ArrowBackRounded,
  AttachEmailRounded,
  DownloadRounded,
  ImageRounded,
  MoreVertRounded,
  OpenInNewRounded,
  PictureAsPdfRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import { type DocumentTemplate } from '@/context/ConfigurationContext'
import { type GeneratedDocument } from '@/utils/exportUtils'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSignedUrl, uploadPatientFile } from '@/lib/storage'
import React from 'react'
import PatientDocumentEditor from './PatientDocumentEditor'
import TemplateSelectionModal from './TemplateSelectionModal'
import UploadConsentModal from './UploadConsentModal'

type DocumentsProps = {
  onClose?: () => void
  patientId?: string
  patientName?: string
}

// HU-020: Extended consent status to include 'Pendiente'
type ConsentStatus = 'Firmado' | 'Enviado' | 'Pendiente'

type ConsentRow = {
  id: string
  name: string
  sentAt: string
  status: ConsentStatus
  linkedTreatmentType?: string
  mandatory?: boolean
  documentPath?: string | null
  /** Transient blob URL for just-created documents (not yet reloaded from DB) */
  blobUrl?: string
}

type DbConsentRow = {
  id: number
  consent_type: string
  status: string
  signed_at: string | null
  created_at: string
  document_url: string | null
}

// HU-020: Mapping of treatment types to required consents
export const TREATMENT_CONSENT_REQUIREMENTS: Record<string, string[]> = {
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

// HU-020: Check if patient has required consents for a treatment
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

/** Map DB status to UI status */
function mapDbStatus(status: string): ConsentStatus {
  switch (status) {
    case 'signed':
      return 'Firmado'
    case 'sent':
      return 'Enviado'
    case 'pending':
    default:
      return 'Pendiente'
  }
}

/** Map DB consent_type to mandatory flag via CONSENT_TYPES lookup */
function isMandatoryConsent(consentType: string): boolean {
  const ct = CONSENT_TYPES.find(
    (t) => t.name.toLowerCase() === consentType.toLowerCase()
  )
  return ct?.mandatory ?? false
}

/** Reverse-lookup: find which treatment type a consent is linked to */
function findLinkedTreatmentType(consentType: string): string | undefined {
  const lc = consentType.toLowerCase()
  for (const [treatment, consents] of Object.entries(
    TREATMENT_CONSENT_REQUIREMENTS
  )) {
    if (consents.some((c) => lc.includes(c.toLowerCase()))) {
      return treatment
    }
  }
  return undefined
}

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

export default function Documents({
  onClose,
  patientId,
  patientName
}: DocumentsProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [openMenuRowId, setOpenMenuRowId] = React.useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] =
    React.useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<DocumentTemplate | null>(null)
  const [rows, setRows] = React.useState<ConsentRow[]>([])
  const [toast, setToast] = React.useState<{
    message: string
    variant: ToastVariant
  } | null>(null)
  const [previewDocument, setPreviewDocument] =
    React.useState<(ConsentRow & { resolvedUrl?: string }) | null>(null)
  const [patientData, setPatientData] = React.useState<{
    nombre?: string
    dni?: string
    email?: string
    telefono?: string
    direccion?: string
    fecha_nacimiento?: string
    edad?: string
    sexo?: string
  }>({})

  // Load patient data for template variable replacement
  React.useEffect(() => {
    if (!patientId) return
    ;(async () => {
      const { data } = await supabase
        .from('patients')
        .select(
          'first_name, last_name, dni, email, phone, address, birth_date, gender'
        )
        .eq('id', patientId)
        .single()
      if (!data) return
      const fullName =
        patientName || [data.first_name, data.last_name].filter(Boolean).join(' ')
      const birthDate = data.birth_date
        ? new Date(data.birth_date).toLocaleDateString(DEFAULT_LOCALE, {
            timeZone: DEFAULT_TIMEZONE
          })
        : undefined
      const age = data.birth_date
        ? String(
            Math.floor(
              (Date.now() - new Date(data.birth_date).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          )
        : undefined
      setPatientData({
        nombre: fullName,
        dni: data.dni ?? undefined,
        email: data.email ?? undefined,
        telefono: data.phone ?? undefined,
        direccion: data.address ?? undefined,
        fecha_nacimiento: birthDate,
        edad: age,
        sexo: data.gender ?? undefined
      })
    })()
  }, [patientId, patientName, supabase])

  // Load consents from DB
  const loadConsents = React.useCallback(async () => {
    if (!patientId) {
      setRows([])
      return
    }
    const { data, error } = await supabase
      .from('patient_consents')
      .select('id, consent_type, status, signed_at, created_at, document_url')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (error) return
    const mapped: ConsentRow[] = ((data || []) as DbConsentRow[]).map((c) => ({
      id: String(c.id),
      name: c.document_url
        ? String(c.document_url).split('/').pop() || c.consent_type
        : c.consent_type,
      sentAt:
        c.signed_at || c.created_at
          ? new Date(c.signed_at || c.created_at).toLocaleDateString(
              DEFAULT_LOCALE,
              { timeZone: DEFAULT_TIMEZONE }
            )
          : '—',
      status: mapDbStatus(c.status),
      documentPath: c.document_url || null,
      mandatory: isMandatoryConsent(c.consent_type),
      linkedTreatmentType: findLinkedTreatmentType(c.consent_type)
    }))
    setRows(mapped)
  }, [patientId, supabase])

  React.useEffect(() => {
    void loadConsents()
  }, [loadConsents])

  // Close menu on outside click
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

  // Resolve a signed URL for storage paths (or use blobUrl / direct URL)
  const resolveDocumentUrl = React.useCallback(
    async (row: ConsentRow): Promise<string | null> => {
      if (row.blobUrl) return row.blobUrl
      if (!row.documentPath) return null
      const isDirectUrl = /^https?:\/\//i.test(row.documentPath)
      if (isDirectUrl) return row.documentPath
      try {
        return await getSignedUrl(row.documentPath)
      } catch {
        return null
      }
    },
    []
  )

  // View document in preview modal
  const handleViewDocument = React.useCallback(
    async (row: ConsentRow) => {
      const url = await resolveDocumentUrl(row)
      setPreviewDocument({ ...row, resolvedUrl: url || undefined })
    },
    [resolveDocumentUrl]
  )

  // Open document in new window
  const handleOpenInNewWindow = React.useCallback(
    async (row: ConsentRow) => {
      const url = await resolveDocumentUrl(row)
      if (!url) {
        setToast({ message: 'Archivo no disponible', variant: 'error' })
        window.setTimeout(() => setToast(null), 3000)
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [resolveDocumentUrl]
  )

  // Download document
  const handleDownloadDocument = React.useCallback(
    async (row: ConsentRow) => {
      const url = await resolveDocumentUrl(row)
      if (url) {
        const link = document.createElement('a')
        link.href = url
        link.download = row.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setToast({
          message: `Descargando ${row.name}...`,
          variant: 'success'
        })
      } else {
        setToast({
          message: 'Archivo no disponible para descargar',
          variant: 'error'
        })
      }
      setOpenMenuRowId(null)
      window.setTimeout(() => setToast(null), 3000)
    },
    [resolveDocumentUrl]
  )

  // Send document (mark as sent in DB)
  const handleSendDocument = React.useCallback(
    async (row: ConsentRow) => {
      const consentId = Number(row.id)
      if (!Number.isFinite(consentId)) return
      try {
        const { error } = await supabase
          .from('patient_consents')
          .update({ status: 'sent' })
          .eq('id', consentId)
          .eq('patient_id', patientId || '')
        if (error) throw error

        await loadConsents()
        setToast({
          message: `Documento "${row.name}" enviado al paciente`,
          variant: 'success'
        })
      } catch (err) {
        console.warn('No se pudo enviar consentimiento', err)
        setToast({
          message: 'No se pudo enviar el consentimiento',
          variant: 'error'
        })
      } finally {
        setOpenMenuRowId(null)
        window.setTimeout(() => setToast(null), 3000)
      }
    },
    [loadConsents, patientId, supabase]
  )

  // HU-020: Calculate pending mandatory consents
  const pendingMandatory = rows.filter(
    (r) => r.mandatory && r.status === 'Pendiente'
  )
  const hasPendingMandatory = pendingMandatory.length > 0

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
              {/* File + name + date */}
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
                  onClick={() => void handleViewDocument(row)}
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
                        onClick={() => void handleSendDocument(row)}
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
                            void handleSendDocument(row)
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
                          void handleOpenInNewWindow(row)
                          setOpenMenuRowId(null)
                        }}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <OpenInNewRounded className='size-5' />
                        <span className='text-body-md'>
                          Abrir en nueva ventana
                        </span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => void handleDownloadDocument(row)}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)] cursor-pointer'
                      >
                        <DownloadRounded className='size-5' />
                        <span className='text-body-md'>
                          Descargar original
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Consent Modal */}
      <UploadConsentModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        patientId={patientId}
        onError={(msg) => {
          setToast({ message: msg, variant: 'error' })
          window.setTimeout(() => setToast(null), 3500)
        }}
        onFileSelected={async (f) => {
          try {
            if (!patientId) throw new Error('Sin paciente')
            const { path } = await uploadPatientFile({
              patientId,
              file: f,
              kind: 'consents'
            })
            const consentType =
              f.name.replace(/\.[^/.]+$/, '') || 'consentimiento'
            const { error: insertError } = await supabase
              .from('patient_consents')
              .insert({
                patient_id: patientId,
                consent_type: consentType,
                status: 'sent',
                document_url: path
              })
            if (insertError) {
              setToast({ message: insertError.message, variant: 'error' })
              return
            }
            await loadConsents()
            setToast({
              message: 'Consentimiento subido',
              variant: 'success'
            })
          } catch (e: any) {
            setToast({
              message: e?.message ?? 'Fallo al subir',
              variant: 'error'
            })
          } finally {
            window.setTimeout(() => setToast(null), 3000)
            setIsUploadOpen(false)
          }
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
        patientData={patientData}
        onSave={async (document: GeneratedDocument) => {
          try {
            if (!patientId) throw new Error('Sin paciente')
            // Convert the blob to a File for upload
            const file = new File([document.blob], document.filename, {
              type: document.blob.type || 'application/pdf'
            })
            const { path } = await uploadPatientFile({
              patientId,
              file,
              kind: 'consents'
            })
            const consentType =
              selectedTemplate?.title ||
              document.filename.replace(/\.[^/.]+$/, '') ||
              'documento'
            const { error: insertError } = await supabase
              .from('patient_consents')
              .insert({
                patient_id: patientId,
                consent_type: consentType,
                status: 'sent',
                document_url: path
              })
            if (insertError) {
              setToast({ message: insertError.message, variant: 'error' })
              return
            }
            await loadConsents()
            setToast({
              message: 'Documento PDF creado correctamente',
              variant: 'success'
            })
          } catch (e: any) {
            setToast({
              message: e?.message ?? 'Fallo al guardar documento',
              variant: 'error'
            })
          } finally {
            window.setTimeout(() => setToast(null), 3000)
          }
        }}
      />

      {/* Document Preview Modal */}
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
                    Estado: {previewDocument.status} • Fecha:{' '}
                    {previewDocument.sentAt}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => void handleOpenInNewWindow(previewDocument)}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F7F9] border border-[#CBD3D9] text-[0.875rem] font-medium text-[#535C66] hover:bg-[#E2E7EA] transition-colors cursor-pointer'
                >
                  <OpenInNewRounded className='w-[1rem] h-[1rem]' />
                  <span>Abrir</span>
                </button>
                <button
                  type='button'
                  onClick={() => void handleDownloadDocument(previewDocument)}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9FBF9] border border-[var(--color-brand-300)] text-[0.875rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
                >
                  <DownloadRounded className='w-[1rem] h-[1rem]' />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            {/* PDF/Image Viewer */}
            <div className='flex-1 bg-[#E2E7EA] p-4 overflow-auto'>
              {previewDocument.resolvedUrl ? (
                previewDocument.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDocument.resolvedUrl}
                    className='w-full h-full rounded-lg shadow-lg bg-white'
                    title={previewDocument.name}
                  />
                ) : previewDocument.name.toLowerCase().endsWith('.html') ? (
                  <iframe
                    src={previewDocument.resolvedUrl}
                    className='w-full h-full rounded-lg shadow-lg bg-white'
                    title={previewDocument.name}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg'>
                    <img
                      src={previewDocument.resolvedUrl}
                      alt={previewDocument.name}
                      className='max-w-full max-h-full object-contain'
                    />
                  </div>
                )
              ) : (
                <div className='w-full h-full flex flex-col items-center justify-center text-[#535C66] bg-white rounded-lg shadow-lg'>
                  <PictureAsPdfRounded className='size-16 mb-4 text-[#CBD3D9]' />
                  <p className='text-[1rem] font-medium'>
                    Vista previa no disponible
                  </p>
                  <p className='text-[0.875rem] mt-1'>
                    El archivo no tiene una URL asociada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
