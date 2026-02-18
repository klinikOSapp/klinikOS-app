'use client'

import { initialSpecialistsData } from '@/components/configuracion/SpecialistsListPage'
import Portal from '@/components/ui/Portal'
import { useEffect, useMemo, useRef, useState } from 'react'
import CallStatusBadge from './CallStatusBadge'
import type { CallRecord } from './voiceAgentTypes'
import { CALL_INTENT_LABELS } from './voiceAgentTypes'

type AssignProfessionalModalProps = {
  call: CallRecord
  onClose: () => void
  onAssign?: (professionalId: string) => void
}

/**
 * Assign Professional Modal
 * Figma: 517px width
 * Allows selecting a professional to assign to the call
 */
export default function AssignProfessionalModal({
  call,
  onClose,
  onAssign
}: AssignProfessionalModalProps) {
  const displayIntent = call.intentDisplay?.trim() || CALL_INTENT_LABELS[call.intent]
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get active specialists from configuration
  const specialists = useMemo(() => {
    return initialSpecialistsData
      .map((specialist, index) => ({
        ...specialist,
        id: `specialist-${index}`
      }))
      .filter((specialist) => specialist.status === 'Activo')
  }, [])

  // Handle escape key and click outside
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false)
        } else {
          onClose()
        }
      }
    }

    function handleClickOutside(event: MouseEvent) {
      // Close dropdown if clicking outside of it
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }

      // Close modal if clicking outside of it (but not on dropdown)
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, isDropdownOpen])

  const handleAssign = () => {
    if (selectedProfessional && onAssign) {
      onAssign(selectedProfessional)
    }
    onClose()
  }

  const selectedSpecialist = specialists.find(
    (s) => s.id === selectedProfessional
  )

  return (
    <Portal>
      {/* Backdrop */}
      <div className='fixed inset-0 z-[9998] bg-black/30' />

      {/* Modal */}
      <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
        <div
          ref={modalRef}
          className='relative w-[min(32.3125rem,95vw)] bg-white rounded-lg overflow-hidden shadow-xl'
          role='dialog'
          aria-modal='true'
          aria-labelledby='assign-professional-title'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-8 h-14 border-b border-neutral-300'>
            <h2
              id='assign-professional-title'
              className='text-title-md font-medium text-neutral-900'
            >
              Asignar cita a profesional
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='p-1 text-neutral-600 hover:text-neutral-900 transition-colors rounded hover:bg-neutral-100'
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-xl'>close</span>
            </button>
          </header>

          {/* Content */}
          <div className='px-8 py-6'>
            {/* Professional Select */}
            <div className='mb-6'>
              <label className='block text-body-md text-neutral-900 mb-2'>
                Profesional
              </label>
              <div ref={dropdownRef} className='relative'>
                <button
                  type='button'
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className='w-full h-12 px-3 bg-neutral-50 border border-neutral-300 rounded-lg flex items-center justify-between text-left hover:border-neutral-400 transition-colors'
                >
                  <span
                    className={`text-body-md ${
                      selectedProfessional
                        ? 'text-neutral-900'
                        : 'text-neutral-400'
                    }`}
                  >
                    {selectedSpecialist
                      ? `${selectedSpecialist.name} - ${selectedSpecialist.role}`
                      : 'Seleccionar profesional'}
                  </span>
                  <span
                    className={`material-symbols-rounded text-2xl text-neutral-600 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  >
                    keyboard_arrow_down
                  </span>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto'>
                    {specialists.map((specialist) => (
                      <button
                        key={specialist.id}
                        type='button'
                        onClick={() => {
                          setSelectedProfessional(specialist.id)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-neutral-100 transition-colors ${
                          selectedProfessional === specialist.id
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-neutral-900'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-body-md'>
                            {specialist.name}
                          </span>
                          <span className='text-label-sm text-neutral-600'>
                            {specialist.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className='bg-white rounded-lg p-4 shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1),-2px_-2px_4px_0px_rgba(0,0,0,0.05)]'>
              {/* Estado */}
              <div className='flex items-center justify-between mb-4'>
                <span className='text-body-md text-neutral-700'>Estado</span>
                <CallStatusBadge status={call.status} />
              </div>

              {/* Details */}
              <div className='flex flex-col gap-2'>
                {/* Hora */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Hora
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.time}
                  </span>
                </div>

                {/* Paciente */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Paciente
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.patient ?? 'Pendiente de asignar'}
                  </span>
                </div>

                {/* Teléfono */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Teléfono
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.phone}
                  </span>
                </div>

                {/* Motivo/Intención */}
                <div className='flex items-start gap-16'>
                  <span className='text-body-md text-neutral-700 w-16 shrink-0'>
                    Motivo
                  </span>
                  <span className='text-body-md text-neutral-900' title={displayIntent}>
                    {displayIntent}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className='flex justify-end mt-6'>
              <button
                type='button'
                onClick={handleAssign}
                disabled={!selectedProfessional}
                className='px-4 py-2 bg-brand-500 text-brand-900 font-medium rounded-full hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
