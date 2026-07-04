
-- 1) is_demo kolom
ALTER TABLE public.omzet_uren
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS omzet_uren_is_demo_idx
  ON public.omzet_uren (vestiging) WHERE is_demo;

-- 2) sync_runs: sta nieuwe types/statussen toe (kolommen zijn text, geen check nodig)

-- 3) helper: mag_cijfers_zien
CREATE OR REPLACE FUNCTION public.mag_cijfers_zien(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_uid, 'owner'::app_role)
    OR public.has_role(_uid, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _uid AND COALESCE(p.mag_cijfers_zien, false) = true
    );
$$;

-- 4) Views (security_invoker=true → respecteer RLS van omzet_uren)
DROP VIEW IF EXISTS public.v_cijfers_dag CASCADE;
CREATE VIEW public.v_cijfers_dag
WITH (security_invoker = true) AS
SELECT
  vestiging,
  werkdag,
  bool_or(is_demo) AS is_demo,
  SUM(omzet_incl)::numeric AS omzet_incl,
  SUM(omzet_excl)::numeric AS omzet_excl,
  SUM(aantal_bonnen)::integer AS aantal_bonnen
FROM public.omzet_uren
GROUP BY vestiging, werkdag;

DROP VIEW IF EXISTS public.v_cijfers_uur_weekdag CASCADE;
CREATE VIEW public.v_cijfers_uur_weekdag
WITH (security_invoker = true) AS
SELECT
  vestiging,
  EXTRACT(ISODOW FROM werkdag)::int AS isodow,
  uur,
  AVG(omzet_incl)::numeric AS gem_omzet,
  COUNT(DISTINCT werkdag)::int AS n_dagen
FROM public.omzet_uren
GROUP BY vestiging, EXTRACT(ISODOW FROM werkdag), uur;

GRANT SELECT ON public.v_cijfers_dag TO authenticated;
GRANT SELECT ON public.v_cijfers_uur_weekdag TO authenticated;

-- 5) RPC: samenvatting (StatCards) + vergelijkperiode
CREATE OR REPLACE FUNCTION public.rpc_cijfers_samenvatting(
  p_vestigingen text[],
  p_van date,
  p_tot date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_len int := (p_tot - p_van); -- dagen in periode (exclusief einddag+1)
  v_prev_van date := p_van - (v_len + 1);
  v_prev_tot date := p_van - 1;
  v_result jsonb;
BEGIN
  WITH cur AS (
    SELECT vestiging,
           COALESCE(SUM(omzet_incl),0) AS omzet,
           COALESCE(SUM(aantal_bonnen),0) AS bonnen,
           COUNT(*) FILTER (WHERE omzet_incl > 0) AS open_dagen
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
    GROUP BY vestiging
  ),
  prev AS (
    SELECT vestiging,
           COALESCE(SUM(omzet_incl),0) AS omzet
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN v_prev_van AND v_prev_tot
    GROUP BY vestiging
  )
  SELECT jsonb_build_object(
    'periode', jsonb_build_object('van', p_van, 'tot', p_tot),
    'vorige_periode', jsonb_build_object('van', v_prev_van, 'tot', v_prev_tot),
    'totaal', jsonb_build_object(
      'omzet', COALESCE((SELECT SUM(omzet) FROM cur),0),
      'bonnen', COALESCE((SELECT SUM(bonnen) FROM cur),0),
      'open_dagen', COALESCE((SELECT SUM(open_dagen) FROM cur),0),
      'vorige_omzet', COALESCE((SELECT SUM(omzet) FROM prev),0)
    ),
    'per_vestiging', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'vestiging', c.vestiging,
        'omzet', c.omzet,
        'bonnen', c.bonnen,
        'open_dagen', c.open_dagen,
        'vorige_omzet', COALESCE(p.omzet, 0)
      ) ORDER BY c.vestiging)
      FROM cur c LEFT JOIN prev p USING (vestiging)
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 6) RPC: tijdreeks (uur|dag|maand)
CREATE OR REPLACE FUNCTION public.rpc_cijfers_tijdreeks(
  p_vestigingen text[],
  p_van date,
  p_tot date,
  p_granulariteit text
) RETURNS TABLE(bucket timestamptz, vestiging text, omzet numeric, bonnen integer)
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_granulariteit = 'uur' THEN
    RETURN QUERY
    SELECT ((werkdag::timestamp + (uur || ' hours')::interval) AT TIME ZONE 'Europe/Amsterdam') AS bucket,
           o.vestiging,
           SUM(o.omzet_incl)::numeric,
           SUM(o.aantal_bonnen)::int
    FROM public.omzet_uren o
    WHERE o.vestiging = ANY(p_vestigingen)
      AND o.werkdag BETWEEN p_van AND p_tot
    GROUP BY 1, o.vestiging
    ORDER BY 1;
  ELSIF p_granulariteit = 'dag' THEN
    RETURN QUERY
    SELECT (d.werkdag::timestamp AT TIME ZONE 'Europe/Amsterdam') AS bucket,
           d.vestiging,
           d.omzet_incl,
           d.aantal_bonnen
    FROM public.v_cijfers_dag d
    WHERE d.vestiging = ANY(p_vestigingen)
      AND d.werkdag BETWEEN p_van AND p_tot
    ORDER BY 1;
  ELSIF p_granulariteit = 'maand' THEN
    RETURN QUERY
    SELECT (date_trunc('month', d.werkdag)::timestamp AT TIME ZONE 'Europe/Amsterdam') AS bucket,
           d.vestiging,
           SUM(d.omzet_incl)::numeric,
           SUM(d.aantal_bonnen)::int
    FROM public.v_cijfers_dag d
    WHERE d.vestiging = ANY(p_vestigingen)
      AND d.werkdag BETWEEN p_van AND p_tot
    GROUP BY 1, d.vestiging
    ORDER BY 1;
  ELSE
    RAISE EXCEPTION 'granulariteit moet uur|dag|maand zijn';
  END IF;
