
-- Verscherp de fallback-regel: Lightspeed wint alleen als hij >= 10% van Eitje-omzet is
-- (of als er geen Eitje-omzet is)

CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_samenvatting(p_vestigingen text[], p_van date, p_tot date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_len int := (p_tot - p_van);
  v_prev_van date := p_van - (v_len + 1);
  v_prev_tot date := p_van - 1;
  v_result jsonb;
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  WITH per_day AS (
    SELECT
      COALESCE(u.werkdag,   d.werkdag)   AS werkdag,
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.geplande_uren, 0)::numeric AS geplande_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      u.loonkosten_bron,
      CASE
        WHEN COALESCE(d.omzet_incl,0) > 0
         AND COALESCE(d.omzet_incl,0) >= COALESCE(u.eitje_omzet_dag,0) * 0.1
          THEN d.omzet_incl::numeric
        WHEN COALESCE(u.eitje_omzet_dag,0) > 0
          THEN u.eitje_omzet_dag::numeric
        WHEN COALESCE(d.omzet_incl,0) > 0
          THEN d.omzet_incl::numeric
        ELSE 0
      END AS omzet_eff,
      CASE
        WHEN COALESCE(d.omzet_incl,0) > 0
         AND COALESCE(d.omzet_incl,0) >= COALESCE(u.eitje_omzet_dag,0) * 0.1
          THEN 'lightspeed'
        WHEN COALESCE(u.eitje_omzet_dag,0) > 0
          THEN 'eitje'
        WHEN COALESCE(d.omzet_incl,0) > 0
          THEN 'lightspeed'
        ELSE 'geen'
      END AS omzet_bron
    FROM public.uren_dagen u
    FULL OUTER JOIN public.v_cijfers_dag d
      ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    WHERE COALESCE(u.vestiging, d.vestiging) = ANY(p_vestigingen)
      AND COALESCE(u.werkdag,   d.werkdag)   BETWEEN p_van AND p_tot
  ),
  cur AS (
    SELECT vestiging,
           SUM(gewerkte_uren) AS gewerkte_uren,
           SUM(geplande_uren) AS geplande_uren,
           SUM(loonkosten)    AS loonkosten,
           SUM(omzet_eff)     AS omzet,
           COUNT(*) FILTER (WHERE loonkosten_bron = 'eitje')    AS n_loon_eitje,
           COUNT(*) FILTER (WHERE loonkosten_bron = 'berekend') AS n_loon_berekend,
           COUNT(*) FILTER (WHERE omzet_bron = 'lightspeed')    AS n_oms_lightspeed,
           COUNT(*) FILTER (WHERE omzet_bron = 'eitje')         AS n_oms_eitje,
           COUNT(*) FILTER (WHERE omzet_bron = 'geen')          AS n_oms_geen
    FROM per_day GROUP BY vestiging
  ),
  prev_day AS (
    SELECT
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      CASE
        WHEN COALESCE(d.omzet_incl,0) > 0
         AND COALESCE(d.omzet_incl,0) >= COALESCE(u.eitje_omzet_dag,0) * 0.1
          THEN d.omzet_incl::numeric
        WHEN COALESCE(u.eitje_omzet_dag,0) > 0 THEN u.eitje_omzet_dag::numeric
        WHEN COALESCE(d.omzet_incl,0) > 0 THEN d.omzet_incl::numeric
        ELSE 0
      END AS omzet_eff
    FROM public.uren_dagen u
    FULL OUTER JOIN public.v_cijfers_dag d
      ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    WHERE COALESCE(u.vestiging, d.vestiging) = ANY(p_vestigingen)
      AND COALESCE(u.werkdag,   d.werkdag)   BETWEEN v_prev_van AND v_prev_tot
  ),
  prev AS (
    SELECT vestiging, SUM(gewerkte_uren) AS gewerkte_uren, SUM(loonkosten) AS loonkosten, SUM(omzet_eff) AS omzet
    FROM prev_day GROUP BY vestiging
  ),
  per_vest AS (
    SELECT
      COALESCE(c.vestiging, p.vestiging) AS vestiging,
      COALESCE(c.gewerkte_uren, 0) AS gewerkte_uren,
      COALESCE(c.geplande_uren, 0) AS geplande_uren,
      COALESCE(c.loonkosten,    0) AS loonkosten,
      COALESCE(c.omzet,         0) AS omzet,
      COALESCE(c.n_loon_eitje,    0) AS n_loon_eitje,
      COALESCE(c.n_loon_berekend, 0) AS n_loon_berekend,
      COALESCE(c.n_oms_lightspeed,0) AS n_oms_lightspeed,
      COALESCE(c.n_oms_eitje,     0) AS n_oms_eitje,
      COALESCE(c.n_oms_geen,      0) AS n_oms_geen,
      COALESCE(p.gewerkte_uren, 0) AS prev_gewerkte_uren,
      COALESCE(p.loonkosten,    0) AS prev_loonkosten,
      COALESCE(p.omzet,         0) AS prev_omzet
    FROM cur c FULL OUTER JOIN prev p USING (vestiging)
  ),
  tot AS (
    SELECT
      COALESCE(SUM(gewerkte_uren),0) AS gewerkte_uren,
      COALESCE(SUM(geplande_uren),0) AS geplande_uren,
      COALESCE(SUM(loonkosten),0)    AS loonkosten,
      COALESCE(SUM(omzet),0)         AS omzet,
      COALESCE(SUM(n_loon_eitje),0)     AS n_loon_eitje,
      COALESCE(SUM(n_loon_berekend),0)  AS n_loon_berekend,
      COALESCE(SUM(n_oms_lightspeed),0) AS n_oms_lightspeed,
      COALESCE(SUM(n_oms_eitje),0)      AS n_oms_eitje,
      COALESCE(SUM(n_oms_geen),0)       AS n_oms_geen,
      COALESCE(SUM(prev_gewerkte_uren),0) AS prev_gewerkte_uren,
      COALESCE(SUM(prev_loonkosten),0)    AS prev_loonkosten,
      COALESCE(SUM(prev_omzet),0)         AS prev_omzet
    FROM per_vest
  )
  SELECT jsonb_build_object(
    'periode',        jsonb_build_object('van', p_van, 'tot', p_tot),
    'vorige_periode', jsonb_build_object('van', v_prev_van, 'tot', v_prev_tot),
    'totaal', jsonb_build_object(
      'gewerkte_uren', tot.gewerkte_uren, 'geplande_uren', tot.geplande_uren,
      'loonkosten', tot.loonkosten, 'omzet', tot.omzet,
      'loonkosten_pct_omzet',  CASE WHEN tot.omzet = 0 THEN NULL ELSE ROUND((tot.loonkosten/tot.omzet*100)::numeric,1) END,
      'omzet_per_gewerkt_uur', CASE WHEN tot.gewerkte_uren = 0 THEN NULL ELSE ROUND((tot.omzet/tot.gewerkte_uren)::numeric,2) END,
      'prev_loonkosten', tot.prev_loonkosten, 'prev_omzet', tot.prev_omzet, 'prev_gewerkte_uren', tot.prev_gewerkte_uren,
      'bron_mix', jsonb_build_object('eitje', tot.n_loon_eitje, 'berekend', tot.n_loon_berekend),
      'omzet_bron_mix', jsonb_build_object('lightspeed', tot.n_oms_lightspeed, 'eitje', tot.n_oms_eitje, 'geen', tot.n_oms_geen)
    ),
    'per_vestiging', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'vestiging', pv.vestiging,
        'gewerkte_uren', pv.gewerkte_uren, 'geplande_uren', pv.geplande_uren,
        'loonkosten', pv.loonkosten, 'omzet', pv.omzet,
        'loonkosten_pct_omzet',  CASE WHEN pv.omzet = 0 THEN NULL ELSE ROUND((pv.loonkosten/pv.omzet*100)::numeric,1) END,
        'omzet_per_gewerkt_uur', CASE WHEN pv.gewerkte_uren = 0 THEN NULL ELSE ROUND((pv.omzet/pv.gewerkte_uren)::numeric,2) END,
        'prev_loonkosten', pv.prev_loonkosten, 'prev_omzet', pv.prev_omzet, 'prev_gewerkte_uren', pv.prev_gewerkte_uren,
        'bron_mix', jsonb_build_object('eitje', pv.n_loon_eitje, 'berekend', pv.n_loon_berekend),
        'omzet_bron_mix', jsonb_build_object('lightspeed', pv.n_oms_lightspeed, 'eitje', pv.n_oms_eitje, 'geen', pv.n_oms_geen)
      ) ORDER BY pv.vestiging)
      FROM per_vest pv
    ), '[]'::jsonb)
  ) INTO v_result FROM tot;

  RETURN v_result;
