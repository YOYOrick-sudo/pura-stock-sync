-- 1. Productkaart-velden op koelcel_check_items
ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS bron text NOT NULL DEFAULT 'koelcel_inkoop',
  ADD COLUMN IF NOT EXISTS plek text NOT NULL DEFAULT 'koelcel',
  ADD COLUMN IF NOT EXISTS bak_maat text;

UPDATE public.koelcel_check_items SET plek = type WHERE plek = 'koelcel' AND type = 'vriezer';

ALTER TABLE public.koelcel_checks
  ADD COLUMN IF NOT EXISTS doorgezet_naar text;

-- 2. Roosteren als handeling
INSERT INTO public.mep_handelingen (naam, vestiging, sort_order, actief)
SELECT 'Roosteren', v, 35, true
FROM (VALUES ('West'), ('Midsland')) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM public.mep_handelingen h WHERE h.naam = 'Roosteren' AND h.vestiging = t.v
);

-- 3. Bestelbord
CREATE TABLE IF NOT EXISTS public.bestel_signalen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  naam text NOT NULL,
  aantal numeric NOT NULL DEFAULT 1,
  eenheid text NOT NULL DEFAULT 'stuks',
  notitie text,
  status text NOT NULL DEFAULT 'open',
  gemeld_door uuid,
  besteld_door uuid,
  besteld_op timestamptz,
  bron text NOT NULL DEFAULT 'handmatig',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bestel_signalen TO authenticated;
GRANT ALL ON public.bestel_signalen TO service_role;

ALTER TABLE public.bestel_signalen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bestel_signalen lezen" ON public.bestel_signalen;
CREATE POLICY "bestel_signalen lezen" ON public.bestel_signalen
  FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging));

DROP POLICY IF EXISTS "bestel_signalen beheren" ON public.bestel_signalen;
CREATE POLICY "bestel_signalen beheren" ON public.bestel_signalen
  FOR ALL TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (public.heeft_vestiging(auth.uid(), vestiging));

CREATE INDEX IF NOT EXISTS idx_bestel_signalen_open
  ON public.bestel_signalen (vestiging, status, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_bestel_signalen ON public.bestel_signalen;
CREATE TRIGGER set_updated_at_bestel_signalen
  BEFORE UPDATE ON public.bestel_signalen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Vriezer-productkaarten West (uit de oude ontdooi-templates)
INSERT INTO public.koelcel_check_items (vestiging, naam, doel_aantal, eenheid, type, plek, bron, volgorde, actief)
SELECT 'West', t.naam, 1, 'stuks', 'vriezer', 'vriezer', t.bron, t.volgorde, true
FROM (VALUES
  ('Kip', 'midsland', 10),
  ('Tempeh', 'koelcel_inkoop', 20),
  ('Kebab', 'koelcel_inkoop', 30),
  ('Soepen (tom yum / vissoep)', 'midsland', 40),
  ('Zalm & Forel', 'koelcel_inkoop', 50),
  ('Brioche', 'koelcel_inkoop', 60),
  ('Zoet (alleen als echt op)', 'midsland', 70),
  ('Tomatenjam', 'midsland', 80),
  ('Tomatenrelish', 'midsland', 90),
  ('Wortelspread', 'zelf_west', 100),
  ('Kaas', 'koelcel_inkoop', 110),
  ('Bananenpannenkoeken', 'midsland', 120),
  ('Avocado spread', 'midsland', 130)
) AS t(naam, bron, volgorde)
WHERE NOT EXISTS (
  SELECT 1 FROM public.koelcel_check_items k
  WHERE k.vestiging = 'West' AND k.plek = 'vriezer' AND lower(k.naam) = lower(t.naam)
);

-- 5. Werkbank- en werkblad-productkaarten West (uit "Bijvullen keuken")
INSERT INTO public.koelcel_check_items (vestiging, naam, doel_aantal, eenheid, type, plek, bron, bak_maat, volgorde, actief)
SELECT 'West', t.naam, t.aantal, 'stuks', 'koelcel', t.plek, t.bron, t.bak_maat, t.volgorde, true
FROM (VALUES
  ('Hüttenkäse', 1, 'werkbank', 'koelcel_inkoop', 'hoge 1/9e', 10),
  ('Cranberry compote', 1, 'werkbank', 'koelcel_inkoop', 'hoge 1/9e', 20),
  ('Kokosyoghurt', 1, 'werkbank', 'koelcel_inkoop', 'hoge 1/9e', 30),
  ('Avocado spread', 1, 'werkbank', 'midsland', 'hoge 1/9e', 40),
  ('Tomatenrelish', 1, 'werkbank', 'midsland', 'midden 1/9e', 50),
  ('Mayonaises (flessen bijvullen)', 1, 'werkbank', 'zelf_west', 'fles', 60),
  ('Bananenpannenkoeken', 1, 'werkbank', 'midsland', NULL, 70),
  ('Zuurdesem stokbrood (in 3en snijden)', 1, 'werkbank', 'zelf_west', 'broodbak', 80),
  ('Gerookte zalm', 1, 'werkbank', 'koelcel_inkoop', NULL, 90),
  ('Forel', 1, 'werkbank', 'koelcel_inkoop', NULL, 100),
  ('Broodbakken (pita, brioche, deugniet)', 1, 'werkbank', 'koelcel_inkoop', NULL, 110),
  ('Bananencake', 1, 'werkbank', 'midsland', 'lade', 120),
  ('Sesamzaad', 1, 'werkblad', 'magazijn', 'pot', 130),
  ('Amandelschaafsel', 1, 'werkblad', 'magazijn', 'pot', 140),
  ('Kokosschilfers', 1, 'werkblad', 'magazijn', 'pot', 150)
) AS t(naam, aantal, plek, bron, bak_maat, volgorde)
WHERE NOT EXISTS (
  SELECT 1 FROM public.koelcel_check_items k
  WHERE k.vestiging = 'West' AND k.plek IN ('werkbank','werkblad') AND lower(k.naam) = lower(t.naam)
);

-- 6. Oude templates uitzetten zodat er geen dubbele regels ontstaan
UPDATE public.foh_daily_templates
SET is_active = false
WHERE location = 'West'
  AND phase = 'sluit'
  AND category IN ('Bijvullen keuken', 'Ontdooien (vriezer → koelcel)');

UPDATE public.foh_tasks
SET archived = true
WHERE location = 'West'
  AND phase = 'sluit'
  AND due_date >= CURRENT_DATE
  AND coalesce(archived, false) = false
  AND category IN ('Bijvullen keuken', 'Ontdooien (vriezer → koelcel)');