CREATE TABLE public.externe_klant_koppeling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  email text NOT NULL CHECK (email = lower(btrim(email))),
  klantcode text,
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  lightspeed_klant_id text,
  status text NOT NULL CHECK (status IN ('bezig','gekoppeld','onzeker','nieuw')),
  vorige_status text,
  aanmaak_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, email),
  CHECK (status <> 'gekoppeld' OR lightspeed_klant_id IS NOT NULL)
);
CREATE UNIQUE INDEX externe_klant_koppeling_code ON public.externe_klant_koppeling (vestiging, klantcode) WHERE klantcode IS NOT NULL;
GRANT SELECT ON public.externe_klant_koppeling TO authenticated;
GRANT ALL ON public.externe_klant_koppeling TO service_role;
ALTER TABLE public.externe_klant_koppeling ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigenaren lezen klantkoppelingen" ON public.externe_klant_koppeling FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
ALTER TABLE public.externe_bestellingen ADD COLUMN lightspeed_klant_id text;