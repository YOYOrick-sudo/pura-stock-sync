-- Horeko-halfproducten naar de receptenlijst (Midsland en West).
-- Draait niet vanzelf op productie; dit bestand hoort bij de migratieketen.
--
-- Stand van de data op 6 nov 2026, ter controle na het draaien:
--   603 halfproducten, waarvan 12 al een recipe_id hadden.
--   5 hoog-zekere voorstellen worden aan een bestaand app-recept gekoppeld
--   (H489, H531, H295, H275, H294). H671 blijft aan Chimichurry mayo hangen.
--   De overige 586 halfproducten krijgen een nieuw recept.
--   Daarop horen 2286 ingredientregels mee te komen; 0 regels missen een naam.
--   14 van die regels hebben een bestaand app-artikel (ingredient_id).
--   19 Horeko-notities blijven in horeko_recept_regels: recept_ingredienten heeft geen notitiekolom.
--
-- Nieuwe recepten zijn herkenbaar aan description 'bron:horeko:<horeko_key>'.
-- Bestaande app-recepten, hun locaties en hun ingredienten blijven onaangeroerd.
-- Prijzen en kosten worden niet gelezen en niet geschreven.
-- Tweede run voegt niets opnieuw toe.

DO $import$
DECLARE
  v_user uuid;
  v_gekoppeld integer := 0;
  v_nieuw integer := 0;
  v_regels integer := 0;
  v_overgeslagen integer := 0;
