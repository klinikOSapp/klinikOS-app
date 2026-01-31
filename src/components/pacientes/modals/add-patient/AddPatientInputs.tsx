'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import React from 'react'
import { createPortal } from 'react-dom'

type NominatimAddress = {
  road?: string
  street?: string
  city?: string
  town?: string
  village?: string
  postcode?: string
  state?: string
  province?: string
  country?: string
  country_code?: string
}

type NominatimSuggestion = {
  place_id?: string | number
  display_name?: string
  address?: NominatimAddress
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-body-md text-[var(--color-neutral-900)]'>{children}</p>
  )
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

// Validar DNI español (8 números + 1 letra)
export function validateDNI(dni: string): { valid: boolean; error?: string } {
  if (!dni) return { valid: true } // Campo vacío es válido si no es requerido
  
  const dniRegex = /^[0-9]{8}[A-Za-z]$/
  if (!dniRegex.test(dni)) {
    return { valid: false, error: 'Formato: 8 dígitos + letra (ej: 12345678A)' }
  }
  
  // Validar letra del DNI
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const number = parseInt(dni.slice(0, 8), 10)
  const expectedLetter = letters[number % 23]
  const actualLetter = dni.slice(8).toUpperCase()
  
  if (actualLetter !== expectedLetter) {
    return { valid: false, error: 'La letra del DNI no es correcta' }
  }
  
  return { valid: true }
}

// Validar NIE español (X/Y/Z + 7 números + 1 letra)
export function validateNIE(nie: string): { valid: boolean; error?: string } {
  if (!nie) return { valid: true }
  
  const nieRegex = /^[XYZxyz][0-9]{7}[A-Za-z]$/
  if (!nieRegex.test(nie)) {
    return { valid: false, error: 'Formato: X/Y/Z + 7 dígitos + letra (ej: X1234567A)' }
  }
  
  // Validar letra del NIE
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  let nieNumber = nie.toUpperCase()
  nieNumber = nieNumber.replace('X', '0').replace('Y', '1').replace('Z', '2')
  const number = parseInt(nieNumber.slice(0, 8), 10)
  const expectedLetter = letters[number % 23]
  const actualLetter = nie.slice(8).toUpperCase()
  
  if (actualLetter !== expectedLetter) {
    return { valid: false, error: 'La letra del NIE no es correcta' }
  }
  
  return { valid: true }
}

// Validar Pasaporte (formato genérico)
export function validatePassport(passport: string): { valid: boolean; error?: string } {
  if (!passport) return { valid: true }
  
  // Mínimo 5 caracteres alfanuméricos
  const passportRegex = /^[A-Za-z0-9]{5,20}$/
  if (!passportRegex.test(passport)) {
    return { valid: false, error: 'Formato inválido (5-20 caracteres alfanuméricos)' }
  }
  
  return { valid: true }
}

// Validar documento según tipo
export function validateDocument(
  value: string, 
  type: 'DNI' | 'NIE' | 'Pasaporte' | 'Otro'
): { valid: boolean; error?: string } {
  switch (type) {
    case 'DNI':
      return validateDNI(value)
    case 'NIE':
      return validateNIE(value)
    case 'Pasaporte':
      return validatePassport(value)
    default:
      return { valid: true }
  }
}

// Validar email
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' }
  }
  
  return { valid: true }
}

// Validar teléfono español
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: true }
  
  // Eliminar espacios y guiones
  const cleanPhone = phone.replace(/[\s-]/g, '')
  
  // Teléfono español: 9 dígitos empezando por 6, 7, 8 o 9
  const phoneRegex = /^[6789][0-9]{8}$/
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Formato: 9 dígitos (ej: 612345678)' }
  }
  
  return { valid: true }
}

