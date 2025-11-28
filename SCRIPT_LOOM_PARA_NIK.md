# Script para Loom: Integración Frontend-Backend de klinikOS
## Video explicativo para Nik (Backend Developer)

---

## PREPARACIÓN ANTES DE GRABAR

### Software necesario:
- **Loom** instalado y listo
- **VSCode** abierto con el proyecto
- **Terminal** visible
- **Navegador** con la app corriendo (`pnpm dev`)

### Estructura del video:
- **Duración estimada**: 40-50 minutos
- **Objetivo**: Explicar cómo funciona el frontend y qué necesitas construir en el backend

---

## INTRO (0:00-2:00)

### Qué decir:
"Hola Nik! Te voy a explicar todo el frontend de klinikOS para que puedas integrar la base de datos. Este es un sistema de gestión para clínicas dentales construido con **Next.js 15**, **React 19** y **TypeScript**.

Actualmente la interfaz está **completamente funcional con datos mock** - todo lo que ves funciona en el navegador, pero **nada está conectado a una base de datos todavía**. Eso es lo que necesitamos que construyas.

Te voy a mostrar:
1. La arquitectura general del proyecto
2. Cada feature importante y cómo funciona
3. Qué datos necesita cada pantalla
4. Los endpoints exactos que necesitas crear
5. La estructura de base de datos que recomendamos

Vamos allá!"

### Qué mostrar:
- **VSCode** con la estructura del proyecto abierta
- Carpeta `src/app` (rutas)
- Carpeta `src/components` (componentes organizados por feature)

---

## SECCIÓN 1: ARQUITECTURA GENERAL (2:00-6:00)

### Qué decir:
"Primero, el stack tecnológico:
- **Next.js 15** con App Router (rutas basadas en carpetas)
- **React 19** con TypeScript
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **Material-UI** para iconos

La app tiene 5 rutas principales después del login:"

### Qué mostrar:
Muestra en VSCode la estructura de `src/app`:
```
src/app/
├── page.tsx              → Landing page (/)
├── login/page.tsx        → Login (/login)
├── register/page.tsx     → Registro (/register)
├── pacientes/page.tsx    → Lista de pacientes (/pacientes) ⭐️
├── agenda/page.tsx       → Calendario de citas (/agenda) ⭐️
└── gestion/page.tsx      → Dashboard de gestión (/gestion) ⭐️
```

### Qué decir:
"Las tres páginas principales son:
1. **Pacientes** - La más compleja, gestión completa de pacientes
2. **Agenda** - Calendario semanal con citas
3. **Gestión** - Dashboard con métricas y gráficos

Voy a empezar mostrándote cada una en el navegador y luego profundizamos en el código."

---

## SECCIÓN 2: AUTENTICACIÓN (6:00-10:00)

### Qué mostrar en navegador:
1. Abre `http://localhost:3000/login`
2. Muestra el formulario de login
3. Intenta hacer login (muestra el error: "La autenticación aún no está conectada")

### Qué decir:
"Como ves, el login está construido pero no hace nada real. Valida el email con regex, valida que haya contraseña, pero cuando haces click en 'Iniciar sesión'... no pasa nada porque **no hay backend**.

Ahora te muestro el registro..."

### Qué mostrar:
1. Navega a `/register`
2. Escribe un email
3. Se abre el modal de registro
4. Muestra los pasos: datos de cuenta → contraseña → foto de perfil

### Qué decir:
"El registro tiene validación de contraseña robusta:
- Mínimo 8 caracteres
- Una mayúscula
- Un número
- Un símbolo

Pero de nuevo, cuando terminas... no se envía a ningún lado."

### Qué mostrar en VSCode:
Abre `src/app/login/page.tsx` y muestra la línea donde debería ir el API call:
```typescript
const handleLogin = () => {
  // TODO: Aquí debería ir:
  // await fetch('/api/auth/login', { ... })
  setErrorMessage("La autenticación aún no está conectada")
}
```

### Qué decir:
"**Lo que necesitas construir para autenticación:**

```
POST /api/auth/login
  Body: { email: string, password: string }
  Response: { token: string, user: { id, name, email, role } }

POST /api/auth/register
  Body: { email, name, surname, password, avatar? }
  Response: { token: string, user: { ... } }

GET /api/auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { user: { ... } }
```

El frontend guardará el token en localStorage y lo enviará en cada request."

