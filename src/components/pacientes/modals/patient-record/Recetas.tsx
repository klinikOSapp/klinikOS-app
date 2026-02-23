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
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  useConfiguration
} from '@/context/ConfigurationContext'
import { useClinic } from '@/context/ClinicContext'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  downloadPrescriptionPDFFromTemplate,
  type PrescriptionData
} from '@/utils/exportUtils'
import React from 'react'
import type { MedicationEntry } from './PrescriptionCreationModal'
import PrescriptionCreationModal from './PrescriptionCreationModal'
import PrescriptionPdfPreview from './PrescriptionPdfPreview'

type PrescriptionContentJson = {
  medicamento?: string
  especialista?: string
  especialista_id?: string
  especialista_license?: string
  frecuencia?: string
  duracion?: string
  administracion?: string
  medicamentos?: MedicationEntry[]
  status?: string
  sent_at?: string
  sent_via_email_at?: string
}

type DbClinicalNoteRow = {
  id: number
  note_type: string
  content: string | null
  content_json: PrescriptionContentJson | null
  created_at: string
}

type PrescriptionRow = {
  id: string
  name: string
  sentAt: string
  status: 'Firmado' | 'Enviado'
  dbId?: number
  createdAtIso?: string
  contentJson?: PrescriptionContentJson | null
  url?: string
  // Prescription data for preview
  medicamento?: string
  especialista?: string
  especialistaId?: string
  especialistaLicense?: string
  frecuencia?: string
  duracion?: string
  administracion?: string
  medicamentos?: MedicationEntry[]
}

type ToastVariant = 'success' | 'error'

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
  patientId?: string
  patientName?: string
}

