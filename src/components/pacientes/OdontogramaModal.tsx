'use client'

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import React from 'react'
import { createPortal } from 'react-dom'
import {
  MODAL_HEIGHT_REM,
  MODAL_SCALE_FORMULA,
  MODAL_WIDTH_REM
} from './modalDimensions'

const DEFAULT_SELECTED_TEETH = new Set([21, 15, 16, 17, 27, 47, 46, 35])

type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

type ToothConfig = {
  id: number
  x: number
  y: number
  size: number
  labelPosition: LabelPosition
}

function pxToRem(value: number) {
  return `${value / 16}rem`
}

const ARCADA_HALF_WIDTH_PX = 170.5
const ARCADA_HALF_WIDTH_REM = `${ARCADA_HALF_WIDTH_PX / 16}rem`
const ARCADA_HEIGHT_PX = 277
const ARCADA_HEIGHT_REM = `${ARCADA_HEIGHT_PX / 16}rem`

const upperTeeth: ToothConfig[] = [
  { id: 11, x: 131, y: 0, size: 32, labelPosition: 'top' },
  { id: 21, x: 178, y: 0, size: 32, labelPosition: 'top' },
  { id: 12, x: 98, y: 8, size: 32, labelPosition: 'top' },
  { id: 22, x: 211, y: 8, size: 32, labelPosition: 'top' },
  { id: 13, x: 47, y: 47, size: 32, labelPosition: 'left' },
  { id: 23, x: 241, y: 47, size: 32, labelPosition: 'right' },
  { id: 14, x: 31, y: 76, size: 32, labelPosition: 'left' },
  { id: 24, x: 258, y: 76, size: 32, labelPosition: 'right' },
  { id: 15, x: 24, y: 110, size: 32, labelPosition: 'left' },
  { id: 25, x: 265, y: 110, size: 32, labelPosition: 'right' },
  { id: 16, x: 15, y: 147, size: 40, labelPosition: 'left' },
  { id: 26, x: 266, y: 147, size: 40, labelPosition: 'right' },
  { id: 17, x: 6, y: 192, size: 40, labelPosition: 'left' },
  { id: 27, x: 275, y: 192, size: 40, labelPosition: 'right' },
  { id: 18, x: 0, y: 237, size: 40, labelPosition: 'left' },
  { id: 28, x: 281, y: 237, size: 40, labelPosition: 'right' }
]

const lowerTeeth: ToothConfig[] = [
  { id: 31, x: 131, y: 221, size: 32, labelPosition: 'bottom' },
  { id: 41, x: 178, y: 221, size: 32, labelPosition: 'bottom' },
  { id: 32, x: 98, y: 213, size: 32, labelPosition: 'bottom' },
  { id: 42, x: 211, y: 213, size: 32, labelPosition: 'bottom' },
  { id: 33, x: 43, y: 198, size: 32, labelPosition: 'left' },
  { id: 43, x: 241, y: 198, size: 32, labelPosition: 'right' },
  { id: 34, x: 27, y: 169, size: 32, labelPosition: 'left' },
  { id: 44, x: 258, y: 169, size: 32, labelPosition: 'right' },
  { id: 35, x: 22, y: 135, size: 32, labelPosition: 'left' },
  { id: 45, x: 265, y: 135, size: 32, labelPosition: 'right' },
  { id: 36, x: 15, y: 90, size: 40, labelPosition: 'left' },
  { id: 46, x: 266, y: 90, size: 40, labelPosition: 'right' },
  { id: 37, x: 6, y: 45, size: 40, labelPosition: 'left' },
  { id: 47, x: 275, y: 45, size: 40, labelPosition: 'right' },
  { id: 38, x: 0, y: 0, size: 40, labelPosition: 'left' },
  { id: 48, x: 281, y: 0, size: 40, labelPosition: 'right' }
]

const upperLeftIds = new Set([11, 12, 13, 14, 15, 16, 17, 18])
const upperRightIds = new Set([21, 22, 23, 24, 25, 26, 27, 28])

