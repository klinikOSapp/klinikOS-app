# Brief Técnico: Módulo de Caja - klinikOS

**Fecha:** 2 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** MVP (Primera versión completa)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Arquitectura:** Multi-tenant desde el inicio

---

## ⚠️ PRINCIPIO FUNDAMENTAL

> **TODA LA INFORMACIÓN DEL MÓDULO DE CAJA PROVIENE DEL MÓDULO DE FINANZAS DE LA FICHA DEL PACIENTE.**

El módulo de Caja **NO genera datos propios**. Es una **vista agregada y de gestión** sobre los datos financieros que se originan en:

- **Presupuestos** (`budgets`) → Ficha Paciente > Finanzas
- **Pagos** (`payments`) → Ficha Paciente > Finanzas
- **Cuotas de financiación** (`installments`) → Ficha Paciente > Finanzas
- **Facturas** (`invoices`) → Ficha Paciente > Finanzas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE DATOS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FICHA PACIENTE                          MÓDULO CAJA                       │
│   (Módulo Finanzas)                       (Vista Agregada)                  │
│                                                                             │
│   ┌─────────────┐                                                           │
│   │ Presupuesto │──┐                                                        │
│   │  Aceptado   │  │     ┌──────────────┐     ┌──────────────────────┐     │
│   └─────────────┘  │     │              │     │                      │     │
│                    ├────►│   payments   │────►│  cash_transactions   │     │
│   ┌─────────────┐  │     │   (tabla)    │     │  (vista agregada)    │     │
│   │    Pago     │──┤     │              │     │                      │     │
│   │ Registrado  │  │     └──────────────┘     └──────────────────────┘     │
│   └─────────────┘  │            ▲                      │                   │
│                    │            │                      ▼                   │
│   ┌─────────────┐  │            │             ┌──────────────────────┐     │
│   │   Cuota     │──┘            │             │   cash_closings      │     │
│   │   Pagada    │               │             │   (cierres de caja)  │     │
│   └─────────────┘               │             └──────────────────────┘     │
│                                 │                                          │
│                    ORIGEN DE    │                                          │
│                    LOS DATOS    │                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Visión General

### 1.1 Descripción

El **Módulo de Caja** es el centro de control financiero diario de la clínica. Proporciona una vista consolidada de todos los movimientos de dinero, permitiendo el seguimiento de cobros, cierre de caja y generación de informes.

### 1.2 Componentes del Módulo

| Componente               | Descripción                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| **Resumen Diario**       | KPIs del día: ingresos, cobrado vs facturado, desglose por método |
| **Tabla de Movimientos** | Lista de todas las transacciones del período seleccionado         |
| **Cierre de Caja**       | Modal para cerrar el día con resumen y exportación                |
| **Tendencia**            | Gráfico de evolución de ingresos                                  |

### 1.3 Funcionalidades Principales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MÓDULO DE CAJA                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 DASHBOARD                        📋 MOVIMIENTOS                         │
│  ├─ Ingresos del período             ├─ Tabla de transacciones              │
│  ├─ Cobrado vs Facturado             ├─ Filtros por fecha                   │
│  ├─ Por método de pago               ├─ Filtros por método                  │
│  ├─ Por profesional                  ├─ Búsqueda por paciente               │
│  └─ Comparativa períodos             └─ Acciones rápidas                    │
│                                                                             │
│  💰 CIERRE DE CAJA                   🧾 FACTURACIÓN                         │
│  ├─ Resumen del día                  ├─ Ver factura                         │
│  ├─ Desglose por método              ├─ Generar factura                     │
│  ├─ Salida de efectivo               ├─ Imprimir recibo                     │
│  ├─ Exportar a Excel                 └─ Enviar por email                    │
│  └─ Reabrir cierre                                                          │
│                                                                             │
│  🔗 CONEXIONES                       📈 MÉTRICAS                            │
│  ├─ Ficha Paciente → Finanzas        ├─ Tasa de cobro                       │
│  ├─ Agenda → Cobros de cita          ├─ Método preferido                    │
│  ├─ Presupuestos → Cuotas            ├─ Evolución temporal                  │
│  └─ Parte Diario → Producción        └─ Pendiente de cobro                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Métodos de Pago Soportados

| Método            | Código          | Descripción               |
| ----------------- | --------------- | ------------------------- |
| **Efectivo**      | `efectivo`      | Pago en efectivo          |
| **TPV**           | `tpv`           | Tarjeta de crédito/débito |
| **Transferencia** | `transferencia` | Transferencia bancaria    |
| **Financiación**  | `financiacion`  | Pago fraccionado/cuotas   |
| **Otros**         | `otros`         | Bizum, cheque, etc.       |

### 1.5 Estados de Transacción

| Estado de Pago           | Estado de Producción                |
| ------------------------ | ----------------------------------- |
| `cobrado` - Pagado       | `hecho` - Tratamiento realizado     |
| `pendiente` - Por cobrar | `pendiente` - Tratamiento pendiente |