---

## SECCIÓN 3: GESTIÓN DE PACIENTES - PARTE 1 (10:00-16:00)

### Qué mostrar en navegador:
1. Navega a `/pacientes`
2. Muestra la lista de pacientes (12 filas mock)

### Qué decir:
"Aquí está la **feature más grande del sistema**: gestión de pacientes.

Arriba tienes **4 KPI cards** con métricas:
- Pacientes hoy: 2 (con tendencia +24%)
- Pacientes esta semana: 16
- Pacientes recibidos: 4 de 16
- Citas confirmadas: 12 de 16

**Estos números están hardcodeados**. Necesitarás un endpoint que calcule estas métricas en tiempo real.

Luego tienes **búsqueda y filtros**:"

### Qué mostrar:
1. Escribe en el buscador "Laura" → filtra en el navegador
2. Click en filtros: "En deuda", "Activos", "Recall"

### Qué decir:
"La búsqueda funciona SOLO en el frontend ahora - busca en los 12 pacientes mock. Pero cuando tengas miles de pacientes, necesitarás búsqueda en el backend.

La **tabla** tiene estas columnas:
- Nombre del paciente
- Próxima cita
- Estado (Activo/Hecho)
- Teléfono
- Check-in
- Financiación
- Deuda
- Último contacto

Puedes seleccionar filas con checkboxes y hay acciones masivas."

### Qué mostrar en VSCode:
Abre `src/app/pacientes/page.tsx` y busca la línea 169:
```typescript
const MOCK_PATIENTS: PatientRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i}`,
  name: 'Laura Rivas',
  nextDate: '12/01/2025',
  status: 'Activo',
  // ... más campos
}))
```

### Qué decir:
"Ves? Todo está hardcodeado aquí. **Lo que necesitas es**:

```
GET /api/patients?skip=0&take=12&search=Laura&filter=deuda
  Response: {
    data: Patient[],
    total: number,
    page: number,
    totalPages: number
  }
