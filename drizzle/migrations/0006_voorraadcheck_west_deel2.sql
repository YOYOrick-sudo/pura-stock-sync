-- Deel 2 van de West-productlijst: spreads, mayonaises en eieren

-- Bestaande regels bijwerken
UPDATE public.koelcel_check_items
SET doel_aantal = 2, doel_aantal_druk = 3, bak_maat = 'hoge 1/9e', bron = 'koelcel_inkoop'
WHERE vestiging = 'West' AND plek = 'werkbank' AND product_sleutel = 'avocado-spread';

UPDATE public.koelcel_check_items
SET doel_aantal = 2, doel_aantal_druk = 3, bak_maat = 'hoge 1/9e'
WHERE vestiging = 'West' AND plek = 'werkbank' AND product_sleutel = 'kokosyoghurt';

UPDATE public.koelcel_check_items
SET doel_aantal = 1, doel_aantal_druk = 2, bak_maat = 'midden 1/9e'
WHERE vestiging = 'West' AND plek = 'werkbank' AND product_sleutel = 'tomatenrelish';

INSERT INTO public.koelcel_check_items
  (vestiging, naam, doel_aantal, doel_aantal_druk, eenheid, type, plek, bron, bak_maat, volgorde, actief, product_sleutel)
VALUES
  -- Koelwerkbank
  ('West', 'Gekookte eieren (bio)', 1, 2, 'stuks', 'koelcel', 'werkbank', 'zelf_west', 'hoge 1/6', 200, true, 'gekookte-eieren'),
  ('West', 'Eimengsel (scrambled eggs)', 1, 2, 'stuks', 'koelcel', 'werkbank', 'zelf_west', 'midden 1/3', 205, true, 'eimengsel'),
  ('West', 'Tomatenjam', 2, 3, 'stuks', 'koelcel', 'werkbank', 'midsland', 'midden 1/9e', 210, true, 'tomatenjam'),
  ('West', 'Wortelspread', 1, 2, 'stuks', 'koelcel', 'werkbank', 'midsland', 'midden 1/9e', 215, true, 'wortelspread'),
  ('West', 'Chimichurrimayonaise', 2, 3, 'stuks', 'koelcel', 'werkbank', 'zelf_west', 'midden 1/9e', 220, true, 'chimichurrimayonaise'),
  ('West', 'Zeewier-algenmayonaise', 2, 3, 'stuks', 'koelcel', 'werkbank', 'zelf_west', 'midden 1/9e', 225, true, 'zeewiermayonaise'),
  ('West', 'Vegan roomkaas', 1, 2, 'stuks', 'koelcel', 'werkbank', 'koelcel_inkoop', 'midden 1/9e', 230, true, 'vegan-roomkaas'),
  ('West', 'Hummus', 1, 2, 'stuks', 'koelcel', 'werkbank', 'zelf_west', 'midden 1/9e', 235, true, 'hummus'),

  -- Koelcel
  ('West', 'Avocado spread', 1, 2, 'pot', 'koelcel', 'koelcel', 'vriezer', 'pot', 200, true, 'avocado-spread'),
  ('West', 'Kokosyoghurt', 6, 8, 'pakken', 'koelcel', 'koelcel', 'koelcel_inkoop', 'pak', 205, true, 'kokosyoghurt'),
  ('West', 'Tomatenrelish', 1, 2, 'pakje', 'koelcel', 'koelcel', 'vriezer', 'gevacumeerd pakje', 210, true, 'tomatenrelish'),
  ('West', 'Tomatenjam', 1, 2, 'pakje', 'koelcel', 'koelcel', 'vriezer', 'gevacumeerd pakje', 215, true, 'tomatenjam'),
  ('West', 'Wortelspread', 1, 2, 'zakje', 'koelcel', 'koelcel', 'vriezer', 'gevacumeerd zakje', 220, true, 'wortelspread'),
  ('West', 'Chimichurrimayonaise', 1, 2, 'bak', 'koelcel', 'koelcel', 'zelf_west', 'bak (maat nog bepalen)', 225, true, 'chimichurrimayonaise'),
  ('West', 'Zeewier-algenmayonaise', 1, 2, 'bak', 'koelcel', 'koelcel', 'zelf_west', 'bak (maat nog bepalen)', 230, true, 'zeewiermayonaise'),
  ('West', 'Vegan roomkaas', 2, 3, 'potten', 'koelcel', 'koelcel', 'koelcel_inkoop', 'pot', 235, true, 'vegan-roomkaas'),
  ('West', 'Hummus', 1, 2, 'zakje', 'koelcel', 'koelcel', 'zelf_west', 'gevacumeerd zakje', 240, true, 'hummus'),

  -- Vriescel
  ('West', 'Avocado spread', 1, 2, 'stuks', 'vriezer', 'vriezer', 'koelcel_inkoop', NULL, 200, true, 'avocado-spread'),
  ('West', 'Tomatenrelish', 1, 2, 'stuks', 'vriezer', 'vriezer', 'midsland', NULL, 205, true, 'tomatenrelish'),
  ('West', 'Tomatenjam', 1, 2, 'stuks', 'vriezer', 'vriezer', 'midsland', NULL, 210, true, 'tomatenjam'),
  ('West', 'Wortelspread', 1, 2, 'stuks', 'vriezer', 'vriezer', 'midsland', NULL, 215, true, 'wortelspread'),
  ('West', 'Zeewier (voor mayonaise)', 1, 2, 'stuks', 'vriezer', 'vriezer', 'koelcel_inkoop', NULL, 220, true, 'zeewier');
