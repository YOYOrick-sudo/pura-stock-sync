-- ============ 1. Openingsdagen ============
CREATE TABLE IF NOT EXISTS public.vestiging_opendagen (
  vestiging text NOT NULL,
  weekdag smallint NOT NULL CHECK (weekdag BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vestiging, weekdag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vestiging_opendagen TO authenticated;
GRANT ALL ON public.vestiging_opendagen TO service_role;
ALTER TABLE public.vestiging_opendagen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opendagen readable" ON public.vestiging_opendagen FOR SELECT TO authenticated USING (true);
CREATE POLICY "opendagen writable" ON public.vestiging_opendagen FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.vestiging_sluitdatums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  datum date NOT NULL,
  reden text,
  -- true = uitzondering: juist WEL open op een normaal gesloten weekdag
  is_open_uitzondering boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, datum)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vestiging_sluitdatums TO authenticated;
GRANT ALL ON public.vestiging_sluitdatums TO service_role;
ALTER TABLE public.vestiging_sluitdatums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sluitdatums readable" ON public.vestiging_sluitdatums FOR SELECT TO authenticated USING (true);
CREATE POLICY "sluitdatums writable" ON public.vestiging_sluitdatums FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.vestiging_opendagen (vestiging, weekdag, is_open)
SELECT v.vestiging, d.weekdag,
  CASE
    WHEN v.vestiging = 'Midsland' AND d.weekdag IN (1,2) THEN false
    WHEN v.vestiging = 'West' AND d.weekdag = 2 THEN false
    ELSE true
  END
FROM (VALUES ('West'),('Midsland')) AS v(vestiging)
CROSS JOIN generate_series(0,6) AS d(weekdag)
ON CONFLICT DO NOTHING;

INSERT INTO public.vestiging_sluitdatums (vestiging, datum, reden, is_open_uitzondering)
VALUES ('Midsland', DATE '2026-06-15', 'Extra open', true),
       ('Midsland', DATE '2026-06-16', 'Extra open', true)
ON CONFLICT DO NOTHING;

-- ============ 2. Handelingen + instellingen ============
CREATE TABLE IF NOT EXISTS public.mep_handelingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  naam text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, naam)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mep_handelingen TO authenticated;
GRANT ALL ON public.mep_handelingen TO service_role;
ALTER TABLE public.mep_handelingen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handelingen readable" ON public.mep_handelingen FOR SELECT TO authenticated USING (true);
CREATE POLICY "handelingen writable" ON public.mep_handelingen FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.mep_handelingen (vestiging, naam, sort_order)
SELECT v.vestiging, h.naam, h.so
FROM (VALUES ('West'),('Midsland')) AS v(vestiging)
CROSS JOIN (VALUES ('Bereiden',10),('Vacumeren',20),('Snijden',30),('Aanvullen',40),('Ontdooien',50)) AS h(naam, so)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.mep_instellingen (
  vestiging text PRIMARY KEY,
  dagwissel_uur smallint NOT NULL DEFAULT 4 CHECK (dagwissel_uur BETWEEN 0 AND 23),
  morgen_grens_uur smallint NOT NULL DEFAULT 17 CHECK (morgen_grens_uur BETWEEN 0 AND 23),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mep_instellingen TO authenticated;
GRANT ALL ON public.mep_instellingen TO service_role;
ALTER TABLE public.mep_instellingen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mep instellingen readable" ON public.mep_instellingen FOR SELECT TO authenticated USING (true);
CREATE POLICY "mep instellingen writable" ON public.mep_instellingen FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.mep_instellingen (vestiging) VALUES ('West'), ('Midsland')
ON CONFLICT DO NOTHING;

-- ============ 3. mep_planning uitbreiden ============
ALTER TABLE public.mep_planning
  ALTER COLUMN recipe_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS titel text,
  ADD COLUMN IF NOT EXISTS handeling text,
  ADD COLUMN IF NOT EXISTS prioriteit smallint NOT NULL DEFAULT 2 CHECK (prioriteit BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS eenheid text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order_persoon integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.foh_employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aantal_klaar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS doorgeschoven_van date,
  ADD COLUMN IF NOT EXISTS doorschuif_teller integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bron text NOT NULL DEFAULT 'handmatig';

UPDATE public.mep_planning m
SET titel = COALESCE(m.titel, r.name, 'Taak')
FROM public.recipes r
WHERE r.id = m.recipe_id AND m.titel IS NULL;
UPDATE public.mep_planning SET titel = 'Taak' WHERE titel IS NULL;
ALTER TABLE public.mep_planning ALTER COLUMN titel SET NOT NULL;

-- oude unieke constraint/index op recipe_id vervangen
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.mep_planning'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.mep_planning DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
DROP INDEX IF EXISTS public.mep_planning_date_location_recipe_id_key;
DROP INDEX IF EXISTS public.idx_mep_planning_unique;

CREATE UNIQUE INDEX IF NOT EXISTS mep_planning_dag_titel_handeling_uniek
  ON public.mep_planning (date, location, lower(titel), coalesce(handeling, ''))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mep_planning_dag ON public.mep_planning (location, date) WHERE deleted_at IS NULL;

-- ============ 4. Templates ============
CREATE TABLE IF NOT EXISTS public.mep_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  weekdag smallint CHECK (weekdag IS NULL OR weekdag BETWEEN 0 AND 6), -- NULL = dagelijks
  titel text NOT NULL,
  handeling text,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  aantal numeric,
  eenheid text,
  prioriteit smallint NOT NULL DEFAULT 2 CHECK (prioriteit BETWEEN 1 AND 3),
  sort_order integer NOT NULL DEFAULT 0,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mep_templates TO authenticated;
GRANT ALL ON public.mep_templates TO service_role;
ALTER TABLE public.mep_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mep templates readable" ON public.mep_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "mep templates writable" ON public.mep_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER mep_templates_updated_at BEFORE UPDATE ON public.mep_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 5. Dagopbouw-log ============
CREATE TABLE IF NOT EXISTS public.mep_dagopbouw_log (
  vestiging text NOT NULL,
  datum date NOT NULL,
  uitgevoerd_op timestamptz NOT NULL DEFAULT now(),
  regels_toegevoegd integer NOT NULL DEFAULT 0,
  PRIMARY KEY (vestiging, datum)
);
GRANT SELECT, INSERT, UPDATE ON public.mep_dagopbouw_log TO authenticated;
GRANT ALL ON public.mep_dagopbouw_log TO service_role;
ALTER TABLE public.mep_dagopbouw_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dagopbouw log readable" ON public.mep_dagopbouw_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "dagopbouw log writable" ON public.mep_dagopbouw_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ 6. foh_employees afdeling ============
ALTER TABLE public.foh_employees
  ADD COLUMN IF NOT EXISTS afdeling text NOT NULL DEFAULT 'bediening';

-- ============ 7. Open-dag helpers ============
CREATE OR REPLACE FUNCTION public.mep_is_open(_vestiging text, _datum date)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.vestiging_sluitdatums s
                 WHERE s.vestiging = _vestiging AND s.datum = _datum AND s.is_open_uitzondering) THEN true
    WHEN EXISTS (SELECT 1 FROM public.vestiging_sluitdatums s
                 WHERE s.vestiging = _vestiging AND s.datum = _datum AND NOT s.is_open_uitzondering) THEN false
    ELSE COALESCE((SELECT o.is_open FROM public.vestiging_opendagen o
                   WHERE o.vestiging = _vestiging
                     AND o.weekdag = EXTRACT(DOW FROM _datum)::smallint), true)
  END
$$;

CREATE OR REPLACE FUNCTION public.mep_volgende_open_dag(_vestiging text, _vanaf date)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE d date;
BEGIN
  FOR i IN 1..14 LOOP
    d := _vanaf + i;
    IF public.mep_is_open(_vestiging, d) THEN RETURN d; END IF;
  END LOOP;
  RETURN _vanaf + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.mep_vorige_open_dag(_vestiging text, _voor date)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE d date;
BEGIN
  FOR i IN 1..14 LOOP
    d := _voor - i;
    IF public.mep_is_open(_vestiging, d) THEN RETURN d; END IF;
  END LOOP;
  RETURN _voor - 1;
END;
$$;

-- ============ 8. Idempotente dagopbouw ============
CREATE OR REPLACE FUNCTION public.mep_bouw_dag(_vestiging text, _datum date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vorige date;
  _toegevoegd integer := 0;
  _n integer;
BEGIN
  IF NOT public.mep_is_open(_vestiging, _datum) THEN
    INSERT INTO public.mep_dagopbouw_log (vestiging, datum, regels_toegevoegd)
    VALUES (_vestiging, _datum, 0)
    ON CONFLICT (vestiging, datum) DO UPDATE SET uitgevoerd_op = now();
    RETURN 0;
  END IF;

  -- 8a. Templates van deze weekdag (of dagelijks)
  INSERT INTO public.mep_planning
    (date, location, titel, handeling, recipe_id, quantity, eenheid, prioriteit, sort_order, bron, status)
  SELECT _datum, _vestiging, t.titel, t.handeling, t.recipe_id,
         COALESCE(t.aantal, 1)::integer, t.eenheid, t.prioriteit, t.sort_order, 'template', 'pending'
  FROM public.mep_templates t
  WHERE t.vestiging = _vestiging
    AND t.actief
    AND (t.weekdag IS NULL OR t.weekdag = EXTRACT(DOW FROM _datum)::smallint)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT; _toegevoegd := _toegevoegd + _n;

  -- 8b. Onafgeronde regels van de vorige open dag kopiëren (origineel blijft staan)
  _vorige := public.mep_vorige_open_dag(_vestiging, _datum);
  INSERT INTO public.mep_planning
    (date, location, titel, handeling, recipe_id, quantity, eenheid, prioriteit, sort_order,
     employee_id, notes, bron, doorgeschoven_van, doorschuif_teller, status)
  SELECT _datum, _vestiging, p.titel, p.handeling, p.recipe_id,
         GREATEST(COALESCE(p.quantity, 1) - COALESCE(p.aantal_klaar, 0), 1)::integer,
         p.eenheid, p.prioriteit, p.sort_order, p.employee_id, p.notes,
         'doorgeschoven', p.date, COALESCE(p.doorschuif_teller, 0) + 1, 'pending'
  FROM public.mep_planning p
  WHERE p.location = _vestiging
    AND p.date = _vorige
    AND p.deleted_at IS NULL
    AND p.completed_at IS NULL
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT; _toegevoegd := _toegevoegd + _n;

  INSERT INTO public.mep_dagopbouw_log (vestiging, datum, regels_toegevoegd)
  VALUES (_vestiging, _datum, _toegevoegd)
  ON CONFLICT (vestiging, datum) DO UPDATE
    SET uitgevoerd_op = now(),
        regels_toegevoegd = public.mep_dagopbouw_log.regels_toegevoegd + EXCLUDED.regels_toegevoegd;

  RETURN _toegevoegd;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mep_bouw_dag(text, date) TO authenticated, service_role;

-- ============ 9. Sluitdatum -> regels verplaatsen ============
CREATE OR REPLACE FUNCTION public.mep_verplaats_dag(_vestiging text, _van date, _naar date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  WITH verplaatst AS (
    UPDATE public.mep_planning p
    SET date = _naar
    WHERE p.location = _vestiging
      AND p.date = _van
      AND p.deleted_at IS NULL
      AND p.completed_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.mep_planning d
        WHERE d.location = _vestiging AND d.date = _naar AND d.deleted_at IS NULL
          AND lower(d.titel) = lower(p.titel)
          AND COALESCE(d.handeling,'') = COALESCE(p.handeling,'')
      )
    RETURNING 1
  )
  SELECT count(*) INTO _n FROM verplaatst;

  -- dubbelen die niet mee konden: soft-deleten, ze bestaan al op de doeldag
  UPDATE public.mep_planning p
  SET deleted_at = now()
  WHERE p.location = _vestiging AND p.date = _van
    AND p.deleted_at IS NULL AND p.completed_at IS NULL;

  RETURN _n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mep_verplaats_dag(text, date, date) TO authenticated, service_role;

-- ============ 10. Bestellingen-trigger herschrijven ============
CREATE OR REPLACE FUNCTION public.create_mep_from_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE it record;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    FOR it IN
      SELECT oi.product_name, oi.quantity, r.id AS recipe_id
      FROM public.internal_order_items oi
      LEFT JOIN public.recipes r ON r.name = oi.product_name
      WHERE oi.order_id = NEW.id
    LOOP
      INSERT INTO public.mep_planning
        (date, location, titel, recipe_id, quantity, bron, notes, status)
      VALUES
        (NEW.delivery_date, NEW.to_location, it.product_name, it.recipe_id, it.quantity,
         'bestelling', 'Van interne bestelling ' || NEW.order_number, 'pending')
      ON CONFLICT (date, location, lower(titel), coalesce(handeling, ''))
      WHERE deleted_at IS NULL
      DO UPDATE SET
        quantity = COALESCE(public.mep_planning.quantity, 0) + EXCLUDED.quantity,
        completed_at = NULL,
        status = 'pending',
        notes = COALESCE(public.mep_planning.notes || ' + ', '') || EXCLUDED.notes;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;