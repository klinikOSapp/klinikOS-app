import type { VoiceAgentKPI } from './voiceAgentTypes'

type VoiceAgentKPICardProps = VoiceAgentKPI

/**
 * Voice Agent KPI Card
 * Compact version: 10.25rem × 5rem
 * Layout: Grid 2×3 with reduced gaps
 */
export default function VoiceAgentKPICard({
  label,
  value,
  changePercent,
  changeDirection,
  invertTrend,
  comparisonValue,
  comparisonLabel
}: VoiceAgentKPICardProps) {
  const isPositive = invertTrend
    ? changeDirection === 'down'
    : changeDirection === 'up'

  return (
    <div className='bg-surface rounded-lg w-[min(10.25rem,100%)] h-[min(5rem,100%)] px-2 py-2'>
      <div className='flex flex-col gap-1 w-full h-full justify-between'>
        {/* Label */}
        <p className='text-label-sm text-neutral-600 truncate'>{label}</p>

        {/* Value + Change */}
        <div className='flex flex-col w-full'>
          <div className='flex gap-1 items-baseline w-full'>
            {/* Main Value */}
            <p className='font-bold text-title-md text-neutral-600'>{value}</p>

            {/* Change Indicator */}
            <div className='flex gap-0.5 items-center'>
              <p
                className={`text-label-sm font-normal ${
                  isPositive ? 'text-brand-500' : 'text-error-600'
                }`}
              >
                {changePercent}
              </p>
              <span
                className={`material-symbols-rounded text-sm leading-none ${
                  isPositive ? 'text-brand-500' : 'text-error-600'
                }`}
              >
                {isPositive ? 'arrow_outward' : 'arrow_downward'}
              </span>
            </div>
          </div>

          {/* Comparison */}
          <p className='text-[0.5rem] leading-3 text-neutral-400'>
            <span>Vs </span>
            <span className='font-bold'>{comparisonValue}</span>
            <span> {comparisonLabel}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
