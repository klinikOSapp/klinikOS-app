# 🎨 Tokens Semánticos del Dashboard - Referencia Rápida

Este documento describe todos los tokens semánticos disponibles para implementar el dashboard sin usar valores absolutos.

---

## 📊 **Colores Semánticos**

### Superficies
```tsx
bg-surface-app          // Fondo de la aplicación (#F8FAFB)
bg-surface              // Cards/componentes blancos (#FFFFFF)
bg-surface-accent       // Fondos destacados marca (#E9FBF9)
bg-surface-popover      // Popovers (#F8FAFB)
```

### Textos
```tsx
text-fg                 // Texto principal (#24282C)
text-fg-secondary       // Texto secundario (#6D7783)
text-fg-muted           // Texto auxiliar/placeholders (#AEB8C2)
text-fg-inverse         // Texto sobre fondos oscuros (#FFFFFF)
```

### Bordes
```tsx
border-border           // Bordes estándar (#CBD3D9)
```

### Marca (Brand)
```tsx
bg-brandSemantic        // Acción principal (#51D6C7)
bg-brand-strong         // Elementos destacados (#1E4947)
text-brandSemantic      // Color de marca para texto
```

### Estados
```tsx
text-success            // Éxito/crecimiento positivo (#51D6C7)
text-warning            // Advertencias (#FFD188)
text-info               // Información (#D4B5FF)
text-danger             // Errores/negativo
```

### Data Visualization (Gráficos)
```tsx
bg-chart-1              // Serie principal oscura (#2A6B67)
bg-chart-2              // Serie principal (#51D6C7)
bg-chart-3              // Serie clara (#D3F7F3)
bg-chart-4              // Serie media (#A8EFE7)
bg-chart-accent         // Datos comparativos (#D4B5FF)
text-chart-grid         // Líneas de grid (#CBD3D9)
text-chart-axis         // Ejes y etiquetas (#AEB8C2)
text-chart-threshold    // Líneas de referencia (#6D7783)
```

---

## ✍️ **Tipografía Semántica**

### Display (Números KPI Grandes)
```tsx
text-display-lg         // 52px - "€ 2.500,89" (Producción total)
text-display-md         // 36px - KPIs principales

// Ejemplo de uso:
<p className="text-display-lg text-fg-inverse">€ 2.500,89</p>
```

### Headlines (Números Destacados)
```tsx
text-headline-lg        // 36px - "42.000", "€ 56 K"
text-headline-sm        // 28px - "1.200 €", "2.200 €"

// Ejemplo de uso:
<p className="text-headline-lg text-fg-secondary">42.000</p>
<p className="text-headline-sm text-fg-secondary">1.200 €</p>
```

### Body (Texto General)
```tsx
text-body-lg            // 18px - Porcentajes de cambio "+ 35%"
text-body-md            // 16px - Texto estándar (ya existente)
text-body-sm            // 14px - Valores en tablas "60.000 €"

// Ejemplo de uso:
<p className="text-body-lg text-success">+ 35%</p>
<p className="text-body-sm text-fg-secondary">60.000 €</p>
```

### Titles (Títulos de Sección)
```tsx
text-title-lg           // 24px - Títulos grandes (ya existente)
text-title-md           // 18px - Títulos medianos (ya existente)
text-title-sm           // 16px (Medium) - "Facturación", "Contabilidad"

// Ejemplo de uso:
<h2 className="text-title-sm font-medium text-fg">Facturación</h2>
```

### Labels (Etiquetas y Texto Pequeño)
```tsx
text-label-md           // 12px (Medium) - Porcentajes en badges "44%", "56%"
text-label-sm           // 12px (Regular) - Etiquetas de ejes "Ene", "Feb"

// Ejemplo de uso:
<span className="text-label-md font-medium text-fg-secondary">44%</span>
<span className="text-label-sm text-fg-muted">Ene</span>
```

---

## 📏 **Espaciado Semántico**

### Layout
```tsx
gap-card-gap            // 24px - Separación entre cards
gap-section-gap         // 32px - Separación entre secciones
p-card-padding          // 16px - Padding interno de cards
m-chart-margin          // 16px - Márgenes de gráficos
mt-stats-offset         // 113px - Offset inicial hasta la primera fila de KPIs
mt-charts-offset        // 18.25rem - Offset hasta la fila de gráficos
mt-section-gap          // 32px - Separación vertical estándar entre filas

// Espaciado estándar (ya existente)
gap-gapsm               // 8px - Gap pequeño
gap-gapmd               // 16px - Gap medio
p-plnav                 // 24px - Padding estándar
```

### Ejemplos de Uso
```tsx
// Card con espaciado correcto
<div className="flex gap-card-gap">
  <div className="bg-surface p-card-padding rounded-lg">...</div>
  <div className="bg-surface p-card-padding rounded-lg">...</div>
</div>

// Sección con separación
<div className="flex flex-col gap-section-gap">
  <section>...</section>
  <section>...</section>
</div>
```

---

## 🔲 **Dimensiones de Componentes**

### Alturas
```tsx
h-card-stat             // 163px - Cards de estadísticas
h-card-chart            // 342px - Cards con gráficos
```

### Anchos
```tsx
w-card-stat             // 523px - Card de estadística
w-card-chart-lg         // 1069px - Card grande
w-card-chart-md         // 529px - Card mediano
```

