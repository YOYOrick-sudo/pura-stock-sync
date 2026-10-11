DROP TRIGGER IF EXISTS foh_enforce_location_templates ON public.foh_daily_templates;
CREATE TRIGGER foh_enforce_location_templates BEFORE INSERT ON public.foh_daily_templates FOR EACH ROW EXECUTE FUNCTION public.foh_enforce_location_employees();
DROP TRIGGER IF EXISTS trg_foh_tasks_loc ON public.foh_tasks;
CREATE TRIGGER trg_foh_tasks_loc BEFORE INSERT ON public.foh_tasks FOR EACH ROW EXECUTE FUNCTION public.foh_enforce_location_tasks();

CREATE OR REPLACE FUNCTION public.foh_guard_location_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.location IS DISTINCT FROM OLD.location AND auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'admin')) THEN
    NEW.location := OLD.location;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER foh_guard_location_update_templates BEFORE UPDATE ON public.foh_daily_templates FOR EACH ROW EXECUTE FUNCTION public.foh_guard_location_update();
CREATE TRIGGER foh_guard_location_update_tasks BEFORE UPDATE ON public.foh_tasks FOR EACH ROW EXECUTE FUNCTION public.foh_guard_location_update();