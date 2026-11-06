-- Draait supabase/migrations/20261105220000_interne_levering_v2.sql terug.
-- Alleen de objecten van interne levering v2. v1, foh_tasks, horeko_artikelen
-- en bestel_signalen blijven staan.
-- Niet uitvoeren tegen Supabase tenzij je deze route bewust terugdraait.

DROP TRIGGER IF EXISTS interne_aanvraag_updated_at ON public.interne_aanvraag;
DROP POLICY IF EXISTS interne_aanvraag_lezen ON public.interne_aanvraag;

DROP FUNCTION IF EXISTS public.interne_v2_annuleren(text, uuid, numeric);
DROP FUNCTION IF EXISTS public.interne_v2_ontvangen(text, uuid, numeric, text);
DROP FUNCTION IF EXISTS public.interne_v2_mep_klaar(text, uuid, numeric);
DROP FUNCTION IF EXISTS public.interne_v2_meegegeven(text, uuid, numeric);
DROP FUNCTION IF EXISTS public.interne_v2_klaarzetten(text, uuid, numeric, date, boolean);
DROP FUNCTION IF EXISTS public.interne_v2_inplannen(text, uuid, date, numeric, date);
DROP FUNCTION IF EXISTS public.interne_v2_lezen(text, text);
DROP FUNCTION IF EXISTS public.interne_v2_koppelen(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.interne_v2_plaatsen(text, uuid, text, numeric, text, date, text, text);
DROP FUNCTION IF EXISTS public.interne_v2_product_opslaan(text, uuid, text, numeric, text, numeric, boolean);
DROP FUNCTION IF EXISTS public.interne_v2_producten_beheer(text);
DROP FUNCTION IF EXISTS public.interne_v2_artikelen_zoeken(text, text);
DROP FUNCTION IF EXISTS public.interne_v2_producten_lijst(text);
DROP FUNCTION IF EXISTS public.interne_v2_json(uuid);
DROP FUNCTION IF EXISTS public.interne_v2_pak(text, uuid);
DROP FUNCTION IF EXISTS public.interne_v2_zet_status(uuid);
DROP FUNCTION IF EXISTS public.interne_v2_eis_vestiging(text);
DROP FUNCTION IF EXISTS public.interne_v2_eis_rol(boolean);
DROP FUNCTION IF EXISTS public.interne_v2_status_van(boolean, numeric, numeric, numeric, numeric, numeric, boolean);

DROP TABLE IF EXISTS public.interne_aanvraag;

ALTER TABLE public.interne_producten DROP COLUMN IF EXISTS v2_beschikbaar;

DELETE FROM public.fase2_vlag WHERE vlag = 'interne_levering_v2';

-- FIX Programmeerbot 5-11: check terug naar de stand van voor v2 (na het wissen van de v2-rijen).
ALTER TABLE public.fase2_vlag DROP CONSTRAINT IF EXISTS fase2_vlag_vlag_check;
ALTER TABLE public.fase2_vlag ADD CONSTRAINT fase2_vlag_vlag_check
  CHECK (vlag = ANY (ARRAY['ontvangst_v2'::text, 'keukenadvies'::text, 'leverancier_kiezen'::text, 'interne_levering'::text]));
