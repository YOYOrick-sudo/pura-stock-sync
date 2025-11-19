-- Drop existing category check constraints
ALTER TABLE public.foh_daily_templates 
DROP CONSTRAINT IF EXISTS foh_daily_templates_category_check;

ALTER TABLE public.foh_tasks 
DROP CONSTRAINT IF EXISTS foh_tasks_category_check;

-- Add sort_order column to foh_daily_templates
ALTER TABLE public.foh_daily_templates 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Add sort_order column to foh_tasks
ALTER TABLE public.foh_tasks 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_foh_tasks_sort_order 
ON public.foh_tasks(location, phase, sort_order);

-- Delete existing 'open' phase templates for Midsland
DELETE FROM public.foh_daily_templates 
WHERE location = 'Midsland' 
AND phase = 'open';

-- Insert 34 new tasks with exact order
-- DEEL 1 (1-13)
INSERT INTO public.foh_daily_templates (location, phase, category, title, priority, repeat_type, estimated_minutes, sort_order) VALUES
('Midsland', 'open', 'Deel 1', 'Inklokken: bevestig je check-in', 2, 'daily', 2, 1),
('Midsland', 'open', 'Deel 1', 'Lichten aan: serre, wc, bar, terras onder luifel, rode foodbar-lampje', 2, 'daily', 3, 2),
('Midsland', 'open', 'Deel 1', 'Glazenspoelmachine starten', 2, 'daily', 2, 3),
('Midsland', 'open', 'Deel 1', 'Lichten aan van wijnklimaatkast en friskoeling', 2, 'daily', 2, 4),
('Midsland', 'open', 'Deel 1', 'Koffiemolens en puqpress aanzetten', 2, 'daily', 2, 5),
('Midsland', 'open', 'Deel 1', 'Spoelbak vullen met water + glansspoelblokje', 2, 'daily', 3, 6),
('Midsland', 'open', 'Deel 1', 'Cocktailbar-wasbak vullen', 2, 'daily', 2, 7),
('Midsland', 'open', 'Deel 1', 'Sopje maken (warm water + afwasmiddel bij koffieapparaat)', 2, 'daily', 3, 8),
('Midsland', 'open', 'Deel 1', 'Suikerwater, citroensap, aquafaba, espressoshots, siropen klaarzetten', 2, 'daily', 5, 9),
('Midsland', 'open', 'Deel 1', 'Bakjes met garnituren uit de koeling halen en in bar plaatsen', 2, 'daily', 3, 10),
('Midsland', 'open', 'Deel 1', 'Terras kussens op de banken leggen', 2, 'daily', 5, 11),
('Midsland', 'open', 'Deel 1', 'Straatbord buiten zetten (overkant)', 2, 'daily', 2, 12),
('Midsland', 'open', 'Deel 1', 'Gevulde hondenwaterbak neerzetten bij de ingang + buitenomgeving netjes maken', 2, 'daily', 5, 13),

-- DEEL 2 (14-21)
('Midsland', 'open', 'Deel 2', 'Stofzuigen & dweilen: toiletten → serre → binnen → voorportaal', 2, 'daily', 15, 14),
('Midsland', 'open', 'Deel 2', 'Toiletten checken: schoon, papier, handdoekjes, zeep', 2, 'daily', 5, 15),
('Midsland', 'open', 'Deel 2', 'Tafels aanvullen met stoelen (volgens Zenchef)', 2, 'daily', 10, 16),
('Midsland', 'open', 'Deel 2', 'Wiebelende tafels fixen (schroefjes aandraaien)', 2, 'daily', 5, 17),
('Midsland', 'open', 'Deel 2', 'Kassatellen, via de Pura app', 2, 'daily', 10, 18),
('Midsland', 'open', 'Deel 2', 'Kaarsjes aan vanaf 10:00', 2, 'daily', 3, 19),
('Midsland', 'open', 'Deel 2', 'Smoothiecorner checken (fruit, diepvriesfruit, OJ, kokosmelk)', 2, 'daily', 5, 20),
('Midsland', 'open', 'Deel 2', 'Smoothies checken op houdbaarheid en bijmaken (1 kan op voorraad)', 2, 'daily', 8, 21),

-- DEEL 3 (22-34)
('Midsland', 'open', 'Deel 3', 'IJsblokjes in de voorste bak (klein laagje)', 2, 'daily', 3, 22),
('Midsland', 'open', 'Deel 3', 'Crushed ice bak vullen 1/3e vol', 2, 'daily', 3, 23),
('Midsland', 'open', 'Deel 3', 'Slagroom checken', 2, 'daily', 2, 24),
('Midsland', 'open', 'Deel 3', 'Smoothies in crushed ice plaatsen (van elk 1)', 2, 'daily', 3, 25),
('Midsland', 'open', 'Deel 3', 'Muziek aan vanaf 10:00 (Sonos → Pura daglijst)', 2, 'daily', 2, 26),
('Midsland', 'open', 'Deel 3', 'Voordeurraam schoonmaken + openingstijden checken', 2, 'daily', 5, 27),
('Midsland', 'open', 'Deel 3', 'Terras + vlonder vegen', 2, 'daily', 8, 28),
('Midsland', 'open', 'Deel 3', 'Whiteboard check: klopt actuele voorraad?', 2, 'daily', 3, 29),
('Midsland', 'open', 'Deel 3', 'Mailbox controleren', 2, 'daily', 5, 30),
('Midsland', 'open', 'Deel 3', 'Bar-garnering snijden (FIFO) – passievrucht, munt, gember, limoenpartjes, citroenschijfjes, sinaasappelschijfjes', 2, 'daily', 12, 31),
('Midsland', 'open', 'Deel 3', 'Plantenwand sproeien (elke dag)', 2, 'daily', 3, 32),
('Midsland', 'open', 'Deel 3', 'Was checken: ophangen, opvouwen, wasmachine aanzetten', 2, 'daily', 8, 33),
('Midsland', 'open', 'Deel 3', 'Periodieke taken checken en overdracht check in Pura app', 2, 'daily', 5, 34);