---

## 2. Arquitectura de Datos

### 2.1 Diagrama de Origen de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORIGEN: FICHA PACIENTE > FINANZAS                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     BUDGETS     │     │    PAYMENTS     │     │   INSTALLMENTS  │
│ (Presupuestos)  │     │    (Pagos)      │     │    (Cuotas)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └─────────────►│ cash_transactions│◄─────────────┘
                        │  (Vista/Query)  │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  cash_closings  │
                        │ (Cierres caja)  │
                        └─────────────────┘
```

### 2.2 Relación con Otros Módulos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RELACIONES DEL MÓDULO DE CAJA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ FICHA PACIENTE  │                      │     AGENDA      │               │
│  │    (Finanzas)   │                      │                 │               │
│  ├─────────────────┤                      ├─────────────────┤               │
│  │ • payments      │─────────┬───────────►│ • appointment   │               │
│  │ • budgets       │         │            │   payments      │               │
│  │ • installments  │         │            └─────────────────┘               │
│  │ • invoices      │         │                                              │
│  └────────┬────────┘         │                                              │
│           │                  │                                              │
│           │    FUENTE        │                                              │
│           │    ÚNICA         ▼                                              │
│           │    DE      ┌───────────────┐                                    │
│           │    DATOS   │  MÓDULO CAJA  │                                    │
│           └───────────►│               │                                    │
│                        │ Vista agregada│                                    │
│                        │ de payments   │                                    │
│                        └───────┬───────┘                                    │
│                                │                                            │
│                                ▼                                            │
│                        ┌─────────────────┐                                  │
│                        │  PARTE DIARIO   │                                  │
│                        │  (Producción)   │                                  │
│                        └─────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Definición de Tablas

### 3.1 Tabla: `payments` (Origen - Definida en Ficha Paciente)

**NOTA:** Esta tabla ya está definida en el Brief de Ficha del Paciente. Aquí se muestra para referencia.

```sql
-- Ver definición completa en BRIEF_TECNICO_FICHA_PACIENTE.md
-- Esta tabla es la FUENTE de datos para Caja

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Referencias a origen del pago
    budget_id UUID REFERENCES budgets(id),
    appointment_id UUID REFERENCES appointments(id),
    invoice_id UUID REFERENCES invoices(id),
    installment_id UUID REFERENCES installments(id), -- Cuota específica pagada

    -- Detalles del pago
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL
        CHECK (payment_method IN ('efectivo', 'tpv', 'transferencia', 'financiacion', 'otros')),

    -- Referencia externa (ej: número de transferencia)
    reference VARCHAR(100),
    concept TEXT,

    -- Fecha y hora
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,

    -- Estados
    status VARCHAR(20) DEFAULT 'Completado'
        CHECK (status IN ('Pendiente', 'Completado', 'Anulado', 'Devuelto')),
    production_status VARCHAR(20) DEFAULT 'pendiente'
        CHECK (production_status IN ('hecho', 'pendiente')),

    -- Anulación
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT,

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índices para Caja
CREATE INDEX idx_payments_date ON payments(clinic_id, payment_date);
CREATE INDEX idx_payments_method ON payments(clinic_id, payment_date, payment_method);
CREATE INDEX idx_payments_status ON payments(clinic_id, status, payment_date);
```

### 3.2 Tabla: `cash_closings` (Cierres de Caja)

```sql
CREATE TABLE cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Día del cierre (único por clínica)
    closing_date DATE NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by UUID NOT NULL REFERENCES auth.users(id),
    closed_by_name VARCHAR(150),

    -- Datos de caja
    initial_cash DECIMAL(10,2) NOT NULL DEFAULT 0, -- Caja inicial del día
    total_income DECIMAL(10,2) NOT NULL DEFAULT 0, -- Total ingresos cobrados
    total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0, -- Total gastos (si aplica)
    cash_outflow DECIMAL(10,2) NOT NULL DEFAULT 0, -- Efectivo retirado
    final_balance DECIMAL(10,2) NOT NULL DEFAULT 0, -- Balance final

    -- Desglose por método de pago (JSONB para flexibilidad)
    income_by_method JSONB NOT NULL DEFAULT '{
        "efectivo": 0,
        "tpv": 0,
        "transferencia": 0,
        "financiacion": 0,
        "otros": 0
    }',

    -- Contadores
    transaction_count INTEGER NOT NULL DEFAULT 0,
    collected_count INTEGER DEFAULT 0, -- Transacciones cobradas
    pending_count INTEGER DEFAULT 0, -- Transacciones pendientes

    -- Estado del cierre
    status VARCHAR(20) NOT NULL DEFAULT 'closed'
        CHECK (status IN ('open', 'closed', 'reopened')),

    -- Reapertura
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES auth.users(id),
    reopen_reason TEXT,

    -- Notas del cierre
    notes TEXT,

    -- Constraint: un cierre por día por clínica
    CONSTRAINT unique_closing_per_clinic_date UNIQUE (clinic_id, closing_date)
);

