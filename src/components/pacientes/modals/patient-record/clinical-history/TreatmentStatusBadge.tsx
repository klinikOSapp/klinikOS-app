'use client'

import type { LinkedTreatmentStatus } from '@/context/AppointmentsContext'
import React from 'react'
import { TREATMENT_STATUS_CONFIG } from './types'

type TreatmentStatusBadgeProps = {
  status: LinkedTreatmentStatus
  size?: 'sm' | 'md'
  onClick?: () => void
  showDropdown?: boolean
  onStatusChange?: (status: LinkedTreatmentStatus) => void
}

export default function TreatmentStatusBadge({
  status,
  size = 'sm',
  onClick,
  showDropdown = false,
  onStatusChange
}: TreatmentStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const config = TREATMENT_STATUS_CONFIG[status]

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-label-sm' : 'px-3 py-1 text-body-sm'

  const handleClick = () => {
    if (showDropdown && onStatusChange) {
      setIsOpen(!isOpen)
    } else if (onClick) {
      onClick()
    }
  }

  const handleStatusSelect = (newStatus: LinkedTreatmentStatus) => {
    onStatusChange?.(newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={handleClick}
        className={[
          'rounded-full font-medium transition-opacity',
          sizeClasses,
          showDropdown
            ? 'cursor-pointer hover:opacity-80'
            : onClick
              ? 'cursor-pointer'
              : 'cursor-default'
        ].join(' ')}
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
      >
        {config.label}
      </button>

      {/* Dropdown menu */}
      {showDropdown && isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[var(--color-neutral-200)] py-1 min-w-[140px]'>
          {(
            Object.keys(TREATMENT_STATUS_CONFIG) as LinkedTreatmentStatus[]
          ).map((statusOption) => {
            const optionConfig = TREATMENT_STATUS_CONFIG[statusOption]
            const isSelected = statusOption === status

            return (
              <button
                key={statusOption}
                type='button'
                onClick={() => handleStatusSelect(statusOption)}
                className={[
                  'w-full text-left px-3 py-2 text-body-sm transition-colors',
                  isSelected
                    ? 'bg-[var(--color-neutral-50)]'
                    : 'hover:bg-[var(--color-neutral-50)]'
                ].join(' ')}
              >
                <div className='flex items-center gap-2'>
                  <div
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: optionConfig.textColor }}
                  />
                  <span style={{ color: optionConfig.textColor }}>
                    {optionConfig.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
