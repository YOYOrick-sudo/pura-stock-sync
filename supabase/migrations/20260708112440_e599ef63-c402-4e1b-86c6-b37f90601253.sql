
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
  -- Business-day-grens = kanteluur 06:00 Europe/Amsterdam, identiek aan omzet_uren.
  -- We pakken shifts waarvan de start_ts op één van deze werkdagen valt (met marge
  -- van 1 dag ervoor voor overnacht-shifts die op de vorige kalenderdag begonnen
  -- maar business-day binnen bereik vallen). Voor elke shift-uur berekenen we uit
  -- de lokale tijd de business-werkdag+uur en aggregeren.
  WITH s AS (
    SELECT
      us.id AS shift_id,
      us.vestiging,
      us.pauze_min,
      (us.start_ts AT TIME ZONE 'Europe/Amsterdam') AS sl,
      (us.eind_ts  AT TIME ZONE 'Europe/Amsterdam') AS el,
      EXTRACT(EPOCH FROM ((us.eind_ts AT TIME ZONE 'Europe/Amsterdam') - (us.start_ts AT TIME ZONE 'Europe/Amsterdam')))/60 AS bruto_min
    FROM public.uren_shifts us
    WHERE public.mag_loonkosten_zien(auth.uid())
      AND us.vestiging = ANY(p_vestigingen)
      AND us.bron = p_bron
      AND NOT us.is_demo
      -- ruime datumfilter op werkdag OF vorige dag (overnacht start)
      AND us.werkdag BETWEEN (p_van - 1) AND p_tot
  ),
  -- Splits elke shift in minuut-buckets per kalender-uur (max 24 rijen per shift).
  hourly AS (
    SELECT
      s.shift_id,
      s.vestiging,
      s.bruto_min,
      s.pauze_min,
      -- start van deze uur-bucket (lokale kalendertijd)
      (date_trunc('hour', s.sl) + make_interval(hours => h)) AS bucket_start,
      -- overlap-minuten met [bucket_start, bucket_start + 1u)
      GREATEST(0, EXTRACT(EPOCH FROM (
        LEAST(s.el, (date_trunc('hour', s.sl) + make_interval(hours => h + 1)))
        - GREATEST(s.sl, (date_trunc('hour', s.sl) + make_interval(hours => h)))
      ))/60) AS overlap_min
    FROM s
    CROSS JOIN generate_series(0, 24) h
  ),
  -- Reken kalender-uur naar business-werkdag + business-uur via kanteluur 06:00
  mapped AS (
    SELECT
      vestiging,
      shift_id,
      bruto_min,
      pauze_min,
      overlap_min,
      EXTRACT(HOUR FROM bucket_start)::smallint AS cal_uur,
      CASE
        WHEN EXTRACT(HOUR FROM bucket_start) < 6
          THEN (bucket_start::date - 1)
        ELSE bucket_start::date
      END AS werkdag
    FROM hourly
    WHERE overlap_min > 0
  )
  SELECT
    vestiging,
    werkdag,
    cal_uur AS uur,
    COUNT(DISTINCT shift_id)::int AS headcount,
    ROUND(SUM(
      CASE
        WHEN bruto_min > 0
          THEN overlap_min * (1 - LEAST(1, pauze_min::numeric / bruto_min)) / 60
        ELSE 0
      END
    )::numeric, 4) AS fte_fractie
  FROM mapped
  WHERE werkdag BETWEEN p_van AND p_tot
  GROUP BY vestiging, werkdag, cal_uur
  ORDER BY vestiging, werkdag, cal_uur;
$$;
