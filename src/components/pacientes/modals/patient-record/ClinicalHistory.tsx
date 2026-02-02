'use client'

import type {
  Appointment,
  LinkedTreatmentStatus,
  VisitSOAPNotes
} from '@/context/AppointmentsContext'
import { useAppointments } from '@/context/AppointmentsContext'
import { usePatientFiles } from '@/context/PatientFilesContext'
import React from 'react'
import UploadFileModal, { type UploadFileType } from './UploadFileModal'
import VisitCard from './clinical-history/VisitCard'
import VisitDetailPanel from './clinical-history/VisitDetailPanel'
import type { ClinicalHistoryFilter } from './clinical-history/types'

type ClinicalHistoryProps = {
  onClose?: () => void
  initialEditMode?: boolean
  onEditModeOpened?: () => void
  patientId?: string
  patientName?: string
}

export default function ClinicalHistory({
  onClose,
  initialEditMode = false,
  onEditModeOpened,
  patientId,
  patientName
}: ClinicalHistoryProps) {
  const {
    getAppointmentsByPatient,
    updateSOAPNotes,
    updateLinkedTreatmentStatus,
    addAttachment,
    removeAttachment
  } = useAppointments()

  const { addDocumentFromClinicalHistory, addOdontogramFromClinicalHistory } =
    usePatientFiles()

  // Filter state
  const [filter, setFilter] = React.useState<ClinicalHistoryFilter>('todas')

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

  // Get patient appointments
  const patientAppointments = React.useMemo(() => {
    return getAppointmentsByPatient(patientId, patientName)
  }, [getAppointmentsByPatient, patientId, patientName])

  // Separate and sort appointments
  const { upcomingVisits, pastVisits, allVisits } = React.useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

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
    switch (filter) {
      case 'proximas':
        return upcomingVisits
      case 'pasadas':
        return pastVisits
      case 'confirmadas':
        return allVisits.filter(
          (apt) => apt.status === 'Confirmada' || apt.confirmed
        )
      case 'inasistencia':
        return allVisits.filter((apt) => apt.status === 'Reagendar')
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
    if (!selectedAppointmentId && filteredAppointments.length > 0) {
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
    }
  }

  const handleUploadAttachment = () => {
    setUploadType('document')
    setIsUploadModalOpen(true)
  }

  const handleUploadOdontogram = () => {
    setUploadType('odontogram')
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
        await addDocumentFromClinicalHistory(
          file,
          patientId,
          selectedAppointment.id,
          uploadedBy
        )

        // Also add as attachment to the appointment
        addAttachment(selectedAppointment.id, {
          name: file.name,
          type: 'document',
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          uploadedBy
        })
      } else {
        // Add to patient files (for RX images section)
        await addOdontogramFromClinicalHistory(
          file,
          patientId,
          selectedAppointment.id,
          uploadedBy
        )

        // Also add as attachment to the appointment
        addAttachment(selectedAppointment.id, {
          name: file.name,
          type: 'xray',
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          uploadedBy
        })
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

      {/* Filter tabs */}
      <div className='absolute left-[var(--spacing-plnav)] top-[8rem] flex items-center gap-[var(--spacing-gapmd)]'>
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
                    {filteredAppointments.map((apt, index) => (
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
              onUploadOdontogram={handleUploadOdontogram}
            />
          </div>
        </div>
      </div>

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