BEGIN
  SELECT ur.user_id INTO v_user
  FROM public.user_roles ur
  WHERE ur.role = 'owner'
  ORDER BY ur.user_id
  LIMIT 1;

  IF v_user IS NULL THEN
    SELECT r.created_by INTO v_user
    FROM public.recipes r
    WHERE r.created_by IS NOT NULL
    ORDER BY r.created_at
    LIMIT 1;
  END IF;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Horeko-import: geen gebruiker voor recipes.created_by';
  END IF;

  -- Hoog-zekere voorstellen uit voorstel.csv. Alleen als het Horeko-record nog los staat
  -- en het app-recept bestaat. Een record dat al aan een ander recept hangt blijft staan.
  UPDATE public.horeko_recepten AS hr
  SET recipe_id = k.recipe_id
  FROM (
    VALUES
      ('H489'::text, '7a409516-6eea-4738-ae57-b09d01837c3a'::uuid), -- Eigen kruidenmix
      ('H531'::text, '67f38720-b3eb-4eea-8ff3-14b57772f93e'::uuid), -- Gochuang saus (archief)
      ('H295'::text, '97233afc-119a-4571-aab7-ff42362af828'::uuid), -- Hummus Harissa
      ('H275'::text, '7ecc0e96-978c-43d5-a937-0e5fe7efaae3'::uuid), -- Oesterzwam
      ('H294'::text, '0f618d0a-c508-4b74-88bc-636fd52d99e6'::uuid)  -- Zeewier algen mayonaise
  ) AS k(horeko_key, recipe_id)
  JOIN public.recipes AS bestaand ON bestaand.id = k.recipe_id
  WHERE hr.horeko_key = k.horeko_key
    AND hr.type = 'halfproduct'
    AND hr.recipe_id IS NULL;
  GET DIAGNOSTICS v_gekoppeld = ROW_COUNT;

  WITH nieuw AS (
    INSERT INTO public.recipes (
      name, category, type, porties, bereiding, tht_dagen,
      description, location, created_by, is_gearchiveerd
    )
    SELECT
      COALESCE(NULLIF(btrim(hr.naam), ''), hr.horeko_key),
      COALESCE(NULLIF(btrim(hr.map), ''), 'Horeko'),
      'halffabricaat',
      CASE
        WHEN hr.aantal_personen IS NOT NULL
         AND hr.aantal_personen = trunc(hr.aantal_personen)
         AND hr.aantal_personen BETWEEN 1 AND 100000
        THEN hr.aantal_personen::integer
      END,
      NULLIF(btrim(hr.bereiding), ''),
      CASE
        WHEN hr.dagen_houdbaar IS NOT NULL
         AND hr.dagen_houdbaar = trunc(hr.dagen_houdbaar)
         AND hr.dagen_houdbaar BETWEEN 0 AND 3650
        THEN hr.dagen_houdbaar::integer
        ELSE 3
      END,
      'bron:horeko:' || hr.horeko_key,
      NULL,
      v_user,
      false
    FROM public.horeko_recepten hr
    WHERE hr.type = 'halfproduct'
      AND hr.recipe_id IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.recipes r
        WHERE r.description = 'bron:horeko:' || hr.horeko_key
      )
    RETURNING id
  )
  SELECT count(*) INTO v_nieuw FROM nieuw;

  UPDATE public.horeko_recepten hr
  SET recipe_id = r.id
  FROM public.recipes r
  WHERE r.description = 'bron:horeko:' || hr.horeko_key
    AND hr.type = 'halfproduct'
    AND hr.recipe_id IS NULL;

  -- location NULL laat de bestaande seed-trigger beide vestigingen actief zetten.
  -- Deze insert dekt het geval dat die trigger ontbreekt, en wijzigt bestaande rijen niet.
  INSERT INTO public.recept_locaties (recept_id, vestiging, is_actief)
  SELECT r.id, v.vestiging, true
  FROM public.recipes r
  CROSS JOIN (VALUES ('West'), ('Midsland')) AS v(vestiging)
  WHERE r.description ~ '^bron:horeko:H[0-9]+$'
  ON CONFLICT (recept_id, vestiging) DO NOTHING;

  WITH bron AS (
    SELECT
      rec.id AS recept_id,
      CASE
        WHEN NULLIF(btrim(ha.naam), '') IS NOT NULL
         AND (
           NULLIF(btrim(r.regel), '') IS NULL
           OR position(lower(btrim(ha.naam)) IN lower(r.regel)) > 0
         )
          THEN btrim(ha.naam)
        WHEN NULLIF(btrim(comp.naam), '') IS NOT NULL
         AND (
           NULLIF(btrim(r.regel), '') IS NULL
           OR position(lower(btrim(comp.naam)) IN lower(r.regel)) > 0
         )
          THEN btrim(comp.naam)
        WHEN app.id IS NOT NULL
         AND NOT r.artikel_ontkoppeld
         AND NULLIF(btrim(app.naam), '') IS NOT NULL
         AND (
           NULLIF(btrim(r.regel), '') IS NULL
           OR position(lower(btrim(app.naam)) IN lower(r.regel)) > 0
         )
          THEN btrim(app.naam)
        ELSE NULLIF(btrim(r.regel), '')
      END AS naam,
      CASE
        WHEN r.hoeveelheid IS NULL THEN NULL
        ELSE trim_scale(r.hoeveelheid)::text
      END AS hoeveelheid,
      NULLIF(btrim(r.eenheid), '') AS eenheid,
      r.hoeveelheid AS hoeveelheid_num,
      e.id AS eenheid_id,
      CASE
        WHEN r.artikel_id IS NOT NULL AND NOT r.artikel_ontkoppeld AND app.id IS NOT NULL
        THEN r.artikel_id
      END AS ingredient_id,
      (row_number() OVER (
        PARTITION BY rec.id
        ORDER BY r.volgorde NULLS LAST, r.id
      ) - 1)::integer AS sort_order
    FROM public.horeko_recept_regels r
    JOIN public.horeko_recepten hr ON hr.horeko_key = r.recept_key
    JOIN public.recipes rec
      ON rec.id = hr.recipe_id
     AND rec.description = 'bron:horeko:' || hr.horeko_key
    LEFT JOIN public.artikelen app ON app.id = r.artikel_id
    LEFT JOIN public.horeko_artikelen ha ON ha.horeko_id = r.component_artikel_id
    LEFT JOIN public.horeko_recepten comp ON comp.horeko_key = r.component_recept_key
    LEFT JOIN LATERAL (
      SELECT e.id
      FROM public.eenheden e
      WHERE e.code = lower(btrim(r.eenheid))
      LIMIT 1
    ) e ON true
    WHERE hr.type = 'halfproduct'
  ),
  ingevoegd AS (
    INSERT INTO public.recept_ingredienten (
      recept_id, naam, hoeveelheid, eenheid, hoeveelheid_num, eenheid_id, ingredient_id, sort_order
    )
    SELECT
      b.recept_id, b.naam, b.hoeveelheid, b.eenheid, b.hoeveelheid_num,
      b.eenheid_id, b.ingredient_id, b.sort_order
    FROM bron b
    WHERE b.naam IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.recept_ingredienten ri
        WHERE ri.recept_id = b.recept_id
      )
    RETURNING 1
  )
  SELECT
    (SELECT count(*) FROM ingevoegd),
    (SELECT count(*) FROM bron WHERE naam IS NULL)
  INTO v_regels, v_overgeslagen;

  RAISE NOTICE
    'Horeko-halfproducten: % gekoppeld aan bestaand, % nieuwe recepten, % ingredientregels, % regels zonder naam',
    v_gekoppeld, v_nieuw, v_regels, v_overgeslagen;
END
$import$;