CREATE INDEX idx_cash_closings_clinic_date ON cash_closings(clinic_id, closing_date DESC);
CREATE INDEX idx_cash_closings_status ON cash_closings(clinic_id, status);
```

### 3.3 Tabla: `receipts` (Recibos)

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Número de recibo (único por clínica)
    receipt_number VARCHAR(50) NOT NULL,

    -- Relaciones
    payment_id UUID NOT NULL REFERENCES payments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- Datos del recibo (copia para histórico)
    patient_name VARCHAR(255) NOT NULL,
    concept TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),

    -- Datos de la clínica (para el recibo)
    clinic_name VARCHAR(200) NOT NULL,
    clinic_nif VARCHAR(20),
    clinic_address TEXT,

    -- Fecha de emisión
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),

    -- PDF generado
    pdf_storage_path TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_receipt_number_per_clinic UNIQUE (clinic_id, receipt_number)
);

CREATE INDEX idx_receipts_payment ON receipts(payment_id);
CREATE INDEX idx_receipts_patient ON receipts(patient_id);
CREATE INDEX idx_receipts_date ON receipts(clinic_id, issued_date DESC);
```

### 3.4 Vista: `cash_transactions_view` (Vista Agregada para Caja)

```sql
-- Esta vista agrega datos de payments con información de paciente y cita
-- Es la FUENTE de datos para la tabla de movimientos de Caja

CREATE OR REPLACE VIEW cash_transactions_view AS
SELECT
    p.id,
    p.clinic_id,
    p.payment_date AS transaction_date,
    p.payment_time AS transaction_time,
    p.created_at,

    -- Datos del paciente
    p.patient_id,
    pat.full_name AS patient_name,
    pat.phone AS patient_phone,

    -- Datos del pago
    p.concept,
    p.amount,
    p.currency,
    p.payment_method,
    p.reference,
    p.status AS payment_status,
    p.production_status,

    -- Referencias
    p.budget_id,
    p.appointment_id,
    p.invoice_id,
    p.installment_id,

    -- Datos adicionales del presupuesto (si aplica)
    b.budget_number,
    b.budget_name AS budget_description,

    -- Datos de la cita (si aplica)
    a.appointment_date,
    a.professional_name,
    a.reason AS appointment_reason,

    -- Datos de factura (si existe)
    inv.invoice_number,

    -- Cierre de caja asociado
    cc.id AS closing_id,
    cc.status AS closing_status

FROM payments p
JOIN patients pat ON pat.id = p.patient_id
LEFT JOIN budgets b ON b.id = p.budget_id
LEFT JOIN appointments a ON a.id = p.appointment_id
LEFT JOIN invoices inv ON inv.id = p.invoice_id
LEFT JOIN cash_closings cc ON cc.clinic_id = p.clinic_id
    AND cc.closing_date = p.payment_date
    AND cc.status = 'closed'
WHERE p.status != 'Anulado';

-- Índice para mejorar rendimiento de la vista
CREATE INDEX idx_payments_for_cash_view ON payments(clinic_id, payment_date, status)
WHERE status != 'Anulado';
```

---

## 4. Triggers

### 4.1 Trigger: Auto-generar Número de Recibo

```sql
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
    v_year VARCHAR(4);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Obtener prefijo de la clínica
    SELECT COALESCE(receipt_number_prefix, 'REC') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Obtener siguiente número del año
    SELECT COALESCE(MAX(
        CAST(NULLIF(regexp_replace(receipt_number, '[^0-9]', '', 'g'), '') AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM receipts
    WHERE clinic_id = NEW.clinic_id
    AND issued_date >= DATE_TRUNC('year', CURRENT_DATE);

    NEW.receipt_number := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    WHEN (NEW.receipt_number IS NULL)
    EXECUTE FUNCTION generate_receipt_number();
```

### 4.2 Trigger: Actualizar Totales de Cierre al Modificar Pagos

