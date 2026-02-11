'use client'

import { useClinic } from '@/context/ClinicContext'
import AddBoxOutlined from '@mui/icons-material/AddBoxOutlined'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import React from 'react'

type ClinicSwitcherProps = {
  collapsed?: boolean
}

export default function ClinicSwitcher({ collapsed = false }: ClinicSwitcherProps) {
  const { clinics, activeClinic, activeClinicId, setActiveClinicId, isInitialized } = useClinic()
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  React.useEffect(() => {
    setOpen(false)
  }, [activeClinicId])

  if (!isInitialized || !activeClinic) return null

  const alternatives = clinics.filter((clinic) => clinic.id !== activeClinic.id)

  if (collapsed) {
    return (
      <div className='px-3 mb-4'>
        <button
          type='button'
          className='w-full rounded-[12px] border border-[var(--color-brand-200)] bg-white p-2 text-[var(--color-brand-900)]'
          title={activeClinic.name}
          onClick={() => setOpen((prev) => !prev)}
        >
          <AddBoxOutlined fontSize='small' />
        </button>
      </div>
    )
  }

  return (
    <div className='px-4 pb-4 mt-auto' ref={containerRef}>
      <div className='relative'>
        <button
          type='button'
          onClick={() => setOpen((prev) => !prev)}
          className='w-full rounded-[16px] border border-[var(--color-brand-200)] bg-white px-3 py-2 text-left shadow-sm'
        >
          <div className='flex items-start gap-2'>
            <span className='pt-1 text-[var(--color-brand-900)]'>
              <AddBoxOutlined fontSize='small' />
            </span>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between gap-2'>
                <p className='truncate text-body-md font-medium text-[var(--color-neutral-900)]'>
                  {activeClinic.name}
                </p>
                <ExpandMoreRounded
                  className={[
                    'size-5 text-[var(--color-neutral-500)] transition-transform',
                    open ? 'rotate-180' : ''
                  ].join(' ')}
                />
              </div>
              <div className='mt-0.5 flex items-center gap-1 text-[var(--color-neutral-500)]'>
                <PlaceOutlined sx={{ fontSize: 14 }} />
                <p className='truncate text-label-sm'>{activeClinic.address}</p>
              </div>
            </div>
          </div>
        </button>

        {open && alternatives.length > 0 ? (
          <div className='absolute bottom-full left-0 right-0 mb-2 z-50 rounded-[14px] border border-[var(--color-brand-100)] bg-white p-2 shadow-lg'>
            <p className='px-1 text-label-sm text-[var(--color-neutral-500)]'>
              Cambiar a otra clínica
            </p>
            <div className='mt-2 max-h-[40vh] space-y-2 overflow-y-auto pr-1'>
              {alternatives.map((clinic) => (
                <button
                  key={clinic.id}
                  type='button'
                  onClick={() => setActiveClinicId(clinic.id)}
                  className='w-full rounded-[12px] border border-[var(--color-brand-100)] bg-[var(--color-brand-0)] px-3 py-2 text-left hover:bg-white'
                >
                  <div className='flex items-start gap-2'>
                    <span className='pt-1 text-[var(--color-brand-800)]'>
                      <AddBoxOutlined sx={{ fontSize: 18 }} />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-body-sm font-medium text-[var(--color-neutral-800)]'>
                        {clinic.name}
                      </p>
                      <div className='mt-0.5 flex items-center gap-1 text-[var(--color-neutral-500)]'>
                        <PlaceOutlined sx={{ fontSize: 14 }} />
                        <p className='truncate text-label-sm'>{clinic.address}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
