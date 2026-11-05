-- Rollback van drizzle/migrations/0068_taak_vervolg_config.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
--
-- Haalt alleen de vervolg-instellingen weg. foh_tasks, horeko_artikelen
-- en bestel_signalen blijven onaangeroerd.

DROP FUNCTION IF EXISTS public.taak_vervolg_config_opslaan(text, text, text, text, text);
DROP TABLE IF EXISTS public.taak_vervolg_config;
