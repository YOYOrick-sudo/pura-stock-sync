CREATE TABLE public.sticker_producten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  laatst_type text CHECK (laatst_type IN ('ontdooid','bereid','vrij')),
  laatst_tht_dagen int,
  keer_geprint int NOT NULL DEFAULT 1,
  laatst_geprint timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_sticker_producten_naam ON public.sticker_producten (lower(naam));

GRANT SELECT, INSERT, UPDATE ON public.sticker_producten TO authenticated;
GRANT ALL ON public.sticker_producten TO service_role;

ALTER TABLE public.sticker_producten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_sticker_producten"
  ON public.sticker_producten FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_sticker_producten"
  ON public.sticker_producten FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_sticker_producten"
  ON public.sticker_producten FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.sticker_producten_bump(
  _naam text,
  _type text,
  _tht int
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
BEGIN
  IF _naam IS NULL OR length(trim(_naam)) = 0 THEN
    RAISE EXCEPTION 'naam is verplicht';
  END IF;
  IF _type IS NOT NULL AND _type NOT IN ('ontdooid','bereid','vrij') THEN
    RAISE EXCEPTION 'ongeldig type';
  END IF;

  INSERT INTO public.sticker_producten (naam, laatst_type, laatst_tht_dagen)
  VALUES (trim(_naam), _type, _tht)
  ON CONFLICT ((lower(naam))) DO UPDATE
    SET keer_geprint     = public.sticker_producten.keer_geprint + 1,
        laatst_type      = EXCLUDED.laatst_type,
        laatst_tht_dagen = EXCLUDED.laatst_tht_dagen,
        laatst_geprint   = now()
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sticker_producten_bump(text, text, int) TO authenticated;