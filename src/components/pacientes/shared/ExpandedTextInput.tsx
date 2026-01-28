'use client'

import Portal from '@/components/ui/Portal'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface ExpandedTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Milisegundos de hover antes de mostrar el popover (default: 500ms) */
  hoverDelay?: number
}

/**
 * ExpandedTextInput - Input de texto que muestra un popover expandido al hacer click o hover
 * 
 * Basado en el diseño de Figma:
 * - Fondo: #F4F8FA (Neutral/100)
 * - Border radius: 8px (0.5rem)
 * - Padding: 16px (1rem)
 * - Texto: 14px, line-height 20px, color #24282C (Neutral/900)
 */
export default function ExpandedTextInput({
  value,
  onChange,
  placeholder,
  className = '',
  hoverDelay = 500
}: ExpandedTextInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHoverMode, setIsHoverMode] = useState(false) // Si se abrió por hover (solo lectura)
  const [localValue, setLocalValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  
  // Ref para el timeout del hover
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar valor local con prop cuando no está expandido
  useEffect(() => {
    if (!isExpanded) {
      setLocalValue(value)
    }
  }, [value, isExpanded])

  // Calcular posición del popover
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const popoverHeight = 120 // Altura aproximada del popover
      
      // Si no hay espacio debajo, mostrar arriba
      const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight
      
      setPosition({
        top: showAbove ? rect.top - popoverHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 280)
      })
    }
  }, [])

  // Limpiar timeout del hover
  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  // Abrir popover por hover (solo lectura)
  const handleMouseEnter = useCallback(() => {
    // Solo activar hover si hay texto y no está ya expandido
    if (!isExpanded && value && value.length > 0) {
      clearHoverTimeout()
      hoverTimeoutRef.current = setTimeout(() => {
        updatePosition()
        setIsHoverMode(true)
        setIsExpanded(true)
      }, hoverDelay)
    }
  }, [isExpanded, value, hoverDelay, updatePosition, clearHoverTimeout])

  // Cerrar popover por salir del hover
  const handleMouseLeave = useCallback(() => {
    clearHoverTimeout()
    // Solo cerrar si estaba en modo hover (no si está editando)
    if (isHoverMode) {
      setIsExpanded(false)
      setIsHoverMode(false)
    }
  }, [isHoverMode, clearHoverTimeout])

  // Abrir popover al hacer click (modo edición)
  const handleClick = useCallback(() => {
    clearHoverTimeout()
    updatePosition()
    setIsHoverMode(false) // Modo edición, no hover
    setIsExpanded(true)
  }, [updatePosition, clearHoverTimeout])

  // Cerrar popover y guardar cambios
  const handleClose = useCallback(() => {
    if (!isExpanded) return
    setIsExpanded(false)
    if (!isHoverMode) {
      // Solo guardar si estaba en modo edición
      onChange(localValue)
    }
    setIsHoverMode(false)
  }, [isExpanded, isHoverMode, localValue, onChange])

  // Manejar click fuera del popover
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        handleClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    // Pequeño delay para evitar que el click cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isExpanded, handleClose])

  // Auto-focus en el textarea cuando se abre el popover en modo edición
  useEffect(() => {
    if (isExpanded && !isHoverMode && textareaRef.current) {
      // Pequeño delay para asegurar que el popover está montado
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          // Poner el cursor al final del texto
          const len = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(len, len)
        }
      })
    }
  }, [isExpanded, isHoverMode])

  // Ajustar altura del textarea automáticamente
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    if (isExpanded) {
      adjustTextareaHeight()
    }
  }, [isExpanded, localValue, adjustTextareaHeight])

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      clearHoverTimeout()
    }
  }, [clearHoverTimeout])

  // Manejar cambio en el textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
  }, [])

  // Manejar blur del textarea - cerrar y guardar
  const handleTextareaBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Solo cerrar si el foco no va al contenedor original
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!containerRef.current?.contains(relatedTarget)) {
      handleClose()
    }
  }, [handleClose])

  // Click en el popover en modo hover -> cambiar a modo edición
  const handlePopoverClick = useCallback(() => {
    if (isHoverMode) {
      setIsHoverMode(false)
      // Focus en el textarea para editar
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const len = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(len, len)
        }
      })
    }
  }, [isHoverMode])

  return (
    <>
      {/* Contenedor clickeable que muestra el valor (read-only) */}
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-full text-body-md text-neutral-900 bg-transparent px-1 py-0.5 rounded truncate cursor-text hover:bg-[var(--color-neutral-50)] ${className}`}
        title={value}
      >
        {value || <span className='text-neutral-400'>{placeholder}</span>}
      </div>

      {/* Popover expandido */}
      {isExpanded && (
        <Portal>
          <div
            ref={popoverRef}
            className='fixed z-[9999]'
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              animation: 'fadeIn 150ms ease-out'
            }}
            onMouseEnter={() => {
              // Mantener abierto mientras el mouse está sobre el popover
              clearHoverTimeout()
            }}
            onMouseLeave={() => {
              // Cerrar si estaba en modo hover y el mouse sale
              if (isHoverMode) {
                handleClose()
              }
            }}
            onClick={handlePopoverClick}
          >
            {/* Contenedor del popover - Diseño de Figma */}
            <div className='bg-[#F4F8FA] rounded-[0.5rem] p-[1rem] shadow-lg border border-[var(--color-neutral-200)]'>
              {isHoverMode ? (
                // Modo hover: solo mostrar texto (read-only)
                <p
                  className='w-full text-[0.875rem] leading-[1.25rem] text-[#24282C] font-normal cursor-pointer'
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    minHeight: '1.25rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {value || placeholder}
                </p>
              ) : (
                // Modo edición: textarea editable
                <textarea
                  ref={textareaRef}
                  value={localValue}
                  onChange={handleTextareaChange}
                  onBlur={handleTextareaBlur}
                  placeholder={placeholder}
                  className='w-full bg-transparent border-none outline-none resize-none text-[0.875rem] leading-[1.25rem] text-[#24282C] font-normal'
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    minHeight: '2.5rem'
                  }}
                  rows={1}
                />
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Estilos de animación */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
