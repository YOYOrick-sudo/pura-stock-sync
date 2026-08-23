DO $$ BEGIN
  CREATE TYPE public.allergen AS ENUM ('gluten','schaaldieren','ei','vis','pinda','soja','melk','noten','selderij','mosterd','sesam','sulfiet','lupine','weekdieren');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.ingredienten_master
  ADD COLUMN IF NOT EXISTS allergenen public.allergen[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergenen_sporen public.allergen[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergenen_status text NOT NULL DEFAULT 'onbekend',
  ADD COLUMN IF NOT EXISTS allergenen_bron text,
  ADD COLUMN IF NOT EXISTS allergenen_bijgewerkt_op timestamptz;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS allergenen_extra public.allergen[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergenen_uitgesloten public.allergen[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergenen_notitie text;

CREATE OR REPLACE VIEW public.v_recept_allergenen
WITH (security_invoker = true) AS
WITH regels AS (
  SELECT ri.recept_id,
         im.allergenen,
         im.allergenen_sporen,
         COALESCE(im.allergenen_status, 'onbekend') AS status,
         ri.ingredient_id
  FROM public.recept_ingredienten ri
  LEFT JOIN public.ingredienten_master im ON im.id = ri.ingredient_id
),
agg AS (
  SELECT recept_id,
         COALESCE(ARRAY(SELECT DISTINCT unnest(array_agg(a.code)) ORDER BY 1), '{}')::public.allergen[] AS uit_ingredienten,
         COUNT(*) FILTER (WHERE ingredient_id IS NULL OR status <> 'bevestigd') AS onbekend_count
  FROM regels
  LEFT JOIN LATERAL unnest(COALESCE(allergenen, '{}'::public.allergen[])) AS a(code) ON true
  GROUP BY recept_id
),
sporen AS (
  SELECT recept_id,
         COALESCE(ARRAY(SELECT DISTINCT unnest(array_agg(s.code)) ORDER BY 1), '{}')::public.allergen[] AS sporen
  FROM regels
  LEFT JOIN LATERAL unnest(COALESCE(allergenen_sporen, '{}'::public.allergen[])) AS s(code) ON true
  GROUP BY recept_id
)
SELECT r.id AS recept_id,
       COALESCE(
         ARRAY(
           SELECT DISTINCT x FROM unnest(COALESCE(agg.uit_ingredienten,'{}') || r.allergenen_extra) AS x
           WHERE NOT (x = ANY (r.allergenen_uitgesloten))
           ORDER BY 1
         ), '{}'
       )::public.allergen[] AS allergenen,
       COALESCE(sporen.sporen, '{}')::public.allergen[] AS sporen,
       COALESCE(agg.onbekend_count, 0) AS onbekende_ingredienten,
       r.allergenen_notitie
FROM public.recipes r
LEFT JOIN agg ON agg.recept_id = r.id
LEFT JOIN sporen ON sporen.recept_id = r.id;

GRANT SELECT ON public.v_recept_allergenen TO authenticated;
GRANT ALL ON public.v_recept_allergenen TO service_role;