### Ejemplo de Uso
```tsx
// Card de estadística
<div className="bg-surface h-card-stat w-card-stat rounded-lg p-card-padding">
  {/* Contenido */}
</div>

// Card con gráfico grande
<div className="bg-surface h-card-chart w-card-chart-lg rounded-lg p-card-padding">
  {/* Gráfico */}
</div>
```

---

## 🎯 **Bordes y Radios**

```tsx
rounded-xl              // 16px - Esquinas de cards grandes
rounded-lg              // 8px - Esquinas de cards
rounded-pill            // 72px - Badges/botones redondos
rounded-full            // Círculos perfectos
```

---

## ✨ **Sombras**

```tsx
shadow-elevation-card       // Elevación sutil de cards
shadow-elevation-popover    // Elevación de modales/popovers
```

---

## 📋 **Ejemplos Prácticos de Componentes**

### Card de KPI Simple
```tsx
<div className="bg-surface-accent h-card-stat w-card-stat rounded-lg p-card-padding flex flex-col gap-gapsm">
  <div className="flex items-center justify-between">
    <span className="text-label-sm text-fg-secondary">Efectivo</span>
    <span className="text-label-md font-medium text-fg-secondary">44%</span>
  </div>
  <p className="text-headline-sm text-fg-secondary">1.200 €</p>
  <div className="flex items-center gap-2">
    <span className="text-body-lg text-success">+ 12%</span>
    <span className="material-symbols-rounded text-success">arrow_outward</span>
  </div>
</div>
```

### Card de Gráfico
```tsx
<div className="bg-surface h-card-chart w-card-chart-lg rounded-lg overflow-clip">
  <div className="flex items-baseline justify-between p-card-padding">
    <h2 className="text-title-sm font-medium text-fg">Facturación</h2>
    <div className="flex items-center gap-1">
      <span className="text-label-sm text-fg">2024</span>
      <span className="material-symbols-rounded text-fg-muted">arrow_drop_down</span>
    </div>
  </div>
  {/* Contenido del gráfico */}
</div>
```

### Card Destacado (Producción Total)
```tsx
<div className="bg-brand-strong h-card-stat w-card-stat rounded-lg p-card-padding">
  <div className="flex flex-col gap-gapsm">
    <div className="flex items-baseline gap-4">
      <h2 className="text-title-sm font-medium text-fg-inverse">Producción total</h2>
      <span className="text-label-sm text-fg-inverse">8 - 16 Oct, 2025</span>
    </div>
    <p className="text-display-lg text-fg-inverse">€ 2.500,89</p>
    <div className="flex items-center gap-2">
      <span className="text-body-lg text-success">+ 35%</span>
      <span className="material-symbols-rounded text-success">arrow_outward</span>
    </div>
  </div>
</div>
```

### Grid de Cards
```tsx
<div className="flex gap-card-gap">
  <div className="bg-surface h-card-stat w-card-stat rounded-lg p-card-padding">
    {/* Card 1 */}
  </div>
  <div className="bg-surface h-card-stat w-card-stat rounded-lg p-card-padding">
    {/* Card 2 */}
  </div>
  <div className="bg-brand-strong h-card-stat w-card-stat rounded-lg p-card-padding">
    {/* Card 3 destacado */}
  </div>
</div>
```

---

## ⚠️ **REGLAS IMPORTANTES**

### ❌ **NUNCA HACER:**
```tsx
// NO usar valores absolutos
<div className="bg-[#f8fafb] text-[#24282c] text-[16px] p-[16px]">

// NO usar tamaños fijos sin tokens
<div className="h-[163px] w-[523px]">

// NO usar colores hardcodeados
<div className="bg-[#51d6c7]">
```

### ✅ **SIEMPRE HACER:**
```tsx
// SÍ usar tokens semánticos
<div className="bg-surface-app text-fg text-title-sm p-card-padding">

// SÍ usar dimensiones con tokens
<div className="h-card-stat w-card-stat">

// SÍ usar colores semánticos
<div className="bg-brandSemantic">
```

---

## 🎨 **Paleta de Colores de Referencia**

Para referencia visual rápida:

| Token | Color | Uso Principal |
|-------|-------|---------------|
| `brand-900` | #1E4947 | Fondo card producción total |
| `brand-800` | #2A6B67 | Gráfico serie 1 |
| `brand-500` | #51D6C7 | Color principal marca |
| `brand-200` | #A8EFE7 | Gráfico serie 4 |
| `brand-100` | #D3F7F3 | Gráfico serie 3 |
| `brand-50` | #E9FBF9 | Fondos suaves |
| `neutral-900` | #24282C | Texto principal |
| `neutral-600` | #6D7783 | Texto secundario |
| `neutral-400` | #AEB8C2 | Texto auxiliar |
| `neutral-300` | #CBD3D9 | Bordes |
| `neutral-50` | #F8FAFB | Fondo app |
| `info-200` | #D4B5FF | Datos comparativos |

---

## 🚀 **¿Cómo Empezar?**

1. **Importa los estilos globales** (ya están configurados)
2. **Usa las clases semánticas** en lugar de valores absolutos
3. **Consulta este documento** cuando necesites un token específico
4. **Mantén la consistencia** usando siempre los mismos tokens para casos similares

---

**Última actualización:** 2025-01-05
**Versión:** 1.0.0
