CREATE OR REPLACE VIEW public.v_recept_allergenen
WITH (security_invoker = true) AS
WITH regels AS (
  SELECT ri.recept_id,
         ri.id AS regel_id,
         COALESCE(im.allergenen, '{}'::public.allergen[]) AS allergenen,
         COALESCE(im.allergenen_sporen, '{}'::public.allergen[]) AS sporen,
         CASE WHEN ri.ingredient_id IS NULL THEN 'onbekend'
              ELSE COALESCE(im.allergenen_status, 'onbekend') END AS status
  FROM public.recept_ingredienten ri
  LEFT JOIN public.ingredienten_master im ON im.id = ri.ingredient_id
),
agg AS (
  SELECT recept_id,
         COALESCE(array_agg(DISTINCT a) FILTER (WHERE a IS NOT NULL), '{}')::public.allergen[] AS uit_ingredienten,
         COALESCE(array_agg(DISTINCT s) FILTER (WHERE s IS NOT NULL), '{}')::public.allergen[] AS uit_sporen,
         COUNT(DISTINCT regel_id) FILTER (WHERE status <> 'bevestigd') AS onbekend_count
  FROM regels
  LEFT JOIN LATERAL unnest(regels.allergenen) AS a ON true
  LEFT JOIN LATERAL unnest(regels.sporen) AS s ON true
  GROUP BY recept_id
)
SELECT r.id AS recept_id,
       COALESCE((
         SELECT array_agg(DISTINCT x ORDER BY x)
         FROM unnest(COALESCE(agg.uit_ingredienten, '{}'::public.allergen[]) || COALESCE(r.allergenen_extra, '{}'::public.allergen[])) AS x
         WHERE NOT (x = ANY (COALESCE(r.allergenen_uitgesloten, '{}'::public.allergen[])))
       ), '{}')::public.allergen[] AS allergenen,
       COALESCE(agg.uit_sporen, '{}')::public.allergen[] AS sporen,
       COALESCE(agg.onbekend_count, 0) AS onbekende_ingredienten,
       r.allergenen_notitie
FROM public.recipes r
LEFT JOIN agg ON agg.recept_id = r.id;

GRANT SELECT ON public.v_recept_allergenen TO authenticated;
GRANT ALL ON public.v_recept_allergenen TO service_role;