const lowerLeftIds = new Set([31, 32, 33, 34, 35, 36, 37, 38])
const lowerRightIds = new Set([41, 42, 43, 44, 45, 46, 47, 48])

type ToothRenderConfig = ToothConfig & {
  selected: boolean
  onToggle: (id: number) => void
}

function Tooth({
  id,
  x,
  y,
  size,
  labelPosition,
  selected,
  onToggle
}: ToothRenderConfig) {
  const labelBase = 'absolute text-title-sm'

  let labelStyle: React.CSSProperties = {}
  if (labelPosition === 'top') {
    labelStyle = {
      bottom: 'calc(100% + 0.25rem)',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  } else if (labelPosition === 'bottom') {
    labelStyle = {
      top: 'calc(100% + 0.25rem)',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  } else if (labelPosition === 'left') {
    labelStyle = {
      right: 'calc(100% + 0.25rem)',
      top: '50%',
      transform: 'translateY(-50%)',
      textAlign: 'right'
    }
  } else {
    labelStyle = {
      left: 'calc(100% + 0.25rem)',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }

  const circleClasses = [
    'absolute inset-0 rounded-full border-[0.125rem] transition-colors duration-150',
    selected
      ? 'border-brand-500 bg-brand-500/10'
      : 'border-neutral-400 bg-transparent'
  ].join(' ')

  return (
    <div
      className='absolute'
      style={{
        left: pxToRem(x),
        top: pxToRem(y),
        width: pxToRem(size),
        height: pxToRem(size)
      }}
    >
      <button
        type='button'
        aria-pressed={selected}
        aria-label={`Seleccionar diente ${id}`}
        onClick={() => onToggle(id)}
        className='relative size-full rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
      >
        <div className='relative size-full'>
          <span className={circleClasses} />
          <span
            className={`${labelBase} ${
              selected ? 'text-brand-500' : 'text-neutral-600'
            }`}
            style={labelStyle}
          >
            {id}
          </span>
        </div>
      </button>
    </div>
  )
}

const arcadaQuadrants: Array<{
  key: string
  teeth: ToothConfig[]
  offsetX: number
  leftPx: number
  topPx: number
}> = [
  {
    key: 'upper-left',
    teeth: upperTeeth.filter((tooth) => upperLeftIds.has(tooth.id)),
    offsetX: 0,
    leftPx: 81,
    topPx: 33
  },
  {
    key: 'upper-right',
    teeth: upperTeeth.filter((tooth) => upperRightIds.has(tooth.id)),
    offsetX: ARCADA_HALF_WIDTH_PX,
    leftPx: 81 + ARCADA_HALF_WIDTH_PX,
    topPx: 33
  },
  {
    key: 'lower-left',
    teeth: lowerTeeth.filter((tooth) => lowerLeftIds.has(tooth.id)),
    offsetX: 0,
    leftPx: 80,
    topPx: 349
  },
  {
    key: 'lower-right',
    teeth: lowerTeeth.filter((tooth) => lowerRightIds.has(tooth.id)),
    offsetX: ARCADA_HALF_WIDTH_PX,
    leftPx: 80 + ARCADA_HALF_WIDTH_PX,
    topPx: 349
  }
]

type OdontogramaModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
}

export default function OdontogramaModal({
  open,
  onClose,
  onContinue
}: OdontogramaModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedTeeth, setSelectedTeeth] = React.useState<Set<number>>(
    () => new Set(DEFAULT_SELECTED_TEETH)
  )

  const toggleTooth = React.useCallback((toothId: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev)
      if (next.has(toothId)) {
        next.delete(toothId)
      } else {
        next.add(toothId)
      }
      return next
    })
  }, [])

  const selectedTeethList = React.useMemo(
    () => Array.from(selectedTeeth).sort((a, b) => a - b),
    [selectedTeeth]
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open || !mounted) return null

  const content = (
    <div
      className='fixed inset-0 z-[70] bg-neutral-900/40'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center px-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Odontograma'
          className='relative overflow-hidden rounded-[0.5rem] bg-neutral-50'
          style={{
            width: `calc(${MODAL_WIDTH_REM}rem * ${MODAL_SCALE_FORMULA})`,
            height: `calc(${MODAL_HEIGHT_REM}rem * ${MODAL_SCALE_FORMULA})`
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative bg-neutral-50'
            style={{
              width: `${MODAL_WIDTH_REM}rem`,
              height: `${MODAL_HEIGHT_REM}rem`,
              transform: `scale(${MODAL_SCALE_FORMULA})`,
              transformOrigin: 'top left'
            }}
          >
            <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 px-[2rem]'>
              <p className='text-title-md text-neutral-900'>Odontograma</p>
              <button
                type='button'
                onClick={onClose}
                aria-label='Cerrar odontograma'
                className='flex size-[0.875rem] items-center justify-center text-neutral-900'
              >
                <CloseRounded fontSize='inherit' />
              </button>
            </header>

            <div className='absolute left-[2rem] top-[5.5rem] h-[41.625rem] w-[31.5rem]'>
              <div className='absolute left-[13.6875rem] top-0 flex h-full w-[4.0625rem] flex-col items-center'>
                <p className='text-title-sm text-neutral-900 mb-[1.5625rem]'>
                  Superior
                </p>
                <div className='relative mt-[5.96875rem] flex-1'>
                  <div
                    className='absolute left-1/2 top-[0.0625rem] h-[26.6875rem] -translate-x-1/2 bg-neutral-300'
                    style={{ width: '0.0625rem' }}
                  />
                </div>
                <p className='text-title-sm text-neutral-900'>Inferior</p>
              </div>
              <div className='absolute left-0 top-[20rem] flex w-full items-center justify-between'>
                <p className='text-title-sm text-neutral-900'>Izquierda</p>
                <div className='h-[0.0625rem] w-[20.0625rem] bg-neutral-300' />
                <p className='text-title-sm text-neutral-900'>Derecha</p>
              </div>
              {arcadaQuadrants.map((quadrant) => (
                <div
                  key={quadrant.key}
                  className='absolute'
                  style={{
                    left: pxToRem(quadrant.leftPx),
                    top: pxToRem(quadrant.topPx),
                    width: ARCADA_HALF_WIDTH_REM,
                    height: ARCADA_HEIGHT_REM
                  }}
                >
                  <div className='relative size-full'>
                    {quadrant.teeth.map((tooth) => (
                      <Tooth
                        key={`${quadrant.key}-${tooth.id}`}
                        {...tooth}
                        x={tooth.x - quadrant.offsetX}
                        selected={selectedTeeth.has(tooth.id)}
                        onToggle={toggleTooth}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className='absolute left-[34.75rem] top-[5.5rem] text-title-md text-neutral-900'>
              Diente(s) seleccionado:
            </p>

            <div className='absolute left-[34.75rem] top-[8.25rem] flex h-[5.625rem] w-[31.5rem] flex-wrap content-start gap-[0.5rem] overflow-y-auto pr-[0.25rem]'>
              {selectedTeethList.length === 0 ? (
                <p className='text-label-sm text-neutral-500'>
                  No hay dientes seleccionados.
                </p>
              ) : (
                selectedTeethList.map((toothId) => (
                  <div key={toothId} className='flex items-center gap-[0.5rem]'>
                    <span className='block size-[1rem] rounded-full bg-brand-500' />
                    <p className='text-label-sm text-neutral-900'>
                      Diente #{toothId}
                    </p>
                  </div>
                ))
              )}
            </div>

            <label className='absolute left-[34.75rem] top-[13.875rem] flex w-[31.5rem] flex-col gap-[0.5rem] text-body-sm text-neutral-900'>
              Observaciones
              <div className='border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem]'>
                <textarea
                  className='h-[5rem] w-full resize-none bg-transparent text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
                  placeholder='Value'
                />
              </div>
              <span className='text-label-sm text-neutral-600'>
                Texto descriptivo
              </span>
            </label>

            <button
              type='button'
              onClick={onContinue}
              className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
            >
              Continuar
              <ArrowForwardRounded className='size-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
