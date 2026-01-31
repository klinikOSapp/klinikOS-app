'use client'

import React from 'react'
import {
  CalendarMonthRounded,
  CheckCircleRounded,
  AccessTimeFilledRounded,
  PersonRounded
} from '@/components/icons/md3'
import { VISIT_STATUS_CONFIG } from '@/components/agenda/types'
import type { VisitCardProps } from './types'
import { formatShortDate, formatTimeRange, VISIT_STATUS_LABELS } from './types'

export default function VisitCard({
  appointment,
  selected,
  onClick,
  isUpcoming
}: VisitCardProps) {
  const visitStatus = appointment.visitStatus || 'scheduled'
  const statusConfig = VISIT_STATUS_CONFIG[visitStatus]
  const isCompleted = visitStatus === 'completed'
  const treatmentCount = appointment.linkedTreatments?.length || 0

  return (
    <button
      type='button'
      onClick={onClick}
      className={[
        'w-full text-left p-4 rounded-xl transition-all duration-200 cursor-pointer',
        'bg-white border',
        selected
          ? 'border-[var(--color-brand-500)] shadow-[0_0_0_2px_rgba(81,214,199,0.2)]'
          : 'border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-300)]'
      ].join(' ')}
    >
      {/* Header: Title + Status Badge */}
      <div className='flex items-start justify-between gap-2 mb-3'>
        <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md line-clamp-2">
          {appointment.reason}
        </p>
        {/* Status indicator */}
        <div
          className='shrink-0 px-2 py-0.5 rounded-full text-label-sm font-medium'
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.textColor
          }}
        >
          {VISIT_STATUS_LABELS[visitStatus]}
        </div>
      </div>

      {/* Date & Time */}
      <div className='flex items-center gap-2 mb-2'>
        <CalendarMonthRounded className='size-4 text-[var(--color-neutral-500)]' />
        <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
          {formatShortDate(appointment.date)}
        </span>
        <span className='text-[var(--color-neutral-400)]'>•</span>
        <AccessTimeFilledRounded className='size-4 text-[var(--color-neutral-500)]' />
        <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
          {formatTimeRange(appointment.startTime, appointment.endTime)}
        </span>
      </div>

      {/* Professional */}
      <div className='flex items-center gap-2 mb-2'>
        <PersonRounded className='size-4 text-[var(--color-neutral-500)]' />
        <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-600)] text-body-sm">
          {appointment.professional}
        </span>
      </div>

      {/* Footer: Treatments count + Completed indicator */}
      <div className='flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-neutral-100)]'>
        {treatmentCount > 0 ? (
          <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-600)] text-label-sm">
            {treatmentCount} tratamiento{treatmentCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-label-sm">
            Sin tratamientos vinculados
          </span>
        )}
        
        {isCompleted && (
          <div className='flex items-center gap-1'>
            <CheckCircleRounded className='size-4 text-[var(--color-brand-600)]' />
            <span className="font-['Inter:Medium',_sans-serif] text-[var(--color-brand-600)] text-label-sm">
              Completada
            </span>
          </div>
        )}
        
        {isUpcoming && !isCompleted && (
          <div className='flex items-center gap-1'>
            <span className="font-['Inter:Medium',_sans-serif] text-[var(--color-brand-500)] text-label-sm">
              Próxima
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
