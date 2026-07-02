
-- 1. Master-tabel
CREATE TABLE public.ingredienten_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_ingredienten_master_naam_uniek
  ON public.ingredienten_master (lower(naam));

GRANT SELECT, INSERT, UPDATE ON public.ingredienten_master TO authenticated;
GRANT ALL ON public.ingredienten_master TO service_role;

ALTER TABLE public.ingredienten_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ingredienten_master"
  ON public.ingredienten_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ingredienten_master"
  ON public.ingredienten_master FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ingredienten_master"
  ON public.ingredienten_master FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Geen DELETE policy: opruimen gebeurt via ingredienten_merge (security definer).

-- 2. Koppeling in recept_ingredienten
ALTER TABLE public.recept_ingredienten
  ADD COLUMN ingredient_id uuid REFERENCES public.ingredienten_master(id) ON DELETE SET NULL;
CREATE INDEX idx_recept_ingredienten_master
  ON public.recept_ingredienten(ingredient_id);

-- 3. Backfill: eerst unieke masters, first-wins op lower(trim(naam))
INSERT INTO public.ingredienten_master (naam)
SELECT naam FROM (
  SELECT naam,
         row_number() OVER (PARTITION BY lower(trim(naam)) ORDER BY naam) AS rn
  FROM (
    SELECT DISTINCT trim(naam) AS naam
    FROM public.recept_ingredienten
    WHERE trim(naam) <> ''
  ) s
) t WHERE rn = 1;

-- 4. Backfill: koppel ingredient_id
UPDATE public.recept_ingredienten ri
   SET ingredient_id = im.id
  FROM public.ingredienten_master im
 WHERE lower(trim(ri.naam)) = lower(im.naam)
   AND ri.ingredient_id IS NULL;

-- 5. Stats-view voor de ingrediënten-pagina
CREATE OR REPLACE VIEW public.v_ingredienten_stats
WITH (security_invoker = true) AS
SELECT im.id,
       im.naam,
       COUNT(ri.id)::int AS aantal_recepten,
       MAX(ri.created_at) AS laatst_gebruikt
  FROM public.ingredienten_master im
  LEFT JOIN public.recept_ingredienten ri ON ri.ingredient_id = im.id
 GROUP BY im.id, im.naam;

GRANT SELECT ON public.v_ingredienten_stats TO authenticated;

-- 6. Merge-RPC: transactioneel, security definer
CREATE OR REPLACE FUNCTION public.ingredienten_merge(_keep uuid, _drop uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  SELECT naam INTO keep_naam FROM public.ingredienten_master WHERE id = _keep;
  IF keep_naam IS NULL THEN
    RAISE EXCEPTION 'Doel-ingrediënt bestaat niet';
  END IF;

  UPDATE public.recept_ingredienten
     SET ingredient_id = _keep,
         naam = keep_naam
   WHERE ingredient_id = ANY(_drop);
  GET DIAGNOSTICS affected = ROW_COUNT;

  DELETE FROM public.ingredienten_master WHERE id = ANY(_drop);

  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ingredienten_merge(uuid, uuid[]) TO authenticated;
