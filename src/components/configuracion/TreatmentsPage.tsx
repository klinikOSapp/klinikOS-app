'use client'

import {
    AddRounded,
    CheckBoxOutlineBlankRounded,
    CheckBoxRounded,
    CloseRounded,
    FilterAltRounded,
    SearchRounded
} from '@/components/icons/md3'
import { useCallback, useMemo, useState } from 'react'

// ============================================
// TYPES
// ============================================

type Treatment = {
  id: string
  name: string
  code: string
  basePrice: number
  estimatedTime: string
  iva: string
  selected: boolean
}

type Category = {
  id: string
  name: string
  treatments: Treatment[]
}

type TabKey = 'treatments' | 'budgetType' | 'discounts' | 'medications'

// ============================================
// DATA
// ============================================

// ============================================
// MOCK DATA - Ready for database connection
// Structure: id (uuid), code (unique), name, basePrice (cents recommended for DB),
// estimatedTime (minutes for DB), iva (percentage), categoryId (FK)
// ============================================

const initialCategories: Category[] = [
  {
    id: 'cirugia',
    name: 'Cirugía',
    treatments: [
      { id: 'cir-001', code: 'CIR001', name: 'Extracción simple', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-002', code: 'CIR002', name: 'Extracción compleja', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-003', code: 'CIR003', name: 'Extracción de cordal incluido', basePrice: 250, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-004', code: 'CIR004', name: 'Extracción de cordal semi-incluido', basePrice: 200, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'cir-005', code: 'CIR005', name: 'Extracción múltiple (2-4 piezas)', basePrice: 280, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-006', code: 'CIR006', name: 'Alveoloplastia simple', basePrice: 120, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-007', code: 'CIR007', name: 'Alveoloplastia compleja', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-008', code: 'CIR008', name: 'Frenectomía labial', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-009', code: 'CIR009', name: 'Frenectomía lingual', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-010', code: 'CIR010', name: 'Biopsia de tejidos blandos', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-011', code: 'CIR011', name: 'Biopsia ósea', basePrice: 220, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-012', code: 'CIR012', name: 'Quistectomía simple', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-013', code: 'CIR013', name: 'Quistectomía compleja', basePrice: 450, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-014', code: 'CIR014', name: 'Apicectomía unirradicular', basePrice: 280, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-015', code: 'CIR015', name: 'Apicectomía birradicular', basePrice: 350, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'cir-016', code: 'CIR016', name: 'Apicectomía multirradicular', basePrice: 420, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-017', code: 'CIR017', name: 'Hemisección radicular', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-018', code: 'CIR018', name: 'Reimplante dentario', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-019', code: 'CIR019', name: 'Trasplante dentario', basePrice: 350, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-020', code: 'CIR020', name: 'Regularización de reborde alveolar', basePrice: 250, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-021', code: 'CIR021', name: 'Exéresis de torus palatino', basePrice: 400, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'cir-022', code: 'CIR022', name: 'Exéresis de torus mandibular', basePrice: 350, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-023', code: 'CIR023', name: 'Exéresis de exostosis', basePrice: 280, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-024', code: 'CIR024', name: 'Drenaje de absceso', basePrice: 100, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-025', code: 'CIR025', name: 'Incisión y drenaje intraoral', basePrice: 120, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-026', code: 'CIR026', name: 'Fenestración de diente incluido', basePrice: 220, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-027', code: 'CIR027', name: 'Tracción ortodóncica quirúrgica', basePrice: 280, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-028', code: 'CIR028', name: 'Gingivectomía por cuadrante', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-029', code: 'CIR029', name: 'Alargamiento coronario', basePrice: 250, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-030', code: 'CIR030', name: 'Sutura de herida intraoral', basePrice: 80, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'cir-031', code: 'CIR031', name: 'Extracción de raíz residual', basePrice: 100, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-032', code: 'CIR032', name: 'Extracción con odontosección', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-033', code: 'CIR033', name: 'Cirugía preprotésica menor', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-034', code: 'CIR034', name: 'Cirugía preprotésica mayor', basePrice: 400, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-035', code: 'CIR035', name: 'Eliminación de secuestro óseo', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-036', code: 'CIR036', name: 'Legrado alveolar', basePrice: 80, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'cir-037', code: 'CIR037', name: 'Curetaje periapical', basePrice: 120, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-038', code: 'CIR038', name: 'Marsupialización de quiste', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-039', code: 'CIR039', name: 'Coronectomía', basePrice: 220, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-040', code: 'CIR040', name: 'Extracción de supernumerario', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-041', code: 'CIR041', name: 'Extracción de odontoma', basePrice: 250, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-042', code: 'CIR042', name: 'Cirugía de comunicación oroantral', basePrice: 350, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'cir-043', code: 'CIR043', name: 'Cierre de fístula oroantral', basePrice: 400, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'cir-044', code: 'CIR044', name: 'Plastia vestibular', basePrice: 280, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-045', code: 'CIR045', name: 'Profundización de vestíbulo', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'cir-046', code: 'CIR046', name: 'Retirada de material de osteosíntesis', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-047', code: 'CIR047', name: 'Cirugía de épulis', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'cir-048', code: 'CIR048', name: 'Exéresis de mucocele', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-049', code: 'CIR049', name: 'Exéresis de fibroma', basePrice: 160, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'cir-050', code: 'CIR050', name: 'Exéresis de papiloma', basePrice: 140, estimatedTime: '30 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'conservadora',
    name: 'Conservadora',
    treatments: [
      { id: 'con-001', code: 'CON001', name: 'Obturación composite 1 superficie', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-002', code: 'CON002', name: 'Obturación composite 2 superficies', basePrice: 70, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'con-003', code: 'CON003', name: 'Obturación composite 3 superficies', basePrice: 90, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-004', code: 'CON004', name: 'Obturación composite 4+ superficies', basePrice: 110, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'con-005', code: 'CON005', name: 'Reconstrucción con poste prefabricado', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-006', code: 'CON006', name: 'Reconstrucción con poste colado', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-007', code: 'CON007', name: 'Reconstrucción con poste de fibra', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-008', code: 'CON008', name: 'Reconstrucción de gran destrucción', basePrice: 120, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-009', code: 'CON009', name: 'Incrustación de composite (inlay)', basePrice: 250, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-010', code: 'CON010', name: 'Incrustación de composite (onlay)', basePrice: 300, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-011', code: 'CON011', name: 'Incrustación de composite (overlay)', basePrice: 350, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-012', code: 'CON012', name: 'Incrustación cerámica (inlay)', basePrice: 400, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-013', code: 'CON013', name: 'Incrustación cerámica (onlay)', basePrice: 450, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-014', code: 'CON014', name: 'Incrustación cerámica (overlay)', basePrice: 500, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'con-015', code: 'CON015', name: 'Tratamiento de hipersensibilidad', basePrice: 40, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'con-016', code: 'CON016', name: 'Aplicación de flúor tópico', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'con-017', code: 'CON017', name: 'Sellado de fisuras por diente', basePrice: 35, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'con-018', code: 'CON018', name: 'Recubrimiento pulpar directo', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-019', code: 'CON019', name: 'Recubrimiento pulpar indirecto', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-020', code: 'CON020', name: 'Pulpotomía vital', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-021', code: 'CON021', name: 'Ferulización con composite (por diente)', basePrice: 45, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'con-022', code: 'CON022', name: 'Ferulización con fibra (por diente)', basePrice: 60, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'con-023', code: 'CON023', name: 'Reparación de fractura coronaria', basePrice: 80, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'con-024', code: 'CON024', name: 'Cierre de diastema con composite', basePrice: 100, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-025', code: 'CON025', name: 'Eliminación de caries profunda', basePrice: 70, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'con-026', code: 'CON026', name: 'Obturación provisional', basePrice: 25, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'con-027', code: 'CON027', name: 'Obturación de amalgama (retirada)', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-028', code: 'CON028', name: 'Sustitución de amalgama por composite', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-029', code: 'CON029', name: 'Ajuste oclusal', basePrice: 40, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'con-030', code: 'CON030', name: 'Pulido de restauraciones', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'con-031', code: 'CON031', name: 'Reconstrucción de ángulo incisal', basePrice: 90, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-032', code: 'CON032', name: 'Reconstrucción de borde incisal', basePrice: 85, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'con-033', code: 'CON033', name: 'Restauración de cuello dental', basePrice: 55, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-034', code: 'CON034', name: 'Restauración de abrasión', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-035', code: 'CON035', name: 'Restauración de erosión', basePrice: 55, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-036', code: 'CON036', name: 'Restauración de abfracción', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-037', code: 'CON037', name: 'Obturación con ionómero de vidrio', basePrice: 45, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'con-038', code: 'CON038', name: 'Base cavitaria', basePrice: 20, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'con-039', code: 'CON039', name: 'Tratamiento remineralizante', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-040', code: 'CON040', name: 'Infiltración de resina (ICON)', basePrice: 120, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'con-041', code: 'CON041', name: 'Composite estratificado anterior', basePrice: 130, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-042', code: 'CON042', name: 'Composite estratificado posterior', basePrice: 140, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'con-043', code: 'CON043', name: 'Reconstrucción con composite bulk fill', basePrice: 75, estimatedTime: '35 min', iva: '0%', selected: false },
      { id: 'con-044', code: 'CON044', name: 'Matriz individualizada', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'con-045', code: 'CON045', name: 'Aislamiento absoluto con dique', basePrice: 25, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'con-046', code: 'CON046', name: 'Eliminación de tinción', basePrice: 35, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'con-047', code: 'CON047', name: 'Restauración MOD compleja', basePrice: 100, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'con-048', code: 'CON048', name: 'Tallado para incrustación', basePrice: 80, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'con-049', code: 'CON049', name: 'Cementado de incrustación', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'con-050', code: 'CON050', name: 'Reparación de incrustación', basePrice: 70, estimatedTime: '35 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'endodoncia',
    name: 'Endodoncia',
    treatments: [
      { id: 'end-001', code: 'END001', name: 'Endodoncia unirradicular', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-002', code: 'END002', name: 'Endodoncia birradicular', basePrice: 250, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'end-003', code: 'END003', name: 'Endodoncia multirradicular (3 conductos)', basePrice: 320, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'end-004', code: 'END004', name: 'Endodoncia multirradicular (4+ conductos)', basePrice: 380, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'end-005', code: 'END005', name: 'Reendodoncia unirradicular', basePrice: 250, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'end-006', code: 'END006', name: 'Reendodoncia birradicular', basePrice: 320, estimatedTime: '105 min', iva: '0%', selected: false },
      { id: 'end-007', code: 'END007', name: 'Reendodoncia multirradicular', basePrice: 400, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'end-008', code: 'END008', name: 'Tratamiento de conducto calcificado', basePrice: 350, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'end-009', code: 'END009', name: 'Desobturación de conducto', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-010', code: 'END010', name: 'Localización de conducto adicional', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'end-011', code: 'END011', name: 'Extracción de instrumento fracturado', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-012', code: 'END012', name: 'Extracción de poste', basePrice: 100, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'end-013', code: 'END013', name: 'Perforación y reparación con MTA', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-014', code: 'END014', name: 'Apicoformación', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-015', code: 'END015', name: 'Apexificación', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-016', code: 'END016', name: 'Revascularización pulpar', basePrice: 250, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'end-017', code: 'END017', name: 'Pulpotomía parcial', basePrice: 100, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'end-018', code: 'END018', name: 'Pulpotomía total', basePrice: 120, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'end-019', code: 'END019', name: 'Pulpectomía', basePrice: 140, estimatedTime: '55 min', iva: '0%', selected: false },
      { id: 'end-020', code: 'END020', name: 'Tratamiento de urgencia endodóntica', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'end-021', code: 'END021', name: 'Drenaje de absceso periapical', basePrice: 70, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'end-022', code: 'END022', name: 'Medicación intraconducto', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'end-023', code: 'END023', name: 'Apertura cameral', basePrice: 60, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'end-024', code: 'END024', name: 'Conductometría', basePrice: 40, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'end-025', code: 'END025', name: 'Obturación de conductos con gutapercha', basePrice: 100, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'end-026', code: 'END026', name: 'Obturación con técnica de onda continua', basePrice: 130, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'end-027', code: 'END027', name: 'Blanqueamiento interno', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'end-028', code: 'END028', name: 'Segunda sesión de blanqueamiento interno', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'end-029', code: 'END029', name: 'Sellado apical con MTA', basePrice: 150, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'end-030', code: 'END030', name: 'Bypass de instrumento', basePrice: 120, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'end-031', code: 'END031', name: 'Tratamiento de reabsorción interna', basePrice: 220, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'end-032', code: 'END032', name: 'Tratamiento de reabsorción externa', basePrice: 200, estimatedTime: '70 min', iva: '0%', selected: false },
      { id: 'end-033', code: 'END033', name: 'Endodoncia con microscopio', basePrice: 400, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'end-034', code: 'END034', name: 'Endodoncia rotatoria mecanizada', basePrice: 280, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'end-035', code: 'END035', name: 'Endodoncia con sistema reciprocante', basePrice: 300, estimatedTime: '80 min', iva: '0%', selected: false },
      { id: 'end-036', code: 'END036', name: 'Irrigación con ultrasonidos', basePrice: 60, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'end-037', code: 'END037', name: 'Activación sónica de irrigantes', basePrice: 50, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'end-038', code: 'END038', name: 'CBCT endodóntico', basePrice: 100, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'end-039', code: 'END039', name: 'Diagnóstico de fisura/fractura', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'end-040', code: 'END040', name: 'Test de vitalidad pulpar', basePrice: 30, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'end-041', code: 'END041', name: 'Tratamiento de traumatismo dental', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-042', code: 'END042', name: 'Ferulización post-traumática', basePrice: 100, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'end-043', code: 'END043', name: 'Control post-endodoncia', basePrice: 40, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'end-044', code: 'END044', name: 'Radiografía periapical endodoncia', basePrice: 20, estimatedTime: '5 min', iva: '0%', selected: false },
      { id: 'end-045', code: 'END045', name: 'Endodoncia de diente temporal', basePrice: 120, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'end-046', code: 'END046', name: 'Endodoncia de premolar', basePrice: 220, estimatedTime: '70 min', iva: '0%', selected: false },
      { id: 'end-047', code: 'END047', name: 'Endodoncia de molar superior', basePrice: 350, estimatedTime: '100 min', iva: '0%', selected: false },
      { id: 'end-048', code: 'END048', name: 'Endodoncia de molar inferior', basePrice: 320, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'end-049', code: 'END049', name: 'Endodoncia de incisivo/canino', basePrice: 180, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'end-050', code: 'END050', name: 'Endodoncia de diente con anatomía compleja', basePrice: 420, estimatedTime: '120 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'estetica',
    name: 'Estética',
    treatments: [
      { id: 'est-001', code: 'EST001', name: 'Limpieza bucal profesional', basePrice: 60, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-002', code: 'EST002', name: 'Limpieza con ultrasonidos', basePrice: 70, estimatedTime: '50 min', iva: '10%', selected: false },
      { id: 'est-003', code: 'EST003', name: 'Profilaxis con aeropulidor', basePrice: 80, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-004', code: 'EST004', name: 'Blanqueamiento en clínica', basePrice: 300, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-005', code: 'EST005', name: 'Blanqueamiento con lámpara LED', basePrice: 350, estimatedTime: '75 min', iva: '10%', selected: false },
      { id: 'est-006', code: 'EST006', name: 'Blanqueamiento combinado', basePrice: 400, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-007', code: 'EST007', name: 'Kit blanqueamiento domiciliario', basePrice: 200, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-008', code: 'EST008', name: 'Férulas de blanqueamiento', basePrice: 120, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-009', code: 'EST009', name: 'Recarga gel blanqueamiento', basePrice: 40, estimatedTime: '10 min', iva: '10%', selected: false },
      { id: 'est-010', code: 'EST010', name: 'Carilla de composite por pieza', basePrice: 200, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-011', code: 'EST011', name: 'Carilla de porcelana por pieza', basePrice: 500, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-012', code: 'EST012', name: 'Carilla de disilicato de litio', basePrice: 600, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-013', code: 'EST013', name: 'Carilla ultrafina (lumineers)', basePrice: 700, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-014', code: 'EST014', name: 'Reparación de carilla', basePrice: 150, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-015', code: 'EST015', name: 'Contorneado estético (stripping)', basePrice: 80, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-016', code: 'EST016', name: 'Gingivoplastia estética', basePrice: 200, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-017', code: 'EST017', name: 'Diseño de sonrisa digital (DSD)', basePrice: 150, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-018', code: 'EST018', name: 'Mock-up dental', basePrice: 100, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-019', code: 'EST019', name: 'Encerado diagnóstico', basePrice: 120, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-020', code: 'EST020', name: 'Fotografía dental profesional', basePrice: 50, estimatedTime: '20 min', iva: '10%', selected: false },
      { id: 'est-021', code: 'EST021', name: 'Joyería dental (brillante)', basePrice: 80, estimatedTime: '20 min', iva: '10%', selected: false },
      { id: 'est-022', code: 'EST022', name: 'Eliminación de manchas tabaco', basePrice: 90, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-023', code: 'EST023', name: 'Eliminación de manchas café/té', basePrice: 80, estimatedTime: '40 min', iva: '10%', selected: false },
      { id: 'est-024', code: 'EST024', name: 'Microabrasión del esmalte', basePrice: 100, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-025', code: 'EST025', name: 'Tratamiento de fluorosis', basePrice: 150, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-026', code: 'EST026', name: 'Corona estética de zirconio', basePrice: 450, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-027', code: 'EST027', name: 'Corona estética de disilicato', basePrice: 500, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-028', code: 'EST028', name: 'Corona de cerámica pura', basePrice: 550, estimatedTime: '90 min', iva: '10%', selected: false },
      { id: 'est-029', code: 'EST029', name: 'Puente estético anterior', basePrice: 1200, estimatedTime: '120 min', iva: '10%', selected: false },
      { id: 'est-030', code: 'EST030', name: 'Cierre de diastemas con composite', basePrice: 120, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-031', code: 'EST031', name: 'Reconformación dental estética', basePrice: 100, estimatedTime: '40 min', iva: '10%', selected: false },
      { id: 'est-032', code: 'EST032', name: 'Alargamiento coronario estético', basePrice: 250, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-033', code: 'EST033', name: 'Despigmentación gingival', basePrice: 200, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-034', code: 'EST034', name: 'Tratamiento de sonrisa gingival', basePrice: 350, estimatedTime: '75 min', iva: '10%', selected: false },
      { id: 'est-035', code: 'EST035', name: 'Ácido hialurónico labial', basePrice: 300, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-036', code: 'EST036', name: 'Ácido hialurónico peribucal', basePrice: 350, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-037', code: 'EST037', name: 'Bótox para sonrisa gingival', basePrice: 250, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-038', code: 'EST038', name: 'Bótox para bruxismo', basePrice: 300, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-039', code: 'EST039', name: 'Composite inyectado estético', basePrice: 180, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-040', code: 'EST040', name: 'Restauración de incisivos estética', basePrice: 150, estimatedTime: '50 min', iva: '10%', selected: false },
      { id: 'est-041', code: 'EST041', name: 'Corrección de forma dental', basePrice: 100, estimatedTime: '40 min', iva: '10%', selected: false },
      { id: 'est-042', code: 'EST042', name: 'Corrección de tamaño dental', basePrice: 120, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-043', code: 'EST043', name: 'Snap-on smile (férula estética)', basePrice: 400, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-044', code: 'EST044', name: 'Estudio estético completo', basePrice: 100, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-045', code: 'EST045', name: 'Planificación digital de carillas', basePrice: 200, estimatedTime: '60 min', iva: '10%', selected: false },
      { id: 'est-046', code: 'EST046', name: 'Provisionales estéticos por pieza', basePrice: 80, estimatedTime: '30 min', iva: '10%', selected: false },
      { id: 'est-047', code: 'EST047', name: 'Cementado de carillas', basePrice: 100, estimatedTime: '45 min', iva: '10%', selected: false },
      { id: 'est-048', code: 'EST048', name: 'Retoque de color (shade matching)', basePrice: 50, estimatedTime: '20 min', iva: '10%', selected: false },
      { id: 'est-049', code: 'EST049', name: 'Pulido y acabado estético', basePrice: 40, estimatedTime: '20 min', iva: '10%', selected: false },
      { id: 'est-050', code: 'EST050', name: 'Mantenimiento de carillas', basePrice: 60, estimatedTime: '30 min', iva: '10%', selected: false }
    ]
  },
  {
    id: 'implantes',
    name: 'Implantes',
    treatments: [
      { id: 'imp-001', code: 'IMP001', name: 'Implante dental unitario', basePrice: 1200, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'imp-002', code: 'IMP002', name: 'Implante de carga inmediata', basePrice: 1500, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-003', code: 'IMP003', name: 'Corona sobre implante metal-cerámica', basePrice: 450, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-004', code: 'IMP004', name: 'Corona sobre implante zirconio', basePrice: 600, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-005', code: 'IMP005', name: 'Corona sobre implante cerámica pura', basePrice: 700, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-006', code: 'IMP006', name: 'Pilar de implante estándar', basePrice: 200, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-007', code: 'IMP007', name: 'Pilar de implante personalizado', basePrice: 350, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-008', code: 'IMP008', name: 'Pilar de implante angulado', basePrice: 280, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-009', code: 'IMP009', name: 'Elevación de seno maxilar abierta', basePrice: 1500, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-010', code: 'IMP010', name: 'Elevación de seno maxilar cerrada', basePrice: 800, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'imp-011', code: 'IMP011', name: 'Injerto óseo en bloque', basePrice: 1200, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-012', code: 'IMP012', name: 'Injerto óseo particulado', basePrice: 600, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-013', code: 'IMP013', name: 'Regeneración ósea guiada (ROG)', basePrice: 800, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'imp-014', code: 'IMP014', name: 'Membrana de colágeno', basePrice: 300, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-015', code: 'IMP015', name: 'Membrana PTFE', basePrice: 400, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-016', code: 'IMP016', name: 'Expansión crestal', basePrice: 500, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'imp-017', code: 'IMP017', name: 'Split crest', basePrice: 600, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'imp-018', code: 'IMP018', name: 'Prótesis híbrida sobre implantes', basePrice: 5000, estimatedTime: '180 min', iva: '0%', selected: false },
      { id: 'imp-019', code: 'IMP019', name: 'Sobredentadura sobre 2 implantes', basePrice: 3500, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-020', code: 'IMP020', name: 'Sobredentadura sobre 4 implantes', basePrice: 5500, estimatedTime: '150 min', iva: '0%', selected: false },
      { id: 'imp-021', code: 'IMP021', name: 'All-on-4 arcada completa', basePrice: 8000, estimatedTime: '240 min', iva: '0%', selected: false },
      { id: 'imp-022', code: 'IMP022', name: 'All-on-6 arcada completa', basePrice: 10000, estimatedTime: '300 min', iva: '0%', selected: false },
      { id: 'imp-023', code: 'IMP023', name: 'Puente sobre implantes (3 piezas)', basePrice: 2000, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-024', code: 'IMP024', name: 'Puente sobre implantes (4+ piezas)', basePrice: 2800, estimatedTime: '150 min', iva: '0%', selected: false },
      { id: 'imp-025', code: 'IMP025', name: 'Tornillo de cicatrización', basePrice: 80, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'imp-026', code: 'IMP026', name: 'Tapa de implante', basePrice: 50, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'imp-027', code: 'IMP027', name: 'Segunda fase quirúrgica', basePrice: 200, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-028', code: 'IMP028', name: 'Cirugía guiada por ordenador', basePrice: 500, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-029', code: 'IMP029', name: 'Férula quirúrgica guiada', basePrice: 400, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-030', code: 'IMP030', name: 'Planificación digital 3D', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'imp-031', code: 'IMP031', name: 'CBCT para implantes', basePrice: 120, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'imp-032', code: 'IMP032', name: 'Implante cigomático', basePrice: 3000, estimatedTime: '180 min', iva: '0%', selected: false },
      { id: 'imp-033', code: 'IMP033', name: 'Implante pterigomaxilar', basePrice: 2500, estimatedTime: '150 min', iva: '0%', selected: false },
      { id: 'imp-034', code: 'IMP034', name: 'Mini-implante', basePrice: 400, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-035', code: 'IMP035', name: 'Implante corto', basePrice: 1000, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'imp-036', code: 'IMP036', name: 'Implante estrecho', basePrice: 1100, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'imp-037', code: 'IMP037', name: 'Extracción e implante inmediato', basePrice: 1400, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'imp-038', code: 'IMP038', name: 'Injerto de tejido conectivo', basePrice: 500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-039', code: 'IMP039', name: 'Injerto gingival libre', basePrice: 400, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-040', code: 'IMP040', name: 'Aumento de tejido queratinizado', basePrice: 350, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'imp-041', code: 'IMP041', name: 'Tratamiento periimplantitis', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-042', code: 'IMP042', name: 'Mantenimiento de implantes', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'imp-043', code: 'IMP043', name: 'Reapriete de tornillo protésico', basePrice: 60, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'imp-044', code: 'IMP044', name: 'Cambio de tornillo protésico', basePrice: 100, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'imp-045', code: 'IMP045', name: 'Reparación de prótesis sobre implantes', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'imp-046', code: 'IMP046', name: 'Rebase de sobredentadura', basePrice: 250, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'imp-047', code: 'IMP047', name: 'Cambio de attachment', basePrice: 80, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'imp-048', code: 'IMP048', name: 'Retiro de implante fracasado', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'imp-049', code: 'IMP049', name: 'Provisional sobre implante', basePrice: 250, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'imp-050', code: 'IMP050', name: 'Estudio implantológico completo', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'odontopediatria',
    name: 'Odontopediatría',
    treatments: [
      { id: 'ped-001', code: 'PED001', name: 'Primera visita infantil', basePrice: 30, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-002', code: 'PED002', name: 'Revisión pediátrica', basePrice: 25, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ped-003', code: 'PED003', name: 'Sellado de fisuras por diente', basePrice: 35, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ped-004', code: 'PED004', name: 'Aplicación de flúor tópico', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ped-005', code: 'PED005', name: 'Aplicación de barniz de flúor', basePrice: 35, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ped-006', code: 'PED006', name: 'Limpieza dental infantil', basePrice: 40, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-007', code: 'PED007', name: 'Obturación en diente temporal', basePrice: 45, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-008', code: 'PED008', name: 'Pulpotomía en diente temporal', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-009', code: 'PED009', name: 'Pulpectomía en diente temporal', basePrice: 100, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'ped-010', code: 'PED010', name: 'Extracción de diente temporal', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ped-011', code: 'PED011', name: 'Corona de acero inoxidable', basePrice: 120, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-012', code: 'PED012', name: 'Corona estética pediátrica', basePrice: 150, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'ped-013', code: 'PED013', name: 'Mantenedor de espacio fijo', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-014', code: 'PED014', name: 'Mantenedor de espacio removible', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-015', code: 'PED015', name: 'Banda y ansa', basePrice: 220, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-016', code: 'PED016', name: 'Arco lingual', basePrice: 250, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'ped-017', code: 'PED017', name: 'Botón de Nance', basePrice: 230, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-018', code: 'PED018', name: 'Tratamiento de traumatismo dental', basePrice: 80, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-019', code: 'PED019', name: 'Ferulización dental pediátrica', basePrice: 100, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-020', code: 'PED020', name: 'Reimplante de diente avulsionado', basePrice: 150, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-021', code: 'PED021', name: 'Recubrimiento pulpar directo', basePrice: 50, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'ped-022', code: 'PED022', name: 'Recubrimiento pulpar indirecto', basePrice: 45, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'ped-023', code: 'PED023', name: 'Tratamiento de caries de biberón', basePrice: 60, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-024', code: 'PED024', name: 'Educación en higiene oral', basePrice: 25, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ped-025', code: 'PED025', name: 'Control de placa bacteriana', basePrice: 30, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ped-026', code: 'PED026', name: 'Tratamiento de gingivitis infantil', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-027', code: 'PED027', name: 'Frenectomía labial pediátrica', basePrice: 150, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-028', code: 'PED028', name: 'Frenectomía lingual pediátrica', basePrice: 170, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-029', code: 'PED029', name: 'Sedación consciente con óxido nitroso', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-030', code: 'PED030', name: 'Tratamiento bajo sedación profunda', basePrice: 500, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'ped-031', code: 'PED031', name: 'Tratamiento bajo anestesia general', basePrice: 800, estimatedTime: '180 min', iva: '0%', selected: false },
      { id: 'ped-032', code: 'PED032', name: 'Radiografía oclusal pediátrica', basePrice: 20, estimatedTime: '5 min', iva: '0%', selected: false },
      { id: 'ped-033', code: 'PED033', name: 'Radiografía panorámica pediátrica', basePrice: 40, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'ped-034', code: 'PED034', name: 'Ortopantomografía infantil', basePrice: 45, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'ped-035', code: 'PED035', name: 'Tratamiento de hipomineralización', basePrice: 60, estimatedTime: '35 min', iva: '0%', selected: false },
      { id: 'ped-036', code: 'PED036', name: 'Tratamiento de amelogénesis imperfecta', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-037', code: 'PED037', name: 'Tratamiento de dentinogénesis imperfecta', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-038', code: 'PED038', name: 'Control de hábitos (succión digital)', basePrice: 70, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-039', code: 'PED039', name: 'Aparato para dejar el chupete', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-040', code: 'PED040', name: 'Rejilla lingual para deglución atípica', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ped-041', code: 'PED041', name: 'Placa Hawley pediátrica', basePrice: 180, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-042', code: 'PED042', name: 'Protector bucal deportivo', basePrice: 100, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-043', code: 'PED043', name: 'Férula de descarga pediátrica', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-044', code: 'PED044', name: 'Tratamiento de bruxismo infantil', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-045', code: 'PED045', name: 'Ajuste de mantenedor de espacio', basePrice: 40, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ped-046', code: 'PED046', name: 'Reparación de mantenedor', basePrice: 60, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ped-047', code: 'PED047', name: 'Extracción de diente supernumerario', basePrice: 120, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ped-048', code: 'PED048', name: 'Ulectomía', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ped-049', code: 'PED049', name: 'Gingivectomía pediátrica', basePrice: 100, estimatedTime: '35 min', iva: '0%', selected: false },
      { id: 'ped-050', code: 'PED050', name: 'Control post-tratamiento pediátrico', basePrice: 20, estimatedTime: '15 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'ortodoncia',
    name: 'Ortodoncia',
    treatments: [
      { id: 'ort-001', code: 'ORT001', name: 'Estudio ortodóncico completo', basePrice: 150, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-002', code: 'ORT002', name: 'Fotografías intraorales y extraorales', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-003', code: 'ORT003', name: 'Modelos de estudio', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-004', code: 'ORT004', name: 'Cefalometría', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-005', code: 'ORT005', name: 'Escáner intraoral 3D', basePrice: 100, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-006', code: 'ORT006', name: 'Brackets metálicos arcada completa', basePrice: 2500, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'ort-007', code: 'ORT007', name: 'Brackets estéticos (cerámica) arcada', basePrice: 3200, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'ort-008', code: 'ORT008', name: 'Brackets de zafiro arcada completa', basePrice: 3500, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'ort-009', code: 'ORT009', name: 'Brackets autoligables metálicos', basePrice: 3000, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'ort-010', code: 'ORT010', name: 'Brackets autoligables estéticos', basePrice: 3800, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'ort-011', code: 'ORT011', name: 'Ortodoncia lingual', basePrice: 5000, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'ort-012', code: 'ORT012', name: 'Invisalign Lite', basePrice: 3000, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-013', code: 'ORT013', name: 'Invisalign Full', basePrice: 4500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-014', code: 'ORT014', name: 'Invisalign Comprehensive', basePrice: 5500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-015', code: 'ORT015', name: 'Alineadores transparentes (otra marca)', basePrice: 2500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-016', code: 'ORT016', name: 'Revisión mensual ortodoncia fija', basePrice: 80, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-017', code: 'ORT017', name: 'Revisión mensual alineadores', basePrice: 60, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-018', code: 'ORT018', name: 'Cambio de arco ortodóncico', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-019', code: 'ORT019', name: 'Cambio de ligaduras', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ort-020', code: 'ORT020', name: 'Reposición de bracket', basePrice: 40, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-021', code: 'ORT021', name: 'Reposición de tubo', basePrice: 50, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'ort-022', code: 'ORT022', name: 'Colocación de cadena elástica', basePrice: 25, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'ort-023', code: 'ORT023', name: 'Colocación de elásticos intermaxilares', basePrice: 20, estimatedTime: '10 min', iva: '0%', selected: false },
      { id: 'ort-024', code: 'ORT024', name: 'Stripping (por arcada)', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-025', code: 'ORT025', name: 'Attachment para alineadores', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'ort-026', code: 'ORT026', name: 'Microtornillo ortodóncico', basePrice: 200, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-027', code: 'ORT027', name: 'Disyuntor palatino', basePrice: 400, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-028', code: 'ORT028', name: 'Quad-helix', basePrice: 350, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'ort-029', code: 'ORT029', name: 'Bi-helix', basePrice: 300, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ort-030', code: 'ORT030', name: 'Arco transpalatino', basePrice: 280, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ort-031', code: 'ORT031', name: 'Barra transpalatina', basePrice: 260, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ort-032', code: 'ORT032', name: 'Péndulo de Hilgers', basePrice: 450, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-033', code: 'ORT033', name: 'Distalador molar', basePrice: 400, estimatedTime: '55 min', iva: '0%', selected: false },
      { id: 'ort-034', code: 'ORT034', name: 'Aparato de Herbst', basePrice: 600, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'ort-035', code: 'ORT035', name: 'Máscara facial de Delaire', basePrice: 350, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ort-036', code: 'ORT036', name: 'Mentonera', basePrice: 200, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-037', code: 'ORT037', name: 'Tracción extraoral (arco facial)', basePrice: 300, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ort-038', code: 'ORT038', name: 'Retenedor fijo (por arcada)', basePrice: 150, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-039', code: 'ORT039', name: 'Retenedor removible Essix', basePrice: 100, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-040', code: 'ORT040', name: 'Retenedor removible Hawley', basePrice: 120, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-041', code: 'ORT041', name: 'Retenedor Vivera (Invisalign)', basePrice: 250, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'ort-042', code: 'ORT042', name: 'Reparación de retenedor fijo', basePrice: 80, estimatedTime: '25 min', iva: '0%', selected: false },
      { id: 'ort-043', code: 'ORT043', name: 'Retirada de aparatología fija', basePrice: 100, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'ort-044', code: 'ORT044', name: 'Pulido post-ortodoncia', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'ort-045', code: 'ORT045', name: 'Ortodoncia interceptiva (fase 1)', basePrice: 1500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-046', code: 'ORT046', name: 'Placa activa removible', basePrice: 300, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'ort-047', code: 'ORT047', name: 'Activador ortopédico', basePrice: 400, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'ort-048', code: 'ORT048', name: 'Twin-block', basePrice: 500, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-049', code: 'ORT049', name: 'Regulador de función de Fränkel', basePrice: 550, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'ort-050', code: 'ORT050', name: 'Control de retención anual', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false }
    ]
  },
  {
    id: 'periodoncia',
    name: 'Periodoncia',
    treatments: [
      { id: 'per-001', code: 'PER001', name: 'Estudio periodontal completo', basePrice: 80, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-002', code: 'PER002', name: 'Periodontograma', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'per-003', code: 'PER003', name: 'Índice de placa', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'per-004', code: 'PER004', name: 'Índice de sangrado', basePrice: 30, estimatedTime: '15 min', iva: '0%', selected: false },
      { id: 'per-005', code: 'PER005', name: 'Tartrectomía supragingival', basePrice: 60, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'per-006', code: 'PER006', name: 'Raspado y alisado radicular (por cuadrante)', basePrice: 100, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-007', code: 'PER007', name: 'Raspado y alisado (boca completa)', basePrice: 350, estimatedTime: '120 min', iva: '0%', selected: false },
      { id: 'per-008', code: 'PER008', name: 'Curetaje subgingival (por cuadrante)', basePrice: 120, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'per-009', code: 'PER009', name: 'Curetaje subgingival (boca completa)', basePrice: 400, estimatedTime: '150 min', iva: '0%', selected: false },
      { id: 'per-010', code: 'PER010', name: 'Cirugía periodontal de acceso', basePrice: 250, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-011', code: 'PER011', name: 'Cirugía periodontal regenerativa', basePrice: 400, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'per-012', code: 'PER012', name: 'Cirugía mucogingival', basePrice: 350, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-013', code: 'PER013', name: 'Injerto de encía libre', basePrice: 400, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-014', code: 'PER014', name: 'Injerto de tejido conectivo', basePrice: 500, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'per-015', code: 'PER015', name: 'Colgajo de reposición coronal', basePrice: 350, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-016', code: 'PER016', name: 'Colgajo de reposición lateral', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-017', code: 'PER017', name: 'Técnica de túnel', basePrice: 450, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-018', code: 'PER018', name: 'Gingivectomía (por cuadrante)', basePrice: 180, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-019', code: 'PER019', name: 'Gingivoplastia', basePrice: 200, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'per-020', code: 'PER020', name: 'Alargamiento coronario', basePrice: 250, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-021', code: 'PER021', name: 'Frenectomía', basePrice: 180, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'per-022', code: 'PER022', name: 'Vestibuloplastia', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-023', code: 'PER023', name: 'Regeneración tisular guiada (RTG)', basePrice: 600, estimatedTime: '90 min', iva: '0%', selected: false },
      { id: 'per-024', code: 'PER024', name: 'Aplicación de Emdogain', basePrice: 350, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-025', code: 'PER025', name: 'Injerto óseo periodontal', basePrice: 400, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-026', code: 'PER026', name: 'Membrana reabsorbible', basePrice: 250, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'per-027', code: 'PER027', name: 'Membrana no reabsorbible', basePrice: 300, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'per-028', code: 'PER028', name: 'Plasma rico en plaquetas (PRP)', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-029', code: 'PER029', name: 'Plasma rico en fibrina (PRF)', basePrice: 200, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-030', code: 'PER030', name: 'Ferulización periodontal', basePrice: 150, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-031', code: 'PER031', name: 'Tratamiento de periimplantitis', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-032', code: 'PER032', name: 'Tratamiento de mucositis periimplantaria', basePrice: 150, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-033', code: 'PER033', name: 'Descontaminación de implantes', basePrice: 180, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'per-034', code: 'PER034', name: 'Terapia fotodinámica periodontal', basePrice: 120, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'per-035', code: 'PER035', name: 'Láser periodontal', basePrice: 150, estimatedTime: '45 min', iva: '0%', selected: false },
      { id: 'per-036', code: 'PER036', name: 'Aplicación local de antibiótico', basePrice: 80, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'per-037', code: 'PER037', name: 'Irrigación subgingival', basePrice: 50, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'per-038', code: 'PER038', name: 'Test microbiológico periodontal', basePrice: 100, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'per-039', code: 'PER039', name: 'Test genético periodontal', basePrice: 150, estimatedTime: '20 min', iva: '0%', selected: false },
      { id: 'per-040', code: 'PER040', name: 'Mantenimiento periodontal trimestral', basePrice: 80, estimatedTime: '40 min', iva: '0%', selected: false },
      { id: 'per-041', code: 'PER041', name: 'Mantenimiento periodontal semestral', basePrice: 70, estimatedTime: '35 min', iva: '0%', selected: false },
      { id: 'per-042', code: 'PER042', name: 'Reevaluación periodontal', basePrice: 50, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'per-043', code: 'PER043', name: 'Tratamiento de halitosis', basePrice: 60, estimatedTime: '30 min', iva: '0%', selected: false },
      { id: 'per-044', code: 'PER044', name: 'Tratamiento de recesión gingival', basePrice: 400, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-045', code: 'PER045', name: 'Tratamiento de hiperplasia gingival', basePrice: 200, estimatedTime: '50 min', iva: '0%', selected: false },
      { id: 'per-046', code: 'PER046', name: 'Cirugía de bolsa periodontal', basePrice: 280, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-047', code: 'PER047', name: 'Cirugía ósea resectiva', basePrice: 350, estimatedTime: '75 min', iva: '0%', selected: false },
      { id: 'per-048', code: 'PER048', name: 'Tratamiento de defecto de furca', basePrice: 300, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-049', code: 'PER049', name: 'Hemisección radicular', basePrice: 200, estimatedTime: '60 min', iva: '0%', selected: false },
      { id: 'per-050', code: 'PER050', name: 'Amputación radicular', basePrice: 220, estimatedTime: '60 min', iva: '0%', selected: false }
    ]
  }
]

const tabs: { key: TabKey; label: string }[] = [
  { key: 'treatments', label: 'Lista de tratamientos' },
  { key: 'budgetType', label: 'Presupuesto tipo' },
  { key: 'discounts', label: 'Descuentos (convenios)' },
  { key: 'medications', label: 'Medicamentos con autoguardado' }
]

// ============================================
// FILTER TAG COMPONENT
// ============================================

function FilterTag({
  label,
  onRemove
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <div className='bg-[var(--color-success-50)] inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full'>
      <button
        type='button'
        onClick={onRemove}
        className='flex items-center justify-center size-5 rounded-full text-[var(--color-success-600)] hover:text-[var(--color-success-700)] hover:bg-[var(--color-success-100)] transition-colors'
        aria-label={`Eliminar filtro ${label}`}
      >
        <CloseRounded className='size-3.5' />
      </button>
      <span className='text-body-sm text-[var(--color-success-600)] leading-none'>
        {label}
      </span>
    </div>
  )
}

// ============================================
// TABLE COMPONENTS
// ============================================

// Grid template: checkbox(fixed) | code(flex) | name(flex) | price(flex) | time(flex) | iva(flex)
const TABLE_GRID_CLASSES =
  'grid grid-cols-[2.5rem_minmax(0,0.8fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] w-full'

function TableHeader() {
  const headers = [
    '', // Checkbox column
    'Código interno',
    'Nombre del tratamiento',
    'Precio Base',
    'Tiempo estimado',
    'IVA'
  ]

  return (
    <div className={TABLE_GRID_CLASSES}>
      {headers.map((label, i) => (
        <div
          key={`header-${i}`}
          className='flex items-center border-b border-neutral-300 px-2 py-2 h-10 min-w-0'
        >
          <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

function TableRow({
  treatment,
  onToggle
}: {
  treatment: Treatment
  onToggle: () => void
}) {
  return (
    <div
      className={`${TABLE_GRID_CLASSES} hover:bg-[var(--color-neutral-50)] transition-colors`}
    >
      {/* Checkbox */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10'>
        <button
          type='button'
          onClick={onToggle}
          className='text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors'
          aria-label={
            treatment.selected
              ? `Deseleccionar ${treatment.name}`
              : `Seleccionar ${treatment.name}`
          }
        >
          {treatment.selected ? (
            <CheckBoxRounded className='size-[1.125rem]' />
          ) : (
            <CheckBoxOutlineBlankRounded className='size-[1.125rem]' />
          )}
        </button>
      </div>
      {/* Code */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.code}
        </p>
      </div>
      {/* Name */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p
          className='text-body-md text-[var(--color-neutral-900)] truncate'
          title={treatment.name}
        >
          {treatment.name}
        </p>
      </div>
      {/* Price */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.basePrice}€
        </p>
      </div>
      {/* Estimated Time */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.estimatedTime}
        </p>
      </div>
      {/* IVA */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.iva}
        </p>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TreatmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('treatments')
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>('estetica')
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Get current category
  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  // Get selected treatments for filter tags
  const selectedTreatments = useMemo(() => {
    return categories.flatMap((c) => c.treatments).filter((t) => t.selected)
  }, [categories])

  // Filter treatments by search term
  const filteredTreatments = useMemo(() => {
    if (!currentCategory) return []
    if (!searchTerm.trim()) return currentCategory.treatments
    const term = searchTerm.toLowerCase()
    return currentCategory.treatments.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term)
    )
  }, [currentCategory, searchTerm])

  // Toggle treatment selection
  const toggleTreatment = useCallback((treatmentId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        treatments: category.treatments.map((t) =>
          t.id === treatmentId ? { ...t, selected: !t.selected } : t
        )
      }))
    )
  }, [])

  // Remove filter tag
  const removeFilter = useCallback((treatmentId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        treatments: category.treatments.map((t) =>
          t.id === treatmentId ? { ...t, selected: false } : t
        )
      }))
    )
  }, [])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-8 pr-0 h-[2.5rem]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Tratamientos, precios, presupuestos y descuentos
        </p>
      </div>

      {/* Content Card */}
      <div className='flex-1 ml-8 mr-0 mt-6 mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
          {/* Tabs */}
          <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-10 pt-6 pb-2 min-h-[4rem]'>
            <div className='flex gap-6 items-center overflow-x-auto'>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type='button'
                  onClick={() => setActiveTab(tab.key)}
                  className={`p-2 border-b transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-[var(--color-brand-500)]'
                      : 'border-transparent'
                  }`}
                >
                  <p
                    className={`text-title-sm font-medium ${
                      activeTab === tab.key
                        ? 'text-[var(--color-neutral-900)]'
                        : 'text-[var(--color-neutral-600)]'
                    }`}
                  >
                    {tab.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'treatments' ? (
            <div className='flex min-h-0 mt-6 pb-6'>
              {/* Categories Sidebar */}
              <aside className='w-[min(11.5rem,18vw)] flex-none border border-neutral-200 rounded-lg ml-10 mr-6 overflow-hidden'>
                <nav className='flex flex-col'>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type='button'
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={[
                        'text-left px-[0.625rem] py-[0.625rem] h-12 transition-colors',
                        selectedCategoryId === category.id
                          ? 'bg-[var(--color-neutral-200)] text-body-md font-medium text-[var(--color-neutral-900)]'
                          : 'bg-[var(--color-surface)] text-body-md font-normal text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Treatments Content */}
              <div className='flex-1 flex flex-col min-w-0 pr-10 overflow-hidden'>
                {/* Category Header */}
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                    {currentCategory?.name || ''}
                  </p>
                  <div className='flex items-center gap-2'>
                    {/* Search */}
                    {searchVisible ? (
                      <div className='relative'>
                        <input
                          type='text'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder='Buscar...'
                          className='h-8 w-40 rounded-full px-3 pr-8 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                          autoFocus
                        />
                        <button
                          type='button'
                          onClick={() => {
                            setSearchVisible(false)
                            setSearchTerm('')
                          }}
                          className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)]'
                        >
                          <CloseRounded className='size-4' />
                        </button>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setSearchVisible(true)}
                        className='p-1 hover:bg-neutral-100 rounded transition-colors'
                        aria-label='Buscar'
                      >
                        <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                      </button>
                    )}
                    {/* Filter */}
                    <button
                      type='button'
                      className='flex items-center gap-[0.125rem] px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                    >
                      <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                      <span className='text-body-sm text-[var(--color-neutral-700)]'>
                        Todos
                      </span>
                    </button>
                    {/* Add Treatment */}
                    <button
                      type='button'
                      className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors'
                    >
                      <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
                      <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                        Añadir Tratamiento
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filter Tags */}
                {selectedTreatments.length > 0 && (
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {selectedTreatments.map((t) => (
                      <FilterTag
                        key={t.id}
                        label={t.name}
                        onRemove={() => removeFilter(t.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Treatments Table */}
                <div className='flex-1 overflow-y-auto overflow-x-hidden'>
                  <TableHeader />
                  {filteredTreatments.map((treatment) => (
                    <TableRow
                      key={treatment.id}
                      treatment={treatment}
                      onToggle={() => toggleTreatment(treatment.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-center py-20'>
              <p className='text-body-md text-[var(--color-neutral-600)]'>
                {activeTab === 'budgetType' &&
                  'Contenido de Presupuesto tipo - Por implementar'}
                {activeTab === 'discounts' &&
                  'Contenido de Descuentos (convenios) - Por implementar'}
                {activeTab === 'medications' &&
                  'Contenido de Medicamentos con autoguardado - Por implementar'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
