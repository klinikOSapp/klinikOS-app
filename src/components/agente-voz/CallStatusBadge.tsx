import type { CallStatus } from './voiceAgentTypes'
import { CALL_STATUS_LABELS } from './voiceAgentTypes'

type CallStatusBadgeProps = {
  status: CallStatus
}

/**
 * Call Status Badge
 * Figma colors:
 * - Nueva: brand-500 (#51d6c7) border
 * - Pendiente: warning-200 (#ffd188) border
 * - En curso: neutral-600 (#6d7783) border + animated dot
 * - Resuelta: info blue (#8fc1e5) border
 * - Urgente: error-200 (#f7b7ba) bg, error-800 (#7f1d1d) text
 */
export default function CallStatusBadge({ status }: CallStatusBadgeProps) {
  const label = CALL_STATUS_LABELS[status]

  const getStyles = (): string => {
    switch (status) {
      case 'nueva':
        return 'border border-brand-500 text-brand-500'
      case 'pendiente':
        return 'border border-warning-200 text-warning-200'
      case 'en_curso':
        return 'border border-neutral-600 text-neutral-600'
      case 'resuelta':
        return 'border border-[#8fc1e5] text-[#8fc1e5]'
      case 'urgente':
        return 'bg-error-200 text-error-800'
      default:
        return 'border border-neutral-300 text-neutral-600'
    }
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-2 px-2 py-1 rounded-[5rem] text-label-md ${getStyles()}`}
    >
      <span>{label}</span>
      {status === 'en_curso' && (
        <span className='relative flex h-2 w-2'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-600 opacity-75' />
          <span className='relative inline-flex rounded-full h-2 w-2 bg-neutral-600' />
        </span>
      )}
    </div>
  )
}
