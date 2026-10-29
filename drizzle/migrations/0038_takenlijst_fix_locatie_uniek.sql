CREATE OR REPLACE FUNCTION public.foh_enforce_location_tasks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ingelogde gebruiker: opgegeven vestiging respecteren als hij daar toegang toe heeft.
  -- Alleen bij lege of niet-toegestane vestiging terugvallen op de eigen vestiging.
  IF auth.uid() IS NOT NULL THEN
    IF NEW.location IS NULL OR NOT public.heeft_vestiging(auth.uid(), NEW.location) THEN
      NEW.location := public.current_user_location();
    END IF;
  END IF;

  -- Service role / geen gebruiker: location ongemoeid, maar moet gevuld zijn.
  IF NEW.location IS NULL THEN
    RAISE EXCEPTION 'Location must be provided';
  END IF;

  RETURN NEW;
END $function$;

CREATE UNIQUE INDEX IF NOT EXISTS foh_tasks_uniek_template_per_dag
  ON public.foh_tasks (location, due_date, template_id)
  WHERE template_id IS NOT NULL AND archived = false;