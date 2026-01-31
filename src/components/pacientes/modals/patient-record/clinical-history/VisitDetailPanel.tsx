'use client'

import React from 'react'
import {
  EditRounded,
  CloseRounded,
  CheckRounded,
  AddRounded,
  DownloadRounded,
  DeleteRounded,
  AccessTimeFilledRounded,
  CalendarMonthRounded,
  PersonRounded,
  ImageRounded
} from '@/components/icons/md3'
import { VISIT_STATUS_CONFIG } from '@/components/agenda/types'
import type { Appointment, LinkedTreatmentStatus, VisitSOAPNotes } from '@/context/AppointmentsContext'
import TreatmentStatusBadge from './TreatmentStatusBadge'
import SOAPNotesEditor from './SOAPNotesEditor'
import { formatShortDate, formatTimeRange, VISIT_STATUS_LABELS, calculateDurationMinutes } from './types'

type VisitDetailPanelProps = {
  appointment: Appointment | null
  isEditing: boolean
  editedNotes: VisitSOAPNotes
  onEdit: () => void
  onSave: () => void
  onSaveAsDraft?: () => void
  onCancel: () => void
  onSOAPChange: (field: 'subjective' | 'objective' | 'assessment' | 'plan', value: string) => void
  onTreatmentStatusChange: (treatmentId: string, status: LinkedTreatmentStatus) => void
  onUploadAttachment: () => void
  onRemoveAttachment: (attachmentId: string) => void
}

