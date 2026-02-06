'use client'

import type { TreatmentStatus } from './treatmentTypes'

type StatusBadgeProps = {
  status: TreatmentStatus
  /**
   * Variant controls the styling:
   * - 'simple': Basic two-color scheme (used in patient-file)
   * - 'detailed': Specific colors per status (used in patient-record)
   */
  variant?: 'simple' | 'detailed'
}

export function StatusBadge({
  status,
  variant = 'detailed'
}: StatusBadgeProps) {
  if (variant === 'simple') {
    // Simple variant: only two color schemes
    const isPaidOrAccepted = status === 'Pagado' || status === 'Aceptado'
    return (
      <span
        className={[
          'inline-flex items-center justify-center rounded-full px-2 py-1 text-label-sm',
          isPaidOrAccepted
            ? 'bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB]'
            : 'bg-[#FFF3E0] text-[#F57C00] border border-[#FFE0B2]'
        ].join(' ')}
      >
        {status}
      </span>
    )
  }

  // Detailed variant: specific colors per status
  if (status === 'Aceptado') {
    return (
      <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#00BFFF] px-2 py-1 text-label-sm bg-[#E0F7FA] text-[#00BFFF]'>
        {status}
      </span>
    )
  }
  if (status === 'Pagado') {
    return (
      <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#28A745] px-2 py-1 text-label-sm bg-[#E8FFF3] text-[#28A745]'>
        {status}
      </span>
    )
  }
  if (status === 'No aceptado') {
    return (
      <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#F57C00] px-2 py-1 text-label-sm bg-[#FFF3E0] text-[#F57C00]'>
        {status}
      </span>
    )
  }
  // Recall y Sin pagar - mismo estilo (amarillo)
  return (
    <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#FFC107] px-2 py-1 text-label-sm bg-[#FFF8DC] text-[#FFC107]'>
      {status}
    </span>
  )
}
