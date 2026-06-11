
CREATE OR REPLACE FUNCTION public.foh_enforce_single_active_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  active_count integer;
BEGIN
  -- Alleen relevant voor actieve rijen met een fase (periodieke taken uitgesloten)
  IF NEW.is_active = true AND NEW.phase IS NOT NULL THEN
    SELECT COUNT(DISTINCT template_name) INTO active_count
      FROM public.foh_daily_templates
     WHERE location = NEW.location
       AND phase = NEW.phase
       AND is_active = true
       AND template_name IS DISTINCT FROM NEW.template_name;

    IF active_count > 0 THEN
      RAISE EXCEPTION 'Slechts één actieve takenlijst per fase toegestaan voor % / %. Deactiveer eerst de andere lijst.', NEW.location, NEW.phase;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS foh_enforce_single_active_template_trg ON public.foh_daily_templates;
CREATE TRIGGER foh_enforce_single_active_template_trg
BEFORE INSERT OR UPDATE ON public.foh_daily_templates
FOR EACH ROW EXECUTE FUNCTION public.foh_enforce_single_active_template();
