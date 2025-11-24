'use client'

type SelectFieldProps = {
  label?: string
  value?: string
  placeholder?: string
  description?: string
  hasLabel?: boolean
  hasDescription?: boolean
  onChange?: (value: string) => void
  options?: { value: string; label: string }[]
  className?: string
}

export default function SelectField({
  label = 'Label',
  value,
  placeholder = 'Value',
  description = 'Texto descriptivo',
  hasLabel = false,
  hasDescription = false,
  onChange,
  options = [],
  className = '',
}: SelectFieldProps) {
  const displayValue = value || placeholder
  const isPlaceholder = !value

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {hasLabel && (
        <label className='font-normal text-[0.875rem] leading-[1.25rem] text-neutral-900'>
          {label}
        </label>
      )}
      <div className='flex flex-col gap-1'>
        <div className='relative h-[var(--modal-create-field-height)] w-full'>
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`
              h-full w-full appearance-none
              rounded-[var(--input-radius)]
              border-[var(--input-border-width)] border-solid border-[var(--input-border-color)]
              bg-[var(--input-bg)]
              px-[0.625rem] py-[0.5rem]
              pr-8
              font-normal text-base leading-6
              ${isPlaceholder ? 'text-[var(--input-placeholder-color)]' : 'text-[var(--input-text-color)]'}
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50
              cursor-pointer
            `}
          >
            <option value='' disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-neutral-600'>
              keyboard_arrow_down
            </span>
          </div>
        </div>
        {hasDescription && (
          <p className='font-medium text-[0.6875rem] leading-4 text-[var(--input-description-color)]'>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

