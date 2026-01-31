'use client'

import Portal from '@/components/ui/Portal'
import React from 'react'
import type { MedicationEntry } from './PrescriptionCreationModal'

// HU-021: Updated props to support multiple medications
type PrescriptionPdfPreviewProps = {
  open: boolean
  onClose: () => void
  data?: {
    medicamento?: string
    especialista?: string
    frecuencia?: string
    duracion?: string
    administracion?: string
    // HU-021: Array of medications
    medicamentos?: MedicationEntry[]
  }
}

const CARD_WIDTH_REM = 33.1875 // 531px / 16
const CARD_HEIGHT_REM = 4.5 // 72px / 16
const PAGE_WIDTH_REM = 40 // ~640px equivalent, a bit larger for on-screen preview
const PAGE_HEIGHT_REM = 57 // scaled up to keep aspect ratio-ish while larger preview

const borderColor = '#cbd3d9'
const labelColor = '#24282c'

function MedCard({
  medicamento,
  dosis,
  frecuencia,
  duracion,
  via
}: {
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  via: string
}) {
  const itemClass =
    'flex flex-col gap-[0.5rem] text-[0.75rem] leading-[1rem] text-[#24282c]'
  return (
    <div
      className='flex items-center justify-between rounded-[0.5rem] border p-4'
      style={{
        width: `${CARD_WIDTH_REM}rem`,
        height: `${CARD_HEIGHT_REM}rem`,
        borderColor
      }}
    >
      <div className={itemClass}>
        <span className='font-medium'>Medicamento:</span>
        <span>{medicamento}</span>
      </div>
      <div className={itemClass}>
        <span className='font-medium'>Dosis:</span>
        <span>{dosis}</span>
      </div>
      <div className={itemClass}>
        <span className='font-medium'>Frecuencia:</span>
        <span>{frecuencia}</span>
      </div>
      <div className={itemClass}>
        <span className='font-medium'>Duración:</span>
        <span>{duracion}</span>
      </div>
      <div className={itemClass}>
        <span className='font-medium'>Vía administración:</span>
        <span>{via}</span>
      </div>
    </div>
  )
}

