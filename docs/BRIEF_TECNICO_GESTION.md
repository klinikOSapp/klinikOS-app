# Brief Técnico: Módulo de Gestión (Dashboard) - klinikOS

**Fecha:** 2 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** MVP (Primera versión completa)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Arquitectura:** Multi-tenant desde el inicio

---

## ⚠️ PRINCIPIO FUNDAMENTAL

> **EL MÓDULO DE GESTIÓN ES UN DASHBOARD DE SOLO LECTURA QUE AGREGA DATOS DE TODOS LOS DEMÁS MÓDULOS.**

El módulo de Gestión **NO genera datos propios**. Es una **capa de agregación y visualización** que consume datos de:

- **Ficha del Paciente** → `payments`, `budgets`, `invoices`, `treatments`
- **Agenda** → `appointments`, `visit_status_history`
- **Caja** → `cash_closings`, `cash_transactions_view`
- **Configuración** → `staff`, `specialties`, `clinic_settings`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE DATOS AL DASHBOARD                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ FICHA PACIENTE  │──┐                                                     │
│  │ payments        │  │                                                     │
│  │ budgets         │  │                                                     │
│  │ treatments      │  │                                                     │
│  └─────────────────┘  │                                                     │
│                       │      ┌────────────────────────────────────┐         │
│  ┌─────────────────┐  │      │                                    │         │
│  │     AGENDA      │──┼─────►│     MÓDULO GESTIÓN (Dashboard)     │         │
│  │ appointments    │  │      │                                    │         │
│  │ visit_status    │  │      │  • Solo lectura                    │         │
│  └─────────────────┘  │      │  • Agregación de datos             │         │
│                       │      │  • Visualizaciones y KPIs          │         │
│  ┌─────────────────┐  │      │  • Filtros por período/especialidad│         │
│  │      CAJA       │──┤      │                                    │         │
│  │ cash_closings   │  │      └────────────────────────────────────┘         │
│  │ transactions    │  │                                                     │
│  └─────────────────┘  │                                                     │
│                       │                                                     │
│  ┌─────────────────┐  │                                                     │
│  │  CONFIGURACIÓN  │──┘                                                     │
│  │ staff           │                                                        │
│  │ specialties     │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Visión General

### 1.1 Descripción

El **Módulo de Gestión** (Dashboard) es el centro de inteligencia de negocio de la clínica. Proporciona una visión ejecutiva de todas las métricas clave: ingresos, producción, pacientes, rendimiento por profesional y por especialidad.

### 1.2 Acceso Restringido

⚠️ **Solo accesible para el rol Administrador**. El resto de roles (Recepción, Higienista, Doctor) no tienen acceso a este módulo.

### 1.3 Componentes del Dashboard

| Componente              | Descripción                            | Datos de Origen              |
| ----------------------- | -------------------------------------- | ---------------------------- |
| **IncomeTypes**         | Desglose por método de pago            | `payments.payment_method`    |
| **PatientsSummary**     | Pacientes activos, nuevos, crecimiento | `patients`, `appointments`   |
| **ProductionTotalCard** | Producido vs Facturado                 | `treatments`, `invoices`     |
| **BillingLineChart**    | Evolución temporal de facturación      | `invoices`, histórico        |
| **SpecialtyDonut**      | Distribución por especialidad          | `treatments.specialty`       |
| **AccountingPanel**     | KPIs contables completos               | `payments`, `invoices`       |
| **ProfessionalBars**    | Producción por profesional             | `appointments`, `treatments` |

### 1.4 Funcionalidades Principales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MÓDULO DE GESTIÓN (DASHBOARD)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 MÉTRICAS FINANCIERAS                 📈 ANÁLISIS TEMPORAL               │
│  ├─ Producido (trabajo realizado)        ├─ Evolución de facturación        │
│  ├─ Facturado (presupuestos emitidos)    ├─ Comparativa año anterior        │
│  ├─ Cobrado (dinero recibido)            ├─ Tendencias por período          │
│  ├─ Pendiente de cobrar                  └─ Proyecciones                    │
│  └─ Desglose por método de pago                                             │
│                                                                             │
│  👥 MÉTRICAS DE PACIENTES                👨‍⚕️ RENDIMIENTO PROFESIONAL         │
│  ├─ Pacientes activos                    ├─ Producción por doctor           │
│  ├─ Pacientes nuevos                     ├─ Producción por higienista       │
│  ├─ Tasa de crecimiento                  └─ Ranking de rendimiento          │
│  └─ Retención de pacientes                                                  │
│                                                                             │
│  🏥 ANÁLISIS POR ESPECIALIDAD            🔍 FILTROS DISPONIBLES             │
│  ├─ Conservadora                         ├─ Período: Día / Semana / Mes     │
│  ├─ Ortodoncia                           ├─ Especialidad (interactivo)      │
│  ├─ Implantes                            └─ Navegación temporal             │
│  └─ Estética                                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Períodos Temporales

