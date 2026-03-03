'use client'

import {
  CloseRounded,
  DescriptionRounded,
  ImageRounded,
  TableRowsRounded,
  ViewTimelineRounded
} from '@/components/icons/md3'
import { DEFAULT_TIMEZONE } from '@/lib/datetime'
import type {
  Appointment,
  LinkedTreatmentStatus,
  VisitSOAPNotes
} from '@/context/AppointmentsContext'
import { useAppointments } from '@/context/AppointmentsContext'
import { usePatientFiles } from '@/context/PatientFilesContext'
import { usePatients } from '@/context/PatientsContext'
import React from 'react'
import UploadFileModal, { type UploadFileType } from './UploadFileModal'
import ClinicalHistoryTable from './clinical-history/ClinicalHistoryTable'
import VisitCard from './clinical-history/VisitCard'
import VisitDetailPanel from './clinical-history/VisitDetailPanel'
import type { ClinicalHistoryFilter } from './clinical-history/types'

// View mode type
type ViewMode = 'timeline' | 'table'

type ClinicalHistoryProps = {
  onClose?: () => void
  initialEditMode?: boolean
  onEditModeOpened?: () => void
  patientId?: string
  patientName?: string
  onPatientUpdated?: () => void
}

function getTodayInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

export default function ClinicalHistory({
  initialEditMode = false,
  onEditModeOpened,
  patientId,
  patientName,
  onPatientUpdated
}: ClinicalHistoryProps) {
  const {
    getAppointmentsByPatient,
    updateAppointment,
    updateSOAPNotes,
    updateLinkedTreatmentStatus,
    addAttachment,
    removeAttachment
  } = useAppointments()

  const { addDocumentFromClinicalHistory, addOdontogramFromClinicalHistory } =
    usePatientFiles()

  const { updateTreatment } = usePatients()

  // Filter state
  const [filter, setFilter] = React.useState<ClinicalHistoryFilter>('todas')

  // View mode state (timeline or table)
  const [viewMode, setViewMode] = React.useState<ViewMode>('timeline')

  // Selected appointment state
  const [selectedAppointmentId, setSelectedAppointmentId] = React.useState<
    string | null
  >(null)

  // Edit mode state
  const [isEditing, setIsEditing] = React.useState(initialEditMode)
  const [editedNotes, setEditedNotes] = React.useState<VisitSOAPNotes>({})

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<UploadFileType>('document')
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  // Upload type selector modal (for table view)
  const [isUploadTypeSelectorOpen, setIsUploadTypeSelectorOpen] =
    React.useState(false)

  // Get patient appointments
  const patientAppointments = React.useMemo(() => {
    return getAppointmentsByPatient(patientId, patientName)
  }, [getAppointmentsByPatient, patientId, patientName])

  // Separate and sort appointments
  const { upcomingVisits, pastVisits, allVisits } = React.useMemo(() => {
    const todayStr = getTodayInTimezone(DEFAULT_TIMEZONE)

    const upcoming = patientAppointments
      .filter((apt) => {
        const isCompleted = apt.visitStatus === 'completed'
        const isFuture =
          apt.date > todayStr || (apt.date === todayStr && !isCompleted)
        return isFuture && !isCompleted
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })

    const past = patientAppointments
      .filter((apt) => {
        const isCompleted = apt.visitStatus === 'completed'
        const isPast = apt.date < todayStr || isCompleted
        return isPast
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.startTime.localeCompare(a.startTime)
      })

    // All visits sorted by date (most recent first for past, closest first for upcoming)
    const all = [...upcoming, ...past]

    return { upcomingVisits: upcoming, pastVisits: past, allVisits: all }
  }, [patientAppointments])

  // Filter appointments based on selected filter
  const filteredAppointments = React.useMemo(() => {
    const todayStr = getTodayInTimezone(DEFAULT_TIMEZONE)
    const isConfirmed = (apt: Appointment) =>
      apt.status === 'Confirmada' ||
      Boolean(apt.confirmed) ||
      apt.visitStatus === 'in_consultation' ||
      apt.visitStatus === 'waiting_room' ||
      apt.visitStatus === 'completed'

    const isNoShow = (apt: Appointment) =>
      apt.status === 'Reagendar' ||
      (apt.status === 'No confirmada' &&
        apt.date <= todayStr &&
        apt.visitStatus !== 'completed')

    switch (filter) {
      case 'proximas':
        return upcomingVisits
      case 'pasadas':
        return pastVisits
      case 'confirmadas':
        return allVisits.filter((apt) => isConfirmed(apt) && !isNoShow(apt))
      case 'inasistencia':
        return allVisits.filter(isNoShow)
      case 'todas':
      default:
        return allVisits
    }
  }, [filter, allVisits, upcomingVisits, pastVisits])

  // Get selected appointment
  const selectedAppointment = React.useMemo(() => {
    if (!selectedAppointmentId) return null
    return (
      patientAppointments.find((apt) => apt.id === selectedAppointmentId) ||
      null
    )
  }, [selectedAppointmentId, patientAppointments])

  // Auto-select first appointment if none selected
  React.useEffect(() => {
    if (filteredAppointments.length === 0) {
      if (selectedAppointmentId) setSelectedAppointmentId(null)
      return
    }
    const selectedStillVisible = filteredAppointments.some(
      (apt) => apt.id === selectedAppointmentId
    )
    if (!selectedAppointmentId || !selectedStillVisible) {
      setSelectedAppointmentId(filteredAppointments[0].id)
    }
  }, [selectedAppointmentId, filteredAppointments])

  // Initialize edit mode if requested
  React.useEffect(() => {
    if (initialEditMode && !isEditing && selectedAppointment) {
      setEditedNotes(selectedAppointment.soapNotes || {})
      setIsEditing(true)
      onEditModeOpened?.()
    }
  }, [initialEditMode, isEditing, selectedAppointment, onEditModeOpened])

  // When selected appointment changes, reset edited notes
  React.useEffect(() => {
    if (selectedAppointment) {
      setEditedNotes(selectedAppointment.soapNotes || {})
    }
  }, [selectedAppointment])

  // Handlers
  const handleEdit = () => {
    if (selectedAppointment) {
      setEditedNotes(selectedAppointment.soapNotes || {})
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (selectedAppointment) {
      // Mark as finalized (not a draft)
      const finalizedNotes = {
        ...editedNotes,
        isDraft: false,
        finalizedAt: new Date().toISOString(),
        finalizedBy: 'Dr. Usuario' // TODO: Get from auth context
      }
      updateSOAPNotes(selectedAppointment.id, finalizedNotes)
      setIsEditing(false)
    }
  }

  const handleSaveAsDraft = () => {
    if (selectedAppointment) {
      // Mark as draft
      const draftNotes = {
        ...editedNotes,
        isDraft: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Dr. Usuario' // TODO: Get from auth context
      }
      updateSOAPNotes(selectedAppointment.id, draftNotes)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (selectedAppointment) {
      setEditedNotes(selectedAppointment.soapNotes || {})
    }
    setIsEditing(false)
  }

  const handleSOAPChange = (
    field: 'subjective' | 'objective' | 'assessment' | 'plan',
    value: string
  ) => {
    setEditedNotes((prev) => ({ ...prev, [field]: value }))
  }

  const syncTreatmentWithPatient = (
    treatmentId: string,
    status: LinkedTreatmentStatus
  ) => {
    if (!patientId) return
    if (status === 'completed') {
      updateTreatment(patientId, treatmentId, {
        status: 'Completado',
        completedDate: new Date().toISOString().split('T')[0]
      })
    } else if (status === 'in_progress') {
      updateTreatment(patientId, treatmentId, {
        status: 'En curso',
        completedDate: undefined
      })
    }
  }

  const handleTreatmentStatusChange = (
    treatmentId: string,
    status: LinkedTreatmentStatus
  ) => {
    if (selectedAppointment) {
      updateLinkedTreatmentStatus(
        selectedAppointment.id,
        treatmentId,
        status,
        'Dr. Usuario'
      )
      syncTreatmentWithPatient(treatmentId, status)
    }
  }

  const handleTableTreatmentStatusChange = (
    appointmentId: string,
    treatmentId: string,
    status: LinkedTreatmentStatus
  ) => {
    updateLinkedTreatmentStatus(
      appointmentId,
      treatmentId,
      status,
      'Dr. Usuario'
    )
    syncTreatmentWithPatient(treatmentId, status)
  }

  const handleUploadAttachment = () => {
    setUploadType('document')
    setIsUploadModalOpen(true)
  }

  const handleUploadImage = () => {
    setUploadType('image')
    setIsUploadModalOpen(true)
  }

  const handleFileSelected = async (file: File, type: UploadFileType) => {
    if (!selectedAppointment || !patientId) {
      setUploadError(
        'No se puede subir el archivo. Selecciona una visita primero.'
      )
      return
    }

    try {
      const uploadedBy = 'Dr. Usuario' // TODO: Get from auth context

      if (type === 'document') {
        // Add to patient files (for consents section)
        const uploaded = await addDocumentFromClinicalHistory(
          file,
          patientId,
          selectedAppointment.id,
          uploadedBy
        )

        // Also add in appointment UI without persisting a duplicate DB row.
        addAttachment(selectedAppointment.id, {
          name: file.name,
          type: 'document',
          url: uploaded.storagePath,
          uploadedAt: new Date().toISOString(),
          uploadedBy
        }, { persistToDb: false })
      } else {
        // Add to patient files (for RX images section)
        const uploaded = await addOdontogramFromClinicalHistory(
          file,
          patientId,
          selectedAppointment.id,
          uploadedBy
        )

        // Also add in appointment UI without persisting a duplicate DB row.
        addAttachment(selectedAppointment.id, {
          name: file.name,
          type: 'xray',
          url: uploaded.storagePath,
          uploadedAt: new Date().toISOString(),
          uploadedBy
        }, { persistToDb: false })
      }

      setIsUploadModalOpen(false)
      setUploadError(null)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('Error al subir el archivo. Inténtalo de nuevo.')
    }
  }

  const handleUploadError = (message: string) => {
    setUploadError(message)
    // Auto-clear error after 5 seconds
    setTimeout(() => setUploadError(null), 5000)
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    if (selectedAppointment) {
      removeAttachment(selectedAppointment.id, attachmentId)
    }
  }

  // Filter tabs configuration
  const filters: Array<{ key: ClinicalHistoryFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'proximas', label: 'Próximas' },
    { key: 'pasadas', label: 'Pasadas' },
    { key: 'confirmadas', label: 'Confirmadas' },
    { key: 'inasistencia', label: 'Inasistencia' }
  ]

  const handleKeyDown =
    (currentFilter: ClinicalHistoryFilter) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setFilter(currentFilter)
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const filterKeys = filters.map((f) => f.key)
        const idx = filterKeys.indexOf(filter)
        const nextIdx =
          e.key === 'ArrowRight'
            ? (idx + 1) % filterKeys.length
            : (idx - 1 + filterKeys.length) % filterKeys.length
        setFilter(filterKeys[nextIdx])
      }
    }

  // Check if appointment is upcoming
  const isUpcoming = (apt: Appointment) => {
    return upcomingVisits.some((u) => u.id === apt.id)
  }

  return (
    <div className='bg-[var(--color-neutral-50)] relative w-full h-full overflow-hidden'>
      {/* Header */}
      <div className='absolute left-[var(--spacing-plnav)] top-[2.5rem] w-[35.5rem]'>
        <h2 className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-900)] text-title-lg mb-2">
          Historial clínico
        </h2>
        <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-600)] text-body-sm">
          Filtra el historial clínico, consulta los detalles de cada visita y
          gestiona tratamientos.
        </p>
      </div>

      {/* Filter tabs and view toggle */}
      <div className='absolute left-[var(--spacing-plnav)] right-[var(--spacing-plnav)] top-[8rem] flex items-center justify-between'>
        {/* Filter tabs */}
        <div className='flex items-center gap-[var(--spacing-gapmd)]'>
          {filters.map((f) => (
            <button
              key={f.key}
              type='button'
              role='tab'
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              onKeyDown={handleKeyDown(f.key)}
              tabIndex={0}
              className={[
                'px-3 py-1.5 rounded-full cursor-pointer transition-colors',
                filter === f.key
                  ? 'bg-[var(--color-neutral-900)] text-[var(--color-neutral-50)]'
                  : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]'
              ].join(' ')}
            >
              <span className="font-['Inter:Medium',_sans-serif] text-label-md">
                {f.label}
              </span>
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className='flex items-center gap-1 p-1 bg-[var(--color-neutral-100)] rounded-lg'>
          <button
            type='button'
            onClick={() => setViewMode('timeline')}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer',
              viewMode === 'timeline'
                ? 'bg-white shadow-sm text-[var(--color-neutral-900)]'
                : 'text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]'
            ].join(' ')}
            title='Vista timeline'
          >
            <ViewTimelineRounded className='size-5' />
            <span className="font-['Inter:Medium',_sans-serif] text-label-md">
              Timeline
            </span>
          </button>
          <button
            type='button'
            onClick={() => setViewMode('table')}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer',
              viewMode === 'table'
                ? 'bg-white shadow-sm text-[var(--color-neutral-900)]'
                : 'text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]'
            ].join(' ')}
            title='Vista tabla'
          >
            <TableRowsRounded className='size-5' />
            <span className="font-['Inter:Medium',_sans-serif] text-label-md">
              Tabla
            </span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div
        className='absolute'
        style={{
          left: 'var(--spacing-plnav)',
          right: 'var(--spacing-plnav)',
          top: '10.5rem',
          bottom: 'var(--spacing-plnav)'
        }}
      >
        {viewMode === 'timeline' ? (
          /* Timeline View */
          <div className='flex gap-6 h-full'>
            {/* Left timeline panel */}
            <div className='w-[20rem] shrink-0 flex flex-col'>
              {/* Timeline header */}
              <div className='flex items-center justify-between mb-4'>
                <span className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
                  {filteredAppointments.length} visita
                  {filteredAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Timeline scroll area */}
              <div className='flex-1 overflow-y-auto pr-2'>
                {filteredAppointments.length > 0 ? (
                  <div className='relative'>
                    {/* Vertical timeline line */}
                    <div
                      className='absolute left-3 top-6 bottom-6 w-0.5 bg-[var(--color-brand-200)]'
                      aria-hidden='true'
                    />

                    {/* Timeline cards */}
                    <div className='space-y-4 relative'>
                      {filteredAppointments.map((apt) => (
                        <div key={apt.id} className='relative pl-8'>
                          {/* Timeline dot */}
                          <div
                            className={[
                              'absolute left-0 top-4 w-6 h-6 rounded-full border-2 z-10',
                              selectedAppointmentId === apt.id
                                ? 'bg-[var(--color-brand-500)] border-[var(--color-brand-500)]'
                                : apt.visitStatus === 'completed'
                                ? 'bg-[var(--color-brand-100)] border-[var(--color-brand-400)]'
                                : 'bg-white border-[var(--color-brand-400)]'
                            ].join(' ')}
                            aria-hidden='true'
                          />

                          <VisitCard
                            appointment={apt}
                            selected={selectedAppointmentId === apt.id}
                            onClick={() => {
                              setSelectedAppointmentId(apt.id)
                              setIsEditing(false)
                            }}
                            isUpcoming={isUpcoming(apt)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='h-full flex items-center justify-center'>
                    <div className='text-center py-8'>
                      <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
                        No hay visitas para mostrar
                      </p>
                      <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-label-sm mt-1">
                        Prueba cambiando el filtro
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right detail panel */}
            <div className='flex-1 min-w-0 bg-white border border-[var(--color-neutral-200)] rounded-xl overflow-hidden'>
              <VisitDetailPanel
                appointment={selectedAppointment}
                isEditing={isEditing}
                editedNotes={editedNotes}
                onEdit={handleEdit}
                onSave={handleSave}
                onSaveAsDraft={handleSaveAsDraft}
                onCancel={handleCancel}
                onSOAPChange={handleSOAPChange}
                onTreatmentStatusChange={handleTreatmentStatusChange}
                onUploadAttachment={handleUploadAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                onUploadImage={handleUploadImage}
              />
            </div>
          </div>
        ) : (
          /* Table View - Full width, no detail panel */
          <div className='h-full'>
            <ClinicalHistoryTable
              appointments={filteredAppointments}
              onUpdateAppointment={updateAppointment}
              onUpdateSOAPNotes={(id, notes) => {
                updateSOAPNotes(id, {
                  ...notes,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'Dr. Usuario'
                })
              }}
              isUpcoming={isUpcoming}
              onViewDetails={(appointmentId) => {
                setSelectedAppointmentId(appointmentId)
                setViewMode('timeline')
              }}
              onUploadFile={(appointmentId) => {
                setSelectedAppointmentId(appointmentId)
                setIsUploadTypeSelectorOpen(true)
              }}
              onMarkComplete={(appointmentId) => {
                updateAppointment(appointmentId, {
                  visitStatus: 'completed',
                  completed: true
                })
                onPatientUpdated?.()
              }}
              onTreatmentStatusChange={handleTableTreatmentStatusChange}
            />
          </div>
        )}
      </div>

      {/* Upload Type Selector Modal (for table view) */}
      {isUploadTypeSelectorOpen && (
        <div className='fixed inset-0 z-[100] bg-black/50 grid place-items-center'>
          <div className='bg-white rounded-2xl shadow-xl w-[min(92vw,400px)] overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-[var(--color-neutral-200)]'>
              <h3 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-title-md">
                Subir archivo
              </h3>
              <button
                type='button'
                onClick={() => setIsUploadTypeSelectorOpen(false)}
                className='p-1 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                aria-label='Cerrar'
              >
                <CloseRounded className='size-5 text-[var(--color-neutral-600)]' />
              </button>
            </div>

            {/* Options */}
            <div className='p-4 flex flex-col gap-3'>
              <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-600)] text-body-sm mb-2">
                ¿Qué tipo de archivo deseas subir?
              </p>

              {/* Document option */}
              <button
                type='button'
                onClick={() => {
                  setIsUploadTypeSelectorOpen(false)
                  setUploadType('document')
                  setIsUploadModalOpen(true)
                }}
                className='flex items-center gap-4 p-4 rounded-xl border border-[var(--color-neutral-200)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer group'
              >
                <div className='size-12 rounded-lg bg-[var(--color-neutral-100)] group-hover:bg-[var(--color-brand-100)] flex items-center justify-center transition-colors'>
                  <DescriptionRounded className='size-6 text-[var(--color-neutral-600)] group-hover:text-[var(--color-brand-600)]' />
                </div>
                <div className='flex-1 text-left'>
                  <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
                    Documento
                  </p>
                  <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
                    PDF, informes, consentimientos...
                  </p>
                </div>
              </button>

              {/* Image option */}
              <button
                type='button'
                onClick={() => {
                  setIsUploadTypeSelectorOpen(false)
                  setUploadType('image')
                  setIsUploadModalOpen(true)
                }}
                className='flex items-center gap-4 p-4 rounded-xl border border-[var(--color-neutral-200)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer group'
              >
                <div className='size-12 rounded-lg bg-[var(--color-neutral-100)] group-hover:bg-[var(--color-brand-100)] flex items-center justify-center transition-colors'>
                  <ImageRounded className='size-6 text-[var(--color-neutral-600)] group-hover:text-[var(--color-brand-600)]' />
                </div>
                <div className='flex-1 text-left'>
                  <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
                    Imagen
                  </p>
                  <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
                    Fotos clínicas, radiografías...
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      <UploadFileModal
        open={isUploadModalOpen}
        type={uploadType}
        onClose={() => {
          setIsUploadModalOpen(false)
          setUploadError(null)
        }}
        onFileSelected={handleFileSelected}
        onError={handleUploadError}
      />

      {/* Error Toast */}
      {uploadError && (
        <div className='fixed right-4 bottom-4 z-[200]'>
          <div className='min-w-[240px] max-w-[360px] rounded-lg border shadow-[var(--shadow-cta)] px-4 py-3 bg-[var(--color-error-50)] border-[var(--color-error-200)] text-[var(--color-error-800)]'>
            <div className='flex items-start gap-2'>
              <p className='text-body-md flex-1'>{uploadError}</p>
              <button
                type='button'
                aria-label='Cerrar aviso'
                className='text-body-md leading-none cursor-pointer hover:opacity-70'
                onClick={() => setUploadError(null)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