export default function VisitDetailPanel({
  appointment,
  isEditing,
  editedNotes,
  onEdit,
  onSave,
  onSaveAsDraft,
  onCancel,
  onSOAPChange,
  onTreatmentStatusChange,
  onUploadAttachment,
  onRemoveAttachment
}: VisitDetailPanelProps) {
  // State for showing immutability warning
  const [showImmutabilityWarning, setShowImmutabilityWarning] = React.useState(false)
  if (!appointment) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <CalendarMonthRounded className='size-12 text-[var(--color-neutral-300)] mx-auto mb-3' />
          <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-600)] text-body-md">
            Selecciona una visita
          </p>
          <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-body-sm">
            Haz clic en una visita del timeline para ver sus detalles
          </p>
        </div>
      </div>
    )
  }

  const visitStatus = appointment.visitStatus || 'scheduled'
  const statusConfig = VISIT_STATUS_CONFIG[visitStatus]
  const isCompleted = visitStatus === 'completed'
  const treatments = appointment.linkedTreatments || []
  const attachments = appointment.attachments || []
  
  // Check if notes are finalized (completed visit with non-draft notes)
  const notesAreDraft = appointment.soapNotes?.isDraft === true
  const notesAreFinalized = isCompleted && !notesAreDraft && 
    !!(appointment.soapNotes?.subjective || appointment.soapNotes?.objective || 
     appointment.soapNotes?.assessment || appointment.soapNotes?.plan)
  
  // Handler for edit button that checks immutability
  const handleEditClick = () => {
    if (notesAreFinalized) {
      setShowImmutabilityWarning(true)
      return
    }
    onEdit()
  }

  return (
    <div className='h-full overflow-y-auto px-6 py-5'>
      {/* Header with title and edit button */}
      <div className='flex items-start justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h3 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-title-lg">
              {appointment.reason}
            </h3>
            <div
              className='px-2 py-0.5 rounded-full text-label-sm font-medium'
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor
              }}
            >
              {VISIT_STATUS_LABELS[visitStatus]}
            </div>
          </div>
          
          {/* Visit info */}
          <div className='flex items-center gap-4 text-body-sm text-[var(--color-neutral-600)]'>
            <div className='flex items-center gap-1.5'>
              <CalendarMonthRounded className='size-4' />
              <span>{formatShortDate(appointment.date)}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <AccessTimeFilledRounded className='size-4' />
              <span>{formatTimeRange(appointment.startTime, appointment.endTime)}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <PersonRounded className='size-4' />
              <span>{appointment.professional}</span>
            </div>
          </div>
        </div>

        {/* Edit / Save buttons */}
        {!isEditing ? (
          <div className='flex items-center gap-2'>
            {/* Draft indicator */}
            {notesAreDraft && (
              <span className='px-2 py-1 rounded-full bg-[var(--color-warning-100)] text-[var(--color-warning-700)] text-label-sm font-medium'>
                Borrador
              </span>
            )}
            {/* Finalized indicator */}
            {notesAreFinalized && (
              <span className='px-2 py-1 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] text-label-sm font-medium'>
                Finalizado
              </span>
            )}
            <button
              type='button'
              onClick={handleEditClick}
              disabled={notesAreFinalized}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                notesAreFinalized 
                  ? 'border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)] cursor-not-allowed opacity-60' 
                  : 'border-[var(--color-brand-400)] bg-[#E9FBF9] hover:bg-[var(--color-brand-100)] cursor-pointer'
              }`}
              title={notesAreFinalized ? 'Las notas finalizadas no se pueden editar' : 'Editar notas'}
            >
              <EditRounded className={`size-4 ${notesAreFinalized ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-brand-700)]'}`} />
              <span className={`font-['Inter:Regular',_sans-serif] text-body-sm ${notesAreFinalized ? 'text-[var(--color-neutral-500)]' : 'text-[var(--color-brand-700)]'}`}>
                Editar
              </span>
            </button>
          </div>
        ) : (
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={onCancel}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer'
            >
              <CloseRounded className='size-4 text-[var(--color-neutral-700)]' />
              <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
                Cancelar
              </span>
            </button>
            {onSaveAsDraft && (
              <button
                type='button'
                onClick={onSaveAsDraft}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-warning-100)] border border-[var(--color-warning-300)] hover:bg-[var(--color-warning-200)] transition-colors cursor-pointer'
              >
                <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-warning-700)] text-body-sm">
                  Guardar borrador
                </span>
              </button>
            )}
            <button
              type='button'
              onClick={onSave}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] transition-colors cursor-pointer'
            >
              <CheckRounded className='size-4 text-white' />
              <span className="font-['Inter:Regular',_sans-serif] text-white text-body-sm">
                Finalizar
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Immutability warning */}
      {showImmutabilityWarning && (
        <div className='mb-4 p-4 bg-[var(--color-warning-50)] border border-[var(--color-warning-300)] rounded-lg'>
          <div className='flex items-start gap-3'>
            <div className='flex-1'>
              <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-warning-800)] text-body-sm mb-1">
                Notas clínicas finalizadas
              </p>
              <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-warning-700)] text-label-sm">
                Las notas clínicas de visitas completadas no pueden editarse para mantener la integridad del historial médico. 
                Si necesita agregar información adicional, puede crear un addendum en la próxima visita.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowImmutabilityWarning(false)}
              className='p-1 hover:bg-[var(--color-warning-100)] rounded transition-colors'
              aria-label='Cerrar aviso'
            >
              <CloseRounded className='size-4 text-[var(--color-warning-700)]' />
            </button>
          </div>
        </div>
      )}

      {/* Consultation times (if completed) */}
      {isCompleted && (appointment.waitingDuration || appointment.consultationDuration) && (
        <div className='flex gap-4 mb-6 p-3 bg-[var(--color-neutral-50)] rounded-lg'>
          {appointment.waitingDuration && (
            <div className='flex items-center gap-2'>
              <AccessTimeFilledRounded className='size-4 text-[var(--color-neutral-500)]' />
              <span className='text-body-sm text-[var(--color-neutral-600)]'>
                Espera: {calculateDurationMinutes(appointment.waitingDuration)} min
              </span>
            </div>
          )}
          {appointment.consultationDuration && (
            <div className='flex items-center gap-2'>
              <AccessTimeFilledRounded className='size-4 text-[var(--color-brand-600)]' />
              <span className='text-body-sm text-[var(--color-neutral-600)]'>
                Consulta: {calculateDurationMinutes(appointment.consultationDuration)} min
              </span>
            </div>
          )}
        </div>
      )}

      {/* Treatments section */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-3'>
          <h4 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
            Tratamientos vinculados
          </h4>
          <span className='text-label-sm text-[var(--color-neutral-500)]'>
            {treatments.length} tratamiento{treatments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {treatments.length > 0 ? (
          <div className='space-y-2'>
            {treatments.map((treatment) => (
              <div
                key={treatment.id}
                className='flex items-center justify-between p-3 bg-white border border-[var(--color-neutral-200)] rounded-lg'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-sm">
                      {treatment.description}
                    </span>
                    {treatment.pieceNumber && (
                      <span className='px-1.5 py-0.5 bg-[var(--color-neutral-100)] rounded text-label-sm text-[var(--color-neutral-600)]'>
                        Pieza {treatment.pieceNumber}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-3 text-label-sm text-[var(--color-neutral-500)]'>
                    <span>{treatment.amount}</span>
                    {treatment.completedBy && treatment.status === 'completed' && (
                      <span>• Realizado por {treatment.completedBy}</span>
                    )}
                  </div>
                </div>
                <TreatmentStatusBadge
                  status={treatment.status}
                  showDropdown={isEditing}
                  onStatusChange={(newStatus) => onTreatmentStatusChange(treatment.id, newStatus)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='p-4 bg-[var(--color-neutral-50)] rounded-lg text-center'>
            <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
              No hay tratamientos vinculados a esta visita
            </p>
          </div>
        )}
      </div>

      {/* SOAP Notes section */}
      <div className='mb-6'>
        <h4 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md mb-4">
          Notas clínicas (SOAP)
        </h4>
        <div className='p-4 bg-white border border-[var(--color-neutral-200)] rounded-lg'>
          <SOAPNotesEditor
            notes={isEditing ? editedNotes : appointment.soapNotes}
            isEditing={isEditing}
            onChange={onSOAPChange}
          />
        </div>
      </div>

      {/* Attachments section */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-3'>
          <h4 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
            Archivos adjuntos
          </h4>
          <button
            type='button'
            onClick={onUploadAttachment}
            className='flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity'
          >
            <AddRounded className='size-5 text-[var(--color-brand-500)]' />
            <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-brand-500)] text-body-sm">
              Subir documento
            </span>
          </button>
        </div>

        {attachments.length > 0 ? (
          <div className='space-y-2'>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className='flex items-center justify-between p-3 bg-white border border-[var(--color-neutral-200)] rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  {attachment.type === 'xray' ? (
                    <ImageRounded className='size-5 text-[var(--color-neutral-500)]' />
                  ) : (
                    <ImageRounded className='size-5 text-[var(--color-neutral-500)]' />
                  )}
                  <div>
                    <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
                      {attachment.name}
                    </p>
                    <p className='text-label-sm text-[var(--color-neutral-400)]'>
                      {new Date(attachment.uploadedAt).toLocaleDateString('es-ES')}
                      {attachment.uploadedBy && ` • ${attachment.uploadedBy}`}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    className='p-1.5 hover:bg-[var(--color-neutral-50)] rounded transition-colors cursor-pointer'
                    aria-label='Descargar'
                  >
                    <DownloadRounded className='size-5 text-[var(--color-neutral-600)]' />
                  </button>
                  {isEditing && (
                    <button
                      type='button'
                      onClick={() => onRemoveAttachment(attachment.id)}
                      className='p-1.5 hover:bg-[var(--color-error-50)] rounded transition-colors cursor-pointer'
                      aria-label='Eliminar'
                    >
                      <DeleteRounded className='size-5 text-[var(--color-error-600)]' />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='p-4 bg-[var(--color-neutral-50)] rounded-lg text-center'>
            <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
              No hay archivos adjuntos
            </p>
          </div>
        )}
      </div>

      {/* Odontogram placeholder */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <h4 className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
            Odontograma
          </h4>
          <button
            type='button'
            className='flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity'
          >
            <AddRounded className='size-5 text-[var(--color-brand-500)]' />
            <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-brand-500)] text-body-sm">
              Subir odontograma
            </span>
          </button>
        </div>
        
        {appointment.odontogramSnapshot ? (
          <div className='border border-[var(--color-neutral-200)] rounded-lg overflow-hidden'>
            {/* Placeholder for odontogram image */}
            <div className='h-44 bg-[var(--color-neutral-50)] flex items-center justify-center'>
              <ImageRounded className='size-12 text-[var(--color-neutral-300)]' />
            </div>
          </div>
        ) : (
          <div className='h-44 border border-dashed border-[var(--color-neutral-300)] rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <ImageRounded className='size-10 text-[var(--color-neutral-300)] mx-auto mb-2' />
              <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-body-sm">
                Sin odontograma registrado
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
