
DROP FUNCTION IF EXISTS public.rpc_cijfers_loze_uren_v2(text[], date, date, numeric, boolean);

CREATE OR REPLACE FUNCTION public.rpc_cijfers_loze_uren_v2(
  p_vestigingen text[], p_van date, p_tot date,
  p_marge_pp numeric DEFAULT NULL::numeric,
  p_bypass_auth boolean DEFAULT false
)
 RETURNS TABLE(
   signaal_type text,
   vestiging text, werkdag date, isodow integer,
   uur_van smallint, uur_tot smallint,
   dag_loon_pct numeric, doel_pct numeric, marge_pp numeric,
   headcount_gem numeric, ritme_headcount numeric,
   delta_headcount numeric, delta_fte numeric,
   omzet_cluster numeric, ritme_omzet_cluster numeric,
   verspilling numeric,
   loonkosten_bron text, pct_vangnet numeric,
   team_breakdown jsonb
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_ritme_van date := p_tot - 84;
BEGIN
  IF NOT p_bypass_auth AND NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  RETURN QUERY
  WITH inst AS (
    SELECT ci.vestiging, ci.loon_pct_doel, ci.service_uur_start, ci.service_uur_eind,
           COALESCE(p_marge_pp, ci.loze_uren_marge_pp, 5)::numeric AS marge_pp
    FROM public.cijfers_instellingen ci WHERE ci.vestiging = ANY(p_vestigingen)
  ),
  ud AS (
    SELECT ud0.vestiging, ud0.werkdag, ud0.gewerkte_uren, ud0.loonkosten,
           ud0.loonkosten_bron, ud0.eitje_omzet_dag,
           CASE WHEN ud0.gewerkte_uren>0 THEN ud0.loonkosten/ud0.gewerkte_uren ELSE 0 END AS eff_uurloon
    FROM public.uren_dagen ud0
    WHERE ud0.vestiging=ANY(p_vestigingen) AND ud0.werkdag BETWEEN p_van AND p_tot
  ),
  dag_oms AS (
    SELECT vd.vestiging, vd.werkdag, vd.omzet_incl FROM public.v_cijfers_dag vd
    WHERE vd.vestiging=ANY(p_vestigingen) AND vd.werkdag BETWEEN p_van AND p_tot
  ),
  dag AS (
    SELECT u.vestiging, u.werkdag, u.loonkosten, u.loonkosten_bron, u.eff_uurloon, e.omzet AS dag_omzet
    FROM ud u LEFT JOIN dag_oms d ON d.vestiging=u.vestiging AND d.werkdag=u.werkdag
    CROSS JOIN LATERAL public.f_omzet_effectief(d.omzet_incl, u.eitje_omzet_dag) e
  ),
  dure_dagen AS (
    SELECT d.*, i.loon_pct_doel, i.marge_pp, i.service_uur_start, i.service_uur_eind,
           (d.loonkosten/d.dag_omzet*100) AS dag_loon_pct
    FROM dag d JOIN inst i ON i.vestiging=d.vestiging
    WHERE d.dag_omzet > 0 AND (d.loonkosten/d.dag_omzet*100) > (i.loon_pct_doel + i.marge_pp)
  ),
  -- shifts over BREEDER venster: zowel selectie als 12-wk ritme
  shifts_h AS (
    SELECT us.id AS shift_id, us.vestiging, us.team_id, us.pauze_min,
           (us.start_ts AT TIME ZONE 'Europe/Amsterdam') AS sl,
           (us.eind_ts  AT TIME ZONE 'Europe/Amsterdam') AS el,
           EXTRACT(EPOCH FROM ((us.eind_ts AT TIME ZONE 'Europe/Amsterdam') - (us.start_ts AT TIME ZONE 'Europe/Amsterdam')))/60 AS bruto_min
    FROM public.uren_shifts us
    WHERE us.vestiging=ANY(p_vestigingen) AND us.bron='time_registration' AND NOT us.is_demo
      AND us.werkdag BETWEEN LEAST(p_van, v_ritme_van) - 1 AND p_tot
  ),
  hourly_t AS (
    SELECT s.vestiging, s.team_id, s.shift_id, s.bruto_min, s.pauze_min,
           (date_trunc('hour', s.sl) + make_interval(hours=>h)) AS bucket_start,
           GREATEST(0, EXTRACT(EPOCH FROM (
             LEAST(s.el, (date_trunc('hour', s.sl) + make_interval(hours=>h+1)))
             - GREATEST(s.sl, (date_trunc('hour', s.sl) + make_interval(hours=>h)))
           ))/60) AS overlap_min
    FROM shifts_h s CROSS JOIN generate_series(0,24) h
  ),
  bez_team_all AS (
    SELECT vestiging, team_id,
           CASE WHEN EXTRACT(HOUR FROM bucket_start)<6 THEN (bucket_start::date-1) ELSE bucket_start::date END AS werkdag,
           EXTRACT(HOUR FROM bucket_start)::int AS uur,
           COUNT(DISTINCT shift_id)::int AS headcount,
           SUM(CASE WHEN bruto_min>0 THEN overlap_min*(1-LEAST(1,pauze_min::numeric/bruto_min))/60 ELSE 0 END)::numeric AS fte
    FROM hourly_t WHERE overlap_min>0
    GROUP BY vestiging, team_id,
             CASE WHEN EXTRACT(HOUR FROM bucket_start)<6 THEN (bucket_start::date-1) ELSE bucket_start::date END,
             EXTRACT(HOUR FROM bucket_start)
  ),
  bez_all AS (
    SELECT vestiging, werkdag, uur,
           SUM(headcount)::int AS headcount,
           SUM(fte)::numeric AS fte_fractie
    FROM bez_team_all
    GROUP BY vestiging, werkdag, uur
  ),
  bez AS (
    SELECT * FROM bez_all WHERE werkdag BETWEEN p_van AND p_tot
  ),
  oms_all AS (
    SELECT o.vestiging, o.werkdag, o.uur::int, SUM(o.omzet_incl)::numeric AS omzet_uur
    FROM public.omzet_uren o
    WHERE o.vestiging=ANY(p_vestigingen) AND o.werkdag BETWEEN LEAST(p_van, v_ritme_van) AND p_tot
    GROUP BY o.vestiging, o.werkdag, o.uur
  ),
  oms AS (
    SELECT * FROM oms_all WHERE werkdag BETWEEN p_van AND p_tot
  ),
  -- RITME: vast op laatste 12 weken t/m p_tot
  ritme AS (
    SELECT b.vestiging, EXTRACT(ISODOW FROM b.werkdag)::int AS isodow, b.uur,
           COUNT(*)::int AS n_obs,
           AVG(b.headcount)::numeric AS ritme_hc,
           AVG(b.fte_fractie)::numeric AS ritme_fte,
           AVG(COALESCE(o.omzet_uur,0))::numeric AS ritme_omzet
    FROM bez_all b
    LEFT JOIN oms_all o ON o.vestiging=b.vestiging AND o.werkdag=b.werkdag AND o.uur=b.uur
    WHERE b.werkdag BETWEEN v_ritme_van AND p_tot
    GROUP BY b.vestiging, EXTRACT(ISODOW FROM b.werkdag), b.uur
  ),
  ritme_team AS (
    SELECT bt.vestiging, bt.team_id, EXTRACT(ISODOW FROM bt.werkdag)::int AS isodow, bt.uur,
           AVG(bt.headcount)::numeric AS ritme_hc,
           AVG(bt.fte)::numeric AS ritme_fte
    FROM bez_team_all bt
    WHERE bt.werkdag BETWEEN v_ritme_van AND p_tot
    GROUP BY bt.vestiging, bt.team_id, EXTRACT(ISODOW FROM bt.werkdag), bt.uur
  ),
  vang AS (
    SELECT us.vestiging, us.werkdag,
           EXTRACT(HOUR FROM (us.start_ts AT TIME ZONE 'Europe/Amsterdam'))::int AS uur_approx,
           SUM(CASE WHEN us.uurloon_bron='vangnet' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*)::numeric,0) AS aandeel_vangnet
    FROM public.uren_shifts us
    WHERE us.vestiging=ANY(p_vestigingen) AND us.werkdag BETWEEN p_van AND p_tot
      AND us.bron='time_registration' AND NOT us.is_demo
    GROUP BY us.vestiging, us.werkdag, EXTRACT(HOUR FROM (us.start_ts AT TIME ZONE 'Europe/Amsterdam'))
  ),
  vang_dag AS (
    SELECT us.vestiging, us.werkdag,
           SUM(CASE WHEN us.uurloon_bron='vangnet' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*)::numeric,0) AS aandeel_vangnet
    FROM public.uren_shifts us
    WHERE us.vestiging=ANY(p_vestigingen) AND us.werkdag BETWEEN p_van AND p_tot
      AND us.bron='time_registration' AND NOT us.is_demo
    GROUP BY us.vestiging, us.werkdag
  ),
  uur_sig AS (
    SELECT dd.vestiging, dd.werkdag, dd.dag_loon_pct, dd.loon_pct_doel, dd.marge_pp,
           dd.loonkosten_bron AS dag_lb, dd.eff_uurloon,
           dd.service_uur_start, dd.service_uur_eind,
           b.uur, b.headcount, b.fte_fractie,
           COALESCE(o.omzet_uur,0) AS omzet_uur,
           r.ritme_hc, r.ritme_fte, r.ritme_omzet, r.n_obs,
           COALESCE(v.aandeel_vangnet,0) AS pct_vangnet,
           (b.headcount - r.ritme_hc) AS d_hc,
           (b.fte_fractie - r.ritme_fte) AS d_fte
    FROM dure_dagen dd
    JOIN bez b ON b.vestiging=dd.vestiging AND b.werkdag=dd.werkdag
    LEFT JOIN oms o ON o.vestiging=b.vestiging AND o.werkdag=b.werkdag AND o.uur=b.uur
    JOIN ritme r ON r.vestiging=b.vestiging AND r.isodow=EXTRACT(ISODOW FROM b.werkdag)::int AND r.uur=b.uur
    LEFT JOIN vang v ON v.vestiging=b.vestiging AND v.werkdag=b.werkdag AND v.uur_approx=b.uur
    WHERE b.uur BETWEEN dd.service_uur_start AND (dd.service_uur_eind-1)
      AND r.n_obs >= 2
      AND ((b.headcount - r.ritme_hc) >= 1 OR (b.fte_fractie - r.ritme_fte) >= 0.5)
      AND COALESCE(o.omzet_uur,0) <= r.ritme_omzet * 1.15
  ),
  labeled AS (
    SELECT us.*, (us.uur - ROW_NUMBER() OVER (PARTITION BY us.vestiging, us.werkdag ORDER BY us.uur))::int AS grp
    FROM uur_sig us
  ),
  clusters AS (
    SELECT vestiging, werkdag, grp,
           MIN(uur)::int AS uur_van, MAX(uur)::int AS uur_tot,
           AVG(dag_loon_pct)::numeric AS dag_loon_pct,
           AVG(loon_pct_doel)::numeric AS doel_pct,
           AVG(marge_pp)::numeric AS marge_pp_out,
           MAX(dag_lb) AS dag_lb,
           AVG(eff_uurloon)::numeric AS eff_uurloon,
           AVG(headcount)::numeric AS hc_gem,
           AVG(ritme_hc)::numeric AS ritme_hc,
           AVG(d_hc)::numeric AS d_hc,
           SUM(d_fte)::numeric AS d_fte_sum,
           SUM(omzet_uur)::numeric AS oms_cluster,
           SUM(ritme_omzet)::numeric AS ritme_oms_cluster,
           MAX(pct_vangnet)::numeric AS pct_vangnet
    FROM labeled GROUP BY vestiging, werkdag, grp
  ),
  cluster_uren AS (
    SELECT c.vestiging, c.werkdag, c.grp, gs.uur
    FROM clusters c CROSS JOIN LATERAL generate_series(c.uur_van, c.uur_tot) gs(uur)
  ),
  team_deltas AS (
    SELECT cu.vestiging, cu.werkdag, cu.grp, bt.team_id,
           SUM(bt.headcount - COALESCE(rt.ritme_hc,0))::numeric AS d_hc_team,
           SUM(bt.fte - COALESCE(rt.ritme_fte,0))::numeric AS d_fte_team
    FROM cluster_uren cu
    JOIN bez_team_all bt ON bt.vestiging=cu.vestiging AND bt.werkdag=cu.werkdag AND bt.uur=cu.uur
    LEFT JOIN ritme_team rt ON rt.vestiging=cu.vestiging
                            AND rt.team_id IS NOT DISTINCT FROM bt.team_id
                            AND rt.isodow=EXTRACT(ISODOW FROM cu.werkdag)::int
                            AND rt.uur=cu.uur
    GROUP BY cu.vestiging, cu.werkdag, cu.grp, bt.team_id
    HAVING SUM(bt.fte - COALESCE(rt.ritme_fte,0)) > 0.1
  ),
  team_named AS (
    SELECT td.vestiging, td.werkdag, td.grp,
           COALESCE(et.naam, '(geen team)') AS team_naam,
           td.d_hc_team, td.d_fte_team
    FROM team_deltas td LEFT JOIN public.eitje_teams et ON et.id=td.team_id
  ),
  team_json AS (
    SELECT vestiging, werkdag, grp,
           jsonb_agg(jsonb_build_object(
             'team', team_naam,
             'delta_headcount', ROUND(d_hc_team,2),
             'delta_fte', ROUND(d_fte_team,2)
           ) ORDER BY d_fte_team DESC) AS breakdown
    FROM team_named GROUP BY vestiging, werkdag, grp
  ),
  uur_rows AS (
    SELECT
      'uur'::text AS signaal_type,
      c.vestiging, c.werkdag,
      EXTRACT(ISODOW FROM c.werkdag)::int AS isodow,
      c.uur_van::smallint AS uur_van, c.uur_tot::smallint AS uur_tot,
      ROUND(c.dag_loon_pct,1) AS dag_loon_pct,
      ROUND(c.doel_pct,1) AS doel_pct,
      ROUND(c.marge_pp_out,1) AS marge_pp,
      ROUND(c.hc_gem,2) AS headcount_gem,
      ROUND(c.ritme_hc,2) AS ritme_headcount,
      ROUND(c.d_hc,2) AS delta_headcount,
      ROUND(c.d_fte_sum,2) AS delta_fte,
      ROUND(c.oms_cluster,2) AS omzet_cluster,
      ROUND(c.ritme_oms_cluster,2) AS ritme_omzet_cluster,
      ROUND(c.d_fte_sum * c.eff_uurloon, 2) AS verspilling,
      CASE WHEN c.pct_vangnet>0.2 OR c.dag_lb='berekend' THEN 'schatting' ELSE 'eitje' END AS loonkosten_bron,
      ROUND(c.pct_vangnet,3) AS pct_vangnet,
      COALESCE(tj.breakdown, '[]'::jsonb) AS team_breakdown
    FROM clusters c LEFT JOIN team_json tj USING (vestiging, werkdag, grp)
  ),
  dag_rows AS (
    SELECT
      'dag'::text AS signaal_type,
      dd.vestiging, dd.werkdag,
      EXTRACT(ISODOW FROM dd.werkdag)::int AS isodow,
      NULL::smallint AS uur_van, NULL::smallint AS uur_tot,
      ROUND(dd.dag_loon_pct,1) AS dag_loon_pct,
      ROUND(dd.loon_pct_doel,1) AS doel_pct,
      ROUND(dd.marge_pp,1) AS marge_pp,
      NULL::numeric AS headcount_gem, NULL::numeric AS ritme_headcount,
      NULL::numeric AS delta_headcount, NULL::numeric AS delta_fte,
      ROUND(dd.dag_omzet,2) AS omzet_cluster,
      NULL::numeric AS ritme_omzet_cluster,
      ROUND(dd.loonkosten - dd.dag_omzet * dd.loon_pct_doel/100.0, 2) AS verspilling,
      CASE WHEN COALESCE(vd.aandeel_vangnet,0)>0.2 OR dd.loonkosten_bron='berekend' THEN 'schatting' ELSE 'eitje' END AS loonkosten_bron,
      ROUND(COALESCE(vd.aandeel_vangnet,0),3) AS pct_vangnet,
      '[]'::jsonb AS team_breakdown
    FROM dure_dagen dd
    LEFT JOIN vang_dag vd ON vd.vestiging=dd.vestiging AND vd.werkdag=dd.werkdag
    WHERE NOT EXISTS (
      SELECT 1 FROM clusters c WHERE c.vestiging=dd.vestiging AND c.werkdag=dd.werkdag
    )
  )
  SELECT * FROM uur_rows
  UNION ALL
  SELECT * FROM dag_rows
  ORDER BY (signaal_type='dag'), verspilling DESC NULLS LAST;
END;
$function$;
