'use client'

import {
  CheckCircleRounded,
  CloseRounded,
  DownloadRounded,
  PrintRounded
} from '@/components/icons/md3'
import { useConfiguration } from '@/context/ConfigurationContext'
import type { PaymentMethod, Receipt } from '@/types/payments'
import { formatPaymentMethod } from '@/types/payments'
import { useRef } from 'react'
import { createPortal } from 'react-dom'

type ReceiptPreviewModalProps = {
  open: boolean
  onClose: () => void
  receipt: Receipt | null
  // Si no hay recibo, se pueden pasar datos para generar uno
  transactionData?: {
    patientName: string
    concept: string
    amount: number
    paymentMethod: PaymentMethod
    paymentReference?: string
    date: string
  }
  onGenerateReceipt?: () => void // Callback cuando se genera el recibo
}

export default function ReceiptPreviewModal({
  open,
  onClose,
  receipt,
  transactionData,
  onGenerateReceipt
}: ReceiptPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Get clinic data from configuration context
  const { clinicInfo } = useConfiguration()

  if (!open) return null

  // Build full clinic address from configuration
  const fullClinicAddress = [
    clinicInfo.direccion,
    clinicInfo.poblacion,
    clinicInfo.codigoPostal
  ]
    .filter(Boolean)
    .join(', ')

  // Use receipt data if available, otherwise use transactionData with clinic info from context
  const displayData = receipt || {
    receiptNumber: 'Pendiente de generar',
    date: transactionData?.date || new Date().toISOString(),
    patientName: transactionData?.patientName || '',
    concept: transactionData?.concept || '',
    amount: transactionData?.amount || 0,
    paymentMethod: transactionData?.paymentMethod || 'efectivo',
    paymentReference: transactionData?.paymentReference,
    clinicName: clinicInfo.nombreComercial || 'Clínica Dental',
    clinicNIF: clinicInfo.cif || '',
    clinicAddress: fullClinicAddress
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handlePrint = () => {
    // Save receipt first if not already saved
    if (!receipt && onGenerateReceipt) {
      onGenerateReceipt()
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${displayData.receiptNumber}</title>
          <style>
            @page {
              size: A5;
              margin: 1.5cm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #1a1a1a;
              margin: 0;
              padding: 20px;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 2px solid #e5e5e5;
              border-radius: 8px;
              padding: 24px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #d4d4d4;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .clinic-name {
              font-size: 18px;
              font-weight: 700;
              color: #0d9488;
              margin-bottom: 4px;
            }
            .clinic-info {
              font-size: 11px;
              color: #737373;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: 600;
              text-align: center;
              margin: 16px 0;
              padding: 8px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .receipt-number {
              font-family: monospace;
              font-size: 14px;
              color: #0d9488;
            }
            .section {
              margin: 16px 0;
            }
            .label {
              font-size: 11px;
              color: #737373;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 14px;
              color: #1a1a1a;
            }
            .amount-section {
              text-align: center;
              padding: 20px;
              background: #f0fdfa;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-label {
              font-size: 12px;
              color: #737373;
              margin-bottom: 8px;
            }
            .amount-value {
              font-size: 28px;
              font-weight: 700;
              color: #0d9488;
            }
            .footer {
              text-align: center;
              border-top: 1px dashed #d4d4d4;
              padding-top: 16px;
              margin-top: 16px;
              font-size: 11px;
              color: #737373;
            }
            .paid-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background: #d1fae5;
              color: #047857;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="clinic-name">${
                displayData.clinicName ||
                clinicInfo.nombreComercial ||
                'Clínica Dental'
              }</div>
              <div class="clinic-info">NIF: ${
                displayData.clinicNIF || clinicInfo.cif || ''
              }</div>
              <div class="clinic-info">${
                displayData.clinicAddress || fullClinicAddress
              }</div>
            </div>
            
            <div class="receipt-title">
              RECIBO DE PAGO
              <div class="receipt-number">${displayData.receiptNumber}</div>
            </div>
            
            <div class="section">
              <div class="label">Fecha</div>
              <div class="value">${formatDate(displayData.date)}</div>
            </div>
            
            <div class="section">
              <div class="label">Paciente</div>
              <div class="value">${displayData.patientName}</div>
            </div>
            
            <div class="section">
              <div class="label">Concepto</div>
              <div class="value">${displayData.concept}</div>
            </div>
            
            <div class="section">
              <div class="label">Método de pago</div>
              <div class="value">${formatPaymentMethod(
                displayData.paymentMethod as PaymentMethod
              )}</div>
            </div>
            
            ${
              displayData.paymentReference
                ? `
              <div class="section">
                <div class="label">Referencia</div>
                <div class="value" style="font-family: monospace;">${displayData.paymentReference}</div>
              </div>
            `
                : ''
            }
            
            <div class="amount-section">
              <div class="amount-label">IMPORTE PAGADO</div>
              <div class="amount-value">${formatAmount(
                displayData.amount
              )} €</div>
              <div class="paid-badge" style="margin-top: 12px;">
                ✓ PAGADO
              </div>
            </div>
            
            <div class="footer">
              <p>Gracias por confiar en nosotros</p>
              <p>Este recibo es un comprobante de pago</p>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownload = () => {
    // Save receipt first if not already saved
    if (!receipt && onGenerateReceipt) {
      onGenerateReceipt()
    }

    // Trigger print dialog which allows saving as PDF
    handlePrint()
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-neutral-900/90' onClick={onClose} />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[36rem] max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-6 border-b border-neutral-300 flex-shrink-0'>
          <h2 className='text-title-md text-neutral-900'>
            Vista previa del recibo
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        {/* Content - Receipt Preview */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div
            ref={printRef}
            className='bg-white border-2 border-neutral-200 rounded-xl p-6 max-w-sm mx-auto'
          >
            {/* Clinic Header */}
            <div className='text-center border-b border-dashed border-neutral-300 pb-4 mb-4'>
              <h3 className='text-lg font-bold text-brand-600'>
                {displayData.clinicName ||
                  clinicInfo.nombreComercial ||
                  'Clínica Dental'}
              </h3>
              <p className='text-xs text-neutral-500'>
                NIF: {displayData.clinicNIF || clinicInfo.cif || ''}
              </p>
              <p className='text-xs text-neutral-500'>
                {displayData.clinicAddress || fullClinicAddress}
              </p>
            </div>

            {/* Receipt Title */}
            <div className='text-center bg-neutral-100 rounded-lg py-2 px-4 mb-4'>
              <p className='text-base font-semibold text-neutral-900'>
                RECIBO DE PAGO
              </p>
              <p className='text-sm font-mono text-brand-600'>
                {displayData.receiptNumber}
              </p>
            </div>

            {/* Receipt Details */}
            <div className='space-y-3 mb-4'>
              <div>
                <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                  Fecha
                </p>
                <p className='text-sm text-neutral-900'>
                  {formatDate(displayData.date)}
                </p>
              </div>
              <div>
                <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                  Paciente
                </p>
                <p className='text-sm text-neutral-900'>
                  {displayData.patientName}
                </p>
              </div>
              <div>
                <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                  Concepto
                </p>
                <p className='text-sm text-neutral-900'>
                  {displayData.concept}
                </p>
              </div>
              <div>
                <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                  Método de pago
                </p>
                <p className='text-sm text-neutral-900'>
                  {formatPaymentMethod(
                    displayData.paymentMethod as PaymentMethod
                  )}
                </p>
              </div>
              {displayData.paymentReference && (
                <div>
                  <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                    Referencia
                  </p>
                  <p className='text-sm text-neutral-900 font-mono'>
                    {displayData.paymentReference}
                  </p>
                </div>
              )}
            </div>

            {/* Amount Section */}
            <div className='text-center bg-brand-50 rounded-lg py-5 px-4 mb-4'>
              <p className='text-xs text-neutral-500 uppercase tracking-wide mb-2'>
                Importe pagado
              </p>
              <p className='text-3xl font-bold text-brand-700'>
                {formatAmount(displayData.amount)} €
              </p>
              <div className='inline-flex items-center gap-1 mt-3 bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm font-medium'>
                <CheckCircleRounded className='size-4' />
                PAGADO
              </div>
            </div>

            {/* Footer */}
            <div className='text-center border-t border-dashed border-neutral-300 pt-4'>
              <p className='text-xs text-neutral-500'>
                Gracias por confiar en nosotros
              </p>
              <p className='text-xs text-neutral-400'>
                Este recibo es un comprobante de pago
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className='flex justify-between items-center px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex-shrink-0'>
          {/* Action buttons */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handlePrint}
              className='flex items-center gap-2 px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer'
            >
              <PrintRounded className='size-5' />
              Imprimir
            </button>
            <button
              type='button'
              onClick={handleDownload}
              className='flex items-center gap-2 px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer'
            >
              <DownloadRounded className='size-5' />
              Descargar PDF
            </button>
          </div>

          {/* Close button */}
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
