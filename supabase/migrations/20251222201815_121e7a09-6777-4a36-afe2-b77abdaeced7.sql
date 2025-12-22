-- Create function to automatically create a task when a new active template is inserted
CREATE OR REPLACE FUNCTION public.create_task_from_new_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create task if template is active
  IF NEW.is_active = true THEN
    -- Insert task for today (Amsterdam timezone)
    INSERT INTO foh_tasks (
      location, 
      title, 
      due_date, 
      priority, 
      category, 
      phase, 
      template_id, 
      estimated_minutes, 
      sort_order,
      description
    )
    VALUES (
      NEW.location, 
      NEW.title, 
      (NOW() AT TIME ZONE 'Europe/Amsterdam')::date, 
      NEW.priority, 
      NEW.category, 
      NEW.phase, 
      NEW.id, 
      NEW.estimated_minutes, 
      NEW.sort_order,
      NEW.description
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on foh_daily_templates
CREATE TRIGGER on_template_insert_create_task
  AFTER INSERT ON foh_daily_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_task_from_new_template();