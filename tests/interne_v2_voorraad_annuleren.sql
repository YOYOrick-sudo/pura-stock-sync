-- Lokale proef van 0069. Draait in één transactie en eindigt met ROLLBACK.
-- Niet tegen de echte database draaien.
\set ON_ERROR_STOP on
BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql AS $$ SELECT '11111111-1111-4111-8111-111111111111'::uuid $$;

CREATE TABLE public.fase2_vlag (
  vestiging text NOT NULL,
  vlag text NOT NULL,
  aan boolean NOT NULL
);

CREATE OR REPLACE FUNCTION public.fase2_mag_vestiging(_uid uuid, _vestiging text) RETURNS boolean
LANGUAGE sql AS $$ SELECT true $$;

CREATE TABLE public.interne_aanvraag (
  id uuid PRIMARY KEY,
  van_vestiging text NOT NULL DEFAULT 'Midsland',
  naar_vestiging text NOT NULL DEFAULT 'West',
  proef boolean NOT NULL DEFAULT false,
  product_id uuid,
  artikel_id uuid,
  vrije_naam text,
  besteld_aantal numeric NOT NULL,
  eenheid text NOT NULL,
  mep_taak_id uuid,
  mep_aantal numeric NOT NULL DEFAULT 0,
  mep_klaar_aantal numeric NOT NULL DEFAULT 0,
  meegegeven_aantal numeric NOT NULL DEFAULT 0,
  ontvangen_aantal numeric NOT NULL DEFAULT 0,
  ontvangen_op timestamptz,
  ontvangen_door uuid,
  ontvangst_opmerking text,
  ontvangst_regel_id uuid,
  geannuleerd_aantal numeric NOT NULL DEFAULT 0,
  geannuleerd_op timestamptz,
  geannuleerd_door uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interne_producten (
  id uuid PRIMARY KEY,
  naam text NOT NULL,
  artikel_id uuid,
  inhoud_per_eenheid numeric,
  inhoud_eenheid text
);

CREATE TABLE public.leveranciers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.keuken_telartikel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  bron_vestiging text NOT NULL,
  artikel_id uuid NOT NULL,
  basis_eenheid text NOT NULL,
  actief boolean NOT NULL DEFAULT true
);

CREATE TABLE public.mep_taken (
  id uuid PRIMARY KEY,
  doel_aantal numeric,
  status text NOT NULL DEFAULT 'open',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ontvangst_regel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sleutel text NOT NULL UNIQUE,
  vestiging text NOT NULL,
  bron_vestiging text NOT NULL,
  levering_id uuid NOT NULL,
  leverancier_id uuid,
  artikel_id uuid,
  omschrijving text NOT NULL,
  aantal numeric NOT NULL,
  besteld_aantal numeric,
  eenheid text,
  inhoud_per_verpakking numeric,
  basis_eenheid text,
  uitkomst text NOT NULL,
  ontvangen_op date NOT NULL,
  bron text NOT NULL,
  opmerking text,
  geregistreerd_door uuid,
  geregistreerd_op timestamptz NOT NULL DEFAULT now(),
  vervallen_op timestamptz,
  telt_voorraad boolean GENERATED ALWAYS AS (
    uitkomst = ANY (ARRAY['binnen'::text, 'ander_product'::text])
  ) STORED
);

CREATE OR REPLACE FUNCTION public.interne_v2_pak(p_vestiging text, p_id uuid)
RETURNS public.interne_aanvraag
LANGUAGE plpgsql AS $$
DECLARE
  r public.interne_aanvraag;
BEGIN
  IF current_setting('test.eis_rol', true) = 'ja' THEN
    RAISE EXCEPTION 'rol gecheckt' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO r FROM public.interne_aanvraag WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aanvraag niet gevonden'; END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_zet_status(p_id uuid) RETURNS text
LANGUAGE plpgsql AS $$ BEGIN RETURN 'ok'; END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_json(p_id uuid) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'id', id,
    'ontvangen_aantal', ontvangen_aantal,
    'geannuleerd_aantal', geannuleerd_aantal
  )
  FROM public.interne_aanvraag WHERE id = p_id
$$;

\ir ../drizzle/migrations/0069_interne_levering_voorraad_annuleren.sql

