# Ficha del Paciente - Registro de Cambios

## Resumen General

La **Ficha del Paciente** (`PatientRecordModal`) es el componente central para gestionar toda la información de un paciente. Está organizada en 6 pestañas principales:

1. **Resumen** - Datos básicos, alertas, próximas citas, deuda
2. **Historial clínico** - Notas SOAP, odontograma, actos y adjuntos
3. **Imágenes RX** - Capturas intraorales, fotos antes/después, escáner 3D
4. **Presupuestos y pagos** - Cobros, financiación, facturas/recibos
5. **Consentimientos** - Gestión de consentimientos del paciente
6. **Recetas** - Consulta y emisión de recetas

---

## Estructura de Archivos

```
src/components/pacientes/modals/patient-record/
├── PatientRecordModal.tsx       # Modal principal con navegación por pestañas
├── ClientSummary.tsx            # Pestaña: Resumen del paciente
├── ClinicalHistory.tsx          # Pestaña: Historial clínico
├── RxImages.tsx                 # Pestaña: Imágenes RX
├── BudgetsPayments.tsx          # Pestaña: Presupuestos y pagos
├── Consents.tsx                 # Pestaña: Consentimientos
├── Recetas.tsx                  # Pestaña: Recetas
├── modalDimensions.ts           # Constantes de dimensiones
│
├── AddProductionModal.tsx       # Modal: Añadir producción
├── InvoiceProductionModal.tsx   # Modal: Facturar producción
├── MarkAsProducedModal.tsx      # Modal: Marcar como producido
├── RegisterPaymentModal.tsx     # Modal: Registrar pago
├── TraceabilityModal.tsx        # Modal: Trazabilidad
│
├── OdontogramaModal.tsx         # Modal: Odontograma interactivo
├── ProposalCreationModal.tsx    # Modal: Crear propuesta/presupuesto
├── QuickBudgetModal.tsx         # Modal: Presupuesto rápido
│
├── PrescriptionCreationModal.tsx # Modal: Crear receta
├── PrescriptionPdfPreview.tsx    # Modal: Vista previa PDF de receta
│
└── UploadConsentModal.tsx       # Modal: Subir consentimiento
```

---

## Cambios por Componente

### 1. PatientRecordModal.tsx
**Archivo principal del modal de ficha de paciente**

- Dimensiones responsivas: `w-[93.75rem] h-[56.25rem]` con límites `max-w-[92vw] max-h-[85vh]`
- Navegación lateral con 6 pestañas
- Soporte para abrir directamente en una pestaña específica (`initialTab`)
- Soporte para abrir directamente el modal de creación de presupuesto (`openBudgetCreation`)
- Cierre con tecla Escape

---

### 2. ClientSummary.tsx (Pestaña Resumen)
**Información general del paciente**

- Tarjeta de información personal (avatar, nombre, edad, contacto)
- Sección de alertas del paciente
- Próximas citas
- Información financiera (deuda pendiente)
- Datos de contacto editables

---

### 3. ClinicalHistory.tsx (Pestaña Historial Clínico)
**Historial médico del paciente**

- Lista de visitas/consultas con fechas
- Notas SOAP (Subjetivo, Objetivo, Análisis, Plan)
- Integración con odontograma
- Registro de actos/tratamientos realizados
- Adjuntos por visita
- Botón para abrir `OdontogramaModal`

---

### 4. RxImages.tsx (Pestaña Imágenes RX)
**Galería de imágenes diagnósticas**

- Grid de imágenes con vista previa
- Categorización: Panorámicas, Periapicales, Intraorales, Fotos, 3D
- Funcionalidad de subir nuevas imágenes
- Vista ampliada de imágenes
- Metadata de fecha y tipo

---

### 5. BudgetsPayments.tsx (Pestaña Presupuestos y Pagos)
**Gestión económica del paciente**

#### Secciones:
- **Resumen financiero**: Saldo pendiente, total facturado, total pagado
- **Lista de presupuestos**: Con estados (Pendiente, Aceptado, Rechazado, En curso)
- **Historial de pagos**: Registro de todos los cobros
- **Producción pendiente**: Tratamientos por facturar

#### Modales integrados:
- `AddProductionModal` - Añadir nueva producción/tratamiento
- `InvoiceProductionModal` - Facturar producción pendiente
- `MarkAsProducedModal` - Marcar tratamiento como realizado
- `RegisterPaymentModal` - Registrar un pago
- `TraceabilityModal` - Ver trazabilidad de un tratamiento
- `ProposalCreationModal` - Crear nuevo presupuesto
- `QuickBudgetModal` - Presupuesto rápido

---

### 6. Consents.tsx (Pestaña Consentimientos)
**Gestión de consentimientos informados**

#### Funcionalidades:
- Lista de consentimientos con estados (Firmado, Enviado)
- Columnas: Consentimiento, Estado, Fecha de envío
- Iconos de acciones a la derecha (Ver, Menú de opciones)
- Menú contextual con opciones:
  - Enviar consentimiento
  - Enviar copia firmada (deshabilitado si no está firmado)
  - Descargar

