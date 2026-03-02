'use client'

import { CheckRounded, KeyboardArrowDownRounded } from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type CellSelectOption = {
  value: string
  label: string
}

type CellSelectProps = {
  value: string
  options: CellSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  compact?: boolean
}

export default function CellSelect({
  value,
  options,
  onChange,
  placeholder = '-',
  className = '',
  compact = false
}: CellSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [dropdownPos, setDropdownPos] = React.useState<{
    top: number
    left: number
    minWidth: number
  } | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const openDropdown = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = Math.min(options.length * 32 + 8, 240)
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

    setDropdownPos({
      top: placeAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, compact ? 100 : 140)
    })
    setIsOpen(true)
  }, [options.length, compact])

  React.useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return
      setIsOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    const handleScroll = () => setIsOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const textSize = compact
    ? 'text-[0.6875rem] leading-[1rem]'
    : 'text-[0.875rem] leading-[1.25rem]'

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className={[
          'w-full flex items-center justify-between gap-0.5 bg-transparent rounded px-1 py-0.5 cursor-pointer',
          'hover:bg-[var(--color-neutral-50)] transition-colors text-left',
          textSize,
          value ? 'text-[#24282C]' : 'text-[var(--color-neutral-400)]',
          className
        ].join(' ')}
      >
        <span className='truncate'>
          {selectedOption?.label || placeholder}
        </span>
        <KeyboardArrowDownRounded
          className={[
            'shrink-0 text-[var(--color-neutral-400)] transition-transform',
            compact ? 'w-[0.875rem] h-[0.875rem]' : 'w-[1rem] h-[1rem]',
            isOpen ? 'rotate-180' : ''
          ].join(' ')}
        />
      </button>

      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            className='fixed z-[9999] flex flex-col overflow-auto rounded-[0.5rem] border border-[#E2E7EA] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: dropdownPos.minWidth,
              maxHeight: 240
            }}
            role='listbox'
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type='button'
                  role='option'
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={[
                    'flex items-center justify-between gap-2 px-[0.625rem] transition-colors cursor-pointer',
                    compact ? 'py-[0.25rem]' : 'py-[0.375rem]',
                    textSize,
                    isSelected
                      ? 'bg-[#E9FBF9] text-[var(--color-brand-700)] font-medium'
                      : 'text-[#24282C] hover:bg-[var(--color-neutral-50)]'
                  ].join(' ')}
                >
                  <span className='truncate'>{opt.label}</span>
                  {isSelected && (
                    <CheckRounded className='w-[0.875rem] h-[0.875rem] text-[var(--color-brand-500)] shrink-0' />
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