INSERT INTO public.fase2_vlag VALUES ('West', 'interne_levering_v2', true), ('Test', 'interne_levering_v2', true), ('Midsland', 'interne_levering_v2', true);
INSERT INTO public.leveranciers (naam) VALUES ('Midsland (intern)');
INSERT INTO public.interne_producten (id, naam, artikel_id, inhoud_per_eenheid, inhoud_eenheid)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Wortelspread', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 3200, 'g');
INSERT INTO public.keuken_telartikel (vestiging, bron_vestiging, artikel_id, basis_eenheid)
VALUES
  ('West', 'West', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'g'),
  ('Test', 'West', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'g');

INSERT INTO public.interne_aanvraag (id, product_id, besteld_aantal, eenheid, meegegeven_aantal)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, 'bak', 4);

DO $$
DECLARE
  v jsonb;
  v_rijen int;
  v_som numeric;
  v_telt boolean;
BEGIN
  v := public.interne_v2_ontvangen('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 2, NULL);
  IF (v->>'ontvangen_aantal')::numeric <> 2 THEN RAISE EXCEPTION 'eerste ontvangst telt niet, %', v; END IF;
  IF (v->>'voorraad_telt')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'voorraad zou moeten tellen, %', v; END IF;
  IF v->>'voorraad_reden' IS NOT NULL THEN RAISE EXCEPTION 'onverwachte reden %', v->>'voorraad_reden'; END IF;

  SELECT count(*), bool_and(telt_voorraad), sum(aantal * inhoud_per_verpakking)
  INTO v_rijen, v_telt, v_som
  FROM public.ontvangst_regel
  WHERE vervallen_op IS NULL;
  IF v_rijen <> 1 OR v_telt IS NOT TRUE OR v_som <> 6400 THEN
    RAISE EXCEPTION 'stand na 2 bak: rijen % telt % som %', v_rijen, v_telt, v_som;
  END IF;
  IF EXISTS (SELECT 1 FROM public.ontvangst_regel WHERE inhoud_per_verpakking IS NULL OR basis_eenheid IS DISTINCT FROM 'g' OR artikel_id IS NULL) THEN
    RAISE EXCEPTION 'verpakking of artikel ontbreekt op de ontvangstregel';
  END IF;

  UPDATE public.interne_aanvraag SET ontvangen_aantal = 0 WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v := public.interne_v2_ontvangen('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 2, NULL);
  IF (v->>'al_gedaan')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'tweede keer dezelfde ontvangst hoort al_gedaan, %', v; END IF;
  SELECT count(*) INTO v_rijen FROM public.ontvangst_regel WHERE vervallen_op IS NULL;
  IF v_rijen <> 1 THEN RAISE EXCEPTION 'tweede ontvangst schreef een extra regel'; END IF;
  IF (SELECT ontvangen_aantal FROM public.interne_aanvraag WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc') <> 2 THEN
    RAISE EXCEPTION 'ontvangen aantal liep op bij een herhaling';
  END IF;

  v := public.interne_v2_ontvangen('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', NULL, NULL);
  SELECT count(*), sum(aantal * inhoud_per_verpakking) INTO v_rijen, v_som
  FROM public.ontvangst_regel WHERE vervallen_op IS NULL AND telt_voorraad;
  IF v_rijen <> 2 OR v_som <> 12800 THEN RAISE EXCEPTION 'restontvangst: rijen % som %', v_rijen, v_som; END IF;
  BEGIN
    PERFORM public.interne_v2_ontvangen('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', NULL, NULL);
    RAISE EXCEPTION 'derde ontvangst had moeten weigeren';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
  SELECT count(*) INTO v_rijen FROM public.ontvangst_regel WHERE vervallen_op IS NULL;
  IF v_rijen <> 2 THEN RAISE EXCEPTION 'geweigerde ontvangst schreef toch een regel'; END IF;
END $$;

INSERT INTO public.interne_aanvraag (id, proef, product_id, besteld_aantal, eenheid, meegegeven_aantal, mep_taak_id, mep_aantal)
VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'bak', 1, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1);
INSERT INTO public.mep_taken (id, doel_aantal, status) VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1, 'bezig');

DO $$
DECLARE v jsonb;
BEGIN
  PERFORM set_config('test.eis_rol', 'ja', true);
  v := public.interne_v2_annuleren('Test', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', NULL);
  IF (v->>'geannuleerd_aantal')::numeric <> 1 THEN RAISE EXCEPTION 'annuleren onderweg faalde, %', v; END IF;
  IF (SELECT status FROM public.mep_taken WHERE id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') <> 'geannuleerd' THEN
    RAISE EXCEPTION 'bezige MEP-taak bleef open';
  END IF;
  IF (SELECT count(*) FROM public.ontvangst_regel WHERE levering_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd') <> 0 THEN
    RAISE EXCEPTION 'annuleren zonder ontvangst boekte toch voorraad';
  END IF;
END $$;

UPDATE public.fase2_vlag SET aan = false WHERE vestiging = 'West';
DO $$
BEGIN
  PERFORM set_config('test.eis_rol', 'nee', true);
  BEGIN
    PERFORM public.interne_v2_annuleren('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1);
    RAISE EXCEPTION 'vlag uit hoort te weigeren';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    NULL;
  END;
END $$;
UPDATE public.fase2_vlag SET aan = true WHERE vestiging = 'West';

INSERT INTO public.mep_taken (id, doel_aantal, status) VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff', 4, 'afgerond');
UPDATE public.interne_aanvraag
SET besteld_aantal = 6, meegegeven_aantal = 6,
    mep_taak_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff', mep_aantal = 4, mep_klaar_aantal = 0, geannuleerd_aantal = 0
WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

DO $$
DECLARE
  v jsonb;
  v_som numeric;
BEGIN
  PERFORM set_config('test.eis_rol', 'ja', true);
  v := public.interne_v2_annuleren('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', NULL);
  IF (v->>'voorraad_blijft')::numeric <> 4 THEN RAISE EXCEPTION 'ontvangen voorraad hoort te blijven, %', v; END IF;
  IF (v->>'voorraad_teruggedraaid')::numeric <> 0 THEN RAISE EXCEPTION 'ontvangen voorraad werd teruggedraaid, %', v; END IF;
  SELECT sum(aantal * inhoud_per_verpakking) INTO v_som
  FROM public.ontvangst_regel
  WHERE levering_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' AND vervallen_op IS NULL AND telt_voorraad;
  IF v_som <> 12800 THEN RAISE EXCEPTION 'voorraadstand veranderde door annuleren: %', v_som; END IF;
  IF (SELECT doel_aantal FROM public.mep_taken WHERE id = 'ffffffff-ffff-4fff-8fff-ffffffffffff') <> 4
     OR (SELECT status FROM public.mep_taken WHERE id = 'ffffffff-ffff-4fff-8fff-ffffffffffff') <> 'afgerond' THEN
    RAISE EXCEPTION 'afgeronde MEP-taak werd aangepast';
  END IF;
END $$;

INSERT INTO public.ontvangst_regel (
  sleutel, vestiging, bron_vestiging, levering_id, omschrijving, aantal, uitkomst, ontvangen_op, bron, inhoud_per_verpakking, basis_eenheid, artikel_id
) VALUES (
  'intern-v2:cccccccc-cccc-4ccc-8ccc-cccccccccccc:extra',
  'West', 'West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'extra', 2, 'binnen', CURRENT_DATE, 'eindcheck', 3200, 'g',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

DO $$
DECLARE v jsonb; v_actief int;
BEGIN
  UPDATE public.interne_aanvraag
  SET besteld_aantal = 6, meegegeven_aantal = 6, geannuleerd_aantal = 0
  WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  PERFORM set_config('test.eis_rol', 'ja', true);
  v := public.interne_v2_annuleren('West', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 2);
  IF (v->>'voorraad_teruggedraaid')::numeric <> 2 THEN RAISE EXCEPTION 'surplus bleef staan, %', v; END IF;
  IF (v->>'voorraad_blijft')::numeric <> 4 THEN RAISE EXCEPTION 'blijft klopt niet, %', v; END IF;
  SELECT count(*) INTO v_actief FROM public.ontvangst_regel
  WHERE levering_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' AND vervallen_op IS NULL AND telt_voorraad;
  IF v_actief <> 2 THEN RAISE EXCEPTION 'actieve regels na surplus: %', v_actief; END IF;
END $$;

ROLLBACK;