```

Cada Patient debe tener esta estructura:
```typescript
{
  id: string
  nombre: string
  apellidos: string
  dni: string
  fechaNacimiento: Date
  telefono: string
  email: string
  status: 'Activo' | 'Hecho' | 'Pausado'
  nextAppointment?: Date
  debt?: number
  // ... y más campos que te muestro ahora
}
```

---

## SECCIÓN 4: AÑADIR PACIENTE - EL MODAL GIGANTE (16:00-28:00)

### Qué mostrar en navegador:
1. Click en "Añadir paciente" (botón azul arriba a la derecha)
2. Se abre el modal enorme

### Qué decir:
"Ahora viene **LA JOYA DE LA CORONA**: el modal de crear paciente. Son **6 pasos secuenciales** que recopilan más de 30 campos de información.

Voy a ir paso por paso mostrándote todos los datos que se recopilan."

---

### PASO 1: Paciente (Datos básicos)

### Qué mostrar:
1. Click en la foto → se abre dropdown para subir avatar
2. Rellena: Nombre, Apellidos
3. Click en fecha de nacimiento → calendario custom
4. DNI/NIE
5. Sexo (dropdown)
6. Idioma preferido (dropdown)

### Qué decir:
"**Paso 1 - Datos básicos del paciente:**

Campos:
- `nombre`: string
- `apellidos`: string
- `fechaNacimiento`: Date (con date picker custom)
- `dni`: string (DNI o NIE)
- `sexo`: string (Masculino/Femenino/Otro)
- `idioma`: string (Español/Inglés/Francés/Alemán)
- `avatar`: File (imagen)

Todo esto se guarda en el estado del componente padre."

### Qué mostrar en VSCode:
Abre `src/components/pacientes/modals/add-patient/AddPatientStepPaciente.tsx`

---

### PASO 2: Contacto

### Qué mostrar en navegador:
1. Click "Siguiente"
2. Muestra el paso de contacto
3. Rellena teléfono con código de país
4. Email
5. Checkboxes: WhatsApp, SMS, Email, Llamada
6. Toggles: Recordatorios, Marketing

### Qué decir:
"**Paso 2 - Información de contacto:**

Campos:
- `telefono`: string (con código de país +34, +1, +33, +44)
- `email`: string
- `contactPreferences`: objeto con 4 booleanos
  - `whatsapp`: boolean
  - `sms`: boolean
  - `email`: boolean
  - `llamada`: boolean
- `recordatorios`: boolean (si acepta recordatorios)
- `marketing`: boolean (si acepta comunicaciones de marketing)"

---

### PASO 3: Administrativo

### Qué mostrar en navegador:
1. Click "Siguiente"
2. Muestra TODOS los campos del paso administrativo
3. Scroll para que se vean todos

### Qué decir:
"**Paso 3 - Datos administrativos y de negocio:**

Este paso tiene **13+ campos**:

- `profesionalId`: string (profesional que lo refiere)
- `canal`: string (¿cómo llegó? Instagram, Google, Referido...)
- `cobertura`: string (seguro médico)
- `pais`: string
- `pago1`: string (método de pago primario)
- `pago2`: string (método de pago secundario)
- `financiacion`: string (opciones de financiación)
- `facturaEmpresa`: boolean (si factura a empresa)
- `cif`: string (CIF/NIF de empresa)

**Dirección completa** (con autocompletado usando OpenStreetMap):
- `calle`: string
- `ciudad`: string
- `provincia`: string
- `codigoPostal`: string

- `notas`: string (notas administrativas, textarea)"

### Qué mostrar en VSCode:
Abre `src/components/pacientes/modals/add-patient/AddPatientStepAdministrativo.tsx` y muestra el código del autocompletado de dirección.

### Qué decir:
"Mira, tenemos un autocompletado de direcciones usando la API de Nominatim (OpenStreetMap). Esto ya funciona en el frontend, pero cuando el usuario selecciona una dirección, guardamos todos los campos desglosados."

---

### PASO 4: Salud

### Qué mostrar en navegador:
1. Click "Siguiente"
2. Muestra el paso de salud

### Qué decir:
"**Paso 4 - Información de salud:**

- `alergias`: string (textarea donde se escribe comma-separated)
- `medicamentos`: string (textarea) - placeholder por ahora
- `embarazo`: boolean (toggle)
- `tabaquismo`: boolean (toggle)
- `antecedentes`: string (select con opciones predefinidas)
- `miedo`: string (nivel de miedo/ansiedad, select)

Estos datos son críticos para el historial clínico."

---

### PASO 5: Consentimientos

### Qué mostrar en navegador:
1. Click "Siguiente"
2. Muestra los botones de consentimiento
3. Muestra la sección de subida de documentos

### Qué decir:
"**Paso 5 - Consentimientos y documentos:**

**Consentimientos** (3 checkboxes):
- `informativoGeneral`: boolean
- `proteccionDatos`: boolean (GDPR)
- `cesionImagenes`: boolean (derechos de imagen)

**Documentos** (file uploads):
- `derivacion`: File? (carta de derivación)
- `informes`: File? (informes médicos)
- `rx`: File? (radiografías)
- `fotos`: File? (fotos clínicas)

Cada archivo se sube y se muestra preview. El usuario puede borrar archivos antes de enviar."

---

### PASO 6: Resumen

### Qué mostrar en navegador:
1. Click "Siguiente"
2. Muestra el paso de resumen

### Qué decir:
"**Paso 6 - Resumen:**

Aquí se muestra TODO lo que el usuario rellenó:
- Avatar + nombre completo
- Email y teléfono
- Alergias (como pills)
- Notas administrativas
- Estado de consentimientos
- Preferencias de recordatorios/marketing

Y aquí está el botón **'Crear Paciente'**."

### Qué mostrar:
1. Click en "Crear Paciente"
2. El modal se cierra (pero NO se envía nada)

### Qué decir:
"Ahora mismo este botón solo cierra el modal. **Aquí es donde necesitas el endpoint más importante**:"

### Qué mostrar en VSCode:
Abre `src/components/pacientes/modals/add-patient/AddPatientModal.tsx` y busca el handler del botón.

### Qué decir:
"```
POST /api/patients

