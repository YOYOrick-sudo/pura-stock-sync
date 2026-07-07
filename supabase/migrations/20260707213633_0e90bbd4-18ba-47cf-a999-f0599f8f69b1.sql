
CREATE OR REPLACE FUNCTION public.f_vorige_periode(p_van date, p_tot date)
RETURNS TABLE(prev_van date, prev_tot date)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- 1 dag: zelfde weekdag vorige week
  IF p_van = p_tot THEN
    prev_van := p_van - 7;
    prev_tot := p_tot - 7;
    RETURN NEXT; RETURN;
  END IF;

  -- Volledig kalenderjaar: vorig jaar
  IF p_van = date_trunc('year', p_van)::date
     AND p_tot = (date_trunc('year', p_van) + INTERVAL '1 year - 1 day')::date THEN
    prev_van := (p_van - INTERVAL '1 year')::date;
    prev_tot := (p_tot - INTERVAL '1 year')::date;
    RETURN NEXT; RETURN;
  END IF;

  -- Maand-selectie (heel OF lopend mid-maand): p_van=1e, p_tot in dezelfde maand
  -- → zelfde dagen één jaar eerder
  IF p_van = date_trunc('month', p_van)::date
     AND date_trunc('month', p_tot)::date = date_trunc('month', p_van)::date THEN
    prev_van := (p_van - INTERVAL '1 year')::date;
    prev_tot := (p_tot - INTERVAL '1 year')::date;
    RETURN NEXT; RETURN;
  END IF;

  -- Anders (week, custom range): zelfde lengte, 7 dagen eerder (weekdag-eerlijk)
  prev_van := p_van - 7;
  prev_tot := p_tot - 7;
  RETURN NEXT;
END;
$$;