| Escala  | Descripción                               |
| ------- | ----------------------------------------- |
| `day`   | Vista diaria (datos del día seleccionado) |
| `week`  | Vista semanal (lunes a domingo)           |
| `month` | Vista mensual (mes completo)              |

### 1.6 Especialidades Soportadas

```typescript
type Specialty = 'Conservadora' | 'Ortodoncia' | 'Implantes' | 'Estética'
```

---

## 2. Métricas y KPIs

### 2.1 Definición de Métricas Financieras

| Métrica        | Definición                                             | Cálculo                                                  |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **Producido**  | Valor del trabajo realizado (tratamientos completados) | `SUM(treatments.price) WHERE status = 'completed'`       |
| **Facturado**  | Valor de presupuestos emitidos/aceptados               | `SUM(invoices.total) WHERE status IN ('issued', 'paid')` |
| **Cobrado**    | Dinero efectivamente recibido                          | `SUM(payments.amount) WHERE status = 'Completado'`       |
| **Por Cobrar** | Diferencia entre facturado y cobrado                   | `Facturado - Cobrado`                                    |

### 2.2 Flujo de Métricas

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE MÉTRICAS FINANCIERAS                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. PRODUCIDO (Trabajo realizado)                                         │
│     │                                                                     │
│     │  Tratamiento completado ────► Suma al "Producido"                   │
│     │                                                                     │
│     ▼                                                                     │
│  2. FACTURADO (Presupuesto emitido)                                       │
│     │                                                                     │
│     │  Se genera factura/presupuesto ────► Suma al "Facturado"            │
│     │                                                                     │
│     │  ⚠️ RATIO: Facturado / Producido = % de facturación                 │
│     │                                                                     │
│     ▼                                                                     │
│  3. COBRADO (Pago recibido)                                               │
│     │                                                                     │
│     │  Paciente paga ────► Suma al "Cobrado"                              │
│     │                                                                     │
│     │  ⚠️ RATIO: Cobrado / Facturado = % de cobro                         │
│     │                                                                     │
│     ▼                                                                     │
│  4. POR COBRAR (Pendiente)                                                │
│                                                                           │
│     Facturado - Cobrado = "Por Cobrar"                                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Métricas de Pacientes

| Métrica         | Definición                            | Cálculo                                                             |
| --------------- | ------------------------------------- | ------------------------------------------------------------------- |
| **Activos**     | Pacientes con actividad en el período | `COUNT(DISTINCT patient_id) FROM appointments WHERE date IN period` |
| **Nuevos**      | Pacientes creados en el período       | `COUNT(*) FROM patients WHERE created_at IN period`                 |
| **Crecimiento** | Variación vs período anterior         | `(Nuevos_actual / Nuevos_anterior - 1) * 100`                       |

### 2.4 Métricas por Profesional

| Métrica             | Definición                                       | Cálculo                                                                               |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Producción**      | Valor de tratamientos realizados por profesional | `SUM(treatments.price) WHERE professional_id = X AND status = 'completed'`            |
| **Citas atendidas** | Número de citas completadas                      | `COUNT(*) FROM appointments WHERE professional_id = X AND visit_status = 'completed'` |

---

## 3. Arquitectura de Datos

### 3.1 Fuentes de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FUENTES DE DATOS PARA DASHBOARD                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│     payments       │     │    appointments    │     │    treatments      │
│                    │     │                    │     │                    │
│ • amount           │     │ • patient_id       │     │ • price            │
│ • payment_method   │     │ • professional_id  │     │ • specialty        │
│ • payment_date     │     │ • appointment_date │     │ • status           │
│ • status           │     │ • visit_status     │     │ • professional_id  │
└─────────┬──────────┘     └─────────┬──────────┘     └─────────┬──────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │   DASHBOARD AGGREGATION LAYER  │
                    │                                │
                    │   Vistas Materializadas        │
                    │   Funciones de Agregación      │
                    │   Caché de Métricas            │
                    └────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ financial_summary  │     │ patient_metrics    │     │ professional_stats │