END;
$$;

-- 7) RPC: heatmap
CREATE OR REPLACE FUNCTION public.rpc_cijfers_heatmap(
  p_vestigingen text[],
  p_van date,
  p_tot date
) RETURNS TABLE(isodow int, uur smallint, gem_omzet numeric, n_dagen int)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXTRACT(ISODOW FROM werkdag)::int AS isodow,
         uur,
         AVG(omzet_incl)::numeric AS gem_omzet,
         COUNT(DISTINCT werkdag)::int AS n_dagen
  FROM public.omzet_uren
  WHERE vestiging = ANY(p_vestigingen)
    AND werkdag BETWEEN p_van AND p_tot
    AND uur BETWEEN 10 AND 23
  GROUP BY 1, uur
  ORDER BY 1, uur;
$$;

-- 8) RPC: weekdag-vergelijking (periode vs 8 weken ervoor)
CREATE OR REPLACE FUNCTION public.rpc_cijfers_weekdag_vergelijk(
  p_vestigingen text[],
  p_van date,
  p_tot date
) RETURNS TABLE(isodow int, gem_periode numeric, gem_referentie numeric, delta_pct numeric)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  WITH per AS (
    SELECT EXTRACT(ISODOW FROM werkdag)::int AS isodow,
           AVG(omzet_incl) AS gem
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN p_van AND p_tot
      AND omzet_incl > 0
    GROUP BY 1
  ),
  ref AS (
    SELECT EXTRACT(ISODOW FROM werkdag)::int AS isodow,
           AVG(omzet_incl) AS gem
    FROM public.v_cijfers_dag
    WHERE vestiging = ANY(p_vestigingen)
      AND werkdag BETWEEN (p_van - 56) AND (p_van - 1)
      AND omzet_incl > 0
    GROUP BY 1
  )
  SELECT COALESCE(per.isodow, ref.isodow) AS isodow,
         COALESCE(per.gem, 0)::numeric,
         COALESCE(ref.gem, 0)::numeric,
         CASE WHEN COALESCE(ref.gem,0) = 0 THEN NULL
              ELSE ROUND(((per.gem - ref.gem) / ref.gem * 100)::numeric, 1)
         END AS delta_pct
  FROM per FULL OUTER JOIN ref ON per.isodow = ref.isodow
  ORDER BY 1;
$$;

-- 9) RPC: demo-data wissen (owner-only)
CREATE OR REPLACE FUNCTION public.rpc_demo_data_wissen()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Alleen owners mogen demo-data wissen';
  END IF;

  WITH del AS (
    DELETE FROM public.omzet_uren WHERE is_demo RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM del;

  INSERT INTO public.sync_runs (bron, type, status, foutmelding, klaar_op, bonnen_verwerkt)
  VALUES ('lightspeed', 'demo_wipe', 'ok', 'Demo-data gewist door owner', now(), v_count);

  RETURN v_count;
END;
$$;

-- 10) RPC: bestaat er demo-data (voor banner-check zonder tabel-select-recht op omzet_uren)
CREATE OR REPLACE FUNCTION public.rpc_heeft_demo_data()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.omzet_uren WHERE is_demo);
$$;

-- 11) Grants op RPC's
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_samenvatting(text[], date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_tijdreeks(text[], date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_heatmap(text[], date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cijfers_weekdag_vergelijk(text[], date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_demo_data_wissen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_heeft_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mag_cijfers_zien(uuid) TO authenticated;
