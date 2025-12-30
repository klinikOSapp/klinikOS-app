'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Periodo = 'quarter_current' | 'quarter_previous' | 'custom'
type Formato = 'csv' | 'pdf'

type Props = {
  open: boolean
  onClose: () => void
}

function formatISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

function startEndOfQuarterUTC(now: Date, quarterOffset: number) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const currentQuarter = Math.floor(m / 3)
  const targetQuarter = currentQuarter + quarterOffset
  const targetYear = y + Math.floor(targetQuarter / 4)
  const q = ((targetQuarter % 4) + 4) % 4
  const startMonth = q * 3
  const start = new Date(Date.UTC(targetYear, startMonth, 1))
  const end = new Date(Date.UTC(targetYear, startMonth + 3, 0))
  return { start, end }
}

export function CashExportModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('quarter_current')
  const [formato, setFormato] = useState<Formato>('csv')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [includeMonthly, setIncludeMonthly] = useState(true)
  const [includeMethod, setIncludeMethod] = useState(true)
  const [includeTotals, setIncludeTotals] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const now = new Date()
    const { start, end } = startEndOfQuarterUTC(now, 0)
    setDesde(formatISODate(start))
    setHasta(formatISODate(end))
    setPeriodo('quarter_current')
    setFormato('csv')
    setIncludeMonthly(true)
    setIncludeMethod(true)
    setIncludeTotals(true)
    setError(null)
  }, [open])

  const effectiveRange = useMemo(() => {
    const now = new Date()
    if (periodo === 'quarter_current') return startEndOfQuarterUTC(now, 0)
    if (periodo === 'quarter_previous') return startEndOfQuarterUTC(now, -1)
    return { start: new Date(`${desde}T00:00:00Z`), end: new Date(`${hasta}T00:00:00Z`) }
  }, [periodo, desde, hasta])

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    try {
      const res = await fetch('/api/caja/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodo,
          fecha_desde: periodo === 'custom' ? desde : undefined,
          fecha_hasta: periodo === 'custom' ? hasta : undefined,
          formato,
          incluir: {
            desglose_mensual: includeMonthly,
            desglose_metodo: includeMethod,
            totales_generales: includeTotals
          }
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Error exportando')
        setIsExporting(false)
        return
      }
      const fileName = String(data.file_name || 'caja.csv')

      if (formato === 'pdf') {
        const base64 = String(data.pdf_base64 || '')
        if (!base64) throw new Error('PDF empty')
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } else {
        const csv = String(data.csv || '')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
      setIsExporting(false)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Error exportando')
      setIsExporting(false)
    }
  }

  if (!open || !mounted) return null

  const content = (
    <div className='fixed inset-0 z-[90] bg-black/30 backdrop-blur-[1px]' onClick={onClose}>
      <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
        <div
          className='w-[min(44rem,95vw)] rounded-xl bg-neutral-0 shadow-elevation-popover overflow-hidden'
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
          aria-labelledby='export-modal-title'
        >
          <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
            <p id='export-modal-title' className='text-title-md font-medium text-fg'>
              Exportar cajas
            </p>
            <button
              type='button'
              className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              onClick={onClose}
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
            </button>
          </header>

          <div className='p-[1.25rem] space-y-[1.25rem]'>
            <div className='space-y-[0.5rem]'>
              <p className='text-body-sm text-fg'>Periodo</p>
              <div className='flex flex-col gap-[0.5rem]'>
                <label className='flex items-center gap-[0.5rem] text-body-sm text-fg'>
                  <input
                    type='radio'
                    name='periodo'
                    checked={periodo === 'quarter_current'}
                    onChange={() => setPeriodo('quarter_current')}
                  />
                  Trimestre actual
                </label>
                <label className='flex items-center gap-[0.5rem] text-body-sm text-fg'>
                  <input
                    type='radio'
                    name='periodo'
                    checked={periodo === 'quarter_previous'}
                    onChange={() => setPeriodo('quarter_previous')}
                  />
                  Trimestre anterior
                </label>
                <label className='flex items-center gap-[0.5rem] text-body-sm text-fg'>
                  <input
                    type='radio'
                    name='periodo'
                    checked={periodo === 'custom'}
                    onChange={() => setPeriodo('custom')}
                  />
                  Periodo personalizado
                </label>
              </div>
              <div className='mt-[0.5rem] flex flex-wrap gap-[0.75rem]'>
                <label className='flex items-center gap-[0.5rem] text-body-sm text-neutral-600'>
                  Desde
                  <input
                    type='date'
                    value={periodo === 'custom' ? desde : formatISODate(effectiveRange.start)}
                    onChange={(e) => setDesde(e.target.value)}
                    disabled={periodo !== 'custom'}
                    className='rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                  />
                </label>
                <label className='flex items-center gap-[0.5rem] text-body-sm text-neutral-600'>
                  Hasta
                  <input
                    type='date'
                    value={periodo === 'custom' ? hasta : formatISODate(effectiveRange.end)}
                    onChange={(e) => setHasta(e.target.value)}
                    disabled={periodo !== 'custom'}
                    className='rounded-lg border border-border bg-surface px-[0.75rem] py-[0.5rem]'
                  />
                </label>
              </div>
            </div>

            <div className='space-y-[0.5rem]'>
              <p className='text-body-sm text-fg'>Formato</p>
              <div className='flex items-center gap-[0.75rem] text-body-sm text-fg'>
                <label className='flex items-center gap-[0.5rem]'>
                  <input
                    type='radio'
                    name='formato'
                    checked={formato === 'csv'}
                    onChange={() => setFormato('csv')}
                  />
                  CSV
                </label>
                <label className='flex items-center gap-[0.5rem]'>
                  <input
                    type='radio'
                    name='formato'
                    checked={formato === 'pdf'}
                    onChange={() => setFormato('pdf')}
                  />
                  PDF
                </label>
              </div>
            </div>

            <div className='space-y-[0.5rem]'>
              <p className='text-body-sm text-fg'>Incluir</p>
              <div className='flex flex-col gap-[0.5rem] text-body-sm text-fg'>
                <label className='flex items-center gap-[0.5rem]'>
                  <input type='checkbox' checked={includeMonthly} onChange={(e) => setIncludeMonthly(e.target.checked)} />
                  Desglose mensual
                </label>
                <label className='flex items-center gap-[0.5rem]'>
                  <input type='checkbox' checked={includeMethod} onChange={(e) => setIncludeMethod(e.target.checked)} />
                  Desglose por método
                </label>
                <label className='flex items-center gap-[0.5rem]'>
                  <input type='checkbox' checked={includeTotals} onChange={(e) => setIncludeTotals(e.target.checked)} />
                  Totales generales
                </label>
              </div>
            </div>

            {error ? <div className='text-body-sm text-error-600'>{error}</div> : null}

            <div className='flex items-center justify-end gap-[0.75rem] pt-[0.5rem]'>
              <button
                type='button'
                className='rounded-full border border-border bg-neutral-0 px-[1rem] py-[0.5rem] text-title-sm text-fg hover:bg-neutral-50'
                onClick={onClose}
                disabled={isExporting}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 hover:bg-brand-400 disabled:opacity-50'
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exportando…' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

