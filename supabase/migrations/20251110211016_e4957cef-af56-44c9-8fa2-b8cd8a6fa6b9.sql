-- Update the trigger function to allow inserts without user context
CREATE OR REPLACE FUNCTION public.foh_enforce_location_employees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_location text;
BEGIN
  -- Get user's location if authenticated
  user_location := public.current_user_location();
  
  -- If user is authenticated, enforce their location
  IF user_location IS NOT NULL THEN
    NEW.location := user_location;
  END IF;
  
  -- If no user and no location provided, then fail
  IF NEW.location IS NULL THEN
    RAISE EXCEPTION 'Location must be provided';
  END IF;
  
  RETURN NEW;
END $function$;

-- Now insert the 38 Midsland Open templates
INSERT INTO public.foh_daily_templates (title, location, phase, repeat_type, priority)
VALUES
('Inklokken: bevestig je check-in', 'Midsland', 'open', 'daily', 2),
('Lichten aan serre wc bar terras rode lampje foodbar', 'Midsland', 'open', 'daily', 2),
('Glazenspoelmachine starten', 'Midsland', 'open', 'daily', 2),
('Sopje maken warm water + afwasmiddel bij koffie apparaat', 'Midsland', 'open', 'daily', 2),
('Terras + vlonder vegen', 'Midsland', 'open', 'daily', 2),
('Kussens neerleggen banken', 'Midsland', 'open', 'daily', 2),
('Buiten tafels schoonmaken', 'Midsland', 'open', 'daily', 2),
('Kaarten in houders op tafel', 'Midsland', 'open', 'daily', 2),
('Straatbord neerzetten', 'Midsland', 'open', 'daily', 2),
('Hondenwaterbak vullen neerzetten', 'Midsland', 'open', 'daily', 2),
('Terras indeling check volgens lightspeed', 'Midsland', 'open', 'daily', 2),
('Terras gezellig en netjes', 'Midsland', 'open', 'daily', 2),
('Lichten wijnklima en friskoeling aan', 'Midsland', 'open', 'daily', 2),
('Koffiemolens en puqpress aan', 'Midsland', 'open', 'daily', 2),
('Spoelbak vullen met water + glansblokje', 'Midsland', 'open', 'daily', 2),
('Wasbak cocktailbar vullen', 'Midsland', 'open', 'daily', 2),
('Siropen suikerwater citroensap aquafaba espresso klaarzetten', 'Midsland', 'open', 'daily', 2),
('Garnituren halve bakjes FIFO', 'Midsland', 'open', 'daily', 2),
('Smoothiecorner check voorraad', 'Midsland', 'open', 'daily', 2),
('Smoothies check houdbaarheid en bijmaken', 'Midsland', 'open', 'daily', 2),
('Ijsblokjes in voorste bak', 'Midsland', 'open', 'daily', 2),
('Crushed ice a la minute klaarzetten', 'Midsland', 'open', 'daily', 2),
('Slagroom check en bijvullen', 'Midsland', 'open', 'daily', 2),
('Toiletten check schoon + papier + handdoekjes + zeep', 'Midsland', 'open', 'daily', 2),
('Stofzuigen en dweilen toiletten en serre', 'Midsland', 'open', 'daily', 2),
('Kassa en wisselkassa tellen mail administratie@puravidafoodbar.nl', 'Midsland', 'open', 'daily', 2),
('Muziek aan vanaf 10:00', 'Midsland', 'open', 'daily', 2),
('Kaarsjes aan vanaf 10:00', 'Midsland', 'open', 'daily', 2),
('Whiteboard updaten na overleg keuken', 'Midsland', 'open', 'daily', 2),
('Wiebel tafels fix schroefjes aandraaien', 'Midsland', 'open', 'daily', 2),
('Stoelen aanvullen max per tafel volgens Zenchef', 'Midsland', 'open', 'daily', 2),
('Voordeur raam schoon + openingstijden check', 'Midsland', 'open', 'daily', 2),
('Planten water geven woensdag', 'Midsland', 'open', 'daily', 2),
('Plantenwand spray dagelijks', 'Midsland', 'open', 'daily', 2),
('Was check ophangen opvouwen machine', 'Midsland', 'open', 'daily', 2),
('Mailbox controleren shiftleader', 'Midsland', 'open', 'daily', 2),
('Whiteboard klopt met actuele voorraad', 'Midsland', 'open', 'daily', 2),
('Voordeur schoon en openingstijden correct', 'Midsland', 'open', 'daily', 2);