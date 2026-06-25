
-- Add department column to templates and tasks
ALTER TABLE public.foh_daily_templates
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'voorkant';

ALTER TABLE public.foh_tasks
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'voorkant';

-- Backfill (defensief, voor het geval kolom al bestond met nulls)
UPDATE public.foh_daily_templates SET department = 'voorkant' WHERE department IS NULL;
UPDATE public.foh_tasks SET department = 'voorkant' WHERE department IS NULL;

-- Update single-active trigger om per (location, phase, department) te werken
CREATE OR REPLACE FUNCTION public.foh_enforce_single_active_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  active_count integer;
BEGIN
  IF NEW.is_active = true AND NEW.phase IS NOT NULL THEN
    SELECT COUNT(DISTINCT template_name) INTO active_count
      FROM public.foh_daily_templates
     WHERE location = NEW.location
       AND phase = NEW.phase
       AND COALESCE(department, 'voorkant') = COALESCE(NEW.department, 'voorkant')
       AND is_active = true
       AND template_name IS DISTINCT FROM NEW.template_name;

    IF active_count > 0 THEN
      RAISE EXCEPTION 'Slechts één actieve takenlijst per fase/afdeling toegestaan voor % / % / %. Deactiveer eerst de andere lijst.', NEW.location, NEW.phase, COALESCE(NEW.department, 'voorkant');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update trigger die taak aanmaakt bij nieuw template, zodat department mee overgaat
CREATE OR REPLACE FUNCTION public.create_task_from_new_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_dow integer;
BEGIN
  IF NEW.is_active = true THEN
    IF NEW.repeat_type = 'weekly' AND NEW.day_of_week IS NOT NULL THEN
      current_dow := EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Europe/Amsterdam'));
      IF current_dow != NEW.day_of_week THEN
        RETURN NEW;
      END IF;
    END IF;

    INSERT INTO foh_tasks (
      location, title, due_date, priority, category, phase,
      template_id, estimated_minutes, sort_order, description, department
    )
    VALUES (
      NEW.location, NEW.title,
      (NOW() AT TIME ZONE 'Europe/Amsterdam')::date,
      NEW.priority, NEW.category, NEW.phase,
      NEW.id, NEW.estimated_minutes, NEW.sort_order, NEW.description,
      COALESCE(NEW.department, 'voorkant')
    );
  END IF;
  RETURN NEW;
END;
$function$;
