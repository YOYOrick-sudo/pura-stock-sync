CREATE TABLE public.kassa_verkoop_dag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('Midsland','West')),
  datum date NOT NULL,
  lightspeed_product_id text NOT NULL,
  productnaam text NOT NULL DEFAULT '',
  aantal numeric(12,3) NOT NULL DEFAULT 0,
  omzet_excl numeric(12,2) NOT NULL DEFAULT 0,
  omzet_incl numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kassa_verkoop_dag_uniek UNIQUE (vestiging, datum, lightspeed_product_id)
);
CREATE INDEX idx_kassa_verkoop_dag_vest_datum ON public.kassa_verkoop_dag (vestiging, datum);
GRANT SELECT ON public.kassa_verkoop_dag TO authenticated;
GRANT ALL ON public.kassa_verkoop_dag TO service_role;
ALTER TABLE public.kassa_verkoop_dag ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners en mag_cijfers_zien kunnen verkoop lezen" ON public.kassa_verkoop_dag
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.mag_cijfers_zien = true));