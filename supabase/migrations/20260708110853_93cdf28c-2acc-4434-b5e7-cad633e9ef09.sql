
CREATE TABLE public.uren_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('Midsland','West')),
  werkdag date NOT NULL,
  start_ts timestamptz NOT NULL,
  eind_ts timestamptz NOT NULL,
  pauze_min integer NOT NULL DEFAULT 0,
  bron text NOT NULL CHECK (bron IN ('time_registration','planning')),
  eitje_shift_id text NOT NULL,
  eitje_user_id text,
  uurloon_bron text CHECK (uurloon_bron IN ('salaris','vangnet','geen')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (eind_ts > start_ts)
);

CREATE UNIQUE INDEX uren_shifts_bron_eitje_id_key ON public.uren_shifts (bron, eitje_shift_id);
CREATE INDEX uren_shifts_vest_dag_idx ON public.uren_shifts (vestiging, werkdag);
CREATE INDEX uren_shifts_vest_dag_bron_idx ON public.uren_shifts (vestiging, werkdag, bron);

GRANT SELECT ON public.uren_shifts TO authenticated;
GRANT ALL ON public.uren_shifts TO service_role;

ALTER TABLE public.uren_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loonkosten-rechten kunnen shifts lezen"
  ON public.uren_shifts FOR SELECT
  TO authenticated
  USING (public.mag_loonkosten_zien(auth.uid()));

CREATE TRIGGER trg_uren_shifts_updated_at
  BEFORE UPDATE ON public.uren_shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: per-uur bezetting per vestiging/werkdag.
-- headcount = aantal shifts met overlap in [uur, uur+1)
-- fte_fractie = som overlap-uren, met pauze naar rato afgetrokken
CREATE OR REPLACE FUNCTION public.f_uren_bezetting_per_uur(
  p_vestigingen text[],
  p_van date,
  p_tot date,
  p_bron text DEFAULT 'time_registration'
)
RETURNS TABLE(vestiging text, werkdag date, uur smallint, headcount integer, fte_fractie numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT
      us.id AS shift_id,
      us.vestiging,
      us.werkdag,
      (us.start_ts AT TIME ZONE 'Europe/Amsterdam') AS start_local,
      (us.eind_ts  AT TIME ZONE 'Europe/Amsterdam') AS eind_local,
      us.pauze_min,
      EXTRACT(EPOCH FROM ((us.eind_ts AT TIME ZONE 'Europe/Amsterdam') - (us.start_ts AT TIME ZONE 'Europe/Amsterdam')))/60 AS bruto_min
    FROM public.uren_shifts us
    WHERE public.mag_loonkosten_zien(auth.uid())
      AND us.vestiging = ANY(p_vestigingen)
      AND us.werkdag BETWEEN p_van AND p_tot
      AND us.bron = p_bron
      AND NOT us.is_demo
  ),
  hourly AS (
    SELECT
      s.vestiging,
      s.werkdag,
      h::smallint AS uur,
      s.shift_id,
      s.bruto_min,
      s.pauze_min,
      GREATEST(0, EXTRACT(EPOCH FROM (
        LEAST(s.eind_local, (s.werkdag::timestamp + make_interval(hours => h+1)))
        - GREATEST(s.start_local, (s.werkdag::timestamp + make_interval(hours => h)))
      ))/60) AS overlap_min
    FROM s
    CROSS JOIN generate_series(0,23) h
  )
  SELECT
    vestiging,
    werkdag,
    uur,
    COUNT(DISTINCT shift_id) FILTER (WHERE overlap_min > 0)::int AS headcount,
    ROUND(SUM(
      CASE
        WHEN bruto_min > 0 AND overlap_min > 0
          THEN overlap_min * (1 - LEAST(1, pauze_min::numeric / bruto_min)) / 60
        ELSE 0
      END
    )::numeric, 4) AS fte_fractie
  FROM hourly
  GROUP BY vestiging, werkdag, uur
  HAVING COUNT(*) FILTER (WHERE overlap_min > 0) > 0
  ORDER BY vestiging, werkdag, uur;
$$;
