-- Phase 2 (structural): source of truth for contracted modules per clinic
-- Safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.clinic_modules (
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clinic_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_modules_clinic_enabled
  ON public.clinic_modules (clinic_id, is_enabled);

CREATE INDEX IF NOT EXISTS idx_clinic_modules_module_enabled
  ON public.clinic_modules (module_id, is_enabled);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.touch_clinic_modules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_clinic_modules_updated_at ON public.clinic_modules;
CREATE TRIGGER trg_touch_clinic_modules_updated_at
BEFORE UPDATE ON public.clinic_modules
FOR EACH ROW
EXECUTE FUNCTION public.touch_clinic_modules_updated_at();

-- Backfill (current known organizations)
-- Cubells: voice agent only
INSERT INTO public.clinic_modules (clinic_id, module_id, is_enabled)
VALUES ('a645020a-bb53-4575-9694-04335c1bcf01', 10, true)
ON CONFLICT (clinic_id, module_id)
DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- Bello: all modules except voice agent
INSERT INTO public.clinic_modules (clinic_id, module_id, is_enabled)
SELECT '0a62cf76-bfd0-4125-b8fe-860a1700da39', m.id, true
FROM public.modules m
WHERE m.name <> 'calls'
ON CONFLICT (clinic_id, module_id)
DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- Faus: all modules
INSERT INTO public.clinic_modules (clinic_id, module_id, is_enabled)
SELECT '8165dae0-0fab-4716-aee3-6a8220b3c81e', m.id, true
FROM public.modules m
ON CONFLICT (clinic_id, module_id)
DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

COMMIT;

-- Validation snippets
-- SELECT c.name, m.name AS module_name, cm.is_enabled
-- FROM public.clinic_modules cm
-- JOIN public.clinics c ON c.id = cm.clinic_id
-- JOIN public.modules m ON m.id = cm.module_id
-- WHERE cm.clinic_id IN (
--   'a645020a-bb53-4575-9694-04335c1bcf01',
--   '0a62cf76-bfd0-4125-b8fe-860a1700da39',
--   '8165dae0-0fab-4716-aee3-6a8220b3c81e'
-- )
-- ORDER BY c.name, m.id;
