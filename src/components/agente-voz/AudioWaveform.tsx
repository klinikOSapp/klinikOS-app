'use client'

import { useState } from 'react'

type AudioWaveformProps = {
  /** Duration in format "MM:SS" */
  duration?: string
  /** Optional callback when play button is clicked */
  onPlay?: () => void
  /** Optional: Whether the audio is currently playing */
  isPlaying?: boolean
  /** Optional: Custom class name for the container */
  className?: string
}

// Waveform bar heights matching Figma's pattern (scaled down for compactness)
const WAVEFORM_HEIGHTS = [
  2, 6, 10, 3, 12, 10, 8, 8, 8, 8, 10, 8, 12, 8, 12, 12, 12, 8, 8, 12, 12, 8,
  12, 12, 12, 8, 3, 3, 2
]

/**
 * AudioWaveform Component
 * Visual audio player with waveform visualization
 */
export default function AudioWaveform({
  duration = '0:05',
  onPlay,
  isPlaying: controlledIsPlaying,
  className = ''
}: AudioWaveformProps) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1x')

  // Use controlled or internal state
  const isPlaying = controlledIsPlaying ?? internalIsPlaying

  const handlePlay = () => {
    if (onPlay) {
      onPlay()
    } else {
      setInternalIsPlaying(!internalIsPlaying)
    }
  }

  const cycleSpeed = () => {
    setPlaybackSpeed((current) => {
      if (current === '1x') return '1.5x'
      if (current === '1.5x') return '2x'
      return '1x'
    })
  }

  return (
    <div
      className={`flex items-center gap-2 bg-neutral-100 rounded-full px-2 py-1.5 ${className}`}
    >
      {/* Play/Pause button */}
      <button
        type='button'
        onClick={handlePlay}
        className='w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 hover:bg-neutral-50 transition-colors shadow-sm'
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        <span className='material-symbols-rounded text-base text-neutral-700'>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Speed indicator */}
      <button
        type='button'
        onClick={cycleSpeed}
        className='w-8 h-6 bg-brand-100 rounded-md flex items-center justify-center shrink-0 hover:bg-brand-200 transition-colors'
        aria-label={`Velocidad: ${playbackSpeed}`}
      >
        <span className='text-xs font-semibold text-brand-700'>
          {playbackSpeed}
        </span>
      </button>

      {/* Waveform visualization */}
      <div className='flex items-center gap-0.5 h-6 flex-1 overflow-hidden'>
        {WAVEFORM_HEIGHTS.map((height, index) => (
          <div
            key={index}
            className={`w-0.5 rounded-full shrink-0 transition-colors ${
              isPlaying ? 'bg-brand-500' : 'bg-neutral-400'
            }`}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* Timestamp */}
      <span className='text-xs font-medium text-neutral-600 shrink-0 tabular-nums min-w-[2rem] text-right'>
        {duration}
      </span>

      {/* Volume control */}
      <button
        type='button'
        className='w-6 h-6 flex items-center justify-center shrink-0 hover:bg-neutral-200 rounded-full transition-colors'
        aria-label='Volumen'
      >
        <span className='material-symbols-rounded text-base text-neutral-500'>
          volume_up
        </span>
      </button>
    </div>
  )
}
