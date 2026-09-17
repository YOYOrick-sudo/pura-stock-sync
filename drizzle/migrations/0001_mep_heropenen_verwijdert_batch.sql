-- Bij heropenen van een MEP-taak hoort ook de bijbehorende productiebatch te
-- verdwijnen; anders blijft er een spookregel staan onder "Geproduceerd vandaag".
CREATE OR REPLACE FUNCTION public.mep_taak_heropenen(_taak_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _batches uuid[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000'; END IF;

  SELECT array_agg(batch_id) FILTER (WHERE batch_id IS NOT NULL)
    INTO _batches
    FROM public.mep_taak_afrondingen
   WHERE taak_id = _taak_id;

  DELETE FROM public.mep_taak_afrondingen WHERE taak_id = _taak_id;

  IF _batches IS NOT NULL THEN
    DELETE FROM public.productie_batches WHERE id = ANY(_batches);
  END IF;

  UPDATE public.mep_taken SET status = 'open', updated_at = now() WHERE id = _taak_id;
END $function$;

-- Testregel van de bugronde opruimen.
DELETE FROM public.productie_batches
 WHERE omschrijving = 'ZZ Afrondtest' AND productie_datum = CURRENT_DATE;