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