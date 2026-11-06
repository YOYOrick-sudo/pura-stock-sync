CREATE OR REPLACE FUNCTION public.f_vorige_periode(p_van date, p_tot date, p_mode text DEFAULT 'custom'::text)
 RETURNS TABLE(prev_van date, prev_tot date)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hist_min date := '2020-07-15'::date;
  v_van date;
  v_tot date;
BEGIN
  IF p_mode IN ('dag_prev', 'week_prev', 'weekend_prev') THEN
    v_van := p_van - 7;
    v_tot := p_tot - 7;
  ELSE
    -- Vorig jaar = 52 weken terug, zodat de weekdag gelijk blijft.
    v_van := p_van - 364;
    v_tot := p_tot - 364;
  END IF;
  IF v_van < v_hist_min THEN
    prev_van := NULL; prev_tot := NULL;
  ELSE
    prev_van := v_van; prev_tot := v_tot;
  END IF;
  RETURN NEXT;
END;
$function$;