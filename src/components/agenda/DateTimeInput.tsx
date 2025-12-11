'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

type DateTimeInputProps = {
  label?: string
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  type?: 'date' | 'time'
  className?: string
}

export default function DateTimeInput({
  label = 'Label',
  value,
  placeholder = 'Seleccionar',
  onChange,
  type = 'date',
  className = ''
}: DateTimeInputProps) {
  const isPlaceholder = !value
  const iconName = type === 'date' ? 'calendar_month' : 'schedule'

  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`
          h-[var(--modal-create-field-height)] w-full
          rounded-[var(--input-radius)]
          border-[var(--input-border-width)] border-solid border-[var(--input-border-color)]
          bg-[var(--input-bg)]
          px-[0.625rem] py-[0.5rem]
          pr-10
          font-normal text-base leading-6
          ${
            isPlaceholder
              ? 'text-[var(--input-placeholder-color)]'
              : 'text-[var(--input-text-color)]'
          }
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50
          cursor-pointer
        `}
      />
      <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
        <span className='material-symbols-rounded text-2xl text-neutral-400'>
          {iconName}
        </span>
      </div>
    </div>
  )
}
