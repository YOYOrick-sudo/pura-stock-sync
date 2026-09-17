-- Deel 3: zoet uit Midsland (koelcel <- vriescel <- bestellijst Midsland)

INSERT INTO public.koelcel_check_items
  (vestiging, naam, doel_aantal, doel_aantal_druk, eenheid, type, plek, bron, bak_maat, volgorde, actief, product_sleutel)
VALUES
  -- Koelcel (aangevuld uit de vriescel)
  ('West', 'Wortel-walnoot', 3, 4, 'bakken', 'koelcel', 'koelcel', 'vriezer', 'bak', 300, true, 'wortel-walnoot'),
  ('West', 'Sinaasappelcheesecake', 2, 3, 'bakken', 'koelcel', 'koelcel', 'vriezer', 'bak', 305, true, 'sinaasappelcheesecake'),
  ('West', 'Notenbar', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 310, true, 'notenbar'),
  ('West', 'Bananencake', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 315, true, 'bananencake'),
  ('West', 'Koffiebrownie', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 320, true, 'koffiebrownie'),
  ('West', 'Kleine kokosmakroon', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 325, true, 'kokosmakroon'),
  ('West', 'Witte chocolade-kokos', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 330, true, 'witte-chocolade-kokos'),
  ('West', 'Muffin vanille-wortel-kaneel', 6, 8, 'stuks', 'koelcel', 'koelcel', 'vriezer', NULL, 335, true, 'muffin-wortel-kaneel'),
  ('West', 'Muffin banaan-amandel', 6, 8, 'stuks', 'koelcel', 'koelcel', 'vriezer', NULL, 340, true, 'muffin-banaan-amandel'),
  ('West', 'Appeltaart (special)', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 345, true, 'appeltaart'),
  ('West', 'Madeleine (special)', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 350, true, 'madeleine'),
  ('West', 'Vegan boterkoek (special)', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 355, true, 'vegan-boterkoek'),
  ('West', 'Choco bounty (special)', 1, 2, 'bak', 'koelcel', 'koelcel', 'vriezer', 'bak', 360, true, 'choco-bounty'),

  -- Vriescel (aangevuld vanuit Midsland)
  ('West', 'Wortel-walnoot', 6, 8, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 300, true, 'wortel-walnoot'),
  ('West', 'Sinaasappelcheesecake', 6, 8, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 305, true, 'sinaasappelcheesecake'),
  ('West', 'Notenbar', 5, 6, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 310, true, 'notenbar'),
  ('West', 'Bananencake', 6, 8, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 315, true, 'bananencake'),
  ('West', 'Koffiebrownie', 2, 3, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 320, true, 'koffiebrownie'),
  ('West', 'Kleine kokosmakroon', 4, 6, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 325, true, 'kokosmakroon'),
  ('West', 'Witte chocolade-kokos', 3, 4, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 330, true, 'witte-chocolade-kokos'),
  ('West', 'Muffin vanille-wortel-kaneel', 2, 4, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 335, true, 'muffin-wortel-kaneel'),
  ('West', 'Muffin banaan-amandel', 2, 4, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 340, true, 'muffin-banaan-amandel'),
  ('West', 'Appeltaart (special)', 4, 6, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 345, true, 'appeltaart'),
  ('West', 'Madeleine (special)', 2, 3, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 350, true, 'madeleine'),
  ('West', 'Vegan boterkoek (special)', 2, 3, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 355, true, 'vegan-boterkoek'),
  ('West', 'Choco bounty (special)', 4, 6, 'bakken', 'vriezer', 'vriezer', 'midsland', 'bak', 360, true, 'choco-bounty');

-- Bananencake op de werkbank aan dezelfde keten koppelen (werkbank -> koelcel -> vriescel -> Midsland)
UPDATE public.koelcel_check_items
SET product_sleutel = 'bananencake'
WHERE vestiging = 'West' AND plek = 'werkbank' AND product_sleutel = 'bananencake';
