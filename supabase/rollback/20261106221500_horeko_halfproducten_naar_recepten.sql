-- Rollback van supabase/migrations/20261106221500_horeko_halfproducten_naar_recepten.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
--
-- Haalt alleen weg wat die migratie toevoegde:
--   recepten met description 'bron:horeko:H<nummer>', inclusief hun ingredienten,
--   locaties, stappen, methodes en mep-planning die aan díe recepten hangen
--   (de laatste twee via de bestaande ON DELETE CASCADE, hier expliciet vooraf);
--   de vijf hoog-zekere koppelingen, alleen zolang ze nog naar het toen gekozen app-recept wijzen.
--
-- Bestaande app-recepten blijven staan. Prijzen worden niet aangeraakt.
-- print_jobs, artikelen, mep_taken, mep_templates, productie_batches en interne_producten
-- verliezen hoogstens de verwijzing (ON DELETE SET NULL) en worden niet verwijderd.
-- Als iemand de description van een geïmporteerd recept heeft gewijzigd, herkent
-- dit script dat recept niet meer en laat het staan.

BEGIN;

UPDATE public.horeko_recepten
SET recipe_id = NULL
WHERE (horeko_key, recipe_id) IN (
  ('H489', '7a409516-6eea-4738-ae57-b09d01837c3a'),
  ('H531', '67f38720-b3eb-4eea-8ff3-14b57772f93e'),
  ('H295', '97233afc-119a-4571-aab7-ff42362af828'),
  ('H275', '7ecc0e96-978c-43d5-a937-0e5fe7efaae3'),
  ('H294', '0f618d0a-c508-4b74-88bc-636fd52d99e6')
);

UPDATE public.horeko_recepten hr
SET recipe_id = NULL
FROM public.recipes r
WHERE hr.recipe_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.recept_ingredienten ri
USING public.recipes r
WHERE ri.recept_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.recept_locaties rl
USING public.recipes r
WHERE rl.recept_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.recipe_steps rs
USING public.recipes r
WHERE rs.recipe_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.halffabricaat_methodes m
USING public.recipes r
WHERE m.recept_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.mep_planning p
USING public.recipes r
WHERE p.recipe_id = r.id
  AND r.description ~ '^bron:horeko:H[0-9]+$';

DELETE FROM public.recipes
WHERE description ~ '^bron:horeko:H[0-9]+$';

COMMIT;
