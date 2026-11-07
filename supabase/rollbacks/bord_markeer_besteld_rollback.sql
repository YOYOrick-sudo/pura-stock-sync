-- Draait supabase/migrations/20261107120000_bord_markeer_besteld.sql terug.
-- Alleen de portalfunctie. bestelbot_markeer_besteld en bestel_signalen blijven staan.
-- Niet uitvoeren tegen Supabase tenzij je deze route bewust terugdraait.

DROP FUNCTION IF EXISTS public.bord_markeer_besteld(text, jsonb);
