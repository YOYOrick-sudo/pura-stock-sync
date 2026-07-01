-- Receptenmodule V1: schema uitbreiden + ingrediëntentabel

-- 1) recipes uitbreiden
ALTER TABLE public.recipes ALTER COLUMN location DROP NOT NULL;
ALTER TABLE public.recipes ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'gerecht',
  ADD COLUMN IF NOT EXISTS porties int,
  ADD COLUMN IF NOT EXISTS bereiding text,
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS is_gearchiveerd boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_type_check'
  ) THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT recipes_type_check CHECK (type IN ('gerecht','halffabricaat'));
  END IF;
END $$;

-- Aanvullende SELECT policy: iedereen ingelogd mag gedeelde recepten (NULL location) zien,
-- en in V1 de volledige gedeelde receptenlijst. Bestaande location-policy blijft staan.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='public' AND tablename='recipes'
       AND policyname='Authenticated can view shared recipes'
  ) THEN
    CREATE POLICY "Authenticated can view shared recipes"
      ON public.recipes FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 2) recept_ingredienten
CREATE TABLE IF NOT EXISTS public.recept_ingredienten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recept_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  naam text NOT NULL,
  hoeveelheid text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recept_ingredienten_recept ON public.recept_ingredienten(recept_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recept_ingredienten TO authenticated;
GRANT ALL ON public.recept_ingredienten TO service_role;

ALTER TABLE public.recept_ingredienten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ingredients"
  ON public.recept_ingredienten FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert ingredients"
  ON public.recept_ingredienten FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update ingredients"
  ON public.recept_ingredienten FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete ingredients"
  ON public.recept_ingredienten FOR DELETE
  TO authenticated USING (true);