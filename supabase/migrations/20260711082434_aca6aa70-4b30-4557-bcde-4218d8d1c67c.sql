
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
  -- Shortcuts die uitdrukkelijk "periode ervoor" willen tonen
  IF p_mode IN ('dag_prev', 'week_prev', 'weekend_prev') THEN
    v_van := p_van - 7;
    v_tot := p_tot - 7;
  ELSIF p_mode = 'dag' THEN
    -- Zelfde weekdag vorig jaar: 52 weken = 364 dagen terug (behoudt weekdag,
    -- ~1 dag off kalender; voor seizoensbedrijf is weekdag+seizoen belangrijker
    -- dan exacte kalenderdatum).
    v_van := p_van - 364;
    v_tot := p_tot - 364;
  ELSIF p_mode = 'week' THEN
    -- Zelfde ISO-week vorig jaar (52 weken terug)
    v_van := p_van - 364;
    v_tot := p_tot - 364;
  ELSIF p_mode IN ('maand', 'jaar') THEN
    v_van := (p_van - INTERVAL '1 year')::date;
    v_tot := (p_tot - INTERVAL '1 year')::date;
  ELSE
    -- custom (default): -1 jaar, zelfde kalenderdatums
    v_van := (p_van - INTERVAL '1 year')::date;
    v_tot := (p_tot - INTERVAL '1 year')::date;
  END IF;

  -- Guard: als vorig-jaar-periode buiten historie valt, geen vergelijking.
  IF v_van < v_hist_min THEN
    prev_van := NULL;
    prev_tot := NULL;
  ELSE
    prev_van := v_van;
    prev_tot := v_tot;
  END IF;
  RETURN NEXT;
END;
$function$;