// Calcular edad desde fecha de nacimiento
export function calculateAgeFromDate(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Generar número de historia clínica único
export function generateMedicalRecordNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HC-${year}${month}-${random}`
}

export function TextInput({
  placeholder = 'Value',
  required,
  value,
  onChange,
  error,
  onBlur,
  type = 'text'
}: {
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (v: string) => void
  error?: string
  onBlur?: () => void
  type?: 'text' | 'email' | 'tel'
}) {
  const hasError = !!error
  
  return (
    <div className='relative flex flex-col gap-1'>
      <div className='relative'>
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border px-2.5 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none transition-colors ${
            hasError 
              ? 'border-[var(--color-error-500)] focus:border-[var(--color-error-600)]' 
              : 'border-[var(--color-neutral-300)] focus:border-[var(--color-brand-500)]'
          }`}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
        />
        {required && !hasError && (
          <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-error-600)] text-body-md leading-none'>
            *
          </span>
        )}
        {hasError && (
          <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-error-500)]'>
            <MD3Icon name='ErrorRounded' size='sm' />
          </span>
        )}
      </div>
      {hasError && (
        <span className='text-label-sm text-[var(--color-error-600)]'>
          {error}
        </span>
      )}
    </div>
  )
}

export function SelectInput({
  placeholder = 'Value',
  value,
  onChange,
  options,
  onCreate,
  createLabel = 'Crear',
  createLabelFromInput
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  options?: { label: string; value: string }[]
  onCreate?: (inputValue?: string) => void
  createLabel?: string
  createLabelFromInput?: (inputValue: string) => string
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = React.useState<string>('')

  React.useEffect(() => {
    const selectedOption = options?.find((opt) => opt.value === value)
    setInputValue(selectedOption?.label ?? '')
  }, [options, value])

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  const filteredOptions =
    options?.filter((opt) =>
      inputValue
        ? opt.label.toLowerCase().includes(inputValue.toLowerCase())
        : true
    ) ?? []

  return (
    <div className='relative' ref={containerRef}>
      <div className='relative flex h-12 items-center rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5'>
        <input
          type='text'
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className='w-full bg-transparent pr-6 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
        />
        <button
          type='button'
          aria-label='Abrir selección'
          onClick={() => setIsOpen((prev) => !prev)}
          className='absolute right-2 flex items-center justify-center text-[var(--color-neutral-700)]'
        >
          <MD3Icon
            name='KeyboardArrowDownRounded'
            size='sm'
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className='absolute z-50 w-full mt-1 bg-[rgba(248,250,251,0.95)] backdrop-blur-[2px] rounded-[0.5rem] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] border border-[var(--color-neutral-300)] py-2 max-h-60 overflow-y-auto'
          style={{ backdropFilter: 'blur(2px)' }}
        >
          {filteredOptions.length === 0 && (
            <div className='px-2 py-1 text-body-md text-[var(--color-neutral-500)]'>
              Sin resultados
            </div>
          )}
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() => {
                onChange?.(opt.value)
                setInputValue(opt.label)
                setIsOpen(false)
              }}
              className={`w-full px-2 py-1 text-left text-body-md font-medium text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-50)] transition-colors ${
                opt.value === value ? 'bg-[var(--color-brand-50)]' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
          {filteredOptions.length === 0 && onCreate && (
            <div className='px-2 pt-2'>
              <button
                type='button'
                onClick={() => {
                  onCreate(inputValue)
                  setIsOpen(false)
                }}
                className='w-full rounded-[0.5rem] bg-[var(--color-brand-50)] px-3 py-2 text-left text-body-md font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-100)]'
              >
                {createLabelFromInput
                  ? createLabelFromInput(inputValue)
                  : createLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TextArea({
  placeholder = 'Value',
  value,
  onChange
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className='relative'>
      <textarea
        placeholder={placeholder}
        className='w-full h-20 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 py-2 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none resize-none'
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  )
}

export function AutocompleteInput({
  placeholder = 'Value',
  required,
  value,
  onChange,
  onSelect
}: {
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (v: string) => void
  onSelect?: (suggestion: {
    display: string
    street: string
    city: string
    postcode: string
    province: string
    country: string
    countryCode: string
  }) => void
}) {
  const [suggestions, setSuggestions] = React.useState<NominatimSuggestion[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null)

  // Cerrar sugerencias al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [showSuggestions])

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Usando Nominatim de OpenStreetMap
      // Limitar búsqueda a España añadiendo 'countrycodes=es'
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `countrycodes=es&` +
          `limit=5`,
        {
          headers: {
            'User-Agent': 'klinikOS-App/1.0' // Nominatim requiere User-Agent
          }
        }
      )
      const data = (await response.json()) as NominatimSuggestion[]
      setSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (newValue: string) => {
    onChange?.(newValue)

    // Debounce la búsqueda para no hacer demasiadas peticiones
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      searchAddress(newValue)
    }, 300) // Esperar 300ms después de que el usuario deje de escribir
  }

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    const address = suggestion.address || {}
    const street = address.road || address.street || ''
    const city = address.city || address.town || address.village || ''
    const postcode = address.postcode || ''
    const province = address.state || address.province || ''
    const country = address.country || ''
    const countryCode = address.country_code || ''

    const displayText = suggestion.display_name || street

    onChange?.(displayText)
    onSelect?.({
      display: displayText,
      street,
      city,
      postcode,
      province,
      country,
      countryCode
    })

    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className='relative' ref={containerRef}>
      <input
        placeholder={placeholder}
        className='w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        autoComplete='off'
      />
      {required && (
        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-error-600)] text-body-md leading-none'>
          *
        </span>
      )}
      {isLoading && (
        <span className='absolute right-10 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] text-body-sm'>
          Buscando...
        </span>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          className='absolute z-50 w-full mt-1 bg-[rgba(248,250,251,0.95)] backdrop-blur-[2px] rounded-[0.5rem] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)] border border-[var(--color-neutral-300)] py-2 max-h-60 overflow-y-auto'
          style={{ backdropFilter: 'blur(2px)' }}
        >
          {suggestions.map((suggestion, index) => {
            const address = suggestion.address || {}
            const street = address.road || address.street || ''
            const city = address.city || address.town || address.village || ''
            const province = address.state || address.province || ''
            const postcode = address.postcode || ''

            return (
              <button
                key={suggestion.place_id || index}
                type='button'
                onClick={() => handleSelectSuggestion(suggestion)}
                className='w-full px-3 py-2 text-left hover:bg-[var(--color-brand-50)] transition-colors'
              >
                <div className='text-body-md font-medium text-[var(--color-neutral-900)]'>
                  {street}
                </div>
                <div className='text-body-sm text-[var(--color-neutral-600)]'>
                  {postcode && `${postcode} `}
                  {city && `${city}`}
                  {city && province && ', '}
                  {province}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ToggleInput({
  checked,
  defaultChecked = true,
  onChange,
  ariaLabel
}: {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  ariaLabel?: string
}) {
  const isControlled = typeof checked === 'boolean'
  const [internal, setInternal] = React.useState(defaultChecked)
  const isOn = isControlled ? (checked as boolean) : internal
  const toggle = () => {
    const next = !isOn
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }
  return (
    <button
      type='button'
      role='switch'
      aria-checked={isOn}
      aria-label={ariaLabel}
      onClick={toggle}
      className={`w-10 h-6 rounded-[70px] relative shrink-0 transition-colors duration-150 ${
        isOn ? 'bg-[var(--color-brand-500)]' : 'bg-[var(--color-neutral-300)]'
      }`}
    >
      <span
        className={`absolute top-[3px] size-[18px] rounded-full transition-[left] duration-150 ${
          isOn
            ? 'left-[19px] bg-[var(--color-brand-50)]'
            : 'left-[3px] bg-[var(--color-neutral-50)]'
        }`}
      />
    </button>
  )
}

export function DatePickerInput({
  value,
  onChange
}: {
  value?: Date | null
  onChange?: (d: Date) => void
}) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const dateFieldRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ?? null
  )
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null)
  const today = React.useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = React.useState<number>(today.getMonth())
  const [viewYear, setViewYear] = React.useState<number>(today.getFullYear())
  const [popoverPos, setPopoverPos] = React.useState<{
    left: number
    top: number
  } | null>(null)
  const [scale, setScale] = React.useState(1)
  const [showMonthMenu, setShowMonthMenu] = React.useState(false)
  const [showYearMenu, setShowYearMenu] = React.useState(false)

  // Estados para inputs de día, mes, año
  const [dayInput, setDayInput] = React.useState('')
  const [monthInput, setMonthInput] = React.useState('')
  const [yearInput, setYearInput] = React.useState('')
  const dayRef = React.useRef<HTMLInputElement>(null)
  const monthRef = React.useRef<HTMLInputElement>(null)
  const yearRef = React.useRef<HTMLInputElement>(null)

  // Sync internal state when external value prop changes
  React.useEffect(() => {
    setSelectedDate(value ?? null)
  }, [value])

  // Actualizar inputs cuando cambia selectedDate
  React.useEffect(() => {
    if (selectedDate) {
      setDayInput(String(selectedDate.getDate()).padStart(2, '0'))
      setMonthInput(String(selectedDate.getMonth() + 1).padStart(2, '0'))
      setYearInput(String(selectedDate.getFullYear()))
    } else {
      setDayInput('')
      setMonthInput('')
      setYearInput('')
    }
  }, [selectedDate])

  // Función para validar y actualizar la fecha
  const updateDateFromInputs = React.useCallback(
    (d: string, m: string, y: string) => {
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const day = parseInt(d, 10)
        const month = parseInt(m, 10)
        const year = parseInt(y, 10)
        if (
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 1900 &&
          year <= 2100
        ) {
          const newDate = new Date(year, month - 1, day)
          if (newDate.getDate() === day && newDate.getMonth() === month - 1) {
            setSelectedDate(newDate)
            onChange?.(newDate)
          }
        }
      }
    },
    [onChange]
  )

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    setDayInput(val)
    if (val.length === 2) {
      monthRef.current?.focus()
      monthRef.current?.select()
    }
    updateDateFromInputs(val, monthInput, yearInput)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMonthInput(val)
    if (val.length === 2) {
      yearRef.current?.focus()
      yearRef.current?.select()
    }
    updateDateFromInputs(dayInput, val, yearInput)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYearInput(val)
    updateDateFromInputs(dayInput, monthInput, val)
  }

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && dayInput.length === 0) {
      e.preventDefault()
    }
  }

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && monthInput.length === 0) {
      e.preventDefault()
      dayRef.current?.focus()
    }
  }

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && yearInput.length === 0) {
      e.preventDefault()
      monthRef.current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const match = pastedText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (match) {
      const [, d, m, y] = match
      const day = d.padStart(2, '0')
      const month = m.padStart(2, '0')
      const year = y.length === 2 ? `20${y}` : y
      setDayInput(day)
      setMonthInput(month)
      setYearInput(year)
      updateDateFromInputs(day, month, year)
    }
  }

  const remToPx = React.useCallback((rem: number) => {
    const root = getComputedStyle(document.documentElement).fontSize
    const base = parseFloat(root || '16') || 16
    return rem * base
  }, [])

  React.useEffect(() => {
    const updatePosition = () => {
      if (!dateFieldRef.current) return
      const rect = dateFieldRef.current.getBoundingClientRect()
      const margin = 8
      const baseWpx = remToPx(22.5)
      const baseHpx = remToPx(28.75)
      const maxWFrac = 0.4
      const maxHFrac = 0.6
      const s = Math.min(
        1,
        (window.innerWidth * maxWFrac) / baseWpx,
        (window.innerHeight * maxHFrac) / baseHpx
      )
      setScale(s)
      const scaledW = baseWpx * s
      const scaledH = baseHpx * s
      let left = rect.left + window.scrollX
      let top = rect.bottom + window.scrollY + 4
      const maxLeft = window.scrollX + window.innerWidth - scaledW - margin
      const maxTop = window.scrollY + window.innerHeight - scaledH - margin
      left = Math.max(window.scrollX + margin, Math.min(left, maxLeft))
      top = Math.max(window.scrollY + margin, Math.min(top, maxTop))
      setPopoverPos({ left, top })
    }
    if (calendarOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
    return undefined
  }, [calendarOpen, remToPx])

  React.useEffect(() => {
    if (calendarOpen) {
      const base = selectedDate ?? new Date()
      setPendingDate(selectedDate ?? null)
      setViewMonth(base.getMonth())
      setViewYear(base.getFullYear())
    }
  }, [calendarOpen, selectedDate])

  const monthLabels = React.useMemo(
    () => [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ],
    []
  )
  function formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  function buildMonthMatrix(year: number, month: number) {
    const first = new Date(year, month, 1)
    const startDow = first.getDay()
    const start = new Date(year, month, 1 - startDow)
    const weeks: { date: Date; inMonth: boolean }[][] = []
    for (let r = 0; r < 6; r++) {
      const row: { date: Date; inMonth: boolean }[] = []
      for (let c = 0; c < 7; c++) {
        const d = new Date(start)
        d.setDate(start.getDate() + (r * 7 + c))
        row.push({ date: d, inMonth: d.getMonth() === month })
      }
      weeks.push(row)
    }
    return weeks
  }
  const weeks = React.useMemo(() => {
    const allWeeks = buildMonthMatrix(viewYear, viewMonth)
    const last = allWeeks[allWeeks.length - 1]
    if (last && last.every((c) => !c.inMonth)) {
      return allWeeks.slice(0, allWeeks.length - 1)
    }
    return allWeeks
  }, [viewYear, viewMonth])
  const prevMonth = () => setViewMonth((m) => (m > 0 ? m - 1 : 11))
  const nextMonth = () => setViewMonth((m) => (m < 11 ? m + 1 : 0))
  const prevYear = () => setViewYear((y) => y - 1)
  const nextYear = () => setViewYear((y) => y + 1)

  return (
    <div className='self-stretch flex flex-col justify-start items-start gap-1'>
      <div
        ref={dateFieldRef}
        className='relative self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'
      >
        <div className='flex items-center gap-1 text-body-md font-sans'>
          <input
            ref={dayRef}
            type='text'
            value={dayInput}
            onChange={handleDayChange}
            onKeyDown={handleDayKeyDown}
            onPaste={handlePaste}
            placeholder='DD'
            maxLength={2}
            className='w-8 bg-transparent outline-none text-center text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)]'
          />
          <span className='text-[var(--color-neutral-400)]'>/</span>
          <input
            ref={monthRef}
            type='text'
            value={monthInput}
            onChange={handleMonthChange}
            onKeyDown={handleMonthKeyDown}
            placeholder='MM'
            maxLength={2}
            className='w-8 bg-transparent outline-none text-center text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)]'
          />
          <span className='text-[var(--color-neutral-400)]'>/</span>
          <input
            ref={yearRef}
            type='text'
            value={yearInput}
            onChange={handleYearChange}
            onKeyDown={handleYearKeyDown}
            placeholder='AAAA'
            maxLength={4}
            className='w-16 bg-transparent outline-none text-center text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)]'
          />
        </div>
        <button
          type='button'
          aria-label='Abrir calendario'
          onClick={() => setCalendarOpen((v) => !v)}
          className='p-1 rounded hover:bg-[var(--color-neutral-100)]'
        >
          <MD3Icon name='CalendarMonthRounded' size='md' />
        </button>
        {calendarOpen &&
          popoverPos &&
          createPortal(
            <div
              ref={calendarRef}
              className='fixed z-[10000] w-[22.5rem] bg-[var(--color-surface-popover,#fff)] rounded-[1rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden'
              style={{
                left: popoverPos.left,
                top: popoverPos.top,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
              <div className='w-full h-16 px-2 flex items-center justify-between'>
                <div className='flex items-center gap-0'>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center'
                    onClick={prevMonth}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <MD3Icon
                        name='ChevronLeftRounded'
                        size='lg'
                        className='text-[var(--color-neutral-900)]'
                      />
                    </div>
                  </button>
                  <div className='relative ml-1'>
                    <button
                      type='button'
                      className='box-border flex items-center gap-2 overflow-clip pl-2 pr-1 py-2 rounded-[100px] h-10 hover:bg-[var(--color-neutral-50)]'
                      onClick={() => {
                        setShowMonthMenu((v) => !v)
                        setShowYearMenu(false)
                      }}
                    >
                      <span className='text-body-sm font-medium text-[var(--color-neutral-700)]'>
                        {monthLabels[viewMonth]}
                      </span>
                      <MD3Icon
                        name='KeyboardArrowDownRounded'
                        size='md'
                        className='text-[var(--color-neutral-700)]'
                      />
                    </button>
                    {showMonthMenu && (
                      <div className='absolute left-0 top-[calc(100%+4px)] z-10 w-32 max-h-60 overflow-auto bg-[var(--color-surface-popover)] rounded-[0.75rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'>
                        {monthLabels.map((m, idx) => (
                          <button
                            key={m}
                            type='button'
                            className={`w-full px-3 py-2 text-left text-body-sm ${
                              idx === viewMonth
                                ? 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)]'
                                : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                            }`}
                            onClick={() => {
                              setViewMonth(idx)
                              setShowMonthMenu(false)
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center ml-1'
                    onClick={nextMonth}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <MD3Icon
                        name='ChevronRightRounded'
                        size='lg'
                        className='text-[var(--color-neutral-900)]'
                      />
                    </div>
                  </button>
                </div>
                <div className='flex items-center gap-0'>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center'
                    onClick={prevYear}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <MD3Icon
                        name='ChevronLeftRounded'
                        size='lg'
                        className='text-[var(--color-neutral-900)]'
                      />
                    </div>
                  </button>
                  <div className='relative ml-1'>
                    <button
                      type='button'
                      className='box-border flex items-center gap-2 overflow-clip pl-2 pr-1 py-2 rounded-[100px] h-10 hover:bg-[var(--color-neutral-50)]'
                      onClick={() => {
                        setShowYearMenu((v) => !v)
                        setShowMonthMenu(false)
                      }}
                    >
                      <span className='text-body-sm font-medium text-[var(--color-neutral-700)]'>
                        {viewYear}
                      </span>
                      <MD3Icon
                        name='KeyboardArrowDownRounded'
                        size='md'
                        className='text-[var(--color-neutral-700)]'
                      />
                    </button>
                    {showYearMenu && (
                      <div className='absolute left-0 top-[calc(100%+4px)] z-10 w-28 max-h-60 overflow-auto bg-[var(--color-surface-popover)] rounded-[0.75rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'>
                        {Array.from({ length: 121 }).map((_, i) => {
                          const y = viewYear - 60 + i
                          return (
                            <button
                              key={y}
                              type='button'
                              className={`w-full px-3 py-2 text-left text-body-sm ${
                                y === viewYear
                                  ? 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)]'
                                  : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                              }`}
                              onClick={() => {
                                setViewYear(y)
                                setShowYearMenu(false)
                              }}
                            >
                              {y}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center ml-1'
                    onClick={nextYear}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <MD3Icon
                        name='ChevronRightRounded'
                        size='lg'
                        className='text-[var(--color-neutral-900)]'
                      />
                    </div>
                  </button>
                </div>
              </div>
              <div className='w-full px-3 pt-2'>
                <div className='w-[21rem] mx-auto h-12 grid grid-cols-7 text-center text-[var(--color-neutral-700)] text-body-sm items-center'>
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div
                  className={`w-[21rem] mx-auto grid ${
                    weeks.length === 5 ? 'grid-rows-5' : 'grid-rows-6'
                  } gap-y-0`}
                >
                  {weeks.map((row, rIdx) => (
                    <div key={`row-${rIdx}`} className='grid grid-cols-7'>
                      {row.map(({ date, inMonth }, cIdx) => {
                        const isSelected =
                          pendingDate &&
                          date.getFullYear() === pendingDate.getFullYear() &&
                          date.getMonth() === pendingDate.getMonth() &&
                          date.getDate() === pendingDate.getDate()
                        const base =
                          'w-10 h-10 grid place-items-center rounded text-body-sm'
                        const muted =
                          'text-[var(--color-neutral-700)] opacity-40'
                        const normal = 'text-[var(--color-neutral-900)]'
                        const selected =
                          'bg-[var(--color-brand-500)] text-[var(--color-neutral-50)]'
                        return (
                          <button
                            key={`cell-${rIdx}-${cIdx}`}
                            type='button'
                            className={`${base} ${
                              isSelected
                                ? selected
                                : inMonth
                                ? `${normal} hover:bg-[var(--color-neutral-50)]`
                                : muted
                            }`}
                            onClick={() => setPendingDate(new Date(date))}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className='w-full h-14 px-3 flex items-center justify-end gap-4'>
                <button
                  type='button'
                  className='h-12 px-4 text-[var(--color-brand-500)] text-body-sm font-medium rounded hover:bg-[var(--color-neutral-50)]'
                  onClick={() => setCalendarOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  className='h-12 px-4 text-[var(--color-brand-500)] text-body-sm font-medium rounded hover:bg-[var(--color-neutral-50)]'
                  onClick={() => {
                    if (pendingDate) {
                      setSelectedDate(pendingDate)
                      onChange?.(pendingDate)
                    }
                    setCalendarOpen(false)
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}