│                    │     │                    │     │                    │
│ • produced         │     │ • active_count     │     │ • production       │
│ • invoiced         │     │ • new_count        │     │ • appointments     │
│ • collected        │     │ • growth_rate      │     │ • by_specialty     │
│ • pending          │     │                    │     │                    │
└────────────────────┘     └────────────────────┘     └────────────────────┘
```

### 3.2 No Requiere Tablas Propias

El módulo de Gestión **NO necesita tablas propias**. Utiliza:

1. **Vistas** para agregar datos en tiempo real
2. **Vistas Materializadas** para métricas pre-calculadas (rendimiento)
3. **Funciones** para cálculos complejos bajo demanda

---

## 4. Funciones de Base de Datos

### 4.1 Función: Obtener Métricas Financieras del Período

```sql
CREATE OR REPLACE FUNCTION get_financial_metrics(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    produced DECIMAL,
    invoiced DECIMAL,
    collected DECIMAL,
    pending DECIMAL,
    produced_delta DECIMAL,
    invoiced_delta DECIMAL,
    collected_delta DECIMAL,
    by_method JSONB
) AS $$
DECLARE
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
BEGIN
    -- Calcular período anterior para comparativa
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    RETURN QUERY
    WITH current_period AS (
        -- PRODUCIDO: Tratamientos completados
        SELECT
            COALESCE(SUM(t.price), 0) AS produced
        FROM patient_treatments t
        JOIN appointments a ON a.id = t.appointment_id
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    ),
    current_invoiced AS (
        -- FACTURADO: Facturas emitidas
        SELECT
            COALESCE(SUM(i.total_amount), 0) AS invoiced
        FROM invoices i
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN p_start_date AND p_end_date
        AND i.status IN ('issued', 'paid', 'partial')
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM invoice_items ii
            JOIN patient_treatments pt ON pt.id = ii.treatment_id
            WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
        ))
    ),
    current_collected AS (
        -- COBRADO: Pagos recibidos
        SELECT
            COALESCE(SUM(p.amount), 0) AS collected,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo'), 0),
                'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv'), 0),
                'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia'), 0),
                'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion'), 0),
                'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros'), 0)
            ) AS by_method
        FROM payments p
        WHERE p.clinic_id = p_clinic_id
        AND p.payment_date BETWEEN p_start_date AND p_end_date
        AND p.status = 'Completado'
        -- Filtro por especialidad a través del tratamiento asociado
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM patient_treatments pt
            WHERE pt.budget_id = p.budget_id AND pt.specialty = p_specialty
        ))
    ),
    prev_period AS (
        -- Período anterior para calcular deltas
        SELECT
            COALESCE(SUM(t.price), 0) AS prev_produced,
            (SELECT COALESCE(SUM(total_amount), 0)
             FROM invoices
             WHERE clinic_id = p_clinic_id
             AND invoice_date BETWEEN v_prev_start AND v_prev_end
             AND status IN ('issued', 'paid', 'partial')) AS prev_invoiced,
            (SELECT COALESCE(SUM(amount), 0)
             FROM payments
             WHERE clinic_id = p_clinic_id
             AND payment_date BETWEEN v_prev_start AND v_prev_end
             AND status = 'Completado') AS prev_collected
        FROM patient_treatments t
        JOIN appointments a ON a.id = t.appointment_id
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN v_prev_start AND v_prev_end
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    )
    SELECT
        cp.produced,
        ci.invoiced,
        cc.collected,
        (ci.invoiced - cc.collected) AS pending,
        -- Deltas (% de cambio)
        CASE WHEN pp.prev_produced > 0
            THEN ((cp.produced - pp.prev_produced) / pp.prev_produced * 100)
            ELSE 0
        END AS produced_delta,
        CASE WHEN pp.prev_invoiced > 0
            THEN ((ci.invoiced - pp.prev_invoiced) / pp.prev_invoiced * 100)
            ELSE 0
        END AS invoiced_delta,
        CASE WHEN pp.prev_collected > 0
            THEN ((cc.collected - pp.prev_collected) / pp.prev_collected * 100)
            ELSE 0
        END AS collected_delta,
        cc.by_method
    FROM current_period cp
    CROSS JOIN current_invoiced ci
    CROSS JOIN current_collected cc
    CROSS JOIN prev_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Función: Obtener Métricas de Pacientes