Body (JSON):
{
  // Paso 1: Paciente
  nombre: string,
  apellidos: string,
  fechaNacimiento: Date,
  dni: string,
  sexo: string,
  idioma: string,

  // Paso 2: Contacto
  telefono: string,
  email: string,
  contactPreferences: {
    whatsapp: boolean,
    sms: boolean,
    email: boolean,
    llamada: boolean
  },
  recordatorios: boolean,
  marketing: boolean,

  // Paso 3: Administrativo
  profesionalId: string,
  canal: string,
  cobertura: string,
  pais: string,
  pago1: string,
  pago2: string,
  financiacion: string,
  facturaEmpresa: boolean,
  cif: string,
  direccion: {
    calle: string,
    ciudad: string,
    provincia: string,
    codigoPostal: string
  },
  notas: string,

  // Paso 4: Salud
  alergias: string[],
  medicamentos: string[],
  embarazo: boolean,
  tabaquismo: boolean,
  antecedentes: string,
  miedo: string,

  // Paso 5: Consentimientos
  consentimientos: {
    informativoGeneral: boolean,
    proteccionDatos: boolean,
    cesionImagenes: boolean
  }
}

Response:
{
  patient: {
    id: string,
    ... todos los campos
  }
}
```

Para los **archivos** (avatar y documentos), harás uploads separados:
```
POST /api/patients/:id/avatar (FormData)
POST /api/patients/:id/documents (FormData)
```

O puedes hacer todo en un solo request con `multipart/form-data`."

---

## SECCIÓN 5: FICHA DEL PACIENTE (28:00-35:00)

### Qué mostrar en navegador:
1. Vuelve a `/pacientes`
2. Click en una fila de paciente
3. Se abre el modal de ficha del paciente (ENORME)

### Qué decir:
"Cuando haces click en un paciente, se abre **otro modal gigante** con 5 pestañas. Este modal muestra TODO el historial del paciente."

---

### Tab 1: Resumen

### Qué mostrar:
1. Muestra la pestaña "Resumen"

### Qué decir:
"**Tab 1 - Resumen:**
- Avatar y nombre del paciente
- Email y teléfono
- Alertas importantes
- Próximas citas
- Estado del paciente
- Botón de 'Presupuesto rápido'"

---

### Tab 2: Historial Clínico

### Qué mostrar:
1. Click en "Historial clínico"
2. Muestra los filtros: Próximas, Pasadas, Confirmadas, Inasistencia

### Qué decir:
"**Tab 2 - Historial Clínico:**

Aquí se muestran todas las citas del paciente con:
- Notas SOAP (Subjective, Objective, Assessment, Plan)
- Odontograma (carta dental interactiva)
- Archivos adjuntos
- Procedimientos realizados

**Endpoint necesario:**
```
GET /api/patients/:id/clinical
  Response: {
    records: [
      {
        id: string,
        date: Date,
        title: string,
        soapNotes: string,
        attachedFiles: string[],
        createdBy: string
      }
    ]
  }
```"

---

### Tab 3: Imágenes RX

### Qué mostrar:
1. Click en "Imágenes RX"

### Qué decir:
"**Tab 3 - Imágenes:**
- Fotos de antes/después
- Imágenes de escáner 3D
- Radiografías
- Fotos intraorales

Solo placeholder por ahora."

---

### Tab 4: Presupuestos y Pagos

### Qué mostrar:
1. Click en "Presupuestos y pagos"

### Qué decir:
"**Tab 4 - Presupuestos y Pagos:**

Este componente tiene **1393 líneas de código** - es el más complejo.

Muestra:
- Listado de presupuestos/propuestas
- Estado de pagos
- Facturas generadas
- Opciones de financiación
- Modal de crear presupuesto rápido

**Endpoints necesarios:**
```
GET /api/patients/:id/budgets
POST /api/budgets
PUT /api/budgets/:id
GET /api/budgets/:id/invoices
```"

---

### Tab 5: Consentimientos

### Qué mostrar:
1. Click en "Consentimientos"

### Qué decir:
"**Tab 5 - Consentimientos:**
- Listado de consentimientos firmados
- Upload de nuevos consentimientos
- Tracking de firmas
- Compliance tracking

**Endpoint:**
```
GET /api/patients/:id/consents
POST /api/patients/:id/consents
```"

---

## SECCIÓN 6: CALENDARIO Y CITAS (35:00-40:00)

### Qué mostrar en navegador:
1. Navega a `/agenda`
2. Muestra el calendario semanal

### Qué decir:
"**Agenda - Calendario semanal:**

Es un **week scheduler** que muestra Lunes a Domingo, con slots de 30 minutos desde las 9:00 AM hasta las 8:00 PM.

Las **citas** se muestran como cards posicionadas con CSS (top y height calculados según hora y duración)."

### Qué mostrar:
1. Click en una cita → overlay con detalles
2. Muestra: título, paciente, profesional, hora, duración, monto económico, notas

### Qué decir:
"Cada cita tiene esta información:
```typescript
{
  id: string,
  title: string,
  date: Date,
  startTime: string,
  duration: string,  // "30 min", "1 hora"
  patientId: string,
  professionalId: string,
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada',
  economicAmount?: number,
  notes?: string
}
```

**Endpoints necesarios:**
```
GET /api/appointments?date=2024-11-27&view=week
  Response: { appointments: Appointment[] }