END; $function$;


CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_tijdreeks(p_vestigingen text[], p_van date, p_tot date, p_granulariteit text)
 RETURNS TABLE(bucket timestamp with time zone, vestiging text, gewerkte_uren numeric, geplande_uren numeric, loonkosten numeric, omzet numeric, omzet_bron text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;
  IF p_granulariteit NOT IN ('dag','week','maand') THEN
    RAISE EXCEPTION 'granulariteit moet dag|week|maand zijn';
  END IF;

  RETURN QUERY
  WITH per_day AS (
    SELECT
      COALESCE(u.werkdag,   d.werkdag)   AS werkdag,
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.geplande_uren, 0)::numeric AS geplande_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      CASE
        WHEN COALESCE(d.omzet_incl,0) > 0
         AND COALESCE(d.omzet_incl,0) >= COALESCE(u.eitje_omzet_dag,0) * 0.1
          THEN d.omzet_incl::numeric
        WHEN COALESCE(u.eitje_omzet_dag,0) > 0 THEN u.eitje_omzet_dag::numeric
        WHEN COALESCE(d.omzet_incl,0) > 0 THEN d.omzet_incl::numeric
        ELSE 0
      END AS omzet_eff,
      CASE
        WHEN COALESCE(d.omzet_incl,0) > 0
         AND COALESCE(d.omzet_incl,0) >= COALESCE(u.eitje_omzet_dag,0) * 0.1
          THEN 'lightspeed'
        WHEN COALESCE(u.eitje_omzet_dag,0) > 0 THEN 'eitje'
        WHEN COALESCE(d.omzet_incl,0) > 0 THEN 'lightspeed'
        ELSE 'geen'
      END AS bron_dag
    FROM public.uren_dagen u
    FULL OUTER JOIN public.v_cijfers_dag d
      ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    WHERE COALESCE(u.vestiging, d.vestiging) = ANY(p_vestigingen)
      AND COALESCE(u.werkdag,   d.werkdag)   BETWEEN p_van AND p_tot
  ),
  bucketed AS (
    SELECT
      CASE p_granulariteit
        WHEN 'dag'   THEN (werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'week'  THEN (date_trunc('week',  werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'maand' THEN (date_trunc('month', werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
      END AS bucket,
      vestiging, gewerkte_uren, geplande_uren, loonkosten, omzet_eff, bron_dag
    FROM per_day
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
