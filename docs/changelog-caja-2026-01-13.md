# Changelog - Página de Caja

**Fecha:** 13 de Enero de 2026

---

## Resumen de cambios

Se realizaron mejoras significativas en la página de Caja para hacerla más responsiva, con datos dinámicos y consistente con el dashboard de Gestión.

---

## 1. Layout responsivo de las tarjetas superiores

**Archivos modificados:**
- `src/app/caja/page.tsx`
- `src/components/caja/CashSummaryCard.tsx`

**Cambios:**
- Eliminado `maxWidth` fijo del contenedor del grid
- Las tarjetas ahora ocupan todo el ancho disponible
- Grid usa `minmax(0, fr)` para expansión flexible
- El gráfico de dona (`CashDonutGauge`) ahora tiene `width: 100%` en lugar de ancho fijo

---

## 2. Datos compartidos entre Caja y Gestión

**Archivos creados:**
- `src/data/accountingData.ts`

**Archivos modificados:**
- `src/components/caja/CashSummaryCard.tsx`

**Cambios:**
- Creado archivo de datos compartidos `accountingData.ts`
- Las tarjetas KPI (Producido, Facturado, Cobrado, Por cobrar) ahora usan los mismos datos que el dashboard de Gestión
- Los valores cambian según el `timeScale` (día/semana/mes):

| TimeScale | Producido | Facturado | Cobrado | Por cobrar |
|-----------|-----------|-----------|---------|------------|
| Día       | 1.200 €   | 1.029 €   | 857 €   | 172 €      |
| Semana    | 8.400 €   | 7.200 €   | 6.000 € | 1.200 €    |
| Mes       | 37.800 €  | 32.400 €  | 27.000 €| 5.400 €    |

---

## 3. Refactorización completa de CashTrendCard

**Archivos modificados:**
- `src/components/caja/CashTrendCard.tsx`
- `src/data/accountingData.ts`

**Antes:**
- 421 líneas de código
- ~30 constantes en píxeles hardcodeados
- Posicionamiento absoluto complejo con porcentajes calculados
- Datos generados pseudoaleatoriamente
- Escala Y fija (0-50K)
- Valores de "Facturado" y "Objetivo" hardcodeados

**Después:**
- ~180 líneas de código
- Layout con flexbox simple
- Datos reales basados en `anchorDate`
- Escala Y dinámica según los datos
- Valores dinámicos según `timeScale`

---

## 4. Semanas/meses reales con línea amarilla en período actual

**Cambios:**
- Las etiquetas del eje X ahora muestran semanas/meses reales (Sem 1, Sem 2, Ene, Feb, etc.)
- Muestra 8 períodos: 5 pasados + actual + 2 futuros
- Los 2 períodos futuros no tienen datos (línea no llega)
- La línea amarilla indica el período actual (no siempre al final)
- Consistente con `BillingLineChart.tsx` del dashboard de Gestión

---

## 5. Corrección de bug "Sem NaN"

**Archivos modificados:**
- `src/data/accountingData.ts`

**Problema:**
- Al navegar hacia atrás en el tiempo, aparecía "Sem NaN" en las etiquetas

**Solución:**
- Validación de fechas en `getWeekOfYear()`, `startOfWeek()`, `addDays()`
- Uso de `safeAnchorDate` con fallback a fecha actual si es inválida

---

## 6. Corrección de error de hidratación (Sidebar)

**Archivos modificados:**
- `src/components/layout/Layout.tsx`

**Problema:**
- Error de hidratación por mismatch entre servidor y cliente
- El estado `collapsed` del sidebar se leía de `localStorage` en la inicialización

**Solución:**
- Estado inicial siempre `false` (igual en servidor y cliente)
- Lectura de `localStorage` solo en `useEffect` después del montaje
- Variable `isHydrated` para controlar cuándo guardar en `localStorage`

---

## 7. Corrección de z-index del sidebar

**Archivos modificados:**
- `src/components/layout/Layout.tsx`

**Cambio:**
- Añadido `z-20` al `<main>` para que quede por debajo del sidebar (`z-30`)
- El botón de toggle del sidebar ya no queda oculto por el contenido de la página

---

## 8. Persistencia del estado del sidebar

**Archivos modificados:**
- `src/components/layout/Layout.tsx`

**Cambio:**
- El estado colapsado/expandido del sidebar se guarda en `localStorage`
- Al navegar entre páginas, el sidebar mantiene su estado
- Solo se expande/colapsa cuando el usuario hace clic en el botón

---

## Archivos afectados (resumen)

```
src/
├── app/
│   └── caja/
│       └── page.tsx                    # Layout responsivo
├── components/
│   ├── caja/
│   │   ├── CashSummaryCard.tsx         # Datos compartidos, dona responsiva
│   │   └── CashTrendCard.tsx           # Refactorización completa
│   └── layout/
│       └── Layout.tsx                  # z-index, hidratación, persistencia sidebar
└── data/
    └── accountingData.ts               # Nuevo archivo de datos compartidos
```

---

## Notas técnicas

- Se siguió el patrón de `BillingLineChart.tsx` para consistencia
- Los datos de las KPIs son mock data, listos para conectar con API real
- El gráfico usa Recharts con `connectNulls={false}` para no conectar puntos futuros
