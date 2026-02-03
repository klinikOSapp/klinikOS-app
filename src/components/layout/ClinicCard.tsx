'use client'

import {
  KeyboardArrowDownRounded,
  LocalHospitalRounded,
  PlaceRounded
} from '@/components/icons/md3'
import { useAuth } from '@/context/AuthContext'
import { useClinic } from '@/context/ClinicContext'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import { useCallback, useState } from 'react'
import ClinicSwitchConfirmModal from './ClinicSwitchConfirmModal'

type ClinicCardProps = {
  collapsed?: boolean
}

export default function ClinicCard({ collapsed = false }: ClinicCardProps) {
  const { canSwitchClinic } = useAuth()
  const { currentClinic, accessibleClinics, switchClinic, isLoading } =
    useClinic()
  const { hasUnsavedChanges, unsavedAreas, clearAllUnsavedChanges } =
    useUnsavedChanges()

  const [isExpanded, setIsExpanded] = useState(false)
  const [pendingClinicId, setPendingClinicId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Handle clinic selection
  const handleSelectClinic = useCallback(
    (clinicId: string) => {
      // Check for unsaved changes
      if (hasUnsavedChanges) {
        setPendingClinicId(clinicId)
        setShowConfirmModal(true)
      } else {
        // No unsaved changes, switch directly
        switchClinic(clinicId)
        setIsExpanded(false)
      }
    },
    [hasUnsavedChanges, switchClinic]
  )

  // Handle confirm modal actions
  const handleConfirmSwitch = useCallback(() => {
    if (pendingClinicId) {
      clearAllUnsavedChanges()
      switchClinic(pendingClinicId)
      setPendingClinicId(null)
      setIsExpanded(false)
    }
    setShowConfirmModal(false)
  }, [pendingClinicId, clearAllUnsavedChanges, switchClinic])

  const handleCancelSwitch = useCallback(() => {
    setPendingClinicId(null)
    setShowConfirmModal(false)
  }, [])

  // Don't render if user can't switch clinics or no clinic selected
  if (!canSwitchClinic || !currentClinic) {
    return null
  }

  // Other clinics (not the current one)
  const otherClinics = accessibleClinics.filter(
    (c) => c.id !== currentClinic.id
  )

  // Get the pending clinic name for the modal
  const pendingClinic = accessibleClinics.find((c) => c.id === pendingClinicId)

  // Collapsed view - just show icon
  if (collapsed) {
    return (
      <div className='px-3 pb-4'>
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full p-3 rounded-xl
            bg-white border border-[var(--color-brand-100)]
            flex items-center justify-center
            hover:bg-[var(--color-brand-50)]
            transition-colors duration-150
            ${isLoading ? 'opacity-50' : ''}
          `}
          title={currentClinic.nombre}
        >
          <LocalHospitalRounded className='size-5 text-[var(--color-brand-6)]' />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className='px-4 pb-4'>
        {/* Current clinic card */}
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isLoading}
          className={`
            w-full p-3 rounded-xl
            bg-white border border-[var(--color-brand-100)]
            shadow-sm
            hover:shadow-md hover:border-[var(--color-brand-200)]
            transition-all duration-200
            text-left
            ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          <div className='flex items-start gap-3'>
            <div className='size-10 rounded-lg bg-[var(--color-brand-1)] flex items-center justify-center flex-shrink-0'>
              <LocalHospitalRounded className='size-5 text-[var(--color-brand-6)]' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-semibold text-neutral-900 truncate'>
                  {currentClinic.nombre}
                </p>
                <KeyboardArrowDownRounded
                  className={`size-5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <div className='flex items-center gap-1 mt-0.5'>
                <PlaceRounded className='size-3.5 text-neutral-400 flex-shrink-0' />
                <p className='text-xs text-neutral-500 truncate'>
                  {currentClinic.direccion}
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Expanded list of other clinics */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-out
            ${
              isExpanded
                ? 'max-h-[20rem] opacity-100 mt-2'
                : 'max-h-0 opacity-0 mt-0'
            }
          `}
        >
          <div className='space-y-2'>
            {/* Header */}
            <p className='text-xs text-neutral-500 font-medium px-1'>
              Cambiar a otra clínica
            </p>

            {/* Other clinics */}
            {otherClinics.map((clinic) => (
              <button
                key={clinic.id}
                type='button'
                onClick={() => handleSelectClinic(clinic.id)}
                className={`
                  w-full p-3 rounded-xl
                  bg-[var(--color-brand-0)] border border-[var(--color-brand-50)]
                  hover:bg-white hover:border-[var(--color-brand-100)] hover:shadow-sm
                  transition-all duration-150
                  text-left
                `}
              >
                <div className='flex items-start gap-3'>
                  <div className='size-10 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center flex-shrink-0'>
                    <LocalHospitalRounded className='size-5 text-[var(--color-brand-4)]' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-neutral-700 truncate'>
                      {clinic.nombre}
                    </p>
                    <div className='flex items-center gap-1 mt-0.5'>
                      <PlaceRounded className='size-3.5 text-neutral-400 flex-shrink-0' />
                      <p className='text-xs text-neutral-500 truncate'>
                        {clinic.direccion}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ClinicSwitchConfirmModal
        isOpen={showConfirmModal}
        targetClinicName={pendingClinic?.nombre ?? ''}
        unsavedAreas={unsavedAreas}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </>
  )
}