```sql
CREATE OR REPLACE FUNCTION get_patient_metrics(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    active_patients INTEGER,
    new_patients INTEGER,
    growth_rate DECIMAL,
    active_percent DECIMAL,
    new_percent DECIMAL
) AS $$
DECLARE
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
    v_total_patients INTEGER;
BEGIN
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    -- Total de pacientes de la clínica
    SELECT COUNT(*) INTO v_total_patients
    FROM patients
    WHERE clinic_id = p_clinic_id
    AND is_deleted = FALSE;

    RETURN QUERY
    WITH current_metrics AS (
        -- Pacientes activos (con cita en el período)
        SELECT COUNT(DISTINCT a.patient_id) AS active_count
        FROM appointments a
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND a.is_cancelled = FALSE
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM appointment_linked_treatments alt
            JOIN patient_treatments pt ON pt.id = alt.treatment_id
            WHERE alt.appointment_id = a.id AND pt.specialty = p_specialty
        ))
    ),
    new_patients AS (
        -- Pacientes nuevos (creados en el período)
        SELECT COUNT(*) AS new_count
        FROM patients p
        WHERE p.clinic_id = p_clinic_id
        AND p.created_at::DATE BETWEEN p_start_date AND p_end_date
        AND p.is_deleted = FALSE
    ),
    prev_metrics AS (
        -- Métricas del período anterior
        SELECT
            COUNT(DISTINCT a.patient_id) AS prev_active,
            (SELECT COUNT(*) FROM patients
             WHERE clinic_id = p_clinic_id
             AND created_at::DATE BETWEEN v_prev_start AND v_prev_end
             AND is_deleted = FALSE) AS prev_new
        FROM appointments a
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN v_prev_start AND v_prev_end
        AND a.is_cancelled = FALSE
    )
    SELECT
        cm.active_count::INTEGER,
        np.new_count::INTEGER,
        CASE WHEN pm.prev_new > 0
            THEN ((np.new_count - pm.prev_new)::DECIMAL / pm.prev_new * 100)
            ELSE 0
        END AS growth_rate,
        CASE WHEN v_total_patients > 0
            THEN (cm.active_count::DECIMAL / v_total_patients * 100)
            ELSE 0
        END AS active_percent,
        CASE WHEN (cm.active_count + np.new_count) > 0
            THEN (np.new_count::DECIMAL / (cm.active_count + np.new_count) * 100)
            ELSE 0
        END AS new_percent
    FROM current_metrics cm
    CROSS JOIN new_patients np
    CROSS JOIN prev_metrics pm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 Función: Obtener Producción por Profesional

```sql
CREATE OR REPLACE FUNCTION get_professional_production(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    professional_id UUID,
    professional_name VARCHAR,
    role VARCHAR,
    production DECIMAL,
    appointments_count INTEGER,
    specialties JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS professional_id,
        s.full_name AS professional_name,
        s.role,
        COALESCE(SUM(t.price), 0)::DECIMAL AS production,
        COUNT(DISTINCT a.id)::INTEGER AS appointments_count,
        (
            SELECT jsonb_agg(DISTINCT t2.specialty)
            FROM patient_treatments t2
            JOIN appointments a2 ON a2.id = t2.appointment_id
            WHERE a2.professional_id = s.id
            AND t2.specialty IS NOT NULL
        ) AS specialties
    FROM staff s
    LEFT JOIN appointments a ON a.professional_id = s.id
        AND a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND a.visit_status = 'completed'
    LEFT JOIN patient_treatments t ON t.appointment_id = a.id
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    WHERE s.clinic_id = p_clinic_id
    AND s.is_active = TRUE
    AND s.role IN ('Doctor', 'Higienista')
    GROUP BY s.id, s.full_name, s.role
    ORDER BY production DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 Función: Obtener Distribución por Especialidad

```sql
CREATE OR REPLACE FUNCTION get_specialty_distribution(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    specialty VARCHAR,
    invoiced DECIMAL,
    percentage DECIMAL,
    delta DECIMAL
) AS $$
DECLARE
    v_total_invoiced DECIMAL;
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
BEGIN
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    -- Total facturado del período
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_invoiced
    FROM invoices
    WHERE clinic_id = p_clinic_id
    AND invoice_date BETWEEN p_start_date AND p_end_date
    AND status IN ('issued', 'paid', 'partial');

    RETURN QUERY
    WITH specialty_invoiced AS (
        SELECT
            pt.specialty,
            COALESCE(SUM(ii.amount), 0) AS amount
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN patient_treatments pt ON pt.id = ii.treatment_id
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN p_start_date AND p_end_date
        AND i.status IN ('issued', 'paid', 'partial')
        AND pt.specialty IS NOT NULL
        GROUP BY pt.specialty
    ),
    prev_specialty AS (
        SELECT
            pt.specialty,
            COALESCE(SUM(ii.amount), 0) AS prev_amount
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN patient_treatments pt ON pt.id = ii.treatment_id
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN v_prev_start AND v_prev_end
        AND i.status IN ('issued', 'paid', 'partial')
        AND pt.specialty IS NOT NULL
        GROUP BY pt.specialty
    )
    SELECT
        si.specialty,
        si.amount AS invoiced,
        CASE WHEN v_total_invoiced > 0
            THEN (si.amount / v_total_invoiced * 100)
            ELSE 0
        END AS percentage,
        CASE WHEN COALESCE(ps.prev_amount, 0) > 0
            THEN ((si.amount - COALESCE(ps.prev_amount, 0)) / ps.prev_amount * 100)
            ELSE 0
        END AS delta
    FROM specialty_invoiced si
    LEFT JOIN prev_specialty ps ON ps.specialty = si.specialty
    ORDER BY si.amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.5 Función: Obtener Evolución de Facturación

```sql
CREATE OR REPLACE FUNCTION get_billing_evolution(
    p_clinic_id UUID,
    p_time_scale VARCHAR, -- 'week' | 'month'
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    period_label VARCHAR,
    period_start DATE,
    current_value DECIMAL,
    previous_year_value DECIMAL
) AS $$
DECLARE
    v_periods INTEGER := 12; -- Mostrar 12 períodos
BEGIN
    IF p_time_scale = 'month' THEN
        RETURN QUERY
        WITH periods AS (
            SELECT
                generate_series(
                    DATE_TRUNC('month', p_anchor_date) - INTERVAL '9 months',
                    DATE_TRUNC('month', p_anchor_date) + INTERVAL '2 months',
                    INTERVAL '1 month'
                )::DATE AS period_start
        )
        SELECT
            TO_CHAR(p.period_start, 'Mon') AS period_label,
            p.period_start,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND DATE_TRUNC('month', i.invoice_date) = p.period_start
                AND i.status IN ('issued', 'paid', 'partial')
                AND p.period_start <= DATE_TRUNC('month', CURRENT_DATE)
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS current_value,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND DATE_TRUNC('month', i.invoice_date) = p.period_start - INTERVAL '1 year'
                AND i.status IN ('issued', 'paid', 'partial')
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS previous_year_value
        FROM periods p
        ORDER BY p.period_start;
    ELSE -- week
        RETURN QUERY
        WITH periods AS (
            SELECT
                generate_series(
                    DATE_TRUNC('week', p_anchor_date) - INTERVAL '9 weeks',
                    DATE_TRUNC('week', p_anchor_date) + INTERVAL '2 weeks',
                    INTERVAL '1 week'
                )::DATE AS period_start
        )
        SELECT
            'S' || EXTRACT(WEEK FROM p.period_start)::TEXT AS period_label,
            p.period_start,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND i.invoice_date >= p.period_start
                AND i.invoice_date < p.period_start + INTERVAL '1 week'
                AND i.status IN ('issued', 'paid', 'partial')
                AND p.period_start <= DATE_TRUNC('week', CURRENT_DATE)
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS current_value,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND i.invoice_date >= p.period_start - INTERVAL '1 year'
                AND i.invoice_date < p.period_start - INTERVAL '1 year' + INTERVAL '1 week'
                AND i.status IN ('issued', 'paid', 'partial')
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS previous_year_value
        FROM periods p
        ORDER BY p.period_start;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.6 Función: Obtener Dashboard Completo

```sql
-- Función principal que devuelve todos los datos del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_clinic_id UUID,
    p_time_scale VARCHAR, -- 'day' | 'week' | 'month'
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_result JSONB;
BEGIN
    -- Calcular rango de fechas según escala
    CASE p_time_scale
        WHEN 'day' THEN
            v_start_date := p_anchor_date;
            v_end_date := p_anchor_date;
        WHEN 'week' THEN
            v_start_date := DATE_TRUNC('week', p_anchor_date)::DATE;
            v_end_date := v_start_date + INTERVAL '6 days';
        WHEN 'month' THEN
            v_start_date := DATE_TRUNC('month', p_anchor_date)::DATE;
            v_end_date := (DATE_TRUNC('month', p_anchor_date) + INTERVAL '1 month - 1 day')::DATE;
        ELSE
            v_start_date := DATE_TRUNC('week', p_anchor_date)::DATE;
            v_end_date := v_start_date + INTERVAL '6 days';
    END CASE;

    -- Construir respuesta JSON con todos los datos
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', v_start_date,
            'end_date', v_end_date,
            'time_scale', p_time_scale,
            'specialty_filter', p_specialty
        ),
        'financial', (
            SELECT row_to_json(f.*)
            FROM get_financial_metrics(p_clinic_id, v_start_date, v_end_date, p_specialty) f
        ),
        'patients', (
            SELECT row_to_json(p.*)
            FROM get_patient_metrics(p_clinic_id, v_start_date, v_end_date, p_specialty) p
        ),
        'professionals', (
            SELECT jsonb_agg(row_to_json(pr.*))
            FROM get_professional_production(p_clinic_id, v_start_date, v_end_date, p_specialty) pr
        ),
        'specialties', (
            SELECT jsonb_agg(row_to_json(s.*))
            FROM get_specialty_distribution(p_clinic_id, v_start_date, v_end_date) s
        ),
        'billing_evolution', (
            SELECT jsonb_agg(row_to_json(b.*))
            FROM get_billing_evolution(p_clinic_id, p_time_scale, p_anchor_date, p_specialty) b
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Vistas Materializadas (Optimización)

### 5.1 Vista Materializada: Resumen Diario

```sql
-- Para mejorar rendimiento en dashboards que consultan históricos
CREATE MATERIALIZED VIEW daily_dashboard_summary AS
SELECT
    clinic_id,
    date,
    -- Métricas financieras
    produced,
    invoiced,
    collected,
    (invoiced - collected) AS pending,
    -- Métricas de pacientes
    active_patients,
    new_patients,
    -- Desglose por método
    by_payment_method,
    -- Desglose por especialidad
    by_specialty,
    -- Desglose por profesional
    by_professional
FROM (
    SELECT
        a.clinic_id,
        a.appointment_date AS date,
        -- Producido
        COALESCE(SUM(t.price) FILTER (WHERE t.status = 'completed'), 0) AS produced,
        -- Facturado (simplificado)
        (SELECT COALESCE(SUM(total_amount), 0)
         FROM invoices
         WHERE clinic_id = a.clinic_id
         AND invoice_date = a.appointment_date) AS invoiced,
        -- Cobrado
        (SELECT COALESCE(SUM(amount), 0)
         FROM payments
         WHERE clinic_id = a.clinic_id
         AND payment_date = a.appointment_date
         AND status = 'Completado') AS collected,
        -- Pacientes
        COUNT(DISTINCT a.patient_id) AS active_patients,
        (SELECT COUNT(*) FROM patients
         WHERE clinic_id = a.clinic_id
         AND created_at::DATE = a.appointment_date) AS new_patients,
        -- Desglose por método
        (SELECT jsonb_object_agg(payment_method, total)
         FROM (
             SELECT payment_method, SUM(amount) AS total
             FROM payments
             WHERE clinic_id = a.clinic_id
             AND payment_date = a.appointment_date
             AND status = 'Completado'
             GROUP BY payment_method
         ) pm) AS by_payment_method,
        -- Desglose por especialidad
        (SELECT jsonb_object_agg(specialty, total)
         FROM (
             SELECT t2.specialty, SUM(t2.price) AS total
             FROM patient_treatments t2
             JOIN appointments a2 ON a2.id = t2.appointment_id
             WHERE a2.clinic_id = a.clinic_id
             AND a2.appointment_date = a.appointment_date
             AND t2.status = 'completed'
             GROUP BY t2.specialty
         ) sp) AS by_specialty,
        -- Desglose por profesional
        (SELECT jsonb_object_agg(professional_id::TEXT, total)
         FROM (
             SELECT a3.professional_id, SUM(t3.price) AS total
             FROM appointments a3
             JOIN patient_treatments t3 ON t3.appointment_id = a3.id
             WHERE a3.clinic_id = a.clinic_id
             AND a3.appointment_date = a.appointment_date
             AND t3.status = 'completed'
             GROUP BY a3.professional_id
         ) prof) AS by_professional
    FROM appointments a
    LEFT JOIN patient_treatments t ON t.appointment_id = a.id
    WHERE a.is_cancelled = FALSE
    GROUP BY a.clinic_id, a.appointment_date
) aggregated;

CREATE UNIQUE INDEX idx_daily_dashboard_summary
ON daily_dashboard_summary(clinic_id, date);

-- Refrescar diariamente (cron job o trigger)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_dashboard_summary;
```

---

## 6. Row Level Security (RLS)

### 6.1 Acceso Solo para Administradores

```sql
-- Las funciones de dashboard usan SECURITY DEFINER
-- El control de acceso se hace a nivel de aplicación

-- Función auxiliar para verificar rol de administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'Administrador'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper de seguridad para el dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data_secure(
    p_clinic_id UUID,
    p_time_scale VARCHAR,
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    -- Verificar que el usuario es administrador
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Acceso denegado: se requiere rol de Administrador';
    END IF;

    -- Verificar que el usuario pertenece a la clínica
    IF p_clinic_id != get_user_clinic_id() THEN
        RAISE EXCEPTION 'Acceso denegado: clínica no autorizada';
    END IF;

    RETURN get_dashboard_data(p_clinic_id, p_time_scale, p_anchor_date, p_specialty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Conexiones con Otros Módulos

### 7.1 Mapa de Conexiones (Solo Lectura)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CONEXIONES DEL MÓDULO DE GESTIÓN (SOLO LECTURA)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ FICHA PACIENTE  │                      │     AGENDA      │               │
│  │                 │                      │                 │               │
│  │ payments ───────┼──────────────────────┼─► appointments  │               │
│  │ budgets ────────┼──────┐               │   visit_status  │               │
│  │ treatments ─────┼──────┤               └────────┬────────┘               │
│  │ invoices ───────┼──────┤                        │                        │
│  └─────────────────┘      │                        │                        │
│                           │                        │                        │
│                           ▼                        ▼                        │
│                    ┌─────────────────────────────────────┐                  │
│                    │                                     │                  │
│                    │       MÓDULO DE GESTIÓN             │                  │
│                    │         (Dashboard)                 │                  │
│                    │                                     │                  │
│                    │  ┌─────────────────────────────┐   │                  │
│                    │  │  Solo LECTURA de:           │   │                  │
│                    │  │  • payments                 │   │                  │
│                    │  │  • invoices                 │   │                  │
│                    │  │  • treatments               │   │                  │
│                    │  │  • appointments             │   │                  │
│                    │  │  • patients                 │   │                  │
│                    │  │  • staff                    │   │                  │
│                    │  └─────────────────────────────┘   │                  │
│                    │                                     │                  │
│                    └─────────────────────────────────────┘                  │
│                           ▲                        ▲                        │
│                           │                        │                        │
│  ┌─────────────────┐      │                        │                        │
│  │      CAJA       │──────┘               ┌────────┴────────┐               │
│  │                 │                      │  CONFIGURACIÓN  │               │
│  │ cash_closings   │                      │                 │               │
│  │ transactions    │                      │ staff           │               │
│  └─────────────────┘                      │ specialties     │               │
│                                           │ clinic_settings │               │
│                                           └─────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Queries de Conexión

#### 7.2.1 Datos de Ficha del Paciente

```sql
-- Métricas financieras del paciente
SELECT
    p.id AS patient_id,
    p.full_name,
    COALESCE(SUM(pay.amount), 0) AS total_paid,
    COALESCE(SUM(b.total_amount), 0) AS total_budgeted,
    COUNT(DISTINCT t.id) AS treatments_count
FROM patients p
LEFT JOIN payments pay ON pay.patient_id = p.id AND pay.status = 'Completado'
LEFT JOIN budgets b ON b.patient_id = p.id
LEFT JOIN patient_treatments t ON t.patient_id = p.id
WHERE p.clinic_id = :clinic_id
GROUP BY p.id, p.full_name;
```

#### 7.2.2 Datos de Agenda

```sql
-- Métricas de citas y profesionales
SELECT
    s.id AS professional_id,
    s.full_name,
    s.role,
    COUNT(a.id) AS total_appointments,
    COUNT(a.id) FILTER (WHERE a.visit_status = 'completed') AS completed,
    COUNT(a.id) FILTER (WHERE a.visit_status = 'no_show') AS no_shows
FROM staff s
LEFT JOIN appointments a ON a.professional_id = s.id
    AND a.appointment_date BETWEEN :start_date AND :end_date
WHERE s.clinic_id = :clinic_id
AND s.is_active = TRUE
GROUP BY s.id, s.full_name, s.role;
```

#### 7.2.3 Datos de Caja

```sql
-- Métricas de cierres de caja
SELECT
    DATE_TRUNC(:time_scale, closing_date) AS period,
    SUM(total_income) AS total_income,
    SUM(total_expenses) AS total_expenses,
    AVG(final_balance) AS avg_balance,
    jsonb_object_agg(
        closing_date::TEXT,
        income_by_method
    ) AS daily_breakdown
FROM cash_closings
WHERE clinic_id = :clinic_id
AND closing_date BETWEEN :start_date AND :end_date
AND status = 'closed'
GROUP BY DATE_TRUNC(:time_scale, closing_date);
```

---

## 8. Índices y Optimización

### 8.1 Índices Críticos para Dashboard

```sql
-- Índice para métricas financieras por período
CREATE INDEX CONCURRENTLY idx_payments_dashboard
ON payments(clinic_id, payment_date, status, payment_method)
WHERE status = 'Completado';

-- Índice para métricas de producción
CREATE INDEX CONCURRENTLY idx_treatments_dashboard
ON patient_treatments(appointment_id, status, specialty, price)
WHERE status = 'completed';

-- Índice para métricas de pacientes
CREATE INDEX CONCURRENTLY idx_appointments_dashboard
ON appointments(clinic_id, appointment_date, professional_id, visit_status)
WHERE is_cancelled = FALSE;

-- Índice para facturación
CREATE INDEX CONCURRENTLY idx_invoices_dashboard
ON invoices(clinic_id, invoice_date, status, total_amount)
WHERE status IN ('issued', 'paid', 'partial');

-- Índice para pacientes nuevos
CREATE INDEX CONCURRENTLY idx_patients_created
ON patients(clinic_id, created_at)
WHERE is_deleted = FALSE;
```

### 8.2 Estrategia de Caché

```sql
-- Configurar caché de funciones (si Supabase lo soporta)
-- Alternativamente, usar Redis o caché de aplicación

-- Las vistas materializadas se refrescan:
-- - daily_dashboard_summary: Una vez al día (medianoche)
-- - O bajo demanda cuando se cierra la caja del día

-- Trigger para invalidar caché cuando hay cambios significativos
CREATE OR REPLACE FUNCTION invalidate_dashboard_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar caché como inválido (implementación específica)
    PERFORM pg_notify('dashboard_cache_invalidate',
        json_build_object(
            'clinic_id', COALESCE(NEW.clinic_id, OLD.clinic_id),
            'date', CURRENT_DATE
        )::TEXT
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER trg_invalidate_dashboard_payments
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION invalidate_dashboard_cache();

CREATE TRIGGER trg_invalidate_dashboard_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION invalidate_dashboard_cache();
```

---

## 9. Plan de Implementación Sugerido

### Fase 1: Fundamentos (Semana 1)

- [ ] Verificar que todas las tablas fuente existen
- [ ] Crear funciones auxiliares (`is_admin_user`, etc.)
- [ ] Implementar `get_financial_metrics()`
- [ ] Implementar `get_patient_metrics()`

### Fase 2: Funciones de Análisis (Semana 2)

- [ ] Implementar `get_professional_production()`
- [ ] Implementar `get_specialty_distribution()`
- [ ] Implementar `get_billing_evolution()`
- [ ] Crear función principal `get_dashboard_data()`

### Fase 3: Optimización (Semana 3)

- [ ] Crear índices de rendimiento
- [ ] Implementar vista materializada `daily_dashboard_summary`
- [ ] Configurar refresh automático
- [ ] Testing de rendimiento

### Fase 4: Seguridad y API (Semana 4)

- [ ] Implementar `get_dashboard_data_secure()`
- [ ] Crear endpoints de API (Edge Functions)
- [ ] Testing de seguridad
- [ ] Documentación de API

---

## 10. Referencias

### 10.1 Archivos Frontend Relacionados

```
src/
├── app/
│   └── gestion/page.tsx                   # Página principal del dashboard
│
├── components/gestion/
│   ├── AccountingPanel.tsx                # Panel de contabilidad
│   ├── BillingLineChart.tsx               # Gráfico de facturación
│   ├── IncomeTypes.tsx                    # Métodos de pago
│   ├── PatientsSummary.tsx                # Métricas de pacientes
│   ├── ProductionTotalCard.tsx            # Producido vs Facturado
│   ├── ProfessionalBars.tsx               # Barras por profesional
│   ├── SpecialtyDonut.tsx                 # Donut por especialidad
│   └── gestionTypes.ts                    # Tipos
│
└── components/caja/
    └── CashToolbar.tsx                    # Reutilizado para navegación
```

### 10.2 Documentos Relacionados

- **BRIEF_TECNICO_FICHA_PACIENTE.md** - Tablas: `payments`, `budgets`, `treatments`, `invoices`
- **BRIEF_TECNICO_AGENDA.md** - Tablas: `appointments`, `staff`
- **BRIEF_TECNICO_CAJA.md** - Tablas: `cash_closings`

---

## 11. Notas Importantes

### 11.1 Principio de Solo Lectura

⚠️ **CRÍTICO:** El módulo de Gestión **NUNCA** debe:

- Crear registros en ninguna tabla
- Modificar datos existentes
- Eliminar información

Solo tiene permisos de **SELECT** sobre las tablas que consulta.

### 11.2 Consistencia de Datos

El dashboard muestra datos en tiempo real. Si se requiere consistencia histórica:

1. Usar la vista materializada `daily_dashboard_summary` para datos de días cerrados
2. Consultar en tiempo real solo para el día actual
3. Los cierres de caja (`cash_closings`) proporcionan "snapshots" oficiales

### 11.3 Rendimiento

Para clínicas con alto volumen de datos:

1. Usar siempre filtros de fecha (`WHERE date BETWEEN...`)
2. Evitar consultas sin límite temporal
3. Considerar particionamiento de tablas por fecha si el volumen crece

---

_Documento generado el 2 de Febrero de 2026_  
_Versión 1.0 - MVP Completo_
