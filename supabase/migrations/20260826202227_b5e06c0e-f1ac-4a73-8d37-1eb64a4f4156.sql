ALTER TABLE public.mep_templates ADD COLUMN IF NOT EXISTS notitie text;

CREATE OR REPLACE FUNCTION public.mep_bouw_dag(_vestiging text, _datum date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _vorige date;
  _toegevoegd integer := 0;
  _n integer;
BEGIN
  IF NOT public.mep_is_open(_vestiging, _datum) THEN
    INSERT INTO public.mep_dagopbouw_log (vestiging, datum, regels_toegevoegd)
    VALUES (_vestiging, _datum, 0)
    ON CONFLICT (vestiging, datum) DO UPDATE SET uitgevoerd_op = now();
    RETURN 0;
  END IF;

  INSERT INTO public.mep_planning
    (date, location, titel, handeling, recipe_id, quantity, eenheid, prioriteit, sort_order, notes, bron, status)
  SELECT _datum, _vestiging, t.titel, t.handeling, t.recipe_id,
         COALESCE(t.aantal, 1)::integer, t.eenheid, t.prioriteit, t.sort_order, t.notitie, 'template', 'pending'
  FROM public.mep_templates t
  WHERE t.vestiging = _vestiging
    AND t.actief
    AND (t.weekdag IS NULL OR t.weekdag = EXTRACT(DOW FROM _datum)::smallint)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT; _toegevoegd := _toegevoegd + _n;

  _vorige := public.mep_vorige_open_dag(_vestiging, _datum);
  INSERT INTO public.mep_planning
    (date, location, titel, handeling, recipe_id, quantity, eenheid, prioriteit, sort_order,
     employee_id, notes, bron, doorgeschoven_van, doorschuif_teller, status)
  SELECT _datum, _vestiging, p.titel, p.handeling, p.recipe_id,
         GREATEST(COALESCE(p.quantity, 1) - COALESCE(p.aantal_klaar, 0), 1)::integer,
         p.eenheid, p.prioriteit, p.sort_order, NULL, p.notes,
         'doorgeschoven', p.date, COALESCE(p.doorschuif_teller, 0) + 1, 'pending'
  FROM public.mep_planning p
  WHERE p.location = _vestiging
    AND p.date = _vorige
    AND p.deleted_at IS NULL
    AND p.completed_at IS NULL
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT; _toegevoegd := _toegevoegd + _n;

  INSERT INTO public.mep_dagopbouw_log (vestiging, datum, regels_toegevoegd)
  VALUES (_vestiging, _datum, _toegevoegd)
  ON CONFLICT (vestiging, datum) DO UPDATE
    SET uitgevoerd_op = now(),
        regels_toegevoegd = public.mep_dagopbouw_log.regels_toegevoegd + EXCLUDED.regels_toegevoegd;

  RETURN _toegevoegd;
END;
$function$;