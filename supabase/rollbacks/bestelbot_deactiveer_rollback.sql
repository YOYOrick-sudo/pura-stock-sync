-- Draait supabase/migrations/20261113210000_bestelbot_deactiveer.sql terug.
-- Verwijdert alleen de nieuwe functie en de twee nieuwe kolommen.
-- Bestaande rijen, statussen en leesfuncties blijven staan.
-- Niet uitvoeren tegen Supabase tenzij je deze route bewust terugdraait.

DROP FUNCTION IF EXISTS public.bestelbot_deactiveer(text, uuid[], text);

ALTER TABLE public.bestel_signalen DROP COLUMN IF EXISTS deactivatie_reden;
ALTER TABLE public.bestel_signalen DROP COLUMN IF EXISTS gedeactiveerd_op;
