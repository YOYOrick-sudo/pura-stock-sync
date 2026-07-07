
CREATE OR REPLACE FUNCTION public.rpc_cijfers_tijdreeks(p_vestigingen text[], p_van date, p_tot date, p_granulariteit text)
 RETURNS TABLE(bucket timestamp with time zone, vestiging text, omzet numeric, bonnen integer, omzet_bron text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
BEGIN
  IF p_granulariteit = 'uur' THEN
    RETURN QUERY
    SELECT ((o.werkdag::timestamp + (o.uur || ' hours')::interval) AT TIME ZONE 'Europe/Amsterdam') AS bucket,
           o.vestiging,
           SUM(o.omzet_incl)::numeric AS omzet,
           SUM(o.aantal_bonnen)::int  AS bonnen,
           'lightspeed'::text         AS omzet_bron
    FROM public.omzet_uren o
    WHERE o.vestiging = ANY(p_vestigingen)
      AND o.werkdag BETWEEN p_van AND p_tot
    GROUP BY 1, o.vestiging
    ORDER BY 1;
    RETURN;
  ELSIF p_granulariteit NOT IN ('dag','maand') THEN
    RAISE EXCEPTION 'granulariteit moet uur|dag|maand zijn';
  END IF;

  RETURN QUERY
  WITH d AS (
    SELECT vd.werkdag, vd.vestiging, vd.omzet_incl, vd.aantal_bonnen
    FROM public.v_cijfers_dag vd
    WHERE vd.vestiging = ANY(p_vestigingen)
      AND vd.werkdag BETWEEN p_van AND p_tot
  ),
  u AS (
    SELECT ud.werkdag, ud.vestiging, ud.eitje_omzet_dag
    FROM public.uren_dagen ud
    WHERE ud.vestiging = ANY(p_vestigingen)
      AND ud.werkdag BETWEEN p_van AND p_tot
  ),
  per_day AS (
    SELECT
      COALESCE(d.werkdag,   u.werkdag)   AS werkdag,
      COALESCE(d.vestiging, u.vestiging) AS vestiging,
      COALESCE(d.aantal_bonnen, 0)::int  AS bonnen_ls,
      e.omzet AS omzet_eff,
      e.bron  AS bron_dag
    FROM d
    FULL OUTER JOIN u ON u.werkdag = d.werkdag AND u.vestiging = d.vestiging
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
  ),
  bucketed AS (
    SELECT
      CASE p_granulariteit
        WHEN 'dag'   THEN (pd.werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'maand' THEN (date_trunc('month', pd.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
      END AS bucket,
      pd.vestiging, pd.bonnen_ls, pd.omzet_eff, pd.bron_dag
    FROM per_day pd
  )
  SELECT
    b.bucket, b.vestiging,
    SUM(b.omzet_eff)::numeric AS omzet,
    CASE
      WHEN COUNT(*) FILTER (WHERE b.bron_dag IN ('eitje','geen')) = 0
        THEN SUM(b.bonnen_ls)::int
      ELSE NULL
    END AS bonnen,
    CASE
      WHEN COUNT(*) FILTER (WHERE b.bron_dag = 'lightspeed') > 0
       AND COUNT(*) FILTER (WHERE b.bron_dag = 'eitje')      > 0 THEN 'gemengd'
      WHEN COUNT(*) FILTER (WHERE b.bron_dag = 'lightspeed') > 0 THEN 'lightspeed'
      WHEN COUNT(*) FILTER (WHERE b.bron_dag = 'eitje')      > 0 THEN 'eitje'
      ELSE 'geen'
    END AS omzet_bron
  FROM bucketed b
  GROUP BY b.bucket, b.vestiging
  ORDER BY b.bucket, b.vestiging;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_tijdreeks(p_vestigingen text[], p_van date, p_tot date, p_granulariteit text)
 RETURNS TABLE(bucket timestamp with time zone, vestiging text, gewerkte_uren numeric, geplande_uren numeric, loonkosten numeric, omzet numeric, omzet_bron text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;
  IF p_granulariteit NOT IN ('dag','week','maand') THEN
    RAISE EXCEPTION 'granulariteit moet dag|week|maand zijn';
  END IF;

  RETURN QUERY
  WITH u AS (
    SELECT ud.werkdag, ud.vestiging, ud.gewerkte_uren, ud.geplande_uren, ud.loonkosten, ud.eitje_omzet_dag
    FROM public.uren_dagen ud
    WHERE ud.vestiging = ANY(p_vestigingen)
      AND ud.werkdag BETWEEN p_van AND p_tot
  ),
  d AS (
    SELECT vd.werkdag, vd.vestiging, vd.omzet_incl
    FROM public.v_cijfers_dag vd
    WHERE vd.vestiging = ANY(p_vestigingen)
      AND vd.werkdag BETWEEN p_van AND p_tot
  ),
  per_day AS (
    SELECT
      COALESCE(u.werkdag,   d.werkdag)   AS werkdag,
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.geplande_uren, 0)::numeric AS geplande_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      e.omzet AS omzet_eff,
      e.bron  AS bron_dag
    FROM u
    FULL OUTER JOIN d ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
  ),
  bucketed AS (
    SELECT
      CASE p_granulariteit
        WHEN 'dag'   THEN (pd.werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'week'  THEN (date_trunc('week',  pd.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'maand' THEN (date_trunc('month', pd.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
      END AS bucket,
      pd.vestiging, pd.gewerkte_uren, pd.geplande_uren, pd.loonkosten, pd.omzet_eff, pd.bron_dag
    FROM per_day pd
  )
  SELECT
    b.bucket, b.vestiging,
    SUM(b.gewerkte_uren)::numeric, SUM(b.geplande_uren)::numeric,
    SUM(b.loonkosten)::numeric, SUM(b.omzet_eff)::numeric,
    CASE
      WHEN COUNT(*) FILTER (WHERE b.bron_dag='lightspeed') > 0
       AND COUNT(*) FILTER (WHERE b.bron_dag='eitje')      > 0 THEN 'gemengd'
      WHEN COUNT(*) FILTER (WHERE b.bron_dag='lightspeed') > 0 THEN 'lightspeed'
      WHEN COUNT(*) FILTER (WHERE b.bron_dag='eitje')      > 0 THEN 'eitje'
      ELSE 'geen'
    END AS omzet_bron
  FROM bucketed b
  GROUP BY b.bucket, b.vestiging
  ORDER BY b.bucket, b.vestiging;
END; $function$;
