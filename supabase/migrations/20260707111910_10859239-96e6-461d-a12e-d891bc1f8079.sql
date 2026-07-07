
-- =========================================================================
-- Shared helper: omzet-bron-keuze (Lightspeed vs Eitje fallback)
-- =========================================================================
-- 10%-drempel = tijdelijke filter tegen kapotte near-zero Lightspeed-rijen
-- (bijv. €6,05). Herzien zodra Lightspeed-OAuth live is — absolute
-- ondergrens (bv. < €50) is dan mogelijk eerlijker dan relatief.
CREATE OR REPLACE FUNCTION public.f_omzet_effectief(ls_omzet numeric, eitje_omzet numeric)
RETURNS TABLE(omzet numeric, bron text)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH i AS (
    SELECT COALESCE(ls_omzet, 0)::numeric AS ls,
           COALESCE(eitje_omzet, 0)::numeric AS ei
  )
  SELECT
    CASE
      WHEN i.ls > 0 AND i.ls >= i.ei * 0.1 THEN i.ls
      WHEN i.ei > 0                        THEN i.ei
      WHEN i.ls > 0                        THEN i.ls
      ELSE 0::numeric
    END AS omzet,
    CASE
      WHEN i.ls > 0 AND i.ls >= i.ei * 0.1 THEN 'lightspeed'
      WHEN i.ei > 0                        THEN 'eitje'
      WHEN i.ls > 0                        THEN 'lightspeed'
      ELSE 'geen'
    END AS bron
  FROM i;
$$;

GRANT EXECUTE ON FUNCTION public.f_omzet_effectief(numeric, numeric) TO anon, authenticated, service_role;

-- =========================================================================
-- rpc_cijfers_samenvatting — nu met omzet_effectief + omzet_bron_mix
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rpc_cijfers_samenvatting(p_vestigingen text[], p_van date, p_tot date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_len int := (p_tot - p_van);
  v_prev_van date := p_van - (v_len + 1);
  v_prev_tot date := p_van - 1;
  v_result jsonb;
BEGIN
  -- Filters MOETEN in de sub-CTE's staan, niet in een WHERE na de FULL OUTER JOIN,
  -- anders vallen Eitje-only dagen (waar v_cijfers_dag NULL is) stilletjes weg.
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
           COUNT(*) FILTER (WHERE omzet_bron IN ('lightspeed','eitje')) AS n_data
    FROM per_day_prev
    GROUP BY vestiging
  ),
  -- Bonnen / open_dagen / gemiddelden: alleen betrouwbaar als de héle periode
  -- Lightspeed-only is. Op gemengde dagen zou omzet (LS+Eitje) door LS-bonnen
  -- gedeeld worden en gemiddelden opblazen. Zet dan NULL zodat UI '—' toont.
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
           COALESCE(SUM(n_data),0) AS n_data
    FROM prev
  )
  SELECT jsonb_build_object(
    'periode',        jsonb_build_object('van', p_van, 'tot', p_tot),
    'vorige_periode', jsonb_build_object('van', v_prev_van, 'tot', v_prev_tot),
    'totaal', jsonb_build_object(
      'omzet',        tot.omzet,
      'bonnen',       CASE WHEN tot.n_eitje = 0 AND tot.n_geen = 0 THEN tot.bonnen ELSE NULL END,
      'open_dagen',   CASE WHEN tot.n_eitje = 0 AND tot.n_geen = 0 THEN tot.open_dagen ELSE NULL END,
      -- prev_omzet: NULL als vorige periode volledig 'geen' was (voorkomt onzin-delta)
      'vorige_omzet', CASE WHEN (SELECT n_data FROM tot_prev) = 0 THEN NULL ELSE (SELECT omzet FROM tot_prev) END,
      'omzet_bron_mix', jsonb_build_object('lightspeed', tot.n_ls, 'eitje', tot.n_eitje, 'geen', tot.n_geen)
    ),
    'per_vestiging', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'vestiging',  c.vestiging,
        'omzet',      c.omzet,
        'bonnen',     c.bonnen,
        'open_dagen', c.open_dagen,
        'vorige_omzet', CASE WHEN COALESCE(p.n_data,0) = 0 THEN NULL ELSE p.omzet END,
        'omzet_bron_mix', jsonb_build_object('lightspeed', c.n_ls, 'eitje', c.n_eitje, 'geen', c.n_geen)
      ) ORDER BY c.vestiging)
      FROM cur_clean c LEFT JOIN prev p USING (vestiging)
    ), '[]'::jsonb)
  ) INTO v_result FROM tot;

  RETURN v_result;
END;
$function$;

-- =========================================================================
-- rpc_cijfers_tijdreeks — dag/maand via helper, uur ongewijzigd (LS-only)
-- =========================================================================
DROP FUNCTION IF EXISTS public.rpc_cijfers_tijdreeks(text[], date, date, text);
CREATE OR REPLACE FUNCTION public.rpc_cijfers_tijdreeks(p_vestigingen text[], p_van date, p_tot date, p_granulariteit text)
 RETURNS TABLE(bucket timestamp with time zone, vestiging text, omzet numeric, bonnen integer, omzet_bron text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_granulariteit = 'uur' THEN
    -- Uur-granulariteit: geen Eitje-uurdata, dus Lightspeed-only. Geen fallback.
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
  -- Filters in CTE's vóór de FULL OUTER JOIN, anders vallen Eitje-only dagen weg.
  WITH d AS (
    SELECT werkdag, vestiging, omzet_incl, aantal_bonnen
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  u AS (
    SELECT werkdag, vestiging, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
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
    -- Bonnen alleen betrouwbaar als bucket 100% Lightspeed is
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

-- =========================================================================
-- Refactor uren-RPCs naar helper (gedrag ongewijzigd, drempel op één plek)
-- =========================================================================
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
  WITH u AS (
    SELECT werkdag, vestiging, gewerkte_uren, geplande_uren, loonkosten, eitje_omzet_dag
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
  ),
  d AS (
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

-- Heatmap (rpc_cijfers_heatmap) blijft ongewijzigd: gebruikt omzet_uren op
-- uur-granulariteit. Eitje heeft geen uur-detail, dus geen fallback mogelijk;
-- heatmap toont per definitie alleen Lightspeed-druk-patroon.
COMMENT ON FUNCTION public.rpc_cijfers_heatmap(text[], date, date) IS
  'Uur-heatmap op basis van omzet_uren (Lightspeed-only). Eitje heeft geen uur-data, dus geen fallback.';
