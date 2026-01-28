'use client'

import UserModal from './UserModal'
// Use the consolidated ClientSummary component with readOnly mode
import ClientSummary from './modals/patient-record/ClientSummary'

type PatientFichaModalProps = {
  open: boolean
  onClose: () => void
}

export default function PatientFichaModal({
  open,
  onClose
}: PatientFichaModalProps) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50'>
      <div
        className='absolute inset-0 bg-black/30'
        onClick={onClose}
        aria-hidden
      />
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div className='bg-white rounded-[12px] shadow-xl overflow-hidden'>
          <div className='flex gap-6 p-6'>
            <UserModal />
            <ClientSummary readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
