# Cambios en la Ficha del Paciente (PatientRecordModal)

**Fecha:** 12 de enero de 2026  
**Archivos modificados:**
- `src/components/pacientes/modals/patient-record/ClientSummary.tsx`
- `src/components/pacientes/modals/patient-record/ClinicalHistory.tsx`
- `src/components/pacientes/modals/patient-record/RxImages.tsx`

---

## 1. Tab "Resumen" (ClientSummary.tsx)

### Cambios realizados:

#### 1.1 Eliminación del icono de tres puntos
- **Eliminado:** Icono `MoreVertRounded` (menú de opciones)
- **Mantenido:** Solo el botón "Editar"

#### 1.2 Funcionalidad de edición
El botón "Editar" activa el modo de edición donde todos los campos del paciente se convierten en campos editables:

**Campos editables:**
| Campo | Tipo de input |
|-------|---------------|
| Nombre completo | `<input type="text">` |
| Email | `<input type="email">` |
| Teléfono | `<input type="tel">` |
| Fecha de nacimiento | `<input type="text">` |
| Edad | `<input type="text">` |
| DNI/NIE | `<input type="text">` |
| País | `<input type="text">` |
| Estado | `<select>` (Pre-registro, Activo, Inactivo, Pendiente) |
| Motivo de consulta | `<textarea>` |
| Origen del cliente | `<select>` (Recomendación, Internet, Redes Sociales, Publicidad, Otro) |
| Recomendado por | `<input type="text">` |
| Ocupación | `<input type="text">` |
| Idioma de preferencia | `<select>` (Español, Inglés, Francés, Valenciano, Catalán) |
| Contacto emergencia - Nombre | `<input type="text">` |
| Contacto emergencia - Email | `<input type="email">` |
| Contacto emergencia - Teléfono | `<input type="tel">` |
| Comentarios | `<textarea>` |

**Botones en modo edición:**
- **Cancelar:** Descarta los cambios y vuelve al modo visualización
- **Guardar:** Aplica los cambios y vuelve al modo visualización

---

## 2. Tab "Historial Clínico" (ClinicalHistory.tsx)

### Cambios realizados:

#### 2.1 Nuevo botón de edición
- **Añadido:** Botón "Editar" con estilo consistente (borde verde, icono de lápiz)
- **Reemplaza:** El icono de edición estático que no tenía funcionalidad

#### 2.2 Campos SOAP editables
Al activar el modo edición, los campos SOAP se convierten en textareas:

| Campo | Descripción | Tipo |
|-------|-------------|------|
| Título | Nombre del tratamiento (ej: "Limpieza dental") | `<input type="text">` |
| Subjetivo | ¿Por qué viene? | `<textarea>` |
| Objetivo | ¿Qué tiene? | `<textarea>` |
| Evaluación | ¿Qué le hacemos? | `<textarea>` |
| Plan | Tratamiento a seguir | `<textarea>` |

#### 2.3 Sección "Atendido Por" editable
Se pueden editar los profesionales que atendieron al paciente:

| Campo | Tipo |
|-------|------|
| Profesional 1 - Nombre | `<input type="text">` |
| Profesional 1 - Rol | `<input type="text">` |
| Profesional 2 - Nombre | `<input type="text">` |
| Profesional 2 - Rol | `<input type="text">` |

#### 2.4 Reorganización del layout
**Problema anterior:** Las secciones usaban posicionamiento absoluto (`position: absolute`) con valores fijos de `top`, lo que causaba superposición cuando los campos se expandían en modo edición.

**Solución implementada:**
- Convertido todo el contenido del panel derecho a un layout flex (`flex flex-col`)
- Todas las secciones fluyen naturalmente una debajo de otra
- El contenedor tiene scroll vertical (`overflow-y-auto`)

**Orden de las secciones (de arriba a abajo):**
1. Título + Botones (Editar/Cancelar/Guardar)
2. Subjetivo (SOAP)
3. Objetivo (SOAP)
4. Evaluación (SOAP)
5. Plan (SOAP)
6. Atendido Por
7. Archivos adjuntos
8. Odontograma

---

## 3. Tab "Imágenes RX" (RxImages.tsx)

### Cambios realizados:

#### 3.1 Funcionalidad de subida de imágenes
- **Botón "Añadir RX":** Ahora abre el selector de archivos del dispositivo
- **Input oculto:** `<input type="file" accept="image/*" multiple>`
- **Soporte múltiple:** Se pueden seleccionar varias imágenes a la vez

