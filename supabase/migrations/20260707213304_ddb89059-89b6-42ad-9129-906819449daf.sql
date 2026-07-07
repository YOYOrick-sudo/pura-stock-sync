
CREATE OR REPLACE FUNCTION public.f_vorige_periode(p_van date, p_tot date)
RETURNS TABLE(prev_van date, prev_tot date)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_len int := (p_tot - p_van);
BEGIN
  -- 1 dag: zelfde weekdag vorige week
  IF p_van = p_tot THEN
    prev_van := p_van - 7;
    prev_tot := p_tot - 7;
    RETURN NEXT; RETURN;
  END IF;
  -- Volledig kalenderjaar
  IF p_van = date_trunc('year', p_van)::date
     AND p_tot = (date_trunc('year', p_van) + INTERVAL '1 year - 1 day')::date THEN
    prev_van := (p_van - INTERVAL '1 year')::date;
    prev_tot := (p_tot - INTERVAL '1 year')::date;
    RETURN NEXT; RETURN;
  END IF;
  -- Volledige kalendermaand
  IF p_van = date_trunc('month', p_van)::date
     AND p_tot = (date_trunc('month', p_van) + INTERVAL '1 month - 1 day')::date THEN
    prev_van := (p_van - INTERVAL '1 year')::date;
    prev_tot := (p_tot - INTERVAL '1 year')::date;
    RETURN NEXT; RETURN;
  END IF;
  -- Anders: zelfde lengte, 7 dagen eerder (weekdag-eerlijk)
  prev_van := p_van - 7;
  prev_tot := p_tot - 7;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.f_vorige_periode(date, date) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rpc_cijfers_samenvatting(p_vestigingen text[], p_van date, p_tot date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prev_van date;
  v_prev_tot date;
  v_result jsonb;
BEGIN
  SELECT prev_van, prev_tot INTO v_prev_van, v_prev_tot FROM public.f_vorige_periode(p_van, p_tot);

  WITH d_cur AS (
    SELECT werkdag, vestiging, omzet_incl, aantal_bonnen
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  u_cur AS (
    SELECT werkdag, vestiging, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  per_day_cur AS (
    SELECT
      COALESCE(d.werkdag, u.werkdag)     AS werkdag,
      COALESCE(d.vestiging, u.vestiging) AS vestiging,
      COALESCE(d.aantal_bonnen, 0)::int  AS bonnen_ls,
      COALESCE(d.omzet_incl, 0)::numeric AS ls_omzet,
      e.omzet AS omzet_eff,
      e.bron  AS omzet_bron
    FROM d_cur d
    FULL OUTER JOIN u_cur u ON u.werkdag = d.werkdag AND u.vestiging = d.vestiging
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
  ),
  cur AS (
    SELECT vestiging,
           SUM(omzet_eff) AS omzet,
           COUNT(*) FILTER (WHERE omzet_bron = 'lightspeed') AS n_ls,
           COUNT(*) FILTER (WHERE omzet_bron = 'eitje')      AS n_eitje,
           COUNT(*) FILTER (WHERE omzet_bron = 'geen')       AS n_geen,
           SUM(bonnen_ls) FILTER (WHERE omzet_bron = 'lightspeed') AS bonnen_ls_sum,
           COUNT(*) FILTER (WHERE omzet_bron = 'lightspeed' AND ls_omzet > 0) AS open_dagen_ls
    FROM per_day_cur
    GROUP BY vestiging
  ),
  d_prev AS (
    SELECT werkdag, vestiging, omzet_incl
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN v_prev_van AND v_prev_tot
  ),
  u_prev AS (
    SELECT werkdag, vestiging, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN v_prev_van AND v_prev_tot
  ),
  per_day_prev AS (
    SELECT
      COALESCE(d.vestiging, u.vestiging) AS vestiging,
      e.omzet AS omzet_eff,
      e.bron  AS omzet_bron
    FROM d_prev d
    FULL OUTER JOIN u_prev u ON u.werkdag = d.werkdag AND u.vestiging = d.vestiging
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
  ),
  prev AS (
    SELECT vestiging,
           SUM(omzet_eff) AS omzet,
           COUNT(*) FILTER (WHERE omzet_bron IN ('lightspeed','eitje')) AS n_data,
           COUNT(*) FILTER (WHERE omzet_bron = 'lightspeed') AS n_ls,
           COUNT(*) FILTER (WHERE omzet_bron = 'eitje')      AS n_eitje,
           COUNT(*) FILTER (WHERE omzet_bron = 'geen')       AS n_geen
    FROM per_day_prev
    GROUP BY vestiging
  ),
  cur_clean AS (
    SELECT c.vestiging, c.omzet,
           CASE WHEN c.n_eitje = 0 AND c.n_geen = 0 THEN c.bonnen_ls_sum ELSE NULL END AS bonnen,
           CASE WHEN c.n_eitje = 0 AND c.n_geen = 0 THEN c.open_dagen_ls ELSE NULL END AS open_dagen,
           c.n_ls, c.n_eitje, c.n_geen
    FROM cur c
  ),
  tot AS (
    SELECT COALESCE(SUM(omzet),0)     AS omzet,
           SUM(bonnen)                AS bonnen,
           SUM(open_dagen)            AS open_dagen,
           COALESCE(SUM(n_ls),0)      AS n_ls,
           COALESCE(SUM(n_eitje),0)   AS n_eitje,
           COALESCE(SUM(n_geen),0)    AS n_geen
    FROM cur_clean
  ),
  tot_prev AS (
    SELECT COALESCE(SUM(omzet),0) AS omzet,
           COALESCE(SUM(n_data),0) AS n_data,
           COALESCE(SUM(n_ls),0) AS n_ls,
           COALESCE(SUM(n_eitje),0) AS n_eitje,
           COALESCE(SUM(n_geen),0) AS n_geen
    FROM prev
  )
  SELECT jsonb_build_object(
    'periode',        jsonb_build_object('van', p_van, 'tot', p_tot),
    'vorige_periode', jsonb_build_object('van', v_prev_van, 'tot', v_prev_tot),
    'totaal', jsonb_build_object(
      'omzet',        tot.omzet,
      'bonnen',       CASE WHEN tot.n_eitje = 0 AND tot.n_geen = 0 THEN tot.bonnen ELSE NULL END,
      'open_dagen',   CASE WHEN tot.n_eitje = 0 AND tot.n_geen = 0 THEN tot.open_dagen ELSE NULL END,
      'vorige_omzet', CASE WHEN (SELECT n_data FROM tot_prev) = 0 THEN NULL ELSE (SELECT omzet FROM tot_prev) END,
      'omzet_bron_mix', jsonb_build_object('lightspeed', tot.n_ls, 'eitje', tot.n_eitje, 'geen', tot.n_geen),
      'vorige_omzet_bron_mix', jsonb_build_object(
        'lightspeed', (SELECT n_ls FROM tot_prev),
        'eitje',      (SELECT n_eitje FROM tot_prev),
        'geen',       (SELECT n_geen FROM tot_prev)
      )
    ),
    'per_vestiging', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'vestiging',  c.vestiging,
        'omzet',      c.omzet,
        'bonnen',     c.bonnen,
        'open_dagen', c.open_dagen,
        'vorige_omzet', CASE WHEN COALESCE(p.n_data,0) = 0 THEN NULL ELSE p.omzet END,
        'omzet_bron_mix', jsonb_build_object('lightspeed', c.n_ls, 'eitje', c.n_eitje, 'geen', c.n_geen),
        'vorige_omzet_bron_mix', jsonb_build_object(
          'lightspeed', COALESCE(p.n_ls,0),
          'eitje',      COALESCE(p.n_eitje,0),
          'geen',       COALESCE(p.n_geen,0)
        )
      ) ORDER BY c.vestiging)
      FROM cur_clean c LEFT JOIN prev p USING (vestiging)
    ), '[]'::jsonb)
  ) INTO v_result FROM tot;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_samenvatting(p_vestigingen text[], p_van date, p_tot date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prev_van date;
  v_prev_tot date;
  v_result jsonb;
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  SELECT prev_van, prev_tot INTO v_prev_van, v_prev_tot FROM public.f_vorige_periode(p_van, p_tot);

  WITH u_cur AS (
    SELECT werkdag, vestiging, gewerkte_uren, geplande_uren, loonkosten, loonkosten_bron, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  d_cur AS (
    SELECT werkdag, vestiging, omzet_incl
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  per_day AS (
    SELECT
      COALESCE(u.werkdag,   d.werkdag)   AS werkdag,
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.geplande_uren, 0)::numeric AS geplande_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      u.loonkosten_bron,
      e.omzet AS omzet_eff,
      e.bron  AS omzet_bron
    FROM u_cur u
    FULL OUTER JOIN d_cur d ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
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
  u_prev AS (
    SELECT werkdag, vestiging, gewerkte_uren, loonkosten, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN v_prev_van AND v_prev_tot
  ),
  d_prev AS (
    SELECT werkdag, vestiging, omzet_incl
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN v_prev_van AND v_prev_tot
  ),
  prev_day AS (
    SELECT
      COALESCE(u.vestiging, d.vestiging) AS vestiging,
      COALESCE(u.gewerkte_uren, 0)::numeric AS gewerkte_uren,
      COALESCE(u.loonkosten,    0)::numeric AS loonkosten,
      e.omzet AS omzet_eff
    FROM u_prev u
    FULL OUTER JOIN d_prev d ON d.vestiging = u.vestiging AND d.werkdag = u.werkdag
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
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
