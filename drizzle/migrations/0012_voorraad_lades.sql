CREATE TABLE public.voorraad_lades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  plek text NOT NULL DEFAULT 'werkbank',
  naam text NOT NULL,
  kolom smallint NOT NULL CHECK (kolom BETWEEN 1 AND 3),
  rij smallint NOT NULL CHECK (rij BETWEEN 1 AND 3),
  volgorde integer NOT NULL DEFAULT 0,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voorraad_lades TO authenticated;
GRANT ALL ON public.voorraad_lades TO service_role;

ALTER TABLE public.voorraad_lades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lades zichtbaar eigen vestiging" ON public.voorraad_lades
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR heeft_vestiging(auth.uid(), vestiging));

CREATE POLICY "lades beheren door manager" ON public.voorraad_lades
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER voorraad_lades_updated_at BEFORE UPDATE ON public.voorraad_lades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.koelcel_check_items
  ADD COLUMN lade_id uuid NULL REFERENCES public.voorraad_lades(id) ON DELETE SET NULL;

CREATE INDEX idx_koelcel_check_items_lade ON public.koelcel_check_items(lade_id);

INSERT INTO public.voorraad_lades (vestiging, plek, naam, kolom, rij, volgorde)
SELECT 'West', 'werkbank', n.naam, n.kolom, n.rij, n.volgorde
FROM (VALUES
  ('Links boven',1,1,10),('Links midden',1,2,20),('Links onder',1,3,30),
  ('Midden boven',2,1,40),('Midden midden',2,2,50),('Midden onder',2,3,60),
  ('Rechts boven',3,1,70),('Rechts midden',3,2,80),('Rechts onder',3,3,90)
) AS n(naam, kolom, rij, volgorde);