#### Cambio reciente:
- **Alineación de iconos**: Los iconos de "ver" y "más opciones" ahora están alineados a la derecha, igual que en la pantalla de Recetas

#### Modal integrado:
- `UploadConsentModal` - Subir nuevo consentimiento

---

### 7. Recetas.tsx (Pestaña Recetas)
**Gestión de prescripciones médicas**

#### Funcionalidades:
- Lista de recetas emitidas
- Columnas: Receta, Estado, Fecha de envío
- Estados: Firmado, Enviado
- Iconos de acciones a la derecha (Ver, Menú)

#### Modales integrados:
- `PrescriptionCreationModal` - Crear nueva receta (campos: medicamento, especialista, frecuencia, duración, administración)
- `PrescriptionPdfPreview` - Vista previa del PDF de la receta

---

## Modales Secundarios

### AddProductionModal.tsx
**Añadir producción/tratamiento**
- Selector de tratamiento
- Selector de diente (si aplica)
- Selector de profesional
- Precio y descuentos
- Fecha de realización

### InvoiceProductionModal.tsx
**Facturar producción pendiente**
- Selección de items a facturar
- Resumen de totales
- Generación de factura

### MarkAsProducedModal.tsx
**Marcar tratamiento como producido**
- Confirmación de realización
- Fecha de producción
- Notas adicionales

### RegisterPaymentModal.tsx
**Registrar pago del paciente**
- Método de pago (Efectivo, Tarjeta, Transferencia, etc.)
- Importe
- Referencia/Concepto
- Fecha de pago

### TraceabilityModal.tsx
**Trazabilidad de tratamiento**
- Historial completo del tratamiento
- Estados por los que ha pasado
- Fechas y responsables

### OdontogramaModal.tsx
**Odontograma interactivo**
- Representación gráfica de la dentadura
- Marcado de tratamientos por diente
- Estados de cada pieza dental
- Historial de tratamientos por diente

### ProposalCreationModal.tsx
**Crear propuesta/presupuesto**
- Lista de tratamientos a incluir
- Precios y descuentos
- Opciones de financiación
- Generación de documento

### QuickBudgetModal.tsx
**Presupuesto rápido**
- Versión simplificada de creación de presupuesto
- Para casos sencillos de un solo tratamiento

### PrescriptionCreationModal.tsx
**Crear receta médica**
- Campo de medicamento
- Selector de especialista
- Frecuencia de administración
- Duración del tratamiento
- Vía de administración

### PrescriptionPdfPreview.tsx
**Vista previa de receta en PDF**
- Visualización del documento
- Opciones de descarga
- Envío por email

### UploadConsentModal.tsx
**Subir consentimiento**
- Drag & drop de archivos
- Selección de tipo de consentimiento
- Validación de formato (PDF)

---

## Dimensiones y Responsive

Definidas en `modalDimensions.ts`:

| Componente | Ancho | Alto | Max Width | Max Height |
|------------|-------|------|-----------|------------|
| PatientRecordModal | 93.75rem | 56.25rem | 92vw | 85vh |
| Pestañas contenido | 74.75rem | 56.25rem | - | - |
| Card interna | 70.25rem | 45.3125rem | - | - |

---

## Estilos Comunes

### Navegación lateral
- Ancho: 19rem (304px)
- Items con hover en `brand-100`
- Item activo con `bg-brand-50` y borde izquierdo `brand-500`

### Tarjetas de contenido
- Background: `white`
- Border: `border-neutral-200`
- Border radius: `rounded-xl`

### Badges de estado
- **Firmado**: `border-brand-500 text-brand-500`
- **Enviado**: `border-info-200 text-info-200`
- **Pendiente**: `border-warning-500 text-warning-500`

### Botones de acción
- Estilo pill: `rounded-[136px]`
- Colores: `bg-neutral-50 border-neutral-300`
- Hover: `bg-brand-100 border-brand-300`
- Active: `bg-brand-900 text-neutral-50`

---

## Iconos Utilizados

Importados desde `@/components/icons/md3`:

- `CloseRounded` - Cerrar modales
- `AddRounded` - Añadir nuevo item
- `MoreVertRounded` - Menú de opciones
- `VisibilityRounded` - Ver/previsualizar
- `PictureAsPdfRounded` - Documento PDF
- `AttachEmailRounded` - Enviar por email
- `DownloadRounded` - Descargar
- `EditRounded` - Editar
- `DeleteRounded` - Eliminar

---

## Próximos Pasos / TODOs

- [ ] Conectar con backend de Supabase para persistencia de datos
- [ ] Implementar firma digital de consentimientos
- [ ] Integrar con sistema de facturación
- [ ] Añadir búsqueda y filtros en listas
- [ ] Implementar exportación de historial clínico
- [ ] Conectar odontograma con tratamientos reales

---

*Última actualización: Enero 2026*
