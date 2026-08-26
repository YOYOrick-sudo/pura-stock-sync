-- ============================================================
-- STAP 1: bibliotheek bedrijfsbreed + koppeling per vestiging
-- ============================================================

CREATE TABLE public.recept_locaties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recept_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  vestiging TEXT NOT NULL,
  is_actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recept_id, vestiging)
);

CREATE TABLE public.ingredient_locaties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredienten_master(id) ON DELETE CASCADE,
  vestiging TEXT NOT NULL,
  is_actief BOOLEAN NOT NULL DEFAULT true,
  min_voorraad NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ingredient_id, vestiging)
);

-- Validatie: alleen bestaande vestigingen
CREATE OR REPLACE FUNCTION public.validate_vestiging_kolom()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.vestiging NOT IN ('West', 'Midsland') THEN
    RAISE EXCEPTION 'Onbekende vestiging: %', NEW.vestiging;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_recept_locaties
  BEFORE INSERT OR UPDATE ON public.recept_locaties
  FOR EACH ROW EXECUTE FUNCTION public.validate_vestiging_kolom();

CREATE TRIGGER trg_validate_ingredient_locaties
  BEFORE INSERT OR UPDATE ON public.ingredient_locaties
  FOR EACH ROW EXECUTE FUNCTION public.validate_vestiging_kolom();

CREATE TRIGGER trg_recept_locaties_updated_at
  BEFORE UPDATE ON public.recept_locaties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_ingredient_locaties_updated_at
  BEFORE UPDATE ON public.ingredient_locaties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_recept_locaties_vestiging ON public.recept_locaties(vestiging, is_actief);
CREATE INDEX idx_ingredient_locaties_vestiging ON public.ingredient_locaties(vestiging, is_actief);

-- ── Grants ──────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recept_locaties TO authenticated;
GRANT ALL ON public.recept_locaties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredient_locaties TO authenticated;
GRANT ALL ON public.ingredient_locaties TO service_role;

-- ── RLS ─────────────────────────────────────────────────
ALTER TABLE public.recept_locaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_locaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recept_locaties_select" ON public.recept_locaties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "recept_locaties_write" ON public.recept_locaties
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "ingredient_locaties_select" ON public.ingredient_locaties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ingredient_locaties_write" ON public.ingredient_locaties
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- ── Data overzetten ─────────────────────────────────────
INSERT INTO public.recept_locaties (recept_id, vestiging, is_actief)
SELECT r.id, v.vestiging,
       CASE WHEN r.location IS NULL THEN true ELSE r.location = v.vestiging END
FROM public.recipes r
CROSS JOIN (VALUES ('West'), ('Midsland')) AS v(vestiging)
ON CONFLICT (recept_id, vestiging) DO NOTHING;

INSERT INTO public.ingredient_locaties (ingredient_id, vestiging, is_actief)
SELECT i.id, v.vestiging, true
FROM public.ingredienten_master i
CROSS JOIN (VALUES ('West'), ('Midsland')) AS v(vestiging)
ON CONFLICT (ingredient_id, vestiging) DO NOTHING;

-- Nieuwe recepten/ingredienten krijgen automatisch beide vestigingen
CREATE OR REPLACE FUNCTION public.recept_seed_locaties()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.recept_locaties (recept_id, vestiging, is_actief)
  SELECT NEW.id, v.vestiging,
         CASE WHEN NEW.location IS NULL THEN true ELSE NEW.location = v.vestiging END
  FROM (VALUES ('West'), ('Midsland')) AS v(vestiging)
  ON CONFLICT (recept_id, vestiging) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recept_seed_locaties
  AFTER INSERT ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.recept_seed_locaties();

CREATE OR REPLACE FUNCTION public.ingredient_seed_locaties()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ingredient_locaties (ingredient_id, vestiging, is_actief)
  SELECT NEW.id, v.vestiging, true
  FROM (VALUES ('West'), ('Midsland')) AS v(vestiging)
  ON CONFLICT (ingredient_id, vestiging) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ingredient_seed_locaties
  AFTER INSERT ON public.ingredienten_master
  FOR EACH ROW EXECUTE FUNCTION public.ingredient_seed_locaties();