POST /api/appointments
  Body: { date, startTime, duration, patientId, professionalId, notes }
  Response: { appointment: Appointment }

PUT /api/appointments/:id
DELETE /api/appointments/:id
```"

### Qué mostrar en navegador:
1. Click en "+ Nueva cita"
2. Se abre modal de crear cita
3. Muestra los campos

### Qué decir:
"El modal de crear cita pide:
- Paciente (select)
- Profesional (select)
- Fecha y hora
- Duración
- Monto económico
- Notas

Todo está listo en el frontend, solo falta conectarlo."

---

## SECCIÓN 7: DASHBOARD DE GESTIÓN (40:00-45:00)

### Qué mostrar en navegador:
1. Navega a `/gestion`
2. Muestra todo el dashboard

### Qué decir:
"**Dashboard de Gestión:**

Tiene **3 filas de componentes:**

**Fila 1 - KPI Cards:**
- Tipos de ingresos (breakdown)
- Resumen de pacientes
- Total de producción

**Fila 2 - Gráficos:**
- Gráfico de línea de facturación (12 meses, usando Recharts)
- Gráfico de dona por especialidad

**Fila 3 - Analytics:**
- Panel de contabilidad
- Barras de productividad por profesional"

### Qué mostrar en VSCode:
Abre `src/components/gestion/BillingLineChart.tsx` línea 41:
```typescript
const CHART_DATA = [
  { month: 'Ene', brand: 26000, accent: 24000 },
  { month: 'Feb', brand: 23000, accent: 37000 },
  // ... 12 meses
]
```

### Qué decir:
"Ves estos datos? **Están hardcodeados**. Necesito que me devuelvas datos reales con esta estructura.

**Endpoints necesarios:**
```
GET /api/analytics/billing?start=2024-01-01&end=2024-12-31
  Response: {
    data: [
      { month: 'Ene', brand: number, accent: number },
      ...
    ]
  }

GET /api/analytics/production
  Response: {
    total: number,
    byProfessional: { [id: string]: number },
    bySpecialty: { [name: string]: number }
  }

GET /api/analytics/income-types
  Response: {
    consultas: number,
    tratamientos: number,
    productos: number
  }

GET /api/analytics/patient-summary
  Response: {
    today: number,
    week: number,
    confirmed: number,
    checkIns: number
  }
