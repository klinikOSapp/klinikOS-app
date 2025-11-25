import React from 'react'

type SelectorCardLine = {
  icon?: React.ReactNode
  text: React.ReactNode
}

type SelectorCardProps = {
  title: string
  lines?: SelectorCardLine[]
  selected?: boolean
  onClick?: () => void
  className?: string
  variant?: 'default' | 'hold'
  tone?: 'default' | 'success' | 'info' | 'danger'
}

export default function SelectorCard({
  title,
  lines = [],
  selected = false,
  onClick,
  className,
  variant = 'default',
  tone = 'default'
}: SelectorCardProps) {
  const borderClass = React.useMemo(() => {
    if (variant === 'hold') {
      return selected
        ? 'border border-amber-500 bg-amber-50/70 shadow-[0_0_0_2px_rgba(251,191,36,0.35)]'
        : 'border border-dashed border-amber-300 bg-amber-50/50'
    }
    if (selected) {
      return 'border border-brand-500 shadow-[0_0_0_2px_rgba(81,214,199,0.2)]'
    }
    if (tone === 'success') return 'border border-emerald-200 bg-emerald-50/70'
    if (tone === 'info') return 'border border-sky-200 bg-sky-50/70'
    if (tone === 'danger') return 'border border-rose-200 bg-rose-50/70'
    return 'border border-neutral-200'
  }, [selected, variant, tone])
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'bg-white box-border content-stretch flex w-full flex-col items-start rounded-lg px-4 py-2 text-left',
        'gap-4 outline-none transition-shadow',
        borderClass,
        'focus-visible:ring-2 focus-visible:ring-brand-200',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      data-node-id='selector-card'
    >
      <div className='content-stretch flex w-full flex-col items-start gap-2'>
        <p className='w-full text-title-sm text-neutral-900'>{title}</p>
        {lines.length > 0 && (
          <div className='content-stretch flex w-full flex-col items-start gap-[6px]'>
            {lines.map((line, idx) => (
              <div key={idx} className='content-stretch flex items-center gap-2 w-full'>
                {line.icon ? (
                  <span aria-hidden className='shrink-0 size-6 flex items-center justify-center'>
                    {line.icon}
                  </span>
                ) : null}
                <div className='shrink-0 whitespace-pre text-body-sm text-neutral-700'>{line.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}


