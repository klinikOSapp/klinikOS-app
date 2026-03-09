-- Phase 2 (structural): RPCs aware of clinic_modules
-- Transitional behavior:
--   - If a clinic has no rows in clinic_modules, keep legacy permission behavior.
--   - If a clinic has rows, module must be enabled there first.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_clinic_modules(p_clinic_id uuid)
RETURNS TABLE(module_id integer, module_name text, is_enabled boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id AS module_id, m.name AS module_name, cm.is_enabled
  FROM public.clinic_modules cm
  JOIN public.modules m ON m.id = cm.module_id
  WHERE cm.clinic_id = p_clinic_id
    AND cm.is_enabled = true
  ORDER BY m.id;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  p_clinic_id uuid,
  p_module text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_contract_rows boolean := false;
  v_module_enabled boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- If clinic_modules has rows for this clinic, enforce module gating.
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_modules cm
    WHERE cm.clinic_id = p_clinic_id
  ) INTO v_has_contract_rows;

  IF v_has_contract_rows THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.clinic_modules cm
      JOIN public.modules m ON m.id = cm.module_id
      WHERE cm.clinic_id = p_clinic_id
        AND cm.is_enabled = true
        AND m.name = p_module
    ) INTO v_module_enabled;

    IF NOT v_module_enabled THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.staff_clinics sc
    JOIN public.permissions p ON p.role_id = sc.role_id
    JOIN public.modules m ON m.id = p.module_id
    WHERE sc.staff_id = v_uid
      AND sc.clinic_id = p_clinic_id
      AND m.name = p_module
      AND (
        (p_action = 'view' AND p.can_view = true) OR
        (p_action = 'create' AND p.can_create = true) OR
        (p_action = 'edit' AND p.can_edit = true) OR
        (p_action = 'delete' AND p.can_delete = true)
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clinic_modules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated;

COMMIT;

-- Validation snippets
-- SELECT * FROM public.get_clinic_modules('a645020a-bb53-4575-9694-04335c1bcf01');
-- SELECT public.has_permission('a645020a-bb53-4575-9694-04335c1bcf01', 'calls', 'view');
-- SELECT public.has_permission('a645020a-bb53-4575-9694-04335c1bcf01', 'patients', 'view');