export default function PrescriptionPdfPreview({
  open,
  onClose,
  data
}: PrescriptionPdfPreviewProps) {
  // HU-021: Use medications array if available, otherwise fall back to legacy single medication
  const medications: Array<{
    medicamento: string
    frecuencia: string
    duracion: string
    administracion: string
  }> = React.useMemo(() => {
    if (data?.medicamentos && data.medicamentos.length > 0) {
      return data.medicamentos.map(m => ({
        medicamento: m.medicamento.trim() || 'Medicamento',
        frecuencia: m.frecuencia.trim() || '-',
        duracion: m.duracion.trim() || '-',
        administracion: m.administracion.trim() || 'Oral'
      }))
    }
    // Legacy: single medication
    return [{
      medicamento: data?.medicamento?.trim() || 'Antibiol',
      frecuencia: data?.frecuencia?.trim() || '3 por día',
      duracion: data?.duracion?.trim() || '7 días',
      administracion: data?.administracion?.trim() || 'Oral'
    }]
  }, [data])
  
  const dose = '500mg' // Default dose placeholder

  const cards = React.useMemo(
    () =>
      medications.map((med, index) => (
        <MedCard
          key={index}
          medicamento={med.medicamento}
          dosis={dose}
          frecuencia={med.frecuencia}
          duracion={med.duracion}
          via={med.administracion}
        />
      )),
    [medications, dose]
  )

  const buildHtml = React.useCallback(() => {
    // HU-021: Generate HTML for all medications
    const cardHtml = medications
      .map(
        (med) => `
      <div style="width:${CARD_WIDTH_REM}rem;min-height:${CARD_HEIGHT_REM}rem;border:1px solid ${borderColor};border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center;box-sizing:border-box;">
        ${[
          ['Medicamento:', med.medicamento],
          ['Dosis:', dose],
          ['Frecuencia:', med.frecuencia],
          ['Duración:', med.duracion],
          ['Vía administración:', med.administracion]
        ]
          .map(
            ([label, val]) => `
          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;line-height:16px;color:${labelColor};">
            <span style="font-weight:600;">${label}</span>
            <span>${val}</span>
          </div>`
          )
          .join('')}
      </div>`
      )
      .join(
        `<div style="height:8px;"></div>`
      )

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receta</title>
  <style>
    :root { font-family: 'Inter', sans-serif; }
    body { margin: 0; display: flex; justify-content: center; background: #f8fafb; }
    .page {
      position: relative;
      width: ${PAGE_WIDTH_REM}rem;
      height: ${PAGE_HEIGHT_REM}rem;
      background: white;
      padding: 0;
      box-sizing: border-box;
    }
    .header-right { position:absolute; right:2rem; top:2rem; text-align:right; font-size:12px; line-height:16px; color:${labelColor}; }
    .logo { position:absolute; left:2rem; top:2rem; width:14rem; height:3.8125rem; background:url('http://localhost:3845/assets/b1533c63bebb5617c3a7436a79787f7a06035220.png') center/cover no-repeat; }
    .section-top { position:absolute; left:2rem; top:7rem; width:33.1875rem; display:flex; flex-direction:column; gap:16px; font-size:12px; line-height:16px; color:${labelColor}; }
    .row { display:flex; justify-content:space-between; width:100%; }
    .row-gap { display:flex; gap:32px; }
    .cards { position:absolute; left:2rem; top:17.8125rem; display:flex; flex-direction:column; gap:8px; }
    .cards2 { top:23.3125rem; }
    .cards3 { top:28.8125rem; }
    .case { position:absolute; left:2rem; top:38.0625rem; width:33.1875rem; display:flex; flex-direction:column; gap:12px; font-size:12px; line-height:16px; color:${labelColor}; }
    .line { height:1px; background:${borderColor}; width:100%; }
  </style>
</head>
<body>
  <div class="page">
    <div class="logo"></div>
    <div class="header-right">
      <div>Clinica Tama Dental</div>
      <div>Dirección completa</div>
      <div>Teléfono de contacto</div>
    </div>
    <div class="section-top">
      <div class="row">
        <div>
          <div style="font-weight:600;">Paciente:</div>
          <div>Nombre y apellidos</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">Fecha:</div>
          <div>24/06/2025</div>
        </div>
      </div>
      <div class="row-gap">
        <div><div style="font-weight:600;">DNI:</div><div>44556677 X</div></div>
        <div><div style="font-weight:600;">Sexo:</div><div>Hombre</div></div>
        <div><div style="font-weight:600;">Edad:</div><div>45</div></div>
      </div>
    </div>
    <div class="cards">${cardHtml}</div>
    <div class="case">
      <div>
        <div style="font-weight:600;">Caso:</div>
        <div>Breve descripción del caso, (no es obligatorio rellenarlo)</div>
      </div>
      <div class="line"></div>
      <div class="row">
        <div>
          <div style="font-weight:600;">Doctor:</div>
          <div>Nombre y apellidos</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">Número colegiado:</div>
          <div>XX 895 895 895 895</div>
        </div>
      </div>
      <div>
        <div style="font-weight:600;">Firma:</div>
        <div>-</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      window.focus();
      // Intento de imprimir automático (puede ser bloqueado por el navegador)
      try { window.print(); } catch (e) {}
    };
    function handlePrint() { window.print(); }
  </script>
</body>
</html>`
  }, [medications, dose])

  React.useEffect(() => {
    if (!open) return
    const html = buildHtml()
    const newWin = window.open('', '_blank', 'noopener,noreferrer')
    if (!newWin) return
    newWin.document.write(html)
    newWin.document.close()
    newWin.focus()
  }, [buildHtml, open])

  if (!open) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4'
        onClick={onClose}
        aria-hidden
      >
      <div
        className='relative bg-white shadow-xl overflow-hidden'
        style={{
          width: `${PAGE_WIDTH_REM}rem`,
          height: `${PAGE_HEIGHT_REM}rem`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          onClick={() => {
            const html = buildHtml()
            const newWin = window.open('', '_blank', 'noopener,noreferrer')
            if (!newWin) return
            newWin.document.write(html)
            newWin.document.close()
            newWin.focus()
          }}
          className='absolute left-4 top-4 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1 text-body-sm text-neutral-900 hover:bg-brand-100'
        >
          Abrir en nueva ventana
        </button>
        <div className='absolute left-8 top-8 w-[14rem] h-[3.8125rem] bg-[url("http://localhost:3845/assets/b1533c63bebb5617c3a7436a79787f7a06035220.png")] bg-cover bg-center' />
        <div className='absolute right-8 top-8 text-right text-[0.75rem] leading-[1rem] text-[var(--color-neutral-900)]'>
          <p>Clinica Tama Dental</p>
          <p>Dirección completa</p>
          <p>Teléfono de contacto</p>
        </div>

        <div className='absolute left-8 top-28 w-[33.1875rem] flex flex-col gap-4 text-[0.75rem] leading-[1rem] text-[var(--color-neutral-900)]'>
          <div className='flex justify-between w-full'>
            <div>
              <p className='font-medium'>Paciente:</p>
              <p>Nombre y apellidos</p>
            </div>
            <div className='text-right'>
              <p className='font-medium'>Fecha:</p>
              <p>24/06/2025</p>
            </div>
          </div>
          <div className='flex gap-8'>
            <div>
              <p className='font-medium'>DNI:</p>
              <p>44556677 X</p>
            </div>
            <div>
              <p className='font-medium'>Sexo:</p>
              <p>Hombre</p>
            </div>
            <div>
              <p className='font-medium'>Edad:</p>
              <p>45</p>
            </div>
          </div>
        </div>

        {/* HU-021: Render all medication cards */}
        <div className='absolute left-8 top-[17.8125rem] flex flex-col gap-2 max-h-[18rem] overflow-y-auto'>
          {cards}
        </div>

        <div className='absolute left-8 top-[38.0625rem] w-[33.1875rem] flex flex-col gap-3 text-[0.75rem] leading-[1rem] text-[var(--color-neutral-900)]'>
          <div>
            <p className='font-medium'>Caso:</p>
            <p>Breve descripción del caso, (no es obligatorio rellenarlo)</p>
          </div>
          <div className='h-px w-full' style={{ backgroundColor: borderColor }} />
          <div className='flex justify-between'>
            <div>
              <p className='font-medium'>Doctor:</p>
              <p>Nombre y apellidos</p>
            </div>
            <div className='text-right'>
              <p className='font-medium'>Número colegiado:</p>
              <p>XX 895 895 895 895</p>
            </div>
          </div>
          <div>
            <p className='font-medium'>Firma:</p>
            <p>-</p>
          </div>
        </div>

        <button
          type='button'
          onClick={onClose}
          className='absolute top-4 right-4 text-neutral-900 text-lg'
          aria-label='Cerrar'
        >
          ×
        </button>
      </div>
      </div>
    </Portal>
  )
}

