
CREATE OR REPLACE FUNCTION public.rpc_cijfers_heatmap_bezet(
  p_vestigingen text[], p_van date, p_tot date
)
RETURNS TABLE(
  isodow int, uur smallint,
  gem_omzet numeric, n_dagen int,
  gem_headcount numeric, gem_fte numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.mag_cijfers_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot cijfers';
  END IF;

  RETURN QUERY
  WITH oms AS (
    SELECT EXTRACT(ISODOW FROM werkdag)::int AS isodow,
           uur, werkdag, SUM(omzet_incl)::numeric AS omzet_dag_uur
    FROM public.omzet_uren
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
      AND uur BETWEEN 0 AND 23
    GROUP BY 1, uur, werkdag
  ),
  oms_agg AS (
    SELECT isodow, uur,
           AVG(omzet_dag_uur)::numeric AS gem_omzet,
           COUNT(DISTINCT werkdag)::int AS n_dagen
    FROM oms GROUP BY isodow, uur
  ),
  -- Inline bezettingsberekening (geen loonkosten-check, alleen cijfers-check hierboven)
  s AS (
    SELECT us.id AS shift_id, us.vestiging, us.pauze_min,
           (us.start_ts AT TIME ZONE 'Europe/Amsterdam') AS sl,
           (us.eind_ts  AT TIME ZONE 'Europe/Amsterdam') AS el,
           EXTRACT(EPOCH FROM ((us.eind_ts AT TIME ZONE 'Europe/Amsterdam') - (us.start_ts AT TIME ZONE 'Europe/Amsterdam')))/60 AS bruto_min
    FROM public.uren_shifts us
    WHERE us.vestiging = ANY(p_vestigingen)
      AND us.bron = 'time_registration'
      AND NOT us.is_demo
      AND us.werkdag BETWEEN (p_van - 1) AND p_tot
  ),
  hourly AS (
    SELECT s.shift_id, s.vestiging, s.bruto_min, s.pauze_min,
           (date_trunc('hour', s.sl) + make_interval(hours => h)) AS bucket_start,
           GREATEST(0, EXTRACT(EPOCH FROM (
             LEAST(s.el, (date_trunc('hour', s.sl) + make_interval(hours => h + 1)))
             - GREATEST(s.sl, (date_trunc('hour', s.sl) + make_interval(hours => h)))
           ))/60) AS overlap_min
    FROM s CROSS JOIN generate_series(0, 24) h
  ),
  mapped AS (
    SELECT shift_id, bruto_min, pauze_min, overlap_min,
           EXTRACT(HOUR FROM bucket_start)::smallint AS uur,
           CASE WHEN EXTRACT(HOUR FROM bucket_start) < 6 THEN (bucket_start::date - 1) ELSE bucket_start::date END AS werkdag
    FROM hourly WHERE overlap_min > 0
  ),
  bez_dag AS (
    SELECT werkdag, uur,
           COUNT(DISTINCT shift_id)::numeric AS hc_dag_uur,
           SUM(CASE WHEN bruto_min > 0 THEN overlap_min * (1 - LEAST(1, pauze_min::numeric / bruto_min)) / 60 ELSE 0 END)::numeric AS fte_dag_uur
    FROM mapped
    WHERE werkdag BETWEEN p_van AND p_tot
    GROUP BY werkdag, uur
  ),
  bez_agg AS (
    SELECT EXTRACT(ISODOW FROM werkdag)::int AS isodow, uur,
           AVG(hc_dag_uur)::numeric  AS gem_headcount,
           AVG(fte_dag_uur)::numeric AS gem_fte
    FROM bez_dag GROUP BY 1, uur
  )
  SELECT
    COALESCE(o.isodow, b.isodow) AS isodow,
    COALESCE(o.uur, b.uur)       AS uur,
    COALESCE(o.gem_omzet, 0)::numeric,
    COALESCE(o.n_dagen, 0)::int,
    COALESCE(b.gem_headcount, 0)::numeric,
    COALESCE(b.gem_fte, 0)::numeric
  FROM oms_agg o
  FULL OUTER JOIN bez_agg b ON b.isodow = o.isodow AND b.uur = o.uur
  ORDER BY 1, 2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cijfers_heatmap_bezet(text[], date, date) TO authenticated, service_role, anon;
