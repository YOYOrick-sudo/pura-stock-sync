ALTER TABLE public.fase2_vlag DROP CONSTRAINT IF EXISTS fase2_vlag_vlag_check;
ALTER TABLE public.fase2_vlag ADD CONSTRAINT fase2_vlag_vlag_check
  CHECK (vlag = ANY (ARRAY['ontvangst_v2'::text, 'keukenadvies'::text, 'leverancier_kiezen'::text, 'interne_levering'::text, 'interne_levering_v2'::text, 'eilandbezorger_live'::text]));
INSERT INTO public.fase2_vlag (vestiging, vlag, aan, notitie)
SELECT v, 'eilandbezorger_live', false, 'Eilandbezorger naar kassa, standaard uit'
FROM (VALUES ('West'), ('Midsland')) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM public.fase2_vlag f WHERE f.vestiging = x.v AND f.vlag = 'eilandbezorger_live');

CREATE TABLE public.externe_kassa_config (
  vestiging text PRIMARY KEY,
  merchant_id text NOT NULL UNIQUE,
  lightspeed_klant_id text,
  lightspeed_betaalwijze_id text,
  order_route text NOT NULL DEFAULT 'customer_order' CHECK (order_route IN ('customer_order','establishment_order')),
  venster_minuten integer NOT NULL DEFAULT 45 CHECK (venster_minuten BETWEEN 5 AND 240),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.externe_kassa_config (vestiging, merchant_id) VALUES ('Midsland','36864'),('West','41121');

CREATE TABLE public.externe_product_koppeling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  soort text NOT NULL DEFAULT 'product' CHECK (soort IN ('product','extra')),
  externe_code text NOT NULL,
  lightspeed_product_id text NOT NULL,
  lightspeed_plu text,
  naam text NOT NULL,
  prijs_cent integer NOT NULL CHECK (prijs_cent >= 0),
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, soort, externe_code)
);

CREATE TABLE public.externe_bestellingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bron text NOT NULL DEFAULT 'eilandbezorger',
  modus text NOT NULL CHECK (modus IN ('test','live')),
  vestiging text NOT NULL,
  merchant_id text NOT NULL,
  extern_id text NOT NULL,
  referentie text NOT NULL,
  vingerafdruk text NOT NULL,
  status text NOT NULL,
  reden text,
  versie integer NOT NULL DEFAULT 1,
  ophaaltijd timestamptz NOT NULL,
  bezorgtijd timestamptz,
  restaurant_cent integer NOT NULL,
  bezorgkosten_cent integer NOT NULL DEFAULT 0,
  fooi_cent integer NOT NULL DEFAULT 0,
  korting jsonb,
  invoer jsonb NOT NULL,
  regels jsonb,
  orderbericht jsonb,
  lightspeed_order_id text,
  vrijgegeven_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bron, modus, merchant_id, extern_id),
  UNIQUE (referentie)
);
CREATE INDEX externe_bestellingen_status_idx ON public.externe_bestellingen (status, ophaaltijd);

CREATE TABLE public.externe_bestelling_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bestelling_id uuid NOT NULL REFERENCES public.externe_bestellingen(id),
  van_status text,
  naar_status text NOT NULL,
  reden text,
  door uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.externe_bestelling_poging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bestelling_id uuid NOT NULL REFERENCES public.externe_bestellingen(id),
  versie integer NOT NULL,
  soort text NOT NULL CHECK (soort IN ('verzenden','teruglezen')),
  uitkomst text NOT NULL DEFAULT 'bezig',
  http_status integer,
  antwoord text,
  gestart_op timestamptz NOT NULL DEFAULT now(),
  klaar_op timestamptz
);
CREATE UNIQUE INDEX externe_poging_een_tegelijk ON public.externe_bestelling_poging (bestelling_id) WHERE uitkomst = 'bezig' AND soort = 'verzenden';

GRANT SELECT ON public.externe_kassa_config, public.externe_product_koppeling, public.externe_bestellingen, public.externe_bestelling_log, public.externe_bestelling_poging TO authenticated;
GRANT ALL ON public.externe_kassa_config, public.externe_product_koppeling, public.externe_bestellingen, public.externe_bestelling_log, public.externe_bestelling_poging TO service_role;
GRANT USAGE ON SEQUENCE public.externe_bestelling_log_id_seq TO service_role;

ALTER TABLE public.externe_kassa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.externe_product_koppeling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.externe_bestellingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.externe_bestelling_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.externe_bestelling_poging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers lezen kassaconfig" ON public.externe_kassa_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Managers lezen productkoppeling" ON public.externe_product_koppeling FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Managers lezen externe bestellingen" ON public.externe_bestellingen FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Managers lezen bestellinglog" ON public.externe_bestelling_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Managers lezen pogingen" ON public.externe_bestelling_poging FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));