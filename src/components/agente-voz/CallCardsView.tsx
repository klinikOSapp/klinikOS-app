'use client'

import CallCard from './CallCard'
import type { CallRecord, VoiceAgentTier } from './voiceAgentTypes'

type CallCardsViewProps = {
  /** Array of call records to display */
  calls: CallRecord[]
  /** Callback when a call's phone button is clicked */
  onCall: (call: CallRecord) => void
  /** Callback to mark a call as resolved */
  onMarkResolved: (call: CallRecord) => void
  /** Callback to add a note to a call */
  onAddNote: (call: CallRecord) => void
  /** Callback to show call detail modal */
  onShowDetail: (call: CallRecord) => void
  /** Quick action callbacks */
  onViewAppointment?: (call: CallRecord) => void
  onCreateAppointment?: (call: CallRecord) => void
  onListenCall?: (call: CallRecord) => void
  onViewTranscription?: (call: CallRecord) => void
  onAssignProfessional?: (call: CallRecord) => void
  /** Voice agent tier */
  voiceAgentTier?: VoiceAgentTier
}

/**
 * CallCardsView Component
 * Grid container for call cards
 * Figma: Full width grid with 385px cards and auto-fit
 */
export default function CallCardsView({
  calls,
  onCall,
  onMarkResolved,
  onAddNote,
  onShowDetail,
  onViewAppointment,
  onCreateAppointment,
  onListenCall,
  onViewTranscription,
  onAssignProfessional,
  voiceAgentTier = 'advanced'
}: CallCardsViewProps) {
  if (calls.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <span className='material-symbols-rounded text-6xl text-neutral-300'>
            call_end
          </span>
          <p className='mt-4 text-body-md text-neutral-600'>
            No hay llamadas que mostrar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full h-full overflow-y-auto pr-2'>
      <div className='grid grid-cols-4 gap-4'>
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onCall={() => onCall(call)}
            onMarkResolved={() => onMarkResolved(call)}
            onAddNote={() => onAddNote(call)}
            onShowDetail={() => onShowDetail(call)}
            onViewAppointment={
              onViewAppointment ? () => onViewAppointment(call) : undefined
            }
            onCreateAppointment={
              onCreateAppointment ? () => onCreateAppointment(call) : undefined
            }
            onListenCall={onListenCall ? () => onListenCall(call) : undefined}
            onViewTranscription={
              onViewTranscription ? () => onViewTranscription(call) : undefined
            }
            onAssignProfessional={
              onAssignProfessional
                ? () => onAssignProfessional(call)
                : undefined
            }
            voiceAgentTier={voiceAgentTier}
          />
        ))}
      </div>
    </div>
  )
}
