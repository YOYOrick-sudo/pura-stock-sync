-- ============================================================
-- Voorraadketen v2 — STAP 0
-- ============================================================

-- ---------- 1. EENHEDEN ----------
CREATE TABLE IF NOT EXISTS public.eenheden (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  naam text NOT NULL,
  soort text NOT NULL CHECK (soort IN ('gewicht','volume','stuk','keuken')),
  basis_code text NOT NULL,
  factor_naar_basis numeric NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eenheden_code ON public.eenheden(lower(code));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eenheden TO authenticated;
GRANT ALL ON public.eenheden TO service_role;
ALTER TABLE public.eenheden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eenheden_select" ON public.eenheden
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "eenheden_write" ON public.eenheden
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_eenheden_updated_at BEFORE UPDATE ON public.eenheden
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.eenheden (code, naam, soort, basis_code, factor_naar_basis, sort_order) VALUES
  ('g','gram','gewicht','g',1,10),
  ('kg','kilogram','gewicht','g',1000,20),
  ('ml','milliliter','volume','ml',1,30),
  ('l','liter','volume','ml',1000,40),
  ('stuk','stuk','stuk','stuk',1,50),
  ('portie','portie','stuk','stuk',1,60),
  ('bak','bak','stuk','stuk',1,70),
  ('tray','tray','stuk','stuk',1,80),
  ('doos','doos','stuk','stuk',1,90),
  ('zak','zak','stuk','stuk',1,100),
  ('el','eetlepel','keuken','ml',15,110),
  ('bos','bos','keuken','stuk',1,120),
  ('stengel','stengel','keuken','stuk',1,130),
  ('zakje','zakje','keuken','stuk',1,140)
ON CONFLICT DO NOTHING;

-- ---------- 2. MIGRATIE-LOGBOEK ----------
CREATE TABLE IF NOT EXISTS public.migratie_logboek (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onderwerp text NOT NULL,
  bron_tabel text NOT NULL,
  bron_id uuid,
  reden text NOT NULL,
  ruwe_waarde text,
  opgelost_op timestamptz,
  opgelost_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.migratie_logboek TO authenticated;
GRANT ALL ON public.migratie_logboek TO service_role;
ALTER TABLE public.migratie_logboek ENABLE ROW LEVEL SECURITY;
CREATE POLICY "migratie_logboek_select" ON public.migratie_logboek
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "migratie_logboek_write" ON public.migratie_logboek
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'))
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_migratie_logboek_updated_at BEFORE UPDATE ON public.migratie_logboek
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 3. ARTIKELEN (rename ingredienten_master) ----------
ALTER TABLE public.ingredienten_master RENAME TO artikelen;

ALTER TABLE public.artikelen
  ADD COLUMN IF NOT EXISTS soort text NOT NULL DEFAULT 'ingekocht',
  ADD COLUMN IF NOT EXISTS categorie text,
  ADD COLUMN IF NOT EXISTS recept_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS basis_eenheid_id uuid REFERENCES public.eenheden(id),
  ADD COLUMN IF NOT EXISTS is_voorraad_artikel boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.artikelen
  ADD CONSTRAINT artikelen_soort_check CHECK (soort IN ('ingekocht','halffabricaat','verbruiksartikel'));
ALTER TABLE public.artikelen
  ADD CONSTRAINT artikelen_recept_alleen_hf CHECK (recept_id IS NULL OR soort = 'halffabricaat');

CREATE UNIQUE INDEX IF NOT EXISTS idx_artikelen_recept_uniek
  ON public.artikelen(recept_id) WHERE recept_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_artikelen_updated_at ON public.artikelen;
CREATE TRIGGER trg_artikelen_updated_at BEFORE UPDATE ON public.artikelen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- policies hernoemen zodat de namen kloppen
ALTER POLICY "Authenticated can view ingredienten_master" ON public.artikelen RENAME TO "artikelen_select";
ALTER POLICY "Authenticated can insert ingredienten_master" ON public.artikelen RENAME TO "artikelen_insert";
ALTER POLICY "Authenticated can update ingredienten_master" ON public.artikelen RENAME TO "artikelen_update";

-- compatibiliteitsview (tijdelijk, weg in stap 1)
CREATE VIEW public.ingredienten_master
WITH (security_invoker = true) AS
  SELECT id, naam, created_at, allergenen, allergenen_sporen,
         allergenen_status, allergenen_bron, allergenen_bijgewerkt_op
  FROM public.artikelen
  WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredienten_master TO authenticated;
GRANT ALL ON public.ingredienten_master TO service_role;

-- ---------- 4. ARTIKEL_EENHEDEN ----------
CREATE TABLE IF NOT EXISTS public.artikel_eenheden (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id uuid NOT NULL REFERENCES public.artikelen(id) ON DELETE CASCADE,
  eenheid_id uuid NOT NULL REFERENCES public.eenheden(id),
  factor_naar_basis numeric NOT NULL DEFAULT 1,
  rendement_pct numeric,
  is_inkoop boolean NOT NULL DEFAULT false,
  is_keuken boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artikel_id, eenheid_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel_eenheden TO authenticated;
GRANT ALL ON public.artikel_eenheden TO service_role;
ALTER TABLE public.artikel_eenheden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artikel_eenheden_select" ON public.artikel_eenheden
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "artikel_eenheden_write" ON public.artikel_eenheden
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'))
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_artikel_eenheden_updated_at BEFORE UPDATE ON public.artikel_eenheden
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 5. RECEPT_INGREDIENTEN: numeriek + eenheid_id ----------
ALTER TABLE public.recept_ingredienten
  ADD COLUMN IF NOT EXISTS hoeveelheid_num numeric,
  ADD COLUMN IF NOT EXISTS eenheid_id uuid REFERENCES public.eenheden(id);

UPDATE public.recept_ingredienten ri
   SET hoeveelheid_num = replace(btrim(ri.hoeveelheid), ',', '.')::numeric
 WHERE ri.hoeveelheid IS NOT NULL
   AND btrim(ri.hoeveelheid) <> ''
   AND replace(btrim(ri.hoeveelheid), ',', '.') ~ '^[0-9]+(\.[0-9]+)?$';

UPDATE public.recept_ingredienten ri
   SET eenheid_id = e.id
  FROM public.eenheden e
 WHERE ri.eenheid IS NOT NULL
   AND e.code = CASE lower(btrim(ri.eenheid))
        WHEN 'g' THEN 'g' WHEN 'gr' THEN 'g' WHEN 'gram' THEN 'g'
        WHEN 'kg' THEN 'kg'
        WHEN 'ml' THEN 'ml'
        WHEN 'l' THEN 'l' WHEN 'ltr' THEN 'l' WHEN 'liter' THEN 'l'
        WHEN 'stuks' THEN 'stuk' WHEN 'stuk' THEN 'stuk'
        WHEN 'el' THEN 'el'
        WHEN 'bos' THEN 'bos'
        WHEN 'stengels' THEN 'stengel' WHEN 'stengel' THEN 'stengel'
        WHEN 'zakjes' THEN 'zakje' WHEN 'zakje' THEN 'zakje'
        ELSE NULL END;

-- logboek: niet-numerieke en ontbrekende hoeveelheden
INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'Hoeveelheid receptregel', 'recept_ingredienten', ri.id,
       CASE WHEN ri.hoeveelheid IS NULL OR btrim(ri.hoeveelheid) = ''
            THEN 'Hoeveelheid ontbreekt' ELSE 'Hoeveelheid is geen getal' END,
       coalesce(ri.hoeveelheid, '(leeg)')
  FROM public.recept_ingredienten ri
 WHERE ri.hoeveelheid_num IS NULL;

-- logboek: ontbrekende of onbekende eenheid
INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'Eenheid receptregel', 'recept_ingredienten', ri.id,
       CASE WHEN ri.eenheid IS NULL OR btrim(ri.eenheid) = ''
            THEN 'Eenheid ontbreekt' ELSE 'Eenheid onbekend in eenhedenlijst' END,
       coalesce(ri.eenheid, '(leeg)')
  FROM public.recept_ingredienten ri
 WHERE ri.eenheid_id IS NULL;

-- ---------- 6. HALFFABRICAAT-ARTIKELEN ----------
-- 6a. bestaand artikel met dezelfde naam opwaarderen
WITH match AS (
  SELECT a.id AS artikel_id, r.id AS recept_id, a.naam
    FROM public.recipes r
    JOIN public.artikelen a ON lower(a.naam) = lower(r.name)
   WHERE r.type = 'halffabricaat' AND r.is_gearchiveerd IS NOT TRUE
     AND a.recept_id IS NULL
), upd AS (
  UPDATE public.artikelen a
     SET soort = 'halffabricaat', recept_id = m.recept_id
    FROM match m WHERE a.id = m.artikel_id
  RETURNING a.id, a.naam
)
INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'Artikel opgewaardeerd naar halffabricaat', 'artikelen', upd.id,
       'Bestaand ingredient had dezelfde naam als een halffabricaat-recept', upd.naam
  FROM upd;

-- 6b. ontbrekende halffabricaat-artikelen aanmaken
INSERT INTO public.artikelen (naam, soort, recept_id, is_voorraad_artikel)
SELECT r.name, 'halffabricaat', r.id, true
  FROM public.recipes r
 WHERE r.type = 'halffabricaat' AND r.is_gearchiveerd IS NOT TRUE
   AND NOT EXISTS (SELECT 1 FROM public.artikelen a WHERE a.recept_id = r.id)
ON CONFLICT DO NOTHING;

-- ---------- 7. BASISEENHEID AFLEIDEN ----------
WITH tel AS (
  SELECT ri.ingredient_id AS artikel_id, ri.eenheid_id, count(*) AS n,
         row_number() OVER (PARTITION BY ri.ingredient_id ORDER BY count(*) DESC, min(ri.sort_order)) AS rn
    FROM public.recept_ingredienten ri
   WHERE ri.ingredient_id IS NOT NULL AND ri.eenheid_id IS NOT NULL
   GROUP BY ri.ingredient_id, ri.eenheid_id
), keuze AS (
  SELECT t.artikel_id, e.id AS basis_id
    FROM tel t
    JOIN public.eenheden bron ON bron.id = t.eenheid_id
    JOIN public.eenheden e ON e.code = bron.basis_code
   WHERE t.rn = 1
)
UPDATE public.artikelen a
   SET basis_eenheid_id = k.basis_id
  FROM keuze k
 WHERE a.id = k.artikel_id AND a.basis_eenheid_id IS NULL;

INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'Basiseenheid artikel', 'artikelen', a.id,
       CASE WHEN a.soort = 'halffabricaat'
            THEN 'Halffabricaat: basiseenheid volgt uit de nog in te vullen methode'
            ELSE 'Niet af te leiden uit receptregels' END,
       a.naam
  FROM public.artikelen a
 WHERE a.basis_eenheid_id IS NULL AND a.deleted_at IS NULL;

-- ---------- 8. ARTIKEL_LOCATIES (rename ingredient_locaties) ----------
ALTER TABLE public.ingredient_locaties RENAME TO artikel_locaties;
ALTER TABLE public.artikel_locaties RENAME COLUMN ingredient_id TO artikel_id;

ALTER TABLE public.artikel_locaties
  ADD COLUMN IF NOT EXISTS max_voorraad numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tel_volgorde integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opslag_locatie text,
  ADD COLUMN IF NOT EXISTS aanvul_bron text NOT NULL DEFAULT 'leverancier',
  ADD COLUMN IF NOT EXISTS bron_vestiging text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.artikel_locaties
  ADD CONSTRAINT artikel_locaties_aanvul_bron_check
  CHECK (aanvul_bron IN ('leverancier','interne_order','eigen_productie'));
ALTER TABLE public.artikel_locaties
  ADD CONSTRAINT artikel_locaties_vestiging_check
  CHECK (vestiging IN ('West','Midsland'));
ALTER TABLE public.artikel_locaties
  ADD CONSTRAINT artikel_locaties_bron_vestiging_check
  CHECK (
    (aanvul_bron = 'interne_order' AND bron_vestiging IN ('West','Midsland') AND bron_vestiging <> vestiging)
    OR (aanvul_bron <> 'interne_order' AND bron_vestiging IS NULL)
  );

ALTER POLICY "ingredient_locaties_select" ON public.artikel_locaties RENAME TO "artikel_locaties_select";
ALTER POLICY "ingredient_locaties_write" ON public.artikel_locaties RENAME TO "artikel_locaties_write";

-- locatierijen voor halffabricaat-artikelen vanuit recept_locaties
INSERT INTO public.artikel_locaties (artikel_id, vestiging, is_actief, aanvul_bron)
SELECT a.id, rl.vestiging, true, 'eigen_productie'
  FROM public.artikelen a
  JOIN public.recept_locaties rl ON rl.recept_id = a.recept_id AND rl.is_actief
 WHERE a.soort = 'halffabricaat'
ON CONFLICT (artikel_id, vestiging) DO UPDATE SET aanvul_bron = 'eigen_productie', is_actief = true;

UPDATE public.artikel_locaties al
   SET aanvul_bron = 'eigen_productie'
  FROM public.artikelen a
 WHERE a.id = al.artikel_id AND a.soort = 'halffabricaat' AND al.aanvul_bron <> 'eigen_productie';

-- seed-trigger bijwerken naar de nieuwe namen
CREATE OR REPLACE FUNCTION public.ingredient_seed_locaties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.artikel_locaties (artikel_id, vestiging, is_actief)
  SELECT NEW.id, v.vestiging, true
  FROM (VALUES ('West'), ('Midsland')) AS v(vestiging)
  ON CONFLICT (artikel_id, vestiging) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ingredienten_merge(_keep uuid, _drop uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  affected integer := 0;
  keep_naam text;
BEGIN
  IF _keep IS NULL OR _drop IS NULL OR array_length(_drop, 1) IS NULL THEN
    RAISE EXCEPTION 'keep en drop zijn verplicht';
  END IF;
  IF _keep = ANY(_drop) THEN
    RAISE EXCEPTION 'keep mag niet in drop staan';
  END IF;

  SELECT naam INTO keep_naam FROM public.artikelen WHERE id = _keep;
  IF keep_naam IS NULL THEN
    RAISE EXCEPTION 'Doel-artikel bestaat niet';
  END IF;

  UPDATE public.recept_ingredienten
     SET ingredient_id = _keep,
         naam = keep_naam
   WHERE ingredient_id = ANY(_drop);
  GET DIAGNOSTICS affected = ROW_COUNT;

  DELETE FROM public.artikelen WHERE id = ANY(_drop);

  RETURN affected;
END;
$function$;

-- ---------- 9. INTERNE LEVERDAGEN ----------
CREATE TABLE IF NOT EXISTS public.interne_leverdagen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  van_vestiging text NOT NULL CHECK (van_vestiging IN ('West','Midsland')),
  naar_vestiging text NOT NULL CHECK (naar_vestiging IN ('West','Midsland')),
  weekdag smallint NOT NULL CHECK (weekdag BETWEEN 0 AND 6),
  deadline_tijd time,
  actief boolean NOT NULL DEFAULT true,
  notitie text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interne_leverdagen_richting_check CHECK (van_vestiging <> naar_vestiging),
  UNIQUE (van_vestiging, naar_vestiging, weekdag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interne_leverdagen TO authenticated;
GRANT ALL ON public.interne_leverdagen TO service_role;
ALTER TABLE public.interne_leverdagen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interne_leverdagen_select" ON public.interne_leverdagen
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "interne_leverdagen_write" ON public.interne_leverdagen
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'))
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_interne_leverdagen_updated_at BEFORE UPDATE ON public.interne_leverdagen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 10. LEADTIME OP METHODES ----------
ALTER TABLE public.halffabricaat_methodes
  ADD COLUMN IF NOT EXISTS productie_leadtime_dagen integer NOT NULL DEFAULT 1;