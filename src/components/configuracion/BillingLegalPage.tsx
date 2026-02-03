'use client'

import {
  AddRounded,
  FilterAltRounded,
  SearchRounded
} from '@/components/icons/md3'
import { useCallback, useMemo, useState } from 'react'
import TemplateEditorModal, {
  type DocumentTemplate
} from './TemplateEditorModal'

// Default template content for each document type
const DEFAULT_TEMPLATES: Record<string, string> = {
  factura: `
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; color: #1E4947; margin: 0;">FACTURA</h1>
      <p style="color: #535C66; margin: 4px 0 0 0;">Nº {{documento.numero}}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <p style="font-weight: bold; color: #1E4947;">{{clinica.nombre}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.nif}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.telefono}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">Datos del paciente</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">Nombre: {{paciente.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">DNI: {{paciente.dni}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">Dirección: {{paciente.direccion}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #1E4947; color: white;">
          <th style="padding: 12px; text-align: left;">Concepto</th>
          <th style="padding: 12px; text-align: right;">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px;">{{tratamiento.nombre}}</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="text-align: right; margin-bottom: 32px;">
      <p style="font-size: 18px; font-weight: bold; color: #1E4947;">Total: {{presupuesto.total}}</p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center; color: #535C66; font-size: 12px;">
      <p>{{clinica.nombre}} • {{clinica.email}} • {{clinica.web}}</p>
    </div>
  `,
  receta: `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div>
        <h1 style="font-size: 20px; color: #1E4947; margin: 0;">RECETA MÉDICA</h1>
        <p style="color: #535C66; font-size: 13px; margin: 4px 0 0 0;">{{clinica.nombre}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
        <p style="color: #535C66; font-size: 13px;">Nº: {{documento.numero}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Paciente</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Sexo</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.sexo}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Edad</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.edad}} años</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 16px 0; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Prescripción</h2>
      
      <div style="background: #F0FDF4; border-left: 4px solid #22C55E; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
        <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">{{receta.medicamento}}</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px;">
          <div>
            <span style="color: #6B7280;">Dosis:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.dosis}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Frecuencia:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.frecuencia}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Duración:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.duracion}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Vía:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.via}}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: #92400E; font-size: 13px; margin: 0;"><strong>Notas del caso:</strong> {{receta.notas}}</p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; display: flex; justify-content: space-between;">
      <div>
        <p style="color: #6B7280; font-size: 12px; margin: 0;">Doctor/a</p>
        <p style="color: #24282C; font-weight: bold; margin: 4px 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 13px; margin: 2px 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 13px; margin: 2px 0;">Nº Colegiado: {{profesional.num_colegiado}}</p>
      </div>
      <div style="text-align: center;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0;">Firma</p>
        <div style="width: 150px; height: 60px; border-bottom: 1px solid #24282C;"></div>
      </div>
    </div>
  `,
  presupuesto: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; color: #1E4947; margin: 0;">PRESUPUESTO</h1>
      <p style="color: #535C66; margin: 4px 0 0 0;">Nº {{documento.numero}}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <p style="font-weight: bold; color: #1E4947; font-size: 16px;">{{clinica.nombre}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">Tel: {{clinica.telefono}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
        <p style="color: #535C66; font-size: 13px;">Validez: {{presupuesto.validez}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">Datos del paciente</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">{{paciente.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">DNI: {{paciente.dni}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #1E4947; color: white;">
          <th style="padding: 12px; text-align: left;">Pieza</th>
          <th style="padding: 12px; text-align: left;">Tratamiento</th>
          <th style="padding: 12px; text-align: right;">Precio</th>
          <th style="padding: 12px; text-align: right;">Dto.</th>
          <th style="padding: 12px; text-align: right;">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px;">{{tratamiento.pieza}}</td>
          <td style="padding: 12px;">{{tratamiento.nombre}}</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
          <td style="padding: 12px; text-align: right;">-</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
      <div style="width: 250px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
          <span style="color: #535C66;">Subtotal:</span>
          <span style="color: #24282C;">{{presupuesto.subtotal}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
          <span style="color: #535C66;">Descuento:</span>
          <span style="color: #22C55E;">-{{presupuesto.descuento}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold;">
          <span style="color: #1E4947;">TOTAL:</span>
          <span style="color: #1E4947;">{{presupuesto.total}}</span>
        </div>
      </div>
    </div>
    
    <div style="background: #FEF3C7; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: #92400E; font-size: 12px; margin: 0;">
        * Este presupuesto tiene una validez de {{presupuesto.validez}}. Los precios pueden variar sin previo aviso.
      </p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center; color: #535C66; font-size: 12px;">
      <p>{{clinica.nombre}} • {{clinica.email}} • {{clinica.web}}</p>
    </div>
  `,
  consentimiento: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">CONSENTIMIENTO INFORMADO</h1>
      <p style="color: #535C66; font-size: 14px; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Yo, <strong>{{paciente.nombre}}</strong>, con DNI <strong>{{paciente.dni}}</strong>, 
        declaro que he sido informado/a de manera clara, comprensible y satisfactoria sobre 
        el procedimiento que se me va a realizar, sus beneficios, riesgos y alternativas.
      </p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 12px 0;">Procedimiento</h2>
      <p style="color: #535C66; line-height: 1.6; margin: 0;">
        {{tratamiento.nombre}}: {{tratamiento.descripcion}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 12px 0;">Declaraciones</h2>
      <ul style="color: #535C66; line-height: 2; padding-left: 20px;">
        <li>He comprendido la información proporcionada sobre el procedimiento.</li>
        <li>He tenido la oportunidad de realizar las preguntas que he considerado necesarias.</li>
        <li>Todas mis dudas han sido resueltas satisfactoriamente.</li>
        <li>Entiendo que puedo revocar este consentimiento en cualquier momento.</li>
        <li>Autorizo la realización del procedimiento descrito.</li>
      </ul>
    </div>
    
    <div style="margin-bottom: 32px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        He leído y comprendido este documento de consentimiento informado y acepto 
        voluntariamente someterme al procedimiento indicado.
      </p>
    </div>
    
    <div style="display: flex; justify-content: space-between; padding-top: 24px; border-top: 1px solid #E5E7EB;">
      <div style="text-align: center; width: 45%;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del paciente</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{paciente.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">DNI: {{paciente.dni}}</p>
      </div>
      <div style="text-align: center; width: 45%;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del profesional</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <p style="color: #535C66; font-size: 12px;">En {{clinica.direccion}}, a {{documento.fecha}}</p>
    </div>
  `,
  justificante: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">JUSTIFICANTE DE ASISTENCIA</h1>
      <p style="color: #535C66; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Se hace constar que <strong>{{paciente.nombre}}</strong>, con DNI <strong>{{paciente.dni}}</strong>, 
        ha acudido a nuestra clínica el día <strong>{{documento.fecha}}</strong> para recibir atención médica.
      </p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Paciente</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Fecha de asistencia</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{documento.fecha}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Motivo</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{tratamiento.nombre}}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 32px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Y para que conste a los efectos oportunos, se expide el presente justificante 
        en {{clinica.direccion}}, a {{documento.fecha}}.
      </p>
    </div>
    
    <div style="display: flex; justify-content: flex-end; padding-top: 24px; border-top: 1px solid #E5E7EB;">
      <div style="text-align: center; width: 250px;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma y sello</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 2px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
    
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; text-align: center;">
      <p style="color: #535C66; font-size: 12px; margin: 0;">{{clinica.nombre}} • {{clinica.direccion}}</p>
      <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">Tel: {{clinica.telefono}} • {{clinica.email}}</p>
    </div>
  `,
  informe: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">INFORME CLÍNICO</h1>
      <p style="color: #535C66; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0 0 0;">Nº Informe: {{documento.numero}}</p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase;">Datos del paciente</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Nombre completo</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Fecha de nacimiento</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.fecha_nacimiento}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Edad</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.edad}} años</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Motivo de consulta</h2>
      <p style="color: #535C66; line-height: 1.8;">
        {{tratamiento.descripcion}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Exploración clínica</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Describir hallazgos de la exploración]
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Diagnóstico</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Indicar diagnóstico]
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Plan de tratamiento</h2>
      <p style="color: #535C66; line-height: 1.8;">
        {{tratamiento.nombre}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Recomendaciones</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Indicar recomendaciones al paciente]
      </p>
    </div>
    
    <div style="display: flex; justify-content: space-between; padding-top: 24px; border-top: 1px solid #E5E7EB; margin-top: 32px;">
      <div>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">{{documento.fecha}}</p>
      </div>
      <div style="text-align: center; width: 200px;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del profesional</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 2px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
  `
}

// Initial templates
const initialTemplates: DocumentTemplate[] = [
  {
    id: 'd1',
    title: 'Facturas',
    type: 'factura',
    content: DEFAULT_TEMPLATES.factura,
    isDefault: true
  },
  {
    id: 'd2',
    title: 'Recetas',
    type: 'receta',
    content: DEFAULT_TEMPLATES.receta,
    isDefault: true
  },
  {
    id: 'd3',
    title: 'Presupuestos',
    type: 'presupuesto',
    content: DEFAULT_TEMPLATES.presupuesto,
    isDefault: true
  },
  {
    id: 'd4',
    title: 'Justificantes de asistencia',
    type: 'justificante',
    content: DEFAULT_TEMPLATES.justificante,
    isDefault: true
  },
  {
    id: 'd5',
    title: 'Consentimiento Protección de datos (RGPD)',
    type: 'consentimiento',
    content: DEFAULT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd6',
    title: 'Consentimiento Tratamiento con sedación',
    type: 'consentimiento',
    content: DEFAULT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd7',
    title: 'Consentimiento Extracción dental',
    type: 'consentimiento',
    content: DEFAULT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd8',
    title: 'Informes clínicos',
    type: 'informe',
    content: DEFAULT_TEMPLATES.informe,
    isDefault: true
  }
]

// Type labels in Spanish
const TYPE_LABELS: Record<DocumentTemplate['type'], string> = {
  factura: 'Factura',
  receta: 'Receta',
  presupuesto: 'Presupuesto',
  justificante: 'Justificante',
  consentimiento: 'Consentimiento',
  informe: 'Informe'
}

// Document card component with miniature preview
function DocumentCard({
  template,
  onEdit
}: {
  template: DocumentTemplate
  onEdit: () => void
}) {
  return (
    <div className='w-[min(22rem,100%)] bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-4'>
        <div className='flex-1 min-w-0 mr-3'>
          <p className='text-body-md font-medium text-[var(--color-neutral-900)] truncate'>
            {template.title}
          </p>
          <span className='inline-flex items-center px-2 py-0.5 mt-1 rounded text-label-sm bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'>
            {TYPE_LABELS[template.type]}
          </span>
        </div>
        <button
          type='button'
          onClick={onEdit}
          className='flex items-center justify-center px-3 py-1.5 rounded-2xl border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer flex-shrink-0'
        >
          <span className='text-body-sm font-medium text-[var(--color-brand-700)]'>
            Editar
          </span>
        </button>
      </div>

      {/* Document Preview - scaled down for miniature effect */}
      <div className='flex-1 bg-[var(--color-neutral-50)] p-3 overflow-hidden'>
        <div
          className='bg-white border border-neutral-200 rounded shadow-sm p-4 h-[min(20rem,35vh)] overflow-hidden origin-top-left scale-[0.45]'
          style={{ width: '220%' }}
        >
          <div
            className='prose prose-sm max-w-none'
            style={{ fontSize: '12px', lineHeight: '1.4' }}
            dangerouslySetInnerHTML={{
              __html: template.content.replace(
                /\{\{[^}]+\}\}/g,
                '<span style="background:#E0F2FE;color:#0369A1;padding:1px 4px;border-radius:2px;font-size:10px;">···</span>'
              )
            }}
          />
        </div>
      </div>

      {/* Footer with last modified */}
      {template.lastModified && (
        <div className='px-4 py-2 border-t border-neutral-100 bg-neutral-50'>
          <p className='text-label-sm text-[var(--color-neutral-500)]'>
            Modificado:{' '}
            {new Date(template.lastModified).toLocaleDateString('es-ES')}
          </p>
        </div>
      )}
    </div>
  )
}

// Filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'receta', label: 'Recetas' },
  { value: 'presupuesto', label: 'Presupuestos' },
  { value: 'justificante', label: 'Justificantes' },
  { value: 'consentimiento', label: 'Consentimientos' },
  { value: 'informe', label: 'Informes' }
]

export default function BillingLegalPage() {
  const [templates, setTemplates] =
    useState<DocumentTemplate[]>(initialTemplates)
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocType, setNewDocType] =
    useState<DocumentTemplate['type']>('consentimiento')

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter((t) => t.type === filter)
    }

    // Apply search
    const term = search.trim().toLowerCase()
    if (term) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          TYPE_LABELS[t.type].toLowerCase().includes(term)
      )
    }

    return result
  }, [templates, filter, search])

  // Edit handler
  const handleEdit = useCallback((template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setShowEditor(true)
  }, [])

  // Save handler
  const handleSave = useCallback((updatedTemplate: DocumentTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    )
    setShowEditor(false)
    setSelectedTemplate(null)
  }, [])

  // Reset handler
  const handleReset = useCallback(
    (templateId: string) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id === templateId) {
            return {
              ...t,
              content: DEFAULT_TEMPLATES[t.type],
              logoUrl: undefined,
              logoPosition: undefined,
              lastModified: undefined
            }
          }
          return t
        })
      )
      // Update selected template if it's the one being reset
      setSelectedTemplate((prev) => {
        if (prev && prev.id === templateId) {
          const template = templates.find((t) => t.id === templateId)
          if (template) {
            return {
              ...template,
              content: DEFAULT_TEMPLATES[template.type],
              logoUrl: undefined,
              logoPosition: undefined,
              lastModified: undefined
            }
          }
        }
        return prev
      })
    },
    [templates]
  )

  // Create new document handler
  const handleCreateDocument = useCallback(() => {
    if (!newDocTitle.trim()) return

    const newTemplate: DocumentTemplate = {
      id: `d${Date.now()}`,
      title: newDocTitle.trim(),
      type: newDocType,
      content: DEFAULT_TEMPLATES[newDocType],
      isDefault: false,
      lastModified: new Date().toISOString()
    }

    setTemplates((prev) => [...prev, newTemplate])
    setShowNewDocumentModal(false)
    setNewDocTitle('')
    setNewDocType('consentimiento')

    // Open editor for the new template
    setSelectedTemplate(newTemplate)
    setShowEditor(true)
  }, [newDocTitle, newDocType])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-headline-sm font-normal text-[var(--color-neutral-900)]'>
          Plantillas de documentos
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={() => setShowNewDocumentModal(true)}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Nuevo documento
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none px-[min(2rem,3vw)] py-[min(1rem,1.5vh)] border-b border-neutral-100'>
            <div className='flex items-center justify-between gap-4'>
              <p className='text-label-sm text-[var(--color-neutral-500)]'>
                {filteredTemplates.length} plantilla
                {filteredTemplates.length !== 1 ? 's' : ''}
              </p>
              <div className='flex items-center gap-3'>
                {/* Search */}
                <div className='relative'>
                  <SearchRounded className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[var(--color-neutral-400)]' />
                  <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Buscar plantilla...'
                    className='h-9 pl-10 pr-4 rounded-lg border border-neutral-300 text-body-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] w-[min(16rem,40vw)]'
                  />
                </div>

                {/* Filter */}
                <div className='relative'>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className='h-9 pl-3 pr-8 rounded-lg border border-neutral-300 text-body-sm text-[var(--color-neutral-700)] bg-white cursor-pointer appearance-none'
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FilterAltRounded className='absolute right-2 top-1/2 -translate-y-1/2 size-5 text-[var(--color-neutral-500)] pointer-events-none' />
                </div>
              </div>
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className='flex-1 overflow-auto p-[min(2rem,3vw)]'>
            {filteredTemplates.length > 0 ? (
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'>
                {filteredTemplates.map((template) => (
                  <DocumentCard
                    key={template.id}
                    template={template}
                    onEdit={() => handleEdit(template)}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-full py-16'>
                <div className='w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4'>
                  <svg
                    className='size-8 text-neutral-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <p className='text-body-md text-[var(--color-neutral-600)] mb-1'>
                  No se encontraron plantillas
                </p>
                <p className='text-body-sm text-[var(--color-neutral-400)]'>
                  Prueba con otros términos de búsqueda o filtros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={showEditor}
        onClose={() => {
          setShowEditor(false)
          setSelectedTemplate(null)
        }}
        template={selectedTemplate}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* New Document Modal */}
      {showNewDocumentModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
          onClick={() => setShowNewDocumentModal(false)}
        >
          <div
            className='w-[min(28rem,95vw)] bg-white rounded-xl shadow-xl overflow-hidden'
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-labelledby='new-doc-title'
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
              <h2
                id='new-doc-title'
                className='text-title-lg font-medium text-[var(--color-neutral-900)]'
              >
                Nueva plantilla de documento
              </h2>
              <button
                type='button'
                onClick={() => setShowNewDocumentModal(false)}
                className='text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] cursor-pointer'
                aria-label='Cerrar'
              >
                ✕
              </button>
            </div>
            <div className='p-6 space-y-4'>
              <div>
                <label
                  htmlFor='doc-title'
                  className='block text-body-sm font-medium text-[var(--color-neutral-700)] mb-2'
                >
                  Nombre del documento
                </label>
                <input
                  id='doc-title'
                  type='text'
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder='Ej: Consentimiento para ortodoncia'
                  className='w-full h-11 px-3 rounded-lg border border-neutral-300 text-body-md text-[var(--color-neutral-900)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]'
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor='doc-type'
                  className='block text-body-sm font-medium text-[var(--color-neutral-700)] mb-2'
                >
                  Tipo de documento
                </label>
                <select
                  id='doc-type'
                  value={newDocType}
                  onChange={(e) =>
                    setNewDocType(e.target.value as DocumentTemplate['type'])
                  }
                  className='w-full h-11 px-3 rounded-lg border border-neutral-300 text-body-md text-[var(--color-neutral-700)] bg-white cursor-pointer'
                >
                  <option value='factura'>Factura</option>
                  <option value='receta'>Receta</option>
                  <option value='presupuesto'>Presupuesto</option>
                  <option value='justificante'>Justificante</option>
                  <option value='consentimiento'>Consentimiento</option>
                  <option value='informe'>Informe</option>
                </select>
              </div>
            </div>
            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
              <button
                type='button'
                onClick={() => setShowNewDocumentModal(false)}
                className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleCreateDocument}
                disabled={!newDocTitle.trim()}
                className='px-4 py-2 text-body-md font-medium text-white bg-[var(--color-brand-500)] rounded-lg hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer'
              >
                Crear y editar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
