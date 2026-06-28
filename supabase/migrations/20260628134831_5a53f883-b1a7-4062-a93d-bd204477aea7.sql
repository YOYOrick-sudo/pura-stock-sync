
WITH renames(id, new_title) AS (VALUES
  ('e634d6e5-0fb9-4ed0-ba2b-0d90cf5f6ec1'::uuid, 'Smoothiepakken bijvullen in koeling'),
  ('fc20103a-adb3-4450-a29f-4374214e8c43'::uuid, 'Fruitlade in de koeling aanvullen'),
  ('c2e8c6ac-bb32-4baf-b429-fbc03c50c084'::uuid, 'Fruitlade in de vriezer aanvullen'),
  ('77b27b3a-36c2-4c43-a062-cbaf2933ea96'::uuid, 'Garneerfruit aanvullen (FIFO)'),
  ('7ad04ac4-8b20-4fe5-8be9-5606e29462c8'::uuid, 'Koffiebonen bijvullen in machine (hopper)'),
  ('5e0b3246-627f-4a97-b72d-151263a8d44a'::uuid, 'Shop: koffiebonen aanvullen (hoogste plank)'),
  ('69ff9dae-17d5-4f27-bedc-1f8a197aaded'::uuid, 'Limonadeflessen aanvullen — 1 reservefles per soort in koelcel'),
  ('fd8b8fff-99d5-44f8-9cae-78724a0f70ab'::uuid, 'Takeaway-bekers (koffie & smoothie) aanvullen'),
  ('f0c9c42a-1f95-4a9a-82ff-01402927bb39'::uuid, 'Bekers bij de bar bijvullen (koffie & smoothie)'),
  ('eec63516-a467-4242-ac42-e6080b367e7f'::uuid, 'Blenders & kannen handmatig afwassen'),
  ('13d4b96a-c327-4e8d-aecf-cf4a428870bf'::uuid, 'Juicer handmatig schoonmaken'),
  ('144e42f7-258e-42cc-b540-beda01c70986'::uuid, 'Juspersen schoonmaken'),
  ('5dcce6d2-74b9-4739-99e7-7fa88c917444'::uuid, 'Lades onder de bar schoonmaken'),
  ('12bde78b-6840-4b15-8719-f8baa8b2fbdb'::uuid, 'Dienbladen schoonmaken'),
  ('496e204d-432a-4c66-baf9-6f4ac17955fc'::uuid, 'Tangen zoet & hartig in de vaatwasser'),
  ('bb7ba01e-c8cd-486f-9e05-ece139b9b2f3'::uuid, 'Melkkannetjes in de vaat (binnenkant goed schoon)'),
  ('314ad021-7357-47c3-94f6-289837ed1beb'::uuid, 'Melkstation schoonmaken + rooster in de vaat'),
  ('da860e6a-fb0a-4a08-8f4b-6f839c849f5f'::uuid, 'Deksels op bakjes met voorgesneden fruit'),
  ('ce28c4de-5ebb-4f80-9a5a-3180114b1501'::uuid, 'Restwater uit karaf → bamboeplant'),
  ('a959e92c-742d-41b7-8bfb-14c0528af9d7'::uuid, 'Shop: zakjes & flesjes aanvullen (FIFO)'),
  ('2fd38db2-4e25-45f5-abc7-96352065752c'::uuid, 'Shop: zakjes naar voren schuiven'),
  ('27553bc7-3960-4d01-8302-7c8d8846c571'::uuid, 'Shop: shirts aanvullen (geen lege hangers)'),
  ('07ba26d6-f0e9-4b31-8624-5ffb6194d15c'::uuid, 'Terraskussens naar binnen'),
  ('f9a8e947-15bb-463c-bec4-a2f988d62ca0'::uuid, 'Terrasbakjes in grijze bak — naar binnen'),
  ('ac9d4c51-b243-4efc-be80-3b56d5247d9f'::uuid, 'Plantjes in grijze bak — naar binnen'),
  ('57381cd4-942a-403a-820d-f29f877268ca'::uuid, 'Stoepbord naar binnen'),
  ('6f397822-790f-4bef-9649-fe10095b1b5f'::uuid, 'Shop: shirts netjes ophangen (gelijk verdeeld over rek)')
)
UPDATE foh_daily_templates t SET title = r.new_title
FROM renames r WHERE t.id = r.id;

