-- Pas de trigger aan om expliciete location toe te staan tijdens migrations
CREATE OR REPLACE FUNCTION public.foh_enforce_location_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_location text;
BEGIN
  -- Probeer location op basis van user's role te krijgen
  user_location := public.current_user_location();
  
  -- Als er een user location is, forceer die
  IF user_location IS NOT NULL THEN
    NEW.location := user_location;
  END IF;
  
  -- Valideer dat er nu een location is (ofwel van user, ofwel expliciet meegegeven)
  IF NEW.location IS NULL THEN
    RAISE EXCEPTION 'Location must be provided';
  END IF;
  
  RETURN NEW;
END $function$;

-- Nu de voorbeeldtaken toevoegen
INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Bar openen en gereedmaken', 'open', 'Bar', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Bar openen en gereedmaken' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Terras tafels en stoelen uitklappen', 'open', 'Terras', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Terras tafels en stoelen uitklappen' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Kassa opstarten', 'open', 'Algemeen', 'Midsland', CURRENT_DATE, false, false, 1
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Kassa opstarten' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Toiletten ochtendcontrole', 'open', 'Toilet', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Toiletten ochtendcontrole' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Bar aanvullen na lunch', 'tussen', 'Bar', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Bar aanvullen na lunch' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Terras opruimen en resetten', 'tussen', 'Terras', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Terras opruimen en resetten' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Voorraadcheck uitvoeren', 'tussen', 'Keuken', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Voorraadcheck uitvoeren' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Bar afsluiten en eindschoonmaak', 'sluit', 'Bar', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Bar afsluiten en eindschoonmaak' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Terras binnenhalen en opbergen', 'sluit', 'Terras', 'Midsland', CURRENT_DATE, false, false, 1
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Terras binnenhalen en opbergen' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Kassa afsluiten en kasopmaak', 'sluit', 'Algemeen', 'Midsland', CURRENT_DATE, false, false, 1
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Kassa afsluiten en kasopmaak' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Toiletten eindcontrole', 'sluit', 'Toilet', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Toiletten eindcontrole' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Wijnvoorraad controleren en bijbestellen', NULL, 'Bar', 'Midsland', CURRENT_DATE, false, false, 1
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Wijnvoorraad controleren en bijbestellen' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Menukaarten controleren op slijtage', NULL, 'Algemeen', 'Midsland', CURRENT_DATE + INTERVAL '3 days', false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Menukaarten controleren op slijtage' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE + INTERVAL '3 days'
);

INSERT INTO foh_tasks (title, phase, category, location, due_date, completed, archived, priority)
SELECT 'Reserveringsboek doornemen', NULL, 'Algemeen', 'Midsland', CURRENT_DATE, false, false, 2
WHERE NOT EXISTS (
  SELECT 1 FROM foh_tasks 
  WHERE title = 'Reserveringsboek doornemen' 
  AND location = 'Midsland' 
  AND due_date = CURRENT_DATE
);