```sql
CREATE OR REPLACE FUNCTION update_closing_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_closing_id UUID;
    v_totals RECORD;
BEGIN
    -- Buscar cierre del día (si existe y está reabierto)
    SELECT id INTO v_closing_id
    FROM cash_closings
    WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
    AND closing_date = COALESCE(NEW.payment_date, OLD.payment_date)
    AND status = 'reopened';

    -- Si hay un cierre reabierto, actualizar totales
    IF v_closing_id IS NOT NULL THEN
        SELECT
            COUNT(*) AS transaction_count,
            COUNT(*) FILTER (WHERE status = 'Completado') AS collected_count,
            COUNT(*) FILTER (WHERE status = 'Pendiente') AS pending_count,
            COALESCE(SUM(amount) FILTER (WHERE status = 'Completado'), 0) AS total_income,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'efectivo' AND status = 'Completado'), 0),
                'tpv', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'tpv' AND status = 'Completado'), 0),
                'transferencia', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'transferencia' AND status = 'Completado'), 0),
                'financiacion', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'financiacion' AND status = 'Completado'), 0),
                'otros', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'otros' AND status = 'Completado'), 0)
            ) AS income_by_method
        INTO v_totals
        FROM payments
        WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
        AND payment_date = COALESCE(NEW.payment_date, OLD.payment_date)
        AND status != 'Anulado';

        UPDATE cash_closings
        SET
            transaction_count = v_totals.transaction_count,
            collected_count = v_totals.collected_count,
            pending_count = v_totals.pending_count,
            total_income = v_totals.total_income,
            income_by_method = v_totals.income_by_method,
            final_balance = initial_cash + v_totals.total_income - total_expenses - cash_outflow,
            updated_at = NOW()
        WHERE id = v_closing_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_closing_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_closing_totals();
```

---

## 5. Funciones de Base de Datos

### 5.1 Función: Obtener Resumen del Día

