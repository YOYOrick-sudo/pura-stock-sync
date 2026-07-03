-- 1. Voeg phase kolom toe (nullable eerst voor backfill)
ALTER TABLE public.foh_category_order ADD COLUMN IF NOT EXISTS phase text;

-- 2. Drop oude unieke constraint / index op (location, department, category)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.foh_category_order'::regclass
    AND contype = 'u';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.foh_category_order DROP CONSTRAINT %I', cname);
  END IF;
END$$;

DROP INDEX IF EXISTS public.foh_category_order_location_department_category_key;

-- 3. Backfill: elke bestaande rij (phase IS NULL) → 4 rijen (open/tussen/borrel/sluit)
INSERT INTO public.foh_category_order (location, department, category, sort_order, phase, created_at, updated_at)
SELECT o.location, o.department, o.category, o.sort_order, p.phase, now(), now()
FROM public.foh_category_order o
CROSS JOIN (VALUES ('open'), ('tussen'), ('borrel'), ('sluit')) AS p(phase)
WHERE o.phase IS NULL
ON CONFLICT DO NOTHING;

-- 4. Verwijder de originele phase-NULL rijen
DELETE FROM public.foh_category_order WHERE phase IS NULL;

-- 5. Phase verplicht + check
ALTER TABLE public.foh_category_order ALTER COLUMN phase SET NOT NULL;
ALTER TABLE public.foh_category_order DROP CONSTRAINT IF EXISTS foh_category_order_phase_check;
ALTER TABLE public.foh_category_order ADD CONSTRAINT foh_category_order_phase_check
  CHECK (phase IN ('open','tussen','borrel','sluit'));

-- 6. Nieuwe unieke index inclusief phase
CREATE UNIQUE INDEX IF NOT EXISTS foh_category_order_loc_dept_phase_cat_key
  ON public.foh_category_order (location, department, phase, category);

-- 7. Update RPC — nu phase-scoped
DROP FUNCTION IF EXISTS public.foh_rename_category(text, text, text, text);
CREATE OR REPLACE FUNCTION public.foh_rename_category(
  _location text, _department text, _phase text, _old text, _new text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _new IS NULL OR length(trim(_new)) = 0 THEN
    RAISE EXCEPTION 'New category name required';
  END IF;

  UPDATE public.foh_daily_templates
     SET category = _new
   WHERE location = _location
     AND COALESCE(department, 'voorkant') = _department
     AND phase = _phase
     AND category = _old;

  UPDATE public.foh_tasks
     SET category = _new
   WHERE location = _location
     AND COALESCE(department, 'voorkant') = _department
     AND phase = _phase
     AND category = _old
     AND archived = false;

  IF EXISTS (
    SELECT 1 FROM public.foh_category_order
     WHERE location = _location AND department = _department AND phase = _phase AND category = _new
  ) THEN
    DELETE FROM public.foh_category_order
     WHERE location = _location AND department = _department AND phase = _phase AND category = _old;
  ELSE
    UPDATE public.foh_category_order
       SET category = _new, updated_at = now()
     WHERE location = _location AND department = _department AND phase = _phase AND category = _old;
  END IF;
END;
$function$;