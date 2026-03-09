-- Rollback for 20260308_01_clinic_modules.up.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_touch_clinic_modules_updated_at ON public.clinic_modules;
DROP FUNCTION IF EXISTS public.touch_clinic_modules_updated_at();
DROP TABLE IF EXISTS public.clinic_modules;

COMMIT;
