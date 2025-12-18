type DateNavigatorProps = {
  dateLabel?: string
  onPrevious?: () => void
  onNext?: () => void
}

export default function DateNavigator({
  dateLabel = '13 - 19, oct 2025',
  onPrevious,
  onNext
}: DateNavigatorProps) {
  // Expand the center pill dynamically so longer week ranges don't feel cramped
  const dynamicCenterWidthRem = Math.min(
    18, // hard cap to avoid oversizing
    Math.max(12, (dateLabel?.length ?? 0) * 0.6) // base width driven by label length
  )
  const centerWidthStyle = {
    width: `min(${dynamicCenterWidthRem}rem, 80vw)`,
    minWidth: 'var(--nav-chip-width-center)'
  }

  return (
    <div className='inline-flex overflow-hidden rounded-full border border-border bg-surface-app'>
      {/* Botón Anterior */}
      <button
        onClick={onPrevious}
        className='
          flex items-center justify-center
          h-[var(--nav-chip-height)]
          px-[var(--nav-chip-pad-x)]
          transition-colors
          hover:bg-surface
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0
        '
        style={{ width: 'var(--nav-chip-width-side)' }}
        aria-label='Período anterior'
      >
        <span className='material-symbols-rounded text-fg'>
          arrow_back_ios_new
        </span>
      </button>

      {/* Botón Central - Fecha */}
      <div
        className='
          flex items-center justify-center
          border-x border-border
          h-[var(--nav-chip-height)]
          px-[var(--nav-chip-pad-x)]
        '
        style={centerWidthStyle}
      >
        <span className='text-title-sm font-medium text-fg text-center whitespace-nowrap'>
          {dateLabel}
        </span>
      </div>

      {/* Botón Siguiente */}
      <button
        onClick={onNext}
        className='
          flex items-center justify-center
          h-[var(--nav-chip-height)]
          px-[var(--nav-chip-pad-x)]
          transition-colors
          hover:bg-surface
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0
        '
        style={{ width: 'var(--nav-chip-width-side)' }}
        aria-label='Período siguiente'
      >
        <span className='material-symbols-rounded text-fg'>
          arrow_forward_ios
        </span>
      </button>
    </div>
  )
}
