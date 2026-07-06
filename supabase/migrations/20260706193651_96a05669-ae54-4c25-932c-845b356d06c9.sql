-- 1a. Profielveld + protect-trigger
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mag_loonkosten_zien boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_mag_loonkosten_zien()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NEW.mag_loonkosten_zien IS DISTINCT FROM OLD.mag_loonkosten_zien THEN
    IF NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
      RAISE EXCEPTION 'Alleen owners kunnen mag_loonkosten_zien wijzigen';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_mag_loonkosten_zien ON public.profiles;
CREATE TRIGGER trg_protect_mag_loonkosten_zien
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_mag_loonkosten_zien();

-- 1b. Helper
CREATE OR REPLACE FUNCTION public.mag_loonkosten_zien(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT
    public.has_role(_uid, 'owner'::app_role)
    OR public.has_role(_uid, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _uid AND COALESCE(p.mag_loonkosten_zien, false) = true
    );
$$;

-- 1c. Samenvatting-RPC
CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_samenvatting(
  p_vestigingen text[], p_van date, p_tot date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_len int := (p_tot - p_van);
  v_prev_van date := p_van - (v_len + 1);
  v_prev_tot date := p_van - 1;
  v_result jsonb;
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  WITH cur_uren AS (
    SELECT vestiging,
           COALESCE(SUM(gewerkte_uren),0)::numeric AS gewerkte_uren,
           COALESCE(SUM(geplande_uren),0)::numeric AS geplande_uren,
           COALESCE(SUM(loonkosten),0)::numeric AS loonkosten,
           COUNT(*) FILTER (WHERE loonkosten_bron = 'eitje') AS n_eitje,
           COUNT(*) FILTER (WHERE loonkosten_bron = 'berekend') AS n_berekend
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen) AND werkdag BETWEEN p_van AND p_tot
    GROUP BY vestiging
  ),
  cur_omzet AS (
    SELECT vestiging, COALESCE(SUM(omzet_incl),0)::numeric AS omzet
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen) AND werkdag BETWEEN p_van AND p_tot
    GROUP BY vestiging
  ),
  prev_uren AS (
    SELECT vestiging,
           COALESCE(SUM(gewerkte_uren),0)::numeric AS gewerkte_uren,
           COALESCE(SUM(loonkosten),0)::numeric AS loonkosten
    FROM public.uren_dagen
    WHERE vestiging = ANY(p_vestigingen) AND werkdag BETWEEN v_prev_van AND v_prev_tot
    GROUP BY vestiging
  ),
  prev_omzet AS (
    SELECT vestiging, COALESCE(SUM(omzet_incl),0)::numeric AS omzet
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen) AND werkdag BETWEEN v_prev_van AND v_prev_tot
    GROUP BY vestiging
  ),
  per_vest AS (
    SELECT
      COALESCE(cu.vestiging, co.vestiging) AS vestiging,
      COALESCE(cu.gewerkte_uren,0) AS gewerkte_uren,
      COALESCE(cu.geplande_uren,0) AS geplande_uren,
      COALESCE(cu.loonkosten,0)    AS loonkosten,
      COALESCE(co.omzet,0)          AS omzet,
      COALESCE(cu.n_eitje,0)       AS n_eitje,
      COALESCE(cu.n_berekend,0)    AS n_berekend,
      COALESCE(pu.gewerkte_uren,0) AS prev_gewerkte_uren,
      COALESCE(pu.loonkosten,0)    AS prev_loonkosten,
      COALESCE(po.omzet,0)         AS prev_omzet
    FROM cur_uren cu
    FULL OUTER JOIN cur_omzet  co USING (vestiging)
    LEFT  JOIN prev_uren  pu USING (vestiging)
    LEFT  JOIN prev_omzet po USING (vestiging)
  ),
  tot AS (
    SELECT
      COALESCE(SUM(gewerkte_uren),0)      AS gewerkte_uren,
      COALESCE(SUM(geplande_uren),0)      AS geplande_uren,
      COALESCE(SUM(loonkosten),0)         AS loonkosten,
      COALESCE(SUM(omzet),0)              AS omzet,
      COALESCE(SUM(n_eitje),0)            AS n_eitje,
      COALESCE(SUM(n_berekend),0)         AS n_berekend,
      COALESCE(SUM(prev_gewerkte_uren),0) AS prev_gewerkte_uren,
      COALESCE(SUM(prev_loonkosten),0)    AS prev_loonkosten,
      COALESCE(SUM(prev_omzet),0)         AS prev_omzet
    FROM per_vest
  )
  SELECT jsonb_build_object(
    'periode',        jsonb_build_object('van', p_van, 'tot', p_tot),
    'vorige_periode', jsonb_build_object('van', v_prev_van, 'tot', v_prev_tot),
    'totaal', jsonb_build_object(
      'gewerkte_uren',         tot.gewerkte_uren,
      'geplande_uren',         tot.geplande_uren,
      'loonkosten',            tot.loonkosten,
      'omzet',                 tot.omzet,
      'loonkosten_pct_omzet',  CASE WHEN tot.omzet = 0 THEN NULL ELSE ROUND((tot.loonkosten / tot.omzet * 100)::numeric, 1) END,
      'omzet_per_gewerkt_uur', CASE WHEN tot.gewerkte_uren = 0 THEN NULL ELSE ROUND((tot.omzet / tot.gewerkte_uren)::numeric, 2) END,
      'prev_loonkosten',       tot.prev_loonkosten,
      'prev_omzet',            tot.prev_omzet,
      'prev_gewerkte_uren',    tot.prev_gewerkte_uren,
      'bron_mix', jsonb_build_object('eitje', tot.n_eitje, 'berekend', tot.n_berekend)
    ),
    'per_vestiging', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'vestiging',             pv.vestiging,
        'gewerkte_uren',         pv.gewerkte_uren,
        'geplande_uren',         pv.geplande_uren,
        'loonkosten',            pv.loonkosten,
        'omzet',                 pv.omzet,
        'loonkosten_pct_omzet',  CASE WHEN pv.omzet = 0 THEN NULL ELSE ROUND((pv.loonkosten / pv.omzet * 100)::numeric, 1) END,
        'omzet_per_gewerkt_uur', CASE WHEN pv.gewerkte_uren = 0 THEN NULL ELSE ROUND((pv.omzet / pv.gewerkte_uren)::numeric, 2) END,
        'prev_loonkosten',       pv.prev_loonkosten,
        'prev_omzet',            pv.prev_omzet,
        'prev_gewerkte_uren',    pv.prev_gewerkte_uren,
        'bron_mix', jsonb_build_object('eitje', pv.n_eitje, 'berekend', pv.n_berekend)
      ) ORDER BY pv.vestiging)
      FROM per_vest pv
    ), '[]'::jsonb)
  ) INTO v_result FROM tot;

  RETURN v_result;
