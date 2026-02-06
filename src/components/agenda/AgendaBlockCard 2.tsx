'use client'

import { useState, useRef, useEffect, CSSProperties } from 'react'

import { MD3Icon, type MD3IconName } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'

import type { BlockType } from '@/context/AppointmentsContext'
import { BLOCK_TYPE_CONFIG } from '@/context/AppointmentsContext'

// Striped background pattern for blocks
const STRIPED_BACKGROUND = `
  repeating-linear-gradient(
    45deg,
    #6B7280,
    #6B7280 4px,
    #9CA3AF 4px,
    #9CA3AF 8px
  )
`

// Lighter striped pattern for hover state
const STRIPED_BACKGROUND_HOVER = `
  repeating-linear-gradient(
    45deg,
    #7C8490,
    #7C8490 4px,
    #A8B2BC 4px,
    #A8B2BC 8px
  )
`

const clampStyle = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  } as const)

export interface AgendaBlockCardProps {
  id: string
  blockType: BlockType
  description: string
  box?: string
  timeRange: string
  responsibleName?: string
  isRecurring?: boolean
  // Visual positioning
  top: string
  height: string
  left?: string
  width?: string
  // Interaction
  isActive?: boolean
  isHovered?: boolean
  isDragging?: boolean
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  onDragStart?: (
    type: 'move' | 'resize',
    clientX: number,
    clientY: number
  ) => void
  onEdit?: () => void
  onDelete?: (deleteRecurrence?: boolean) => void
  styleOverride?: CSSProperties
}

// Context menu for blocks
function BlockContextMenu({
  position,
  isRecurring,
  onEdit,
  onDelete,
  onClose
}: {
  position: { x: number; y: number }
  isRecurring?: boolean
  onEdit?: () => void
  onDelete?: (deleteRecurrence?: boolean) => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <Portal>
      <div
        ref={menuRef}
        className='fixed z-[9999] min-w-[12rem] rounded-lg border border-[var(--color-border-default)] bg-white py-1 shadow-lg'
        style={{
          top: position.y,
          left: position.x
        }}
      >
        <button
          onClick={() => {
            onEdit?.()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]'
        >
          <MD3Icon name='EditRounded' size={1} className='text-[var(--color-neutral-500)]' />
          Editar bloqueo
        </button>
        
        <button
          onClick={() => {
            onDelete?.(false)
            onClose()
          }}
          className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50'
        >
          <MD3Icon name='DeleteRounded' size={1} className='text-red-500' />
          Eliminar bloqueo
        </button>

        {isRecurring && (
          <button
            onClick={() => {
              onDelete?.(true)
              onClose()
            }}
            className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50'
          >
            <MD3Icon name='DeleteSweepRounded' size={1} className='text-red-500' />
            Eliminar toda la serie
          </button>
        )}
      </div>
    </Portal>
  )
}

export default function AgendaBlockCard({
  id,
  blockType,
  description,
  box,
  timeRange,
  responsibleName,
  isRecurring,
  top,
  height,
  left,
  width,
  isActive,
  isHovered,
  isDragging,
  onHover,
  onLeave,
  onActivate,
  onDragStart,
  onEdit,
  onDelete,
  styleOverride
}: AgendaBlockCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const blockConfig = BLOCK_TYPE_CONFIG[blockType]

  // Border/shadow states
  const stateClasses = isActive
    ? 'ring-2 ring-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(107,114,128,0.35)]'
    : isHovered
    ? 'ring-1 ring-[var(--color-neutral-500)]'
    : ''

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <button
        type='button'
        data-block-card='true'
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActivate()
          }
        }}
        onContextMenu={handleContextMenu}
        className={[
          'group/blockcard absolute flex flex-col gap-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-400)] p-2 text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)]',
          stateClasses
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          top,
          height,
          left: left ?? 'var(--scheduler-event-left-offset)',
          width: width ?? 'var(--scheduler-event-width)',
          background: isDragging || isHovered ? STRIPED_BACKGROUND_HOVER : STRIPED_BACKGROUND,
          cursor: isDragging ? 'grabbing' : onDragStart ? 'grab' : 'pointer',
          zIndex: isDragging ? 50 : 1,
          opacity: isDragging ? 0.88 : 1,
          transform: isDragging ? 'scale(1.02)' : 'none',
          ...styleOverride
        }}
        aria-pressed={isActive}
        aria-label={`Bloqueo: ${description}`}
      >
        {/* Header with icon and type */}
        <div className='flex items-center gap-1.5'>
          <MD3Icon
            name={blockConfig.icon as MD3IconName}
            size={0.875}
            className='shrink-0 text-white'
          />
          <span
            className='font-semibold text-white'
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              ...clampStyle(1)
            }}
          >
            {blockConfig.label}
          </span>
          {isRecurring && (
            <MD3Icon
              name='RepeatRounded'
              size={0.75}
              className='ml-auto shrink-0 text-white/80'
              title='Bloqueo recurrente'
            />
          )}
        </div>

        {/* Description */}
        {description && (
          <p
            className='font-normal text-white/90'
            style={{
              fontSize: '0.6875rem',
              lineHeight: '0.875rem',
              ...clampStyle(2)
            }}
          >
            {description}
          </p>
        )}

        {/* Time range */}
        <p
          className='font-normal text-white/70'
          style={{
            fontSize: '0.625rem',
            lineHeight: '0.75rem'
          }}
        >
          {timeRange}
        </p>

        {/* Responsible (if assigned) */}
        {responsibleName && (
          <p
            className='font-normal text-white/60'
            style={{
              fontSize: '0.5625rem',
              lineHeight: '0.75rem',
              ...clampStyle(1)
            }}
          >
            {responsibleName}
          </p>
        )}

        {/* Drag overlay */}
        {onDragStart && (
          <div
            className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={(e) => {
              e.stopPropagation()
              onDragStart('move', e.clientX, e.clientY)
            }}
            aria-hidden
          />
        )}

        {/* Resize handle */}
        {onDragStart && (
          <div
            className='absolute bottom-0 left-0 right-0 h-2 cursor-s-resize'
            onMouseDown={(e) => {
              e.stopPropagation()
              onDragStart('resize', e.clientX, e.clientY)
            }}
            aria-hidden
          />
        )}
      </button>

      {/* Context menu */}
      {contextMenu && (
        <BlockContextMenu
          position={contextMenu}
          isRecurring={isRecurring}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
