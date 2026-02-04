'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMedicamentoSearch, type MedicamentoSimplificado } from '@/hooks/useMedicamentoSearch'
import { KeyboardArrowDownRounded } from '@/components/icons/md3'

interface MedicamentoAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (medicamento: MedicamentoSimplificado) => void
  placeholder?: string
  width?: number
  disabled?: boolean
}

/**
 * Maps CIMA via de administración to our options
 */
export function mapViaToOption(via: string): string {
  const viaLower = via.toLowerCase()
  if (viaLower.includes('oral')) return 'Oral'
  if (viaLower.includes('tópica') || viaLower.includes('topica') || viaLower.includes('cutánea')) return 'Tópica'
  if (viaLower.includes('intravenosa') || viaLower.includes('inyect')) return 'Intravenosa'
  return 'Oral' // Default
}

export default function MedicamentoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar medicamento',
  width = 19.1875,
  disabled = false
}: MedicamentoAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const { resultados, loading, error, search, clearResults } = useMedicamentoSearch()

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    search(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }, [onChange, search])

  // Handle selection
  const handleSelect = useCallback((medicamento: MedicamentoSimplificado) => {
    onChange(medicamento.nombre)
    onSelect?.(medicamento)
    setIsOpen(false)
    clearResults()
    inputRef.current?.blur()
  }, [onChange, onSelect, clearResults])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || resultados.length === 0) {
      if (e.key === 'ArrowDown' && value.length >= 2) {
        setIsOpen(true)
        search(value)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < resultados.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : resultados.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < resultados.length) {
          handleSelect(resultados[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        clearResults()
        break
      case 'Tab':
        setIsOpen(false)
        clearResults()
        break
    }
  }, [isOpen, resultados, highlightedIndex, handleSelect, value, search, clearResults])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle focus
  const handleFocus = useCallback(() => {
    if (value.length >= 2) {
      search(value)
      setIsOpen(true)
    }
  }, [value, search])

  const showDropdown = isOpen && (resultados.length > 0 || loading || error)

  return (
    <div
      ref={containerRef}
      className='relative'
      style={{ width: `${width}rem` }}
    >
      {/* Input */}
      <div className='relative flex items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50'>
        <input
          ref={inputRef}
          type='text'
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete='off'
          aria-label='Buscar medicamento'
          aria-expanded={showDropdown ? true : undefined}
          aria-controls='medicamento-listbox'
          aria-autocomplete='list'
          className='w-full h-[3rem] bg-transparent px-[0.625rem] pr-8 text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-50 disabled:cursor-not-allowed'
        />
        <span className='absolute right-2 text-neutral-500 pointer-events-none'>
          {loading ? (
            <span className='inline-block w-4 h-4 border-2 border-neutral-300 border-t-brand-500 rounded-full animate-spin' />
          ) : (
            <KeyboardArrowDownRounded className='text-neutral-500' />
          )}
        </span>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          id='medicamento-listbox'
          role='listbox'
          className='absolute z-50 mt-1 w-full overflow-hidden rounded-[0.5rem] border border-neutral-300 bg-[rgba(248,250,251,0.98)] backdrop-blur-sm shadow-[2px_2px_8px_rgba(0,0,0,0.12)] max-h-[18rem] overflow-y-auto'
        >
          {loading && resultados.length === 0 && (
            <li className='px-3 py-3 text-body-sm text-neutral-500 text-center'>
              Buscando medicamentos...
            </li>
          )}

          {error && (
            <li className='px-3 py-3 text-body-sm text-error-600 text-center'>
              {error}
            </li>
          )}

          {!loading && !error && resultados.length === 0 && value.length >= 2 && (
            <li className='px-3 py-3 text-body-sm text-neutral-500 text-center'>
              No se encontraron medicamentos
            </li>
          )}

          {resultados.map((med, index) => (
            <li
              key={med.nregistro}
              role='option'
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(med)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={[
                'px-3 py-2 cursor-pointer transition-colors',
                index === highlightedIndex
                  ? 'bg-brand-50'
                  : 'hover:bg-neutral-100'
              ].join(' ')}
            >
              <p className='text-body-sm font-medium text-neutral-900 leading-tight'>
                {med.nombre}
              </p>
              <p className='text-label-sm text-neutral-500 mt-0.5'>
                {[
                  med.dosis,
                  med.formaFarmaceutica,
                  med.viaAdministracion
                ].filter(Boolean).join(' • ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