#### 3.2 Gestión de estado
Nuevo estado para manejar las imágenes:

```typescript
type RxImage = {
  id: string
  name: string
  date: string
  url: string
  description: string
}

const [images, setImages] = useState<RxImage[]>(initialImages)
const [selectedId, setSelectedId] = useState<string>('1')
```

#### 3.3 Lista de miniaturas
- Las imágenes subidas aparecen en la columna izquierda
- **Selección:** Click en una miniatura para verla en grande (borde verde en la seleccionada)
- **Eliminación:** Botón rojo de eliminar aparece al pasar el ratón sobre la miniatura
- **Información:** Nombre y fecha debajo de cada miniatura

#### 3.4 Visor principal
- Muestra la imagen seleccionada en tamaño grande
- Si no hay imagen, muestra un placeholder
- Debajo muestra el nombre, fecha y descripción

#### 3.5 Estado vacío
Cuando no hay imágenes, se muestra un mensaje "Sin imágenes" con un icono placeholder.

#### 3.6 Características técnicas
- **Formatos soportados:** Todos los formatos de imagen (`image/*`)
- **Nombre automático:** Se extrae del nombre del archivo
- **Fecha automática:** Se usa la fecha del día de subida
- **Limpieza de memoria:** Se liberan las URLs de blob al desmontar el componente

---

## Resumen de archivos modificados

### ClientSummary.tsx
```diff
- import { MoreVertRounded } from '@/components/icons/md3'
+ // Eliminado MoreVertRounded (no utilizado)

- <MoreVertRounded className='size-6 text-[#24282c]' />
+ // Eliminado el icono de tres puntos
```

### ClinicalHistory.tsx
```diff
+ import { CheckRounded } from '@/components/icons/md3'

+ // Datos iniciales del historial clínico
+ const initialClinicalData = { ... }

+ // Estados de edición
+ const [isEditing, setIsEditing] = useState(false)
+ const [formData, setFormData] = useState(initialClinicalData)
+ const [tempFormData, setTempFormData] = useState(initialClinicalData)

+ // Manejadores
+ const handleEdit = () => { ... }
+ const handleSave = () => { ... }
+ const handleCancel = () => { ... }
+ const updateField = () => { ... }

- // Layout con posicionamiento absoluto
+ // Layout con flexbox (sin superposición)
```

### RxImages.tsx
```diff
+ import { DeleteRounded } from '@/components/icons/md3'

+ type RxImage = { id, name, date, url, description }

+ // Estados
+ const [images, setImages] = useState<RxImage[]>(initialImages)
+ const [selectedId, setSelectedId] = useState<string>('1')
+ const fileInputRef = useRef<HTMLInputElement>(null)

+ // Funciones
+ const handleAddClick = () => { ... }
+ const handleFileChange = () => { ... }
+ const handleDelete = () => { ... }

+ // Input de archivo oculto
+ <input type="file" accept="image/*" multiple ... />

+ // Miniaturas dinámicas con selección y eliminación
+ // Visor principal con imagen seleccionada
```

---

## Notas técnicas

### Patrón de edición utilizado
Todos los componentes editables siguen el mismo patrón:

1. **Estado dual:** `formData` (datos guardados) y `tempFormData` (datos temporales durante edición)
2. **Botón Editar:** Copia `formData` a `tempFormData` y activa modo edición
3. **Botón Guardar:** Copia `tempFormData` a `formData` y desactiva modo edición
4. **Botón Cancelar:** Restaura `tempFormData` desde `formData` y desactiva modo edición

### Estilos de campos editables
- Background: `var(--color-neutral-50)`
- Border: `var(--color-neutral-300)`
- Border on focus: `var(--color-brand-500)`
- Border radius: `rounded` o `rounded-[0.5rem]`

### Estilos de botones
- **Editar:** Borde verde `#51d6c7`, texto `#1e4947`
- **Guardar:** Background `var(--color-brand-500)`, texto blanco
- **Cancelar:** Background `#f8fafb`, borde gris, texto gris

---

## Próximos pasos sugeridos

1. **Persistencia:** Conectar los cambios con la API/base de datos de Supabase
2. **Validación:** Añadir validación de campos (email, teléfono, etc.)
3. **Confirmación:** Modal de confirmación antes de eliminar imágenes RX
4. **Descripción RX:** Permitir editar la descripción de las imágenes RX
5. **Historial:** Guardar historial de cambios en el historial clínico