WITH renames(template_id, new_title) AS (VALUES
  ('e634d6e5-0fb9-4ed0-ba2b-0d90cf5f6ec1'::uuid, 'Smoothiepakken bijvullen in koeling'),
  ('fc20103a-adb3-4450-a29f-4374214e8c43'::uuid, 'Fruitlade in de koeling aanvullen'),
  ('c2e8c6ac-bb32-4baf-b429-fbc03c50c084'::uuid, 'Fruitlade in de vriezer aanvullen'),
  ('77b27b3a-36c2-4c43-a062-cbaf2933ea96'::uuid, 'Garneerfruit aanvullen (FIFO)'),
  ('7ad04ac4-8b20-4fe5-8be9-5606e29462c8'::uuid, 'Koffiebonen bijvullen in machine (hopper)'),
  ('5e0b3246-627f-4a97-b72d-151263a8d44a'::uuid, 'Shop: koffiebonen aanvullen (hoogste plank)'),
  ('69ff9dae-17d5-4f27-bedc-1f8a197aaded'::uuid, 'Limonadeflessen aanvullen — 1 reservefles per soort in koelcel'),
  ('fd8b8fff-99d5-44f8-9cae-78724a0f70ab'::uuid, 'Takeaway-bekers (koffie & smoothie) aanvullen'),
  ('f0c9c42a-1f95-4a9a-82ff-01402927bb39'::uuid, 'Bekers bij de bar bijvullen (koffie & smoothie)'),
  ('eec63516-a467-4242-ac42-e6080b367e7f'::uuid, 'Blenders & kannen handmatig afwassen'),
  ('13d4b96a-c327-4e8d-aecf-cf4a428870bf'::uuid, 'Juicer handmatig schoonmaken'),
  ('144e42f7-258e-42cc-b540-beda01c70986'::uuid, 'Juspersen schoonmaken'),
  ('5dcce6d2-74b9-4739-99e7-7fa88c917444'::uuid, 'Lades onder de bar schoonmaken'),
  ('12bde78b-6840-4b15-8719-f8baa8b2fbdb'::uuid, 'Dienbladen schoonmaken'),
  ('496e204d-432a-4c66-baf9-6f4ac17955fc'::uuid, 'Tangen zoet & hartig in de vaatwasser'),
  ('bb7ba01e-c8cd-486f-9e05-ece139b9b2f3'::uuid, 'Melkkannetjes in de vaat (binnenkant goed schoon)'),
  ('314ad021-7357-47c3-94f6-289837ed1beb'::uuid, 'Melkstation schoonmaken + rooster in de vaat'),
  ('da860e6a-fb0a-4a08-8f4b-6f839c849f5f'::uuid, 'Deksels op bakjes met voorgesneden fruit'),
  ('ce28c4de-5ebb-4f80-9a5a-3180114b1501'::uuid, 'Restwater uit karaf → bamboeplant'),
  ('a959e92c-742d-41b7-8bfb-14c0528af9d7'::uuid, 'Shop: zakjes & flesjes aanvullen (FIFO)'),
  ('2fd38db2-4e25-45f5-abc7-96352065752c'::uuid, 'Shop: zakjes naar voren schuiven'),
  ('27553bc7-3960-4d01-8302-7c8d8846c571'::uuid, 'Shop: shirts aanvullen (geen lege hangers)'),
  ('07ba26d6-f0e9-4b31-8624-5ffb6194d15c'::uuid, 'Terraskussens naar binnen'),
  ('f9a8e947-15bb-463c-bec4-a2f988d62ca0'::uuid, 'Terrasbakjes in grijze bak — naar binnen'),
  ('ac9d4c51-b243-4efc-be80-3b56d5247d9f'::uuid, 'Plantjes in grijze bak — naar binnen'),
  ('57381cd4-942a-403a-820d-f29f877268ca'::uuid, 'Stoepbord naar binnen'),
  ('6f397822-790f-4bef-9649-fe10095b1b5f'::uuid, 'Shop: shirts netjes ophangen (gelijk verdeeld over rek)')
)
UPDATE foh_tasks ft SET title = r.new_title
FROM renames r
WHERE ft.template_id = r.template_id
  AND ft.location = 'West'
  AND ft.phase = 'sluit'
  AND ft.department = 'voorkant'
  AND ft.due_date = (now() AT TIME ZONE 'Europe/Amsterdam')::date
  AND ft.archived = false;