END; $$;

-- Tijdreeks-RPC
CREATE OR REPLACE FUNCTION public.rpc_cijfers_uren_tijdreeks(
  p_vestigingen text[], p_van date, p_tot date, p_granulariteit text
) RETURNS TABLE(
  bucket timestamptz,
  vestiging text,
  gewerkte_uren numeric,
  geplande_uren numeric,
  loonkosten numeric,
  omzet numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.mag_loonkosten_zien(auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang tot loonkosten';
  END IF;

  IF p_granulariteit NOT IN ('dag','week','maand') THEN
    RAISE EXCEPTION 'granulariteit moet dag|week|maand zijn';
  END IF;

  RETURN QUERY
  WITH uren AS (
    SELECT
      CASE p_granulariteit
        WHEN 'dag'   THEN (u.werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'week'  THEN (date_trunc('week',  u.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'maand' THEN (date_trunc('month', u.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
      END AS bucket,
      u.vestiging,
      SUM(u.gewerkte_uren)::numeric AS gewerkte_uren,
      SUM(u.geplande_uren)::numeric AS geplande_uren,
      SUM(u.loonkosten)::numeric    AS loonkosten
    FROM public.uren_dagen u
    WHERE u.vestiging = ANY(p_vestigingen) AND u.werkdag BETWEEN p_van AND p_tot
    GROUP BY 1, u.vestiging
  ),
  oms AS (
    SELECT
      CASE p_granulariteit
        WHEN 'dag'   THEN (d.werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'week'  THEN (date_trunc('week',  d.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
        WHEN 'maand' THEN (date_trunc('month', d.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam')
      END AS bucket,
      d.vestiging,
      SUM(d.omzet_incl)::numeric AS omzet
    FROM public.v_cijfers_dag d
    WHERE d.vestiging = ANY(p_vestigingen) AND d.werkdag BETWEEN p_van AND p_tot
    GROUP BY 1, d.vestiging
  )
  SELECT
    COALESCE(u.bucket, o.bucket) AS bucket,
    COALESCE(u.vestiging, o.vestiging) AS vestiging,
    COALESCE(u.gewerkte_uren, 0) AS gewerkte_uren,
    COALESCE(u.geplande_uren, 0) AS geplande_uren,
    COALESCE(u.loonkosten, 0)    AS loonkosten,
    COALESCE(o.omzet, 0)         AS omzet
  FROM uren u FULL OUTER JOIN oms o ON u.bucket = o.bucket AND u.vestiging = o.vestiging
  ORDER BY 1, 2;
END; $$;

GRANT EXECUTE ON FUNCTION public.mag_loonkosten_zien(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_uren_samenvatting(text[], date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_uren_tijdreeks(text[], date, date, text) TO authenticated;