```"

---

## SECCIÓN 8: GESTIÓN DE ESTADO Y FLUJO DE DATOS (45:00-48:00)

### Qué mostrar en VSCode:
Abre `src/components/pacientes/modals/add-patient/AddPatientModal.tsx` y muestra todos los `useState`:

### Qué decir:
"**Arquitectura actual de estado:**

Ahora mismo usamos **prop drilling** - todo el estado vive en componentes individuales y se pasa como props a los hijos.

Por ejemplo, este modal de añadir paciente tiene **24+ variables de estado** individuales:
```typescript
const [nombre, setNombre] = useState('')
const [apellidos, setApellidos] = useState('')
const [dni, setDni] = useState('')
// ... 21 más
```

**NO hay Redux, NO hay Context API, NO hay gestión global de estado.**

Esto funciona para un prototipo, pero cuando integres el backend, recomiendo:

1. **Crear un layer de API client:**
```typescript
// src/lib/api/patients.ts
export const patientsAPI = {
  list: (filters) => fetch('/api/patients', ...),
  create: (data) => fetch('/api/patients', { method: 'POST', body: data }),
  // ...
}
```

2. **Añadir Context para autenticación:**
```typescript
// src/context/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  // Lógica de login/logout
}
```

3. **Considerar un state manager global** (Redux, Zustand) si crece más."

---

## SECCIÓN 9: RESUMEN Y PRÓXIMOS PASOS (48:00-50:00)

### Qué decir:
"**Resumen de lo que necesitas construir:**

### **FASE 1 - Autenticación (Prioridad Alta)**
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me
- Manejo de JWT tokens

### **FASE 2 - Pacientes (Prioridad Alta)**
- GET /api/patients (con paginación, búsqueda, filtros)
- POST /api/patients (el grande - todos los 6 pasos)
- GET /api/patients/:id
- PUT /api/patients/:id
- DELETE /api/patients/:id
- POST /api/patients/:id/avatar
- POST /api/patients/:id/documents

### **FASE 3 - Citas (Prioridad Media)**
- GET /api/appointments
- POST /api/appointments
- PUT /api/appointments/:id
- DELETE /api/appointments/:id

### **FASE 4 - Analytics (Prioridad Media)**
- GET /api/analytics/billing
- GET /api/analytics/production
- GET /api/analytics/income-types
- GET /api/analytics/patient-summary

### **FASE 5 - Features Adicionales (Prioridad Baja)**
- Clinical records
- Budgets/Proposals
- Consents
- Invoices

**Base de datos sugerida:**

He creado un archivo `QUICK_START_BACKEND.md` con el esquema completo de base de datos sugerido. Incluye:
- Tabla `users` (autenticación)
- Tabla `patients` (con TODOS los campos de los 6 pasos)
- Tabla `appointments`
- Tabla `clinical_records`
- Tabla `budgets`
- Tabla `consents`
- Tabla `documents`

Te recomiendo usar **PostgreSQL** o **MySQL** con **Prisma ORM** para TypeScript, pero cualquier DB relacional funciona.

**Archivos de referencia que he creado:**
1. `KLINIKOS_ARCHITECTURE_ANALYSIS.md` - Análisis completo (20 secciones)
2. `LOOM_SCRIPT_OUTLINE.md` - Este script detallado
3. `QUICK_START_BACKEND.md` - Guía rápida con schemas y endpoints

**Dónde reemplazar mock data:**
- `/src/app/pacientes/page.tsx` línea 169: `MOCK_PATIENTS`
- `/src/components/gestion/BillingLineChart.tsx` línea 41: `CHART_DATA`
- `/src/components/agenda/WeekScheduler.tsx`: eventos hardcodeados

**Flujo de integración:**
1. Construyes los endpoints
2. Yo creo el API client layer (`src/lib/api/*`)
3. Reemplazo los arrays mock por `useEffect` + API calls
4. Añado loading states y error handling
5. Testing completo

**Si tienes preguntas:**
- Todos los componentes están organizados por feature en `src/components/`
- Los tipos TypeScript están definidos (usa esos para definir tu schema)
- El código está comentado y es bastante autoexplicativo

Espero que este video te ayude a entender el proyecto. Cualquier duda, escríbeme y hacemos otra llamada.

Suerte Nik!"

---

## TIPS PARA GRABAR EL VIDEO

1. **Habla despacio y claro** - Nik está aprendiendo el proyecto
2. **Muestra el código MIENTRAS explicas** - no solo hables
3. **Usa el cursor para señalar** líneas importantes de código
4. **Pausa entre secciones** - dale tiempo a procesar
5. **Zoom in** cuando muestres código específico
6. **Repite información crítica** - especialmente los endpoints
7. **Muestra ejemplos de requests/responses** en los comentarios
8. **No te apures** - mejor un video de 50 minutos completo que uno de 30 minutos confuso

---

## CHECKLIST ANTES DE ENVIAR

- [ ] Video grabado con audio claro
- [ ] Se ve bien el código (tamaño de fuente adecuado)
- [ ] Mostraste las 5 features principales
- [ ] Explicaste el modal de añadir paciente (los 6 pasos)
- [ ] Mostraste dónde está el mock data
- [ ] Explicaste los endpoints necesarios
- [ ] Compartiste los 3 archivos markdown de referencia
- [ ] Link de Loom compartido con Nik

---

## NOTA FINAL

Este script está diseñado para que sea **conversacional pero completo**. No tienes que seguirlo palabra por palabra - usa tu propio estilo. Lo importante es:

1. ✅ Mostrar TODO el frontend funcionando
2. ✅ Explicar QUÉ datos necesita cada pantalla
3. ✅ Especificar EXACTAMENTE qué endpoints construir
4. ✅ Proporcionar el esquema de base de datos
5. ✅ Darle archivos de referencia para consultar

**¡Buena suerte con el Loom!** 🎥
