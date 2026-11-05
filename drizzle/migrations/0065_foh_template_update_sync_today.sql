CREATE OR REPLACE FUNCTION public.sync_today_task_from_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  vandaag date := (NOW() AT TIME ZONE 'Europe/Amsterdam')::date;
  dow integer := EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Europe/Amsterdam'));
  hoort_vandaag boolean;
BEGIN
  hoort_vandaag := NEW.is_active = true
    AND NOT (NEW.repeat_type = 'weekly' AND NEW.day_of_week IS NOT NULL AND NEW.day_of_week <> dow);

  IF NOT hoort_vandaag THEN
    UPDATE foh_tasks SET archived = true
     WHERE template_id = NEW.id AND due_date = vandaag
       AND completed = false AND COALESCE(archived,false) = false;
    RETURN NEW;
  END IF;

  UPDATE foh_tasks SET
    location = NEW.location, title = NEW.title, priority = NEW.priority,
    category = NEW.category, phase = NEW.phase, estimated_minutes = NEW.estimated_minutes,
    sort_order = NEW.sort_order, description = NEW.description,
    department = COALESCE(NEW.department, 'voorkant'), foto_url = NEW.foto_url,
    title_en = NEW.title_en, description_en = NEW.description_en
   WHERE template_id = NEW.id AND due_date = vandaag
     AND completed = false AND COALESCE(archived,false) = false;

  IF NOT EXISTS (SELECT 1 FROM foh_tasks WHERE template_id = NEW.id AND due_date = vandaag
                 AND COALESCE(archived,false) = false) THEN
    INSERT INTO foh_tasks (location, title, due_date, priority, category, phase,
      template_id, estimated_minutes, sort_order, description, department, foto_url, title_en, description_en)
    VALUES (NEW.location, NEW.title, vandaag, NEW.priority, NEW.category, NEW.phase,
      NEW.id, NEW.estimated_minutes, NEW.sort_order, NEW.description,
      COALESCE(NEW.department, 'voorkant'), NEW.foto_url, NEW.title_en, NEW.description_en);
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.sync_today_task_from_template() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_template_update_sync_today
AFTER UPDATE ON public.foh_daily_templates
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.sync_today_task_from_template();