
-- Add day_of_week column to foh_daily_templates
ALTER TABLE public.foh_daily_templates
ADD COLUMN day_of_week integer;

-- Add day_of_week column to foh_tasks (for generated tasks to carry forward)
ALTER TABLE public.foh_tasks
ADD COLUMN day_of_week integer;

-- Update the trigger to check day_of_week for weekly templates
CREATE OR REPLACE FUNCTION public.create_task_from_new_template()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_dow integer;
BEGIN
  -- Only create task if template is active
  IF NEW.is_active = true THEN
    -- For weekly templates, check if today is the right day
    IF NEW.repeat_type = 'weekly' AND NEW.day_of_week IS NOT NULL THEN
      current_dow := EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Europe/Amsterdam'));
      IF current_dow != NEW.day_of_week THEN
        RETURN NEW; -- Skip, not the right day
      END IF;
    END IF;

    INSERT INTO foh_tasks (
      location, title, due_date, priority, category, phase, 
      template_id, estimated_minutes, sort_order, description
    )
    VALUES (
      NEW.location, NEW.title, 
      (NOW() AT TIME ZONE 'Europe/Amsterdam')::date, 
      NEW.priority, NEW.category, NEW.phase, 
      NEW.id, NEW.estimated_minutes, NEW.sort_order, NEW.description
    );
  END IF;
  RETURN NEW;
END;
$function$;
