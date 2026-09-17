-- 1. Verzamelregels archiveren
UPDATE public.koelcel_check_items SET actief = false, updated_at = now()
WHERE vestiging = 'West' AND product_sleutel IN ('soepen-tom-yum-vissoep-', 'alle-sauzen');

-- 2. Soepen: eigen vriezerregels uit Midsland, koelcel vult uit de vriezer
INSERT INTO public.koelcel_check_items (vestiging, naam, doel_aantal, eenheid, type, plek, bron, volgorde, actief, product_sleutel)
VALUES
  ('West', 'Vissoep', 1, 'stuks', 'vriezer', 'vriezer', 'midsland', 400, true, 'vissoep'),
  ('West', 'Tom yum', 1, 'stuks', 'vriezer', 'vriezer', 'midsland', 401, true, 'tom-yum');

UPDATE public.koelcel_check_items SET bron = 'vriezer', updated_at = now()
WHERE vestiging = 'West' AND plek = 'koelcel' AND product_sleutel IN ('vissoep', 'tom-yum', 'kip', 'brioche');

-- 3. Mayonaises concreet: knoflook-kurkuma erbij
INSERT INTO public.koelcel_check_items (vestiging, naam, doel_aantal, eenheid, type, plek, bron, bak_maat, volgorde, actief, product_sleutel)
VALUES ('West', 'Knoflook-kurkumamayonaise', 1, 'bak', 'koelcel', 'koelcel', 'zelf_west', 'bak (maat nog bepalen)', 402, true, 'knoflook-kurkumamayonaise');

-- 4. Bloemkool wordt zelf gesneden in West
UPDATE public.koelcel_check_items SET bron = 'zelf_west', updated_at = now()
WHERE vestiging = 'West' AND product_sleutel = 'gesneden-bloemkool';

-- 5. Verse producten: koelwerkbank + koelcel
INSERT INTO public.koelcel_check_items (vestiging, naam, doel_aantal, eenheid, type, plek, bron, bak_maat, volgorde, actief, product_sleutel)
VALUES
  ('West', 'Gesneden paprika', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'volle midden 1/6', 410, true, 'gesneden-paprika'),
  ('West', 'Gesneden paprika', 1, 'stuks', 'koelcel', 'koelcel', 'zelf_west', 'paprika''s (aantal nog bepalen)', 411, true, 'gesneden-paprika'),

  ('West', 'Blauwe bessen', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'midden 1/6 halfvol', 412, true, 'blauwe-bessen'),
  ('West', 'Blauwe bessen', 2, 'pakjes', 'koelcel', 'koelcel', 'koelcel_inkoop', NULL, 413, true, 'blauwe-bessen'),

  ('West', 'Verse avocado''s', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'volle midden 1/6', 414, true, 'verse-avocados'),
  ('West', 'Verse avocado''s', 1, 'doos', 'koelcel', 'koelcel', 'koelcel_inkoop', NULL, 415, true, 'verse-avocados'),

  ('West', 'Granaatappelpitjes', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'volle midden 1/9', 416, true, 'granaatappelpitjes'),
  ('West', 'Granaatappels', 8, 'stuks', 'koelcel', 'koelcel', 'zelf_west', NULL, 417, true, 'granaatappelpitjes'),

  ('West', 'Rode peper', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'midden 1/9, 1/3 gevuld', 418, true, 'rode-peper'),
  ('West', 'Rode peper', 1, 'kilo', 'koelcel', 'koelcel', 'zelf_west', NULL, 419, true, 'rode-peper'),

  ('West', 'Zoetzure gember', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'volle midden 1/9', 420, true, 'zoetzure-gember'),
  ('West', 'Zoetzure gember', 1, 'zak', 'koelcel', 'koelcel', 'koelcel_inkoop', 'restant zak 1,5 kg', 421, true, 'zoetzure-gember'),

  ('West', 'Rode kool', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'volle 1/4', 422, true, 'rode-kool'),
  ('West', 'Rode kool', 1, 'zak', 'koelcel', 'koelcel', 'midsland', 'gevacumeerde zak', 423, true, 'rode-kool'),

  ('West', 'Aubergine', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'halfhoge 1/4', 424, true, 'aubergine'),
  ('West', 'Aubergine', 8, 'stuks', 'koelcel', 'koelcel', 'zelf_west', NULL, 425, true, 'aubergine'),

  ('West', 'Geroosterde groenten', 1, 'bak', 'koelcel', 'werkbank', 'koelcel_inkoop', 'halfhoge 1/4', 426, true, 'geroosterde-groenten'),
  ('West', 'Geroosterde groenten (paprika, courgette, venkel)', 4, 'stuks per soort', 'koelcel', 'koelcel', 'zelf_west', NULL, 427, true, 'geroosterde-groenten');