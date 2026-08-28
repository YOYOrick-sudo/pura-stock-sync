-- 1. telrondes
CREATE TABLE public.telrondes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  route_type text NOT NULL CHECK (route_type IN ('leverancier','interne_route')),
  leverancier_id uuid REFERENCES public.leveranciers(id) ON DELETE SET NULL,
  bron_vestiging text CHECK (bron_vestiging IN ('West','Midsland')),
  datum date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','afgerond')),
  afgerond_op timestamptz,
  afgerond_door uuid,
  aangemaakt_door uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX telrondes_uniek ON public.telrondes (vestiging, route_type, coalesce(leverancier_id::text, bron_vestiging), datum) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telrondes TO authenticated;
GRANT ALL ON public.telrondes TO service_role;
ALTER TABLE public.telrondes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telrondes lezen" ON public.telrondes FOR SELECT TO authenticated USING (true);
CREATE POLICY "telrondes schrijven" ON public.telrondes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. telronde_regels
CREATE TABLE public.telronde_regels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telronde_id uuid NOT NULL REFERENCES public.telrondes(id) ON DELETE CASCADE,
  artikel_id uuid NOT NULL REFERENCES public.artikelen(id) ON DELETE CASCADE,
  geteld_aantal numeric NOT NULL DEFAULT 0,
  eenheid_id uuid REFERENCES public.eenheden(id),
  geteld_basis numeric,
  conversie_ontbreekt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telronde_id, artikel_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telronde_regels TO authenticated;
GRANT ALL ON public.telronde_regels TO service_role;
ALTER TABLE public.telronde_regels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telronde_regels lezen" ON public.telronde_regels FOR SELECT TO authenticated USING (true);
CREATE POLICY "telronde_regels schrijven" ON public.telronde_regels FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. inkoop_orders
CREATE TABLE public.inkoop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id) ON DELETE RESTRICT,
  bestelnummer text NOT NULL UNIQUE,
  kanaal text NOT NULL,
  status text NOT NULL DEFAULT 'concept'
    CHECK (status IN ('concept','verzonden','besteld','deels_ontvangen','ontvangen','verzenden_mislukt','geannuleerd')),
  leverdatum date,
  telronde_id uuid REFERENCES public.telrondes(id) ON DELETE SET NULL,
  verzonden_op timestamptz,
  besteld_op timestamptz,
  besteld_door uuid,
  ontvangen_op timestamptz,
  extern_ordernummer text,
  extern_status text,
  extern_totaal numeric,
  laatste_fout text,
  notitie text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inkoop_orders_open ON public.inkoop_orders (vestiging, leverancier_id, status) WHERE deleted_at IS NULL;
GRANT SELECT ON public.inkoop_orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inkoop_orders TO authenticated;
GRANT ALL ON public.inkoop_orders TO service_role;
ALTER TABLE public.inkoop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inkoop_orders lezen" ON public.inkoop_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "inkoop_orders beheren" ON public.inkoop_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 4. inkoop_order_regels
CREATE TABLE public.inkoop_order_regels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.inkoop_orders(id) ON DELETE CASCADE,
  artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL,
  artikelnummer text,
  omschrijving text NOT NULL,
  aantal numeric NOT NULL,
  besteleenheid_id uuid REFERENCES public.eenheden(id),
  besteleenheid_code text,
  inhoud_per_besteleenheid numeric,
  ontvangen_aantal numeric,
  is_backorder boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inkoop_order_regels_order ON public.inkoop_order_regels (order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inkoop_order_regels TO authenticated;
GRANT ALL ON public.inkoop_order_regels TO service_role;
ALTER TABLE public.inkoop_order_regels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inkoop_order_regels lezen" ON public.inkoop_order_regels FOR SELECT TO authenticated USING (true);
CREATE POLICY "inkoop_order_regels beheren" ON public.inkoop_order_regels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 5. ontvangst op interne orderregels
ALTER TABLE public.internal_order_items ADD COLUMN IF NOT EXISTS ontvangen_aantal numeric;

-- 6. updated_at triggers
CREATE TRIGGER telrondes_updated_at BEFORE UPDATE ON public.telrondes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER telronde_regels_updated_at BEFORE UPDATE ON public.telronde_regels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inkoop_orders_updated_at BEFORE UPDATE ON public.inkoop_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inkoop_order_regels_updated_at BEFORE UPDATE ON public.inkoop_order_regels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();