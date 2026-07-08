-- Fix ambiguous column references in bezettings-heatmap RPC
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
    SELECT EXTRACT(ISODOW FROM o2.werkdag)::int AS isodow,
           o2.uur, o2.werkdag, SUM(o2.omzet_incl)::numeric AS omzet_dag_uur
    FROM public.omzet_uren o2
    WHERE o2.vestiging = ANY(p_vestigingen)
      AND o2.werkdag BETWEEN p_van AND p_tot
      AND o2.uur BETWEEN 0 AND 23
    GROUP BY 1, o2.uur, o2.werkdag
  ),
  oms_agg AS (
    SELECT oms.isodow, oms.uur,
           AVG(oms.omzet_dag_uur)::numeric AS gem_omzet,
           COUNT(DISTINCT oms.werkdag)::int AS n_dagen
    FROM oms GROUP BY oms.isodow, oms.uur
  ),
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
    SELECT hourly.shift_id, hourly.bruto_min, hourly.pauze_min, hourly.overlap_min,
           EXTRACT(HOUR FROM hourly.bucket_start)::smallint AS uur,
           CASE WHEN EXTRACT(HOUR FROM hourly.bucket_start) < 6 THEN (hourly.bucket_start::date - 1) ELSE hourly.bucket_start::date END AS werkdag
    FROM hourly WHERE hourly.overlap_min > 0
  ),
  bez_dag AS (
    SELECT mapped.werkdag, mapped.uur,
           COUNT(DISTINCT mapped.shift_id)::numeric AS hc_dag_uur,
           SUM(CASE WHEN mapped.bruto_min > 0 THEN mapped.overlap_min * (1 - LEAST(1, mapped.pauze_min::numeric / mapped.bruto_min)) / 60 ELSE 0 END)::numeric AS fte_dag_uur
    FROM mapped
    WHERE mapped.werkdag BETWEEN p_van AND p_tot
    GROUP BY mapped.werkdag, mapped.uur
  ),
  bez_agg AS (
    SELECT EXTRACT(ISODOW FROM bez_dag.werkdag)::int AS isodow, bez_dag.uur,
           AVG(bez_dag.hc_dag_uur)::numeric  AS gem_headcount,
           AVG(bez_dag.fte_dag_uur)::numeric AS gem_fte
    FROM bez_dag GROUP BY 1, bez_dag.uur
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

-- Fix ambiguous column references in loze-uren RPC
CREATE OR REPLACE FUNCTION public.rpc_cijfers_loze_uren(
  p_vestigingen text[], p_van date, p_tot date, p_top int DEFAULT 12
)
RETURNS TABLE(
  vestiging text, isodow int, uur smallint,
  n_dagen int,
  gem_omzet numeric, gem_headcount numeric, gem_fte numeric,
  gem_loonkosten numeric, pct_vangnet numeric,
  loonkosten_bron text,
  verspilling numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  RETURN QUERY
  WITH inst AS (
    SELECT ci.vestiging, ci.loon_pct_doel, ci.service_uur_start, ci.service_uur_eind
    FROM public.cijfers_instellingen ci
    WHERE ci.vestiging = ANY(p_vestigingen)
  ),
  ud AS (
    SELECT ud0.vestiging, ud0.werkdag,
           CASE WHEN ud0.gewerkte_uren > 0 THEN ud0.loonkosten/ud0.gewerkte_uren ELSE 0 END AS eff_uurloon,
           ud0.loonkosten_bron
    FROM public.uren_dagen ud0
    WHERE ud0.vestiging = ANY(p_vestigingen)
      AND ud0.werkdag BETWEEN p_van AND p_tot
  ),
  bez AS (
    SELECT b.vestiging, b.werkdag, b.uur,
           b.headcount, b.fte_fractie
    FROM public.f_uren_bezetting_per_uur(p_vestigingen, p_van, p_tot, 'time_registration') b
  ),
  vang AS (
    SELECT us.vestiging, us.werkdag,
           EXTRACT(HOUR FROM (us.start_ts AT TIME ZONE 'Europe/Amsterdam'))::smallint AS uur_approx,
           SUM(CASE WHEN us.uurloon_bron = 'vangnet' THEN 1 ELSE 0 END)::numeric
             / NULLIF(COUNT(*)::numeric, 0) AS aandeel_vangnet
    FROM public.uren_shifts us
    WHERE us.vestiging = ANY(p_vestigingen)
      AND us.werkdag BETWEEN p_van AND p_tot
      AND us.bron = 'time_registration'
      AND NOT us.is_demo
    GROUP BY us.vestiging, us.werkdag,
             EXTRACT(HOUR FROM (us.start_ts AT TIME ZONE 'Europe/Amsterdam'))
  ),
  oms AS (
    SELECT o2.vestiging, o2.werkdag, o2.uur, SUM(o2.omzet_incl)::numeric AS omzet_uur
    FROM public.omzet_uren o2
    WHERE o2.vestiging = ANY(p_vestigingen)
      AND o2.werkdag BETWEEN p_van AND p_tot
    GROUP BY o2.vestiging, o2.werkdag, o2.uur
  ),
  per_row AS (
    SELECT b.vestiging, b.werkdag, b.uur,
           b.headcount, b.fte_fractie,
           COALESCE(o.omzet_uur, 0) AS omzet_uur,
           b.fte_fractie * COALESCE(ud.eff_uurloon, 0) AS loonkosten_uur,
           ud.loonkosten_bron,
           COALESCE(v.aandeel_vangnet, 0) AS aandeel_vangnet
    FROM bez b
    LEFT JOIN ud ON ud.vestiging = b.vestiging AND ud.werkdag = b.werkdag
    LEFT JOIN oms o ON o.vestiging = b.vestiging AND o.werkdag = b.werkdag AND o.uur = b.uur
    LEFT JOIN vang v ON v.vestiging = b.vestiging AND v.werkdag = b.werkdag AND v.uur_approx = b.uur
  ),
  agg AS (
    SELECT
      pr.vestiging,
      EXTRACT(ISODOW FROM pr.werkdag)::int AS isodow,
      pr.uur,
      COUNT(DISTINCT pr.werkdag)::int AS n_dagen,
      AVG(pr.omzet_uur)::numeric       AS gem_omzet,
      AVG(pr.headcount)::numeric       AS gem_headcount,
      AVG(pr.fte_fractie)::numeric     AS gem_fte,
      AVG(pr.loonkosten_uur)::numeric  AS gem_loonkosten,
      AVG(pr.aandeel_vangnet)::numeric AS pct_vangnet,
      CASE
        WHEN AVG(pr.aandeel_vangnet) > 0.2
          OR SUM(CASE WHEN pr.loonkosten_bron = 'berekend' THEN 1 ELSE 0 END) > 0
        THEN 'schatting'
        ELSE 'eitje'
      END AS loonkosten_bron
    FROM per_row pr
    GROUP BY pr.vestiging, EXTRACT(ISODOW FROM pr.werkdag), pr.uur
  ),
  filt AS (
    SELECT a.*, i.loon_pct_doel
    FROM agg a
    JOIN inst i ON i.vestiging = a.vestiging
    WHERE a.uur BETWEEN i.service_uur_start AND (i.service_uur_eind - 1)
      AND a.gem_headcount >= 1
      AND a.n_dagen >= 2
  )
  SELECT
    f.vestiging, f.isodow, f.uur,
    f.n_dagen,
    ROUND(f.gem_omzet, 2),
    ROUND(f.gem_headcount, 2),
    ROUND(f.gem_fte, 2),
    ROUND(f.gem_loonkosten, 2),
    ROUND(f.pct_vangnet, 3),
    f.loonkosten_bron,
    ROUND((f.gem_loonkosten - (f.gem_omzet * COALESCE(f.loon_pct_doel, 30) / 100.0)), 2) AS verspilling
  FROM filt f
  WHERE (f.gem_loonkosten - (f.gem_omzet * COALESCE(f.loon_pct_doel, 30) / 100.0)) > 0
  ORDER BY verspilling DESC
  LIMIT p_top;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_cijfers_heatmap_bezet(text[], date, date) FROM public;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_heatmap_bezet(text[], date, date) TO authenticated, service_role, anon;
REVOKE ALL ON FUNCTION public.rpc_cijfers_loze_uren(text[], date, date, int) FROM public;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_loze_uren(text[], date, date, int) TO authenticated, service_role;