```sql
CREATE OR REPLACE FUNCTION get_day_summary(
    p_clinic_id UUID,
    p_date DATE
)
RETURNS TABLE (
    transaction_date DATE,
    initial_cash DECIMAL,
    total_income DECIMAL,
    total_expenses DECIMAL,
    final_balance DECIMAL,
    income_by_method JSONB,
    transaction_count INTEGER,
    collected_count INTEGER,
    pending_count INTEGER,
    is_closed BOOLEAN,
    closing_id UUID
) AS $$
DECLARE
    v_closing cash_closings%ROWTYPE;
BEGIN
    -- Verificar si existe cierre
    SELECT * INTO v_closing
    FROM cash_closings cc
    WHERE cc.clinic_id = p_clinic_id
    AND cc.closing_date = p_date;

    IF v_closing.id IS NOT NULL AND v_closing.status = 'closed' THEN
        -- Devolver datos del cierre
        RETURN QUERY
        SELECT
            p_date,
            v_closing.initial_cash,
            v_closing.total_income,
            v_closing.total_expenses,
            v_closing.final_balance,
            v_closing.income_by_method,
            v_closing.transaction_count,
            v_closing.collected_count,
            v_closing.pending_count,
            TRUE,
            v_closing.id;
    ELSE
        -- Calcular datos en tiempo real desde payments
        RETURN QUERY
        SELECT
            p_date,
            COALESCE(v_closing.initial_cash, 100.00)::DECIMAL, -- Default inicial
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0)::DECIMAL,
            0::DECIMAL, -- Gastos (por implementar)
            (COALESCE(v_closing.initial_cash, 100.00) +
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0))::DECIMAL,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo' AND p.status = 'Completado'), 0),
                'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv' AND p.status = 'Completado'), 0),
                'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia' AND p.status = 'Completado'), 0),
                'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion' AND p.status = 'Completado'), 0),
                'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros' AND p.status = 'Completado'), 0)
            ),
            COUNT(*)::INTEGER,
            COUNT(*) FILTER (WHERE p.status = 'Completado')::INTEGER,
            COUNT(*) FILTER (WHERE p.status = 'Pendiente')::INTEGER,
            FALSE,
            v_closing.id
        FROM payments p
        WHERE p.clinic_id = p_clinic_id
        AND p.payment_date = p_date
        AND p.status != 'Anulado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Función: Obtener Transacciones del Día

```sql
CREATE OR REPLACE FUNCTION get_day_transactions(
    p_clinic_id UUID,
    p_date DATE,
    p_payment_method VARCHAR DEFAULT NULL,
    p_search_query VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    transaction_time TIME,
    patient_id UUID,
    patient_name VARCHAR,
    concept TEXT,
    amount DECIMAL,
    payment_method VARCHAR,
    payment_status VARCHAR,
    production_status VARCHAR,
    invoice_id UUID,
    budget_id UUID,
    appointment_id UUID,
    budget_description VARCHAR,
    professional_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ctv.id,
        ctv.transaction_time,
        ctv.patient_id,
        ctv.patient_name,
        ctv.concept,
        ctv.amount,
        ctv.payment_method,
        ctv.payment_status,
        ctv.production_status,
        ctv.invoice_id,
        ctv.budget_id,
        ctv.appointment_id,
        ctv.budget_description,
        ctv.professional_name
    FROM cash_transactions_view ctv
    WHERE ctv.clinic_id = p_clinic_id
    AND ctv.transaction_date = p_date
    AND (p_payment_method IS NULL OR ctv.payment_method = p_payment_method)
    AND (
        p_search_query IS NULL
        OR ctv.patient_name ILIKE '%' || p_search_query || '%'
        OR ctv.concept ILIKE '%' || p_search_query || '%'
    )
    ORDER BY ctv.transaction_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Función: Cerrar Caja del Día

```sql
CREATE OR REPLACE FUNCTION close_cash_day(
    p_clinic_id UUID,
    p_date DATE,
    p_cash_outflow DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS cash_closings AS $$
DECLARE
    v_summary RECORD;
    v_closing cash_closings;
    v_user_name VARCHAR;
BEGIN
    -- Verificar que no esté ya cerrado
    IF EXISTS (
        SELECT 1 FROM cash_closings
        WHERE clinic_id = p_clinic_id
        AND closing_date = p_date
        AND status = 'closed'
    ) THEN
        RAISE EXCEPTION 'El día % ya está cerrado', p_date;
    END IF;

    -- Obtener resumen del día
    SELECT * INTO v_summary
    FROM get_day_summary(p_clinic_id, p_date);

    -- Obtener nombre del usuario
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
    FROM auth.users
    WHERE id = auth.uid();

    -- Insertar o actualizar cierre
    INSERT INTO cash_closings (
        clinic_id,
        closing_date,
        closed_by,
        closed_by_name,
        initial_cash,
        total_income,
        total_expenses,
        cash_outflow,
        final_balance,
        income_by_method,
        transaction_count,
        collected_count,
        pending_count,
        status,
        notes
    ) VALUES (
        p_clinic_id,
        p_date,
        auth.uid(),
        v_user_name,
        v_summary.initial_cash,
        v_summary.total_income,
        v_summary.total_expenses,
        p_cash_outflow,
        v_summary.final_balance - p_cash_outflow,
        v_summary.income_by_method,
        v_summary.transaction_count,
        v_summary.collected_count,
        v_summary.pending_count,
        'closed',
        p_notes
    )
    ON CONFLICT (clinic_id, closing_date)
    DO UPDATE SET
        closed_by = auth.uid(),
        closed_by_name = v_user_name,
        total_income = EXCLUDED.total_income,
        cash_outflow = EXCLUDED.cash_outflow,
        final_balance = EXCLUDED.final_balance,
        income_by_method = EXCLUDED.income_by_method,
        transaction_count = EXCLUDED.transaction_count,
        collected_count = EXCLUDED.collected_count,
        pending_count = EXCLUDED.pending_count,
        status = 'closed',
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING * INTO v_closing;

    RETURN v_closing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Función: Reabrir Cierre de Caja

```sql
CREATE OR REPLACE FUNCTION reopen_cash_day(
    p_clinic_id UUID,
    p_date DATE,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE cash_closings
    SET
        status = 'reopened',
        reopened_at = NOW(),
        reopened_by = auth.uid(),
        reopen_reason = p_reason,
        updated_at = NOW()
    WHERE clinic_id = p_clinic_id
    AND closing_date = p_date
    AND status = 'closed';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.5 Función: Obtener KPIs de Período

```sql
CREATE OR REPLACE FUNCTION get_cash_kpis(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_income DECIMAL,
    total_pending DECIMAL,
    total_collected DECIMAL,
    collection_rate DECIMAL,
    by_method JSONB,
    by_day JSONB,
    transaction_count INTEGER,
    avg_transaction_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(p.amount), 0)::DECIMAL AS total_income,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Pendiente'), 0)::DECIMAL AS total_pending,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0)::DECIMAL AS total_collected,
        CASE
            WHEN SUM(p.amount) > 0
            THEN (SUM(p.amount) FILTER (WHERE p.status = 'Completado') / SUM(p.amount) * 100)
            ELSE 0
        END::DECIMAL AS collection_rate,
        jsonb_build_object(
            'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo'), 0),
            'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv'), 0),
            'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia'), 0),
            'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion'), 0),
            'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros'), 0)
        ) AS by_method,
        (
            SELECT jsonb_agg(day_data ORDER BY day_data->>'date')
            FROM (
                SELECT jsonb_build_object(
                    'date', payment_date,
                    'total', SUM(amount),
                    'collected', SUM(amount) FILTER (WHERE status = 'Completado')
                ) AS day_data
                FROM payments
                WHERE clinic_id = p_clinic_id
                AND payment_date BETWEEN p_start_date AND p_end_date
                AND status != 'Anulado'
                GROUP BY payment_date
            ) daily
        ) AS by_day,
        COUNT(*)::INTEGER AS transaction_count,
        AVG(p.amount)::DECIMAL AS avg_transaction_amount
    FROM payments p
    WHERE p.clinic_id = p_clinic_id
    AND p.payment_date BETWEEN p_start_date AND p_end_date
    AND p.status != 'Anulado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.6 Función: Generar Recibo

```sql
CREATE OR REPLACE FUNCTION generate_receipt(
    p_payment_id UUID
)
RETURNS receipts AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_patient patients%ROWTYPE;
    v_clinic clinic_settings%ROWTYPE;
    v_receipt receipts;
BEGIN
    -- Obtener datos del pago
    SELECT * INTO v_payment
    FROM payments
    WHERE id = p_payment_id;

    IF v_payment.id IS NULL THEN
        RAISE EXCEPTION 'Pago no encontrado';
    END IF;

    -- Verificar que no existe recibo
    IF EXISTS (SELECT 1 FROM receipts WHERE payment_id = p_payment_id) THEN
        SELECT * INTO v_receipt FROM receipts WHERE payment_id = p_payment_id;
        RETURN v_receipt;
    END IF;

    -- Obtener datos del paciente
    SELECT * INTO v_patient
    FROM patients
    WHERE id = v_payment.patient_id;

    -- Obtener datos de la clínica
    SELECT * INTO v_clinic
    FROM clinic_settings
    WHERE clinic_id = v_payment.clinic_id;

    -- Crear recibo
    INSERT INTO receipts (
        clinic_id,
        payment_id,
        patient_id,
        patient_name,
        concept,
        amount,
        payment_method,
        payment_reference,
        clinic_name,
        clinic_nif,
        clinic_address,
        created_by
    ) VALUES (
        v_payment.clinic_id,
        v_payment.id,
        v_payment.patient_id,
        v_patient.full_name,
        v_payment.concept,
        v_payment.amount,
        v_payment.payment_method,
        v_payment.reference,
        v_clinic.clinic_name,
        v_clinic.clinic_nif,
        v_clinic.clinic_address,
        auth.uid()
    )
    RETURNING * INTO v_receipt;

    RETURN v_receipt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Row Level Security (RLS)

### 6.1 Políticas para cash_closings

```sql
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;

-- Lectura: solo cierres de la clínica del usuario
CREATE POLICY "Users can view closings from their clinic"
ON cash_closings FOR SELECT
USING (clinic_id = get_user_clinic_id());

-- Inserción: solo en su clínica
CREATE POLICY "Users can create closings in their clinic"
ON cash_closings FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());

-- Actualización: solo usuarios con rol apropiado
CREATE POLICY "Only authorized users can update closings"
ON cash_closings FOR UPDATE
USING (
    clinic_id = get_user_clinic_id()
    AND (has_role('Administrador') OR has_role('Recepción'))
);
```

### 6.2 Políticas para receipts

```sql
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receipts from their clinic"
ON receipts FOR SELECT
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can create receipts in their clinic"
ON receipts FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());
```

---

## 7. Conexiones con Otros Módulos

### 7.1 Mapa de Conexiones

```
                              ┌─────────────────────────────────────────┐
                              │           FICHA PACIENTE                │
                              │           (Módulo Finanzas)             │
                              │                                         │
                              │  ┌─────────────────────────────────┐   │
                              │  │ payments (FUENTE ÚNICA)         │   │
                              │  │ budgets                         │   │
                              │  │ installments                    │   │
                              │  │ invoices                        │   │
                              │  └─────────────┬───────────────────┘   │
                              │                │                       │
                              └────────────────┼───────────────────────┘
                                               │
                                               │ ORIGEN DE
                                               │ TODOS LOS DATOS
                                               ▼
                              ┌─────────────────────────────────────────┐
                              │           MÓDULO CAJA                   │
                              │                                         │
                              │  ┌─────────────────────────────────┐   │
                              │  │ cash_transactions_view (Vista)  │   │
                              │  │ cash_closings (Cierres)         │   │
                              │  │ receipts (Recibos)              │   │
                              │  └─────────────────────────────────┘   │
                              │                                         │
                              └────────────────┬───────────────────────┘
                                               │
              ┌────────────────────────────────┼────────────────────────────────┐
              │                                │                                │
              ▼                                ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│       AGENDA        │          │    PARTE DIARIO     │          │      GESTIÓN        │
│                     │          │                     │          │                     │
│ • Cobros de cita    │          │ • Producción día    │          │ • KPIs financieros  │
│ • Estado pagado     │          │ • Estado producción │          │ • Reportes          │
└─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

### 7.2 Detalle de Conexiones

#### 7.2.1 FICHA PACIENTE (Finanzas) → CAJA

| Acción en Ficha            | Resultado en Caja                           |
| -------------------------- | ------------------------------------------- |
| Registrar pago             | Aparece en tabla de movimientos             |
| Pagar cuota de presupuesto | Aparece con referencia al presupuesto       |
| Emitir factura             | Vincula invoice_id al pago                  |
| Anular pago                | Desaparece de la vista (status = 'Anulado') |

**Query principal (origen de datos):**

```sql
-- TODA la información de Caja viene de esta consulta
SELECT
    p.*,
    pat.full_name AS patient_name,
    b.budget_number,
    b.budget_name AS budget_description,
    a.professional_name,
    inv.invoice_number
FROM payments p
JOIN patients pat ON pat.id = p.patient_id
LEFT JOIN budgets b ON b.id = p.budget_id
LEFT JOIN appointments a ON a.id = p.appointment_id
LEFT JOIN invoices inv ON inv.id = p.invoice_id
WHERE p.clinic_id = :clinic_id
AND p.payment_date BETWEEN :start_date AND :end_date
AND p.status != 'Anulado'
ORDER BY p.payment_date DESC, p.payment_time DESC;
```

#### 7.2.2 CAJA → FICHA PACIENTE

| Acción en Caja                       | Resultado en Ficha             |
| ------------------------------------ | ------------------------------ |
| Click en movimiento → "Ver paciente" | Abre ficha en pestaña Finanzas |
| Actualizar estado a "Cobrado"        | Actualiza payment.status       |
| Generar factura                      | Crea invoice vinculada al pago |

**Query de navegación:**

```sql
-- Al hacer click en "Ver paciente" desde Caja
-- Redirigir a: /pacientes?id={patient_id}&tab=Finanzas
SELECT patient_id FROM payments WHERE id = :payment_id;
```

#### 7.2.3 AGENDA → CAJA

| Acción en Agenda         | Resultado en Caja               |
| ------------------------ | ------------------------------- |
| Completar cita con cobro | Crea payment con appointment_id |
| Cobrar desde cita        | Aparece en Caja con referencia  |

**Query de cobro de cita:**

```sql
-- Pagos que vienen de citas
SELECT
    p.*,
    a.appointment_date,
    a.start_time,
    a.reason AS appointment_reason,
    a.professional_name
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
WHERE p.clinic_id = :clinic_id
AND p.payment_date = CURRENT_DATE;
```

#### 7.2.4 CAJA → PARTE DIARIO

| Dato de Caja      | Uso en Parte Diario |
| ----------------- | ------------------- |
| Pagos del día     | Columna de cobrado  |
| Estado producción | Filtro "Producido"  |

---

### 7.3 Matriz de Permisos

| Funcionalidad             | Recepción | Higienista  | Doctor      | Administrador |
| ------------------------- | --------- | ----------- | ----------- | ------------- |
| Ver tabla movimientos     | ✅        | 👁️ Solo ver | 👁️ Solo ver | ✅            |
| Cambiar estado pago       | ✅        | ❌          | ✅          | ✅            |
| Cambiar estado producción | ✅        | ✅          | ✅          | ✅            |
| Cerrar caja               | ✅        | ❌          | ❌          | ✅            |
| Reabrir cierre            | ❌        | ❌          | ❌          | ✅            |
| Exportar datos            | ✅        | ❌          | ✅          | ✅            |
| Generar recibo            | ✅        | ❌          | ✅          | ✅            |
| Ver/Generar factura       | ✅        | ❌          | ✅          | ✅            |

---

## 8. Eventos del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENTOS DE CAJA                                      │
└─────────────────────────────────────────────────────────────────────────────┘

FICHA PACIENTE emite hacia CAJA:
├── payment.created ──────────────► Aparece en tabla de movimientos
├── payment.updated ──────────────► Actualiza estado en tabla
├── payment.voided ───────────────► Desaparece de la vista
└── installment.paid ─────────────► Aparece como pago de cuota

CAJA emite:
├── cash_closing.completed ───────► Gestión (reportes)
│                                 └► Histórico (archivado)
│
├── cash_closing.reopened ────────► Permite nuevas modificaciones
│
├── payment_status.changed ───────► Ficha Paciente (actualiza payment)
│                                 └► Parte Diario (actualiza estado)
│
├── production_status.changed ────► Parte Diario (actualiza producción)
│
├── receipt.generated ────────────► PDF disponible para imprimir
│
└── invoice.generated ────────────► Ficha Paciente (vincula factura)

AGENDA emite hacia CAJA:
├── appointment.payment_registered ►Nuevo pago en movimientos
└── appointment.completed ─────────► Actualiza producción si aplica
```

---

## 9. Índices y Optimización

### 9.1 Índices Críticos para Caja

```sql
-- Índice compuesto para consulta principal de movimientos
CREATE INDEX CONCURRENTLY idx_payments_cash_main
ON payments(clinic_id, payment_date, payment_time DESC)
WHERE status != 'Anulado';

-- Índice para filtro por método de pago
CREATE INDEX CONCURRENTLY idx_payments_method_date
ON payments(clinic_id, payment_method, payment_date)
WHERE status != 'Anulado';

-- Índice para búsqueda por paciente (JOIN con patients)
CREATE INDEX CONCURRENTLY idx_payments_patient_lookup
ON payments(patient_id, payment_date DESC);

-- Índice para cierres de caja
CREATE INDEX CONCURRENTLY idx_closings_lookup
ON cash_closings(clinic_id, closing_date DESC, status);

-- Índice para KPIs por período
CREATE INDEX CONCURRENTLY idx_payments_kpi_period
ON payments(clinic_id, payment_date, status, payment_method)
WHERE status != 'Anulado';
```

### 9.2 Materialización de Resumen Diario (Opcional)

```sql
-- Vista materializada para resúmenes diarios (mejora rendimiento)
CREATE MATERIALIZED VIEW daily_cash_summary AS
SELECT
    clinic_id,
    payment_date AS date,
    COUNT(*) AS transaction_count,
    COUNT(*) FILTER (WHERE status = 'Completado') AS collected_count,
    SUM(amount) FILTER (WHERE status = 'Completado') AS total_collected,
    SUM(amount) FILTER (WHERE status = 'Pendiente') AS total_pending,
    jsonb_build_object(
        'efectivo', SUM(amount) FILTER (WHERE payment_method = 'efectivo' AND status = 'Completado'),
        'tpv', SUM(amount) FILTER (WHERE payment_method = 'tpv' AND status = 'Completado'),
        'transferencia', SUM(amount) FILTER (WHERE payment_method = 'transferencia' AND status = 'Completado'),
        'financiacion', SUM(amount) FILTER (WHERE payment_method = 'financiacion' AND status = 'Completado'),
        'otros', SUM(amount) FILTER (WHERE payment_method = 'otros' AND status = 'Completado')
    ) AS by_method
FROM payments
WHERE status != 'Anulado'
GROUP BY clinic_id, payment_date;

CREATE UNIQUE INDEX idx_daily_cash_summary
ON daily_cash_summary(clinic_id, date);

-- Refrescar al final de cada día o bajo demanda
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_cash_summary;
```

---

## 10. Plan de Implementación Sugerido

### Fase 1: Fundamentos (Semana 1)

- [ ] Verificar que tabla `payments` existe (de Ficha Paciente)
- [ ] Crear tabla `cash_closings`
- [ ] Crear tabla `receipts`
- [ ] Crear vista `cash_transactions_view`
- [ ] Configurar RLS

### Fase 2: Funciones Core (Semana 2)

- [ ] Implementar `get_day_summary()`
- [ ] Implementar `get_day_transactions()`
- [ ] Implementar `close_cash_day()`
- [ ] Implementar `reopen_cash_day()`

### Fase 3: Funciones de Negocio (Semana 3)

- [ ] Implementar `get_cash_kpis()`
- [ ] Implementar `generate_receipt()`
- [ ] Triggers de actualización automática
- [ ] Exportación a Excel

### Fase 4: Optimización (Semana 4)

- [ ] Crear índices de rendimiento
- [ ] Implementar vista materializada (opcional)
- [ ] Testing de rendimiento
- [ ] Pruebas de integración con Ficha Paciente

---

## 11. Referencias

### 11.1 Archivos Frontend Relacionados

```
src/
├── app/
│   └── caja/page.tsx                      # Página principal
│
├── components/caja/
│   ├── CashMovementsTable.tsx             # Tabla de movimientos
│   ├── CashSummaryCard.tsx                # Tarjeta de resumen
│   ├── CashTrendCard.tsx                  # Gráfico de tendencia
│   ├── CashToolbar.tsx                    # Toolbar con navegación
│   ├── CashClosingModal.tsx               # Modal de cierre
│   ├── NewPaymentModal.tsx                # Modal nuevo pago
│   ├── ReceiptPreviewModal.tsx            # Preview de recibo
│   └── cajaTypes.ts                       # Tipos
│
└── context/
    └── CashClosingContext.tsx             # Contexto de caja
```

### 11.2 Documentos Relacionados

- **BRIEF_TECNICO_FICHA_PACIENTE.md** - Definición de `payments`, `budgets`, `invoices`
- **BRIEF_TECNICO_AGENDA.md** - Conexión con `appointments`

---

## 12. Notas Importantes

### 12.1 Principio de Fuente Única

⚠️ **CRÍTICO:** El módulo de Caja **NUNCA** debe crear registros en la tabla `payments` directamente. Todos los pagos deben registrarse a través de:

1. **Ficha Paciente > Finanzas** → Pago manual
2. **Ficha Paciente > Finanzas** → Pago de cuota
3. **Agenda** → Cobro de cita

Caja solo puede:

- **Leer** datos de `payments`
- **Actualizar** estados (`status`, `production_status`)
- **Crear** registros en `cash_closings` y `receipts`

### 12.2 Consistencia de Datos

```sql
-- Verificar que todos los pagos tienen origen válido
SELECT
    CASE
        WHEN budget_id IS NOT NULL THEN 'budget_payment'
        WHEN appointment_id IS NOT NULL THEN 'appointment_payment'
        WHEN installment_id IS NOT NULL THEN 'installment_payment'
        ELSE 'direct_payment'
    END AS payment_source,
    COUNT(*)
FROM payments
WHERE clinic_id = :clinic_id
GROUP BY payment_source;
```

---

_Documento generado el 2 de Febrero de 2026_  
_Versión 1.0 - MVP Completo_
