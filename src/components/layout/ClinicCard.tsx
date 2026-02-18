'use client'

import {
  KeyboardArrowDownRounded,
  LocalHospitalRounded,
  PlaceRounded
} from '@/components/icons/md3'
import { useClinic } from '@/context/ClinicContext'
import { useMemo, useState } from 'react'

type ClinicCardProps = {
  collapsed?: boolean
}

export default function ClinicCard({ collapsed = false }: ClinicCardProps) {
  const { activeClinic, clinics, setActiveClinicId, isLoading } = useClinic()

  const [isExpanded, setIsExpanded] = useState(false)

  const canSwitchClinic = clinics.length > 1
  const otherClinics = useMemo(
    () =>
      clinics.filter((clinic) => clinic.id !== activeClinic?.id),
    [activeClinic?.id, clinics]
  )

  // Don't render if no clinic selected yet
  if (!activeClinic) {
    return null
  }

  // Collapsed view - just show icon
  if (collapsed) {
    return (
      <div className='px-3 pb-4'>
        {canSwitchClinic ? (
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
            title={activeClinic.name}
          >
            <LocalHospitalRounded className='size-5 text-[var(--color-brand-6)]' />
          </button>
        ) : (
          <div
            className='w-full p-3 rounded-xl bg-white border border-[var(--color-brand-100)] flex items-center justify-center'
            title={activeClinic.name}
          >
            <LocalHospitalRounded className='size-5 text-[var(--color-brand-6)]' />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className='px-4 pb-4'>
        {/* Current clinic card */}
        <button
          type='button'
          onClick={() => {
            if (canSwitchClinic) setIsExpanded(!isExpanded)
          }}
          disabled={isLoading || !canSwitchClinic}
          className={`
            w-full p-3 rounded-xl
            bg-white border border-[var(--color-brand-100)]
            shadow-sm
            transition-all duration-200
            text-left
            ${
              canSwitchClinic
                ? 'hover:shadow-md hover:border-[var(--color-brand-200)]'
                : ''
            }
            ${
              isLoading
                ? 'opacity-50 cursor-wait'
                : canSwitchClinic
                  ? 'cursor-pointer'
                  : 'cursor-default'
            }
          `}
        >
          <div className='flex items-start gap-3'>
            <div className='size-10 rounded-lg bg-[var(--color-brand-1)] flex items-center justify-center flex-shrink-0'>
              <LocalHospitalRounded className='size-5 text-[var(--color-brand-6)]' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-semibold text-neutral-900 truncate'>
                  {activeClinic.name}
                </p>
                {canSwitchClinic && (
                  <KeyboardArrowDownRounded
                    className={`size-5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </div>
              <div className='flex items-center gap-1 mt-0.5'>
                <PlaceRounded className='size-3.5 text-neutral-400 flex-shrink-0' />
                <p className='text-xs text-neutral-500 truncate'>
                  {activeClinic.address}
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Expanded list of other clinics */}
        {canSwitchClinic && (
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
                  onClick={() => {
                    setActiveClinicId(clinic.id)
                    setIsExpanded(false)
                  }}
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
                        {clinic.name}
                      </p>
                      <div className='flex items-center gap-1 mt-0.5'>
                        <PlaceRounded className='size-3.5 text-neutral-400 flex-shrink-0' />
                        <p className='text-xs text-neutral-500 truncate'>
                          {clinic.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </>
  )
}
