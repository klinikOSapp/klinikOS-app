'use client'

type InputTextProps = {
  label?: string
  value?: string
  placeholder?: string
  description?: string
  hasLabel?: boolean
  hasDescription?: boolean
  onChange?: (value: string) => void
  multiline?: boolean
  className?: string
}

export default function InputText({
  label = 'Label',
  value,
  placeholder = 'Value',
  description = 'Texto descriptivo',
  hasLabel = false,
  hasDescription = false,
  onChange,
  multiline = false,
  className = '',
}: InputTextProps) {
  const isPlaceholder = !value

  const inputClasses = `
    w-full
    rounded-[var(--input-radius)]
    border-[var(--input-border-width)] border-solid border-[var(--input-border-color)]
    bg-[var(--input-bg)]
    px-[0.625rem] py-[0.5rem]
    font-normal text-base leading-6
    ${isPlaceholder ? 'text-[var(--input-placeholder-color)]' : 'text-[var(--input-text-color)]'}
    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50
    resize-none
  `

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {hasLabel && (
        <label className='font-normal text-[0.875rem] leading-[1.25rem] text-neutral-900'>
          {label}
        </label>
      )}
      <div className='flex flex-col gap-1'>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`${inputClasses} h-[var(--modal-create-textarea-height)]`}
            rows={3}
          />
        ) : (
          <input
            type='text'
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`${inputClasses} h-[var(--modal-create-field-height)]`}
          />
        )}
        {hasDescription && (
          <p className='font-medium text-[0.6875rem] leading-4 text-[var(--input-description-color)]'>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