export default function Recetas({
  onClose,
  openPrescriptionCreation = false,
  onPrescriptionCreationOpened,
  patientId,
  patientName
}: RecetasProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const { activeClinicId } = useClinic()
  // Get clinic data and templates from configuration context
  const { clinicInfo, getDocumentTemplatesByType, activeProfessionals } =
    useConfiguration()

  // Get the receta template
  const recetaTemplate = React.useMemo(() => {
    const templates = getDocumentTemplatesByType('receta')
    const sortedTemplates = [...templates].sort((a, b) => {
      const aTs = a.lastModified ? new Date(a.lastModified).getTime() : 0
      const bTs = b.lastModified ? new Date(b.lastModified).getTime() : 0
      return bTs - aTs
    })
    const candidate =
      sortedTemplates.find((template) => template.content?.trim())?.content?.trim() ||
      ''
    return candidate || DEFAULT_DOCUMENT_TEMPLATES.receta
  }, [getDocumentTemplatesByType])

  // Build full clinic address from configuration
  const fullClinicAddress = [
    clinicInfo.direccion,
    clinicInfo.poblacion,
    clinicInfo.codigoPostal
  ]
    .filter(Boolean)
    .join(', ')

  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'Paciente'
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
    especialistaId?: string
    especialistaLicense?: string
    frecuencia?: string
    duracion?: string
    administracion?: string
    medicamentos?: MedicationEntry[]
  } | null>(null)
  const [rows, setRows] = React.useState<PrescriptionRow[]>([])

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

  const hydratePrescriptions = React.useCallback(async () => {
    if (!patientId) {
      setRows([])
      return
    }
    try {
      const { data: notes, error } = await supabase
        .from('clinical_notes')
        .select('id, note_type, content, content_json, created_at')
        .eq('patient_id', patientId)
        .eq('note_type', 'prescription')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedRows: PrescriptionRow[] = ((notes || []) as DbClinicalNoteRow[]).map(
        (note) => {
          const payload =
            note.content_json &&
            typeof note.content_json === 'object' &&
            !Array.isArray(note.content_json)
              ? (note.content_json as PrescriptionContentJson)
              : null
          const primaryMedication =
            payload?.medicamento ||
            payload?.medicamentos?.[0]?.medicamento ||
            note.content ||
            'Medicamento'
          const createdAtIso = note.created_at
          const displayIso = payload?.sent_at || createdAtIso
          return {
            id: String(note.id),
            dbId: note.id,
            createdAtIso,
            contentJson: payload,
            name: `Receta - ${String(primaryMedication).slice(0, 30)}.pdf`,
            sentAt: new Date(displayIso).toLocaleDateString(DEFAULT_LOCALE, {
              timeZone: DEFAULT_TIMEZONE
            }),
            status: payload?.status === 'signed' ? 'Firmado' : 'Enviado',
            medicamento: payload?.medicamento || String(note.content || ''),
            especialista: payload?.especialista,
            especialistaId: payload?.especialista_id,
            especialistaLicense: payload?.especialista_license,
            frecuencia: payload?.frecuencia,
            duracion: payload?.duracion,
            administracion: payload?.administracion,
            medicamentos: Array.isArray(payload?.medicamentos)
              ? payload?.medicamentos
              : undefined
          }
        }
      )
      setRows(mappedRows)
    } catch (err) {
      console.warn('Recetas hydration failed', err)
      setRows([])
    }
  }, [patientId, supabase])

  React.useEffect(() => {
    void hydratePrescriptions()
  }, [hydratePrescriptions])

  // Action handlers
  const handleViewPrescription = (row: PrescriptionRow) => {
    // If the row has data, use it for preview
    if (row.medicamento || (row.medicamentos && row.medicamentos.length > 0)) {
      const resolvedProfessional =
        (row.especialistaId
          ? activeProfessionals.find(
              (professional) => professional.id === row.especialistaId
            )
          : undefined) ||
        (row.especialista
          ? activeProfessionals.find(
              (professional) =>
                professional.name.trim().toLowerCase() ===
                row.especialista?.trim().toLowerCase()
            )
          : undefined)
      setPdfData({
        medicamento: row.medicamento,
        especialista: resolvedProfessional?.name || row.especialista,
        especialistaId: row.especialistaId || resolvedProfessional?.id,
        especialistaLicense:
          row.especialistaLicense ||
          resolvedProfessional?.professionalLicenseId,
        frecuencia: row.frecuencia,
        duracion: row.duracion,
        administracion: row.administracion,
        medicamentos: row.medicamentos
      })
      setIsPdfOpen(true)
    } else {
      // Show a simple preview modal for rows without data
      setPreviewRow(row)
    }
    setOpenMenuRowId(null)
  }

  const handleDownloadPrescription = async (row: PrescriptionRow) => {
    if (!recetaTemplate) {
      setToast({ message: 'No se encontró la plantilla de receta', variant: 'error' })
      window.setTimeout(() => setToast(null), 3000)
      return
    }

    // Build prescription data for PDF generation using clinic info from configuration
    const resolvedProfessional =
      (row.especialistaId
        ? activeProfessionals.find(
            (professional) => professional.id === row.especialistaId
          )
        : undefined) ||
      (row.especialista
        ? activeProfessionals.find(
            (professional) =>
              professional.name.trim().toLowerCase() ===
              row.especialista?.trim().toLowerCase()
          )
        : undefined)

    const prescriptionData: PrescriptionData = {
      patientName: displayPatientName,
      patientDni: '44556677X',
      patientSex: 'Hombre',
      patientAge: 45,
      doctorName:
        resolvedProfessional?.name ||
        activeProfessionals[0]?.name ||
        row.especialista ||
        'Profesional',
      doctorLicense:
        row.especialistaLicense ||
        resolvedProfessional?.professionalLicenseId ||
        activeProfessionals[0]?.professionalLicenseId ||
        '',
      clinicName: clinicInfo.nombreComercial || 'Clínica Dental',
      clinicAddress: fullClinicAddress || clinicInfo.direccion || '',
      clinicPhone: clinicInfo.telefono || '',
      prescriptionDate: row.createdAtIso ? new Date(row.createdAtIso) : new Date(),
      caseNotes: '',
      medications:
        row.medicamentos && row.medicamentos.length > 0
          ? row.medicamentos.map((medication) => ({
              medicamento: medication.medicamento || 'Medicamento',
              frecuencia: medication.frecuencia || '3 por día',
              duracion: medication.duracion || '7 días',
              administracion: medication.administracion || 'Oral',
              dosis: medication.dosis || ''
            }))
          : row.medicamento
          ? [
              {
                  medicamento: row.medicamento,
                  frecuencia: row.frecuencia || '3 por día',
                  duracion: row.duracion || '7 días',
                  administracion: row.administracion || 'Oral',
                  dosis: ''
              }
            ]
          : [
              {
                medicamento: 'Medicamento',
                frecuencia: '3 por día',
                duracion: '7 días',
                administracion: 'Oral',
                dosis: ''
              }
            ]
    }

    // Generate and download PDF from template
    try {
      await downloadPrescriptionPDFFromTemplate(recetaTemplate, prescriptionData, row.medicamento)
      setToast({ message: `Descargando ${row.name}...`, variant: 'success' })
    } catch (error) {
      console.error('Error downloading prescription PDF:', error)
      setToast({ message: 'Error al generar el PDF', variant: 'error' })
    }
    setOpenMenuRowId(null)
    window.setTimeout(() => setToast(null), 3000)
  }

  const handleSendPrescription = async (row: PrescriptionRow) => {
    try {
      if (patientId && row.dbId) {
        const nowIso = new Date().toISOString()
        const nextJson: PrescriptionContentJson = {
          ...(row.contentJson || {}),
          medicamento: row.medicamento,
          especialista: row.especialista,
          especialista_id: row.especialistaId,
          especialista_license: row.especialistaLicense,
          frecuencia: row.frecuencia,
          duracion: row.duracion,
          administracion: row.administracion,
          medicamentos: row.medicamentos,
          status: 'sent',
          sent_at: row.contentJson?.sent_at || row.createdAtIso || nowIso,
          sent_via_email_at: nowIso
        }
        const { error } = await supabase
          .from('clinical_notes')
          .update({ content_json: nextJson })
          .eq('id', row.dbId)
          .eq('patient_id', patientId)
        if (error) throw error
      }
      await hydratePrescriptions()
      setToast({
        message: `Receta "${row.name}" enviada al paciente`,
        variant: 'success'
      })
    } catch (error) {
      console.warn('No se pudo actualizar el envío de la receta', error)
      setToast({ message: 'No se pudo enviar la receta', variant: 'error' })
    } finally {
      setOpenMenuRowId(null)
      window.setTimeout(() => setToast(null), 3000)
    }
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
                  <p className='text-label-sm'>{row.sentAt}</p>
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
                        onClick={() => void handleSendPrescription(row)}
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
        onContinue={async (data) => {
          const nowIso = new Date().toISOString()
          const primaryMedication =
            data.medicamento ||
            data.medicamentos?.[0]?.medicamento ||
            'Medicamento'
          const payload: PrescriptionContentJson = {
            medicamento: data.medicamento,
            especialista: data.especialista,
            especialista_id: data.especialistaId,
            especialista_license: data.especialistaLicense,
            frecuencia: data.frecuencia,
            duracion: data.duracion,
            administracion: data.administracion,
            medicamentos: data.medicamentos,
            status: 'sent',
            sent_at: nowIso
          }

          const newRow: PrescriptionRow = {
            id: `new-${Date.now()}`,
            name: `Receta - ${primaryMedication}.pdf`,
            sentAt: new Date(nowIso).toLocaleDateString(DEFAULT_LOCALE, {
              timeZone: DEFAULT_TIMEZONE
            }),
            status: 'Enviado',
            contentJson: payload,
            createdAtIso: nowIso,
            especialistaId: data.especialistaId,
            especialistaLicense: data.especialistaLicense,
            ...data
          }
          if (patientId) {
            try {
              const { data: authData } = await supabase.auth.getUser()
              const staffId = authData.user?.id
              if (!staffId) throw new Error('No hay usuario autenticado')
              const { data: inserted, error } = await supabase
                .from('clinical_notes')
                .insert({
                  patient_id: patientId,
                  staff_id: staffId,
                  note_type: 'prescription',
                  content: primaryMedication,
                  content_json: payload
                })
                .select('id, created_at')
                .single()
              if (error || !inserted) throw error || new Error('No insertado')
              newRow.id = String(inserted.id)
              newRow.dbId = inserted.id
              newRow.createdAtIso = inserted.created_at
              newRow.sentAt = new Date(inserted.created_at).toLocaleDateString(
                DEFAULT_LOCALE,
                { timeZone: DEFAULT_TIMEZONE }
              )

              const normalizedMedications = (data.medicamentos || [])
                .filter((med) => med.medicamento?.trim())
                .map((medication, index) => ({
                  medication_name: medication.medicamento.trim(),
                  dosage: medication.dosis || null,
                  frequency: medication.frecuencia || null,
                  duration: medication.duracion || null,
                  administration_route: medication.administracion || null,
                  sort_order: index
                }))

              const fallbackMedicationRows =
                normalizedMedications.length > 0
                  ? normalizedMedications
                  : [
                      {
                        medication_name: primaryMedication,
                        dosage: null,
                        frequency: data.frecuencia || null,
                        duration: data.duracion || null,
                        administration_route: data.administracion || null,
                        sort_order: 0
                      }
                    ]

              // Best effort: mirror receta into prescriptions/prescription_items.
              if (activeClinicId) {
                try {
                  const { data: prescriptionRecord, error: prescriptionError } =
                    await supabase
                      .from('prescriptions')
                      .insert({
                        clinic_id: activeClinicId,
                        patient_id: patientId,
                        prescribing_professional_id:
                          data.especialistaId || null,
                        prescribing_professional_name:
                          data.especialista || null,
                        prescribing_professional_license:
                          data.especialistaLicense || null,
                        prescription_date: nowIso.slice(0, 10),
                        notes: null,
                        created_by: staffId,
                        updated_by: staffId
                      })
                      .select('id')
                      .single()

                  if (prescriptionError) throw prescriptionError

                  if (prescriptionRecord?.id) {
                    const { error: prescriptionItemsError } = await supabase
                      .from('prescription_items')
                      .insert(
                        fallbackMedicationRows.map((item) => ({
                          prescription_id: prescriptionRecord.id,
                          ...item
                        }))
                      )
                    if (prescriptionItemsError) throw prescriptionItemsError
                  }
                } catch (mirrorError) {
                  console.warn(
                    'Could not mirror prescription into prescriptions tables',
                    mirrorError
                  )
                }
              }
            } catch (error) {
              console.warn('Could not persist prescription note', error)
              setToast({
                message: 'No se pudo guardar la receta en la base de datos',
                variant: 'error'
              })
              window.setTimeout(() => setToast(null), 3000)
              return
            }
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
                    void handleSendPrescription(previewRow)
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
