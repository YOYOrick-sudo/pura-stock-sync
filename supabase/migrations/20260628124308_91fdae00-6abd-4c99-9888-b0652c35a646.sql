
CREATE TABLE public.foh_category_order (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location text NOT NULL,
  department text NOT NULL DEFAULT 'voorkant',
  category text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location, department, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foh_category_order TO authenticated;
GRANT ALL ON public.foh_category_order TO service_role;

ALTER TABLE public.foh_category_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read category order"
  ON public.foh_category_order FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert category order"
  ON public.foh_category_order FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update category order"
  ON public.foh_category_order FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete category order"
  ON public.foh_category_order FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_foh_category_order_updated_at
  BEFORE UPDATE ON public.foh_category_order
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- Atomic rename RPC: renames a category across templates + active tasks + the order table
CREATE OR REPLACE FUNCTION public.foh_rename_category(
  _location text,
  _department text,
  _old text,
  _new text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _new IS NULL OR length(trim(_new)) = 0 THEN
    RAISE EXCEPTION 'New category name required';
  END IF;

  UPDATE public.foh_daily_templates
     SET category = _new
   WHERE location = _location
     AND COALESCE(department, 'voorkant') = _department
     AND category = _old;

  UPDATE public.foh_tasks
     SET category = _new
   WHERE location = _location
     AND COALESCE(department, 'voorkant') = _department
     AND category = _old
     AND archived = false;

  -- merge order rows if target already exists, else rename
  IF EXISTS (
    SELECT 1 FROM public.foh_category_order
     WHERE location = _location AND department = _department AND category = _new
  ) THEN
    DELETE FROM public.foh_category_order
     WHERE location = _location AND department = _department AND category = _old;
  ELSE
    UPDATE public.foh_category_order
       SET category = _new, updated_at = now()
     WHERE location = _location AND department = _department AND category = _old;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.foh_rename_category(text, text, text, text) TO authenticated;

-- Seed from existing West data (alphabetical, step 10)
WITH cats AS (
  SELECT DISTINCT location, COALESCE(department, 'voorkant') AS department, category
    FROM public.foh_daily_templates
   WHERE location = 'West' AND category IS NOT NULL AND length(trim(category)) > 0
  UNION
  SELECT DISTINCT location, COALESCE(department, 'voorkant') AS department, category
    FROM public.foh_tasks
   WHERE location = 'West' AND archived = false AND category IS NOT NULL AND length(trim(category)) > 0
),
ranked AS (
  SELECT location, department, category,
         row_number() OVER (PARTITION BY location, department ORDER BY category) * 10 AS sort_order
    FROM cats
)
INSERT INTO public.foh_category_order (location, department, category, sort_order)
SELECT location, department, category, sort_order FROM ranked
ON CONFLICT (location, department, category) DO NOTHING;
