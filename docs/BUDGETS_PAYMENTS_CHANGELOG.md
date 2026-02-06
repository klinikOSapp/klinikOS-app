# Changelog - Presupuestos y Pagos

## Fecha: 12 de Enero de 2026

Este documento resume todos los cambios realizados en la ventana de **Presupuestos y Pagos** (`BudgetsPayments.tsx`) y componentes relacionados.

---

## 1. Modal de Trazabilidad

### Archivo creado:
- `src/components/pacientes/modals/patient-record/TraceabilityModal.tsx`

### Funcionalidad:
Muestra un resumen completo del ciclo de vida de un tratamiento cuando el usuario selecciona "Ver trazabilidad" desde el menú de acciones de una factura.

### Secciones del modal:
| Sección | Campos |
|---------|--------|
| **Info General** | Paciente, Tratamiento, Profesional, Monto, Aseguradora |
| **Presupuesto** | ID, Fecha, Estado |
| **Producción** | ID, Fecha producción, Estado |
| **Factura** | ID, Fecha factura, Método de pago, Fecha cobro, Estado |

---

## 2. Calendario en Campos de Fecha

### Archivos modificados:
- `MarkAsProducedModal.tsx`
- `InvoiceProductionModal.tsx`
- `RegisterPaymentModal.tsx`
- `AddPatientInputs.tsx` (z-index fix)

### Cambios:
1. Reemplazado el `SelectInput` con opciones "Hoy/Ayer/Otra fecha" por el componente `DatePickerInput` con calendario visual completo.
2. Añadido botón **"Hoy"** al lado del calendario para selección rápida.
3. La fecha de **hoy** aparece automáticamente al abrir cada modal.
4. Corregido z-index del calendario (`z-[100]` → `z-[10000]`) para que aparezca sobre modales.
5. Añadida sincronización del estado interno del `DatePickerInput` cuando el valor cambia desde fuera.

### Ejemplo visual:
```
┌─────────────────────────────────────┐
│ Fecha producción                    │
│ ┌─────────────────────┐  ┌───────┐  │
│ │ 12 / 01 / 2026  📅  │  │  Hoy  │  │
│ └─────────────────────┘  └───────┘  │
└─────────────────────────────────────┘
```

---

## 3. Sistema de Filtros Completo

### Archivo modificado:
- `BudgetsPayments.tsx`

### Filtros implementados:

#### Filtros Rápidos (chips)
| Filtro | Función |
|--------|---------|
| **Todos** | Muestra todos los registros |
| **Esta semana** | Filtra por fechas de la semana actual |
| **Este mes** | Filtra por fechas del mes actual |

> ⚠️ Se eliminó el chip "Pendientes" por ser redundante (el estado Pendiente ya está activo por defecto).

#### Búsqueda por Texto
- Input expandible con icono de lupa
- Busca en **ID** y **descripción**
- Botón de cerrar para limpiar y colapsar

#### Filtros por Dropdown

| Tab | Estado | Profesional | Aseguradora | Método pago | Fechas |
|-----|--------|-------------|-------------|-------------|--------|
| **Presupuestos** | ✅ Multi-select | ✅ | ✅ | - | ✅ |
| **Producción** | ✅ Multi-select | ✅ | - | - | ✅ |
| **Facturas** | ✅ Multi-select | - | ✅ | ✅ | ✅ |

#### Estados por defecto:
- **Presupuestos**: Pendiente (preseleccionado)
- **Producción**: Pendiente (preseleccionado)
- **Facturas**: Pendiente (preseleccionado)

### Características adicionales:
- 🔴 **Botón "Limpiar"**: Aparece cuando hay filtros activos (más allá del estado por defecto)
- 📊 **Contador de resultados**: Muestra "X de Y resultados" cuando hay filtros activos
- 📭 **Estado vacío**: Mensaje amigable cuando no hay resultados con opción de limpiar filtros
- ✨ **Indicador visual**: Los filtros activos se resaltan en color brand
- 🖱️ **Click fuera**: Cierra automáticamente los dropdowns abiertos

---

## 4. Iconos Añadidos

### Archivo modificado:
- `src/components/icons/MD3Icon.tsx`
- `src/components/icons/md3.tsx`

### Iconos añadidos:
| Icono | Glyph |
|-------|-------|
| `InfoRounded` | `info` |
| `ReceiptLongRounded` | `receipt_long` |
| `TimelineRounded` | `timeline` |
| `CalendarMonthRounded` | `calendar_month` |
| `AppsRounded` | `apps` |
| `FolderOpenRounded` | `folder_open` |
| `PaymentsRounded` | `payments` |

---

## 5. Modal de Registrar Pago (Mejoras del Usuario)

### Archivo modificado:
- `RegisterPaymentModal.tsx`

### Nuevas funcionalidades (implementadas por el usuario):
1. **Pagos parciales**: Soporte para pagar montos parciales
2. **Planes de cuotas**: Opción de pagar cuotas según plan definido
3. **Tres opciones de pago**:
   - Pagar cuota (si hay plan)
   - Pagar todo el pendiente
   - Pago personalizado (monto libre)
4. **Resumen de pagos**: Muestra total, pagado y pendiente con barra de progreso
5. **Vista previa**: Muestra lo que quedará pendiente después del pago
6. **Nuevo método de pago**: Bizum añadido a las opciones

---

## Estructura de Archivos Modificados

```
src/
├── components/
│   ├── icons/
│   │   ├── MD3Icon.tsx        # Nuevos iconos
│   │   └── md3.tsx            # Exports de iconos
│   └── pacientes/
│       └── modals/
│           ├── add-patient/
│           │   └── AddPatientInputs.tsx   # z-index fix
│           └── patient-record/
│               ├── BudgetsPayments.tsx    # Filtros completos
│               ├── MarkAsProducedModal.tsx    # DatePicker + Hoy
│               ├── InvoiceProductionModal.tsx # DatePicker + Hoy
│               ├── RegisterPaymentModal.tsx   # DatePicker + Pagos parciales
│               └── TraceabilityModal.tsx      # NUEVO
```

---

## Tipos de Datos para Filtros

```typescript
// Estados de Producción
type StatusType = 'Producido' | 'Pendiente' | 'Facturado'

// Estados de Presupuesto
type BudgetStatusType = 'Aceptado' | 'Pendiente' | 'Rechazado'

// Estados de Factura
type InvoiceStatusType = 'Cobrado' | 'Pendiente'

// Filtros rápidos
type QuickFilter = 'all' | 'this-week' | 'this-month'
```

---

## Próximos Pasos Sugeridos

1. Implementar "Ver detalles" para facturas
2. Implementar "Enviar por Mail" 
3. Implementar "Descargar PDF"
4. Persistir filtros en localStorage o URL params
5. Añadir ordenamiento de columnas
