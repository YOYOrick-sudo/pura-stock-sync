CREATE TABLE public.kassa_afdrachten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location text NOT NULL,
  type text NOT NULL CHECK (type IN ('open','sluit')),
  week_number int NOT NULL,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date,
  naam text NOT NULL,
  kassa_lade_denominations jsonb NOT NULL DEFAULT '{}'::jsonb,
  kassa_lade_total numeric(10,2) NOT NULL DEFAULT 0,
  wisselkas_denominations jsonb NOT NULL DEFAULT '{}'::jsonb,
  wisselkas_total numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  opmerkingen text
);

CREATE INDEX kassa_afdrachten_location_date_idx ON public.kassa_afdrachten (location, date DESC);
CREATE INDEX kassa_afdrachten_created_at_idx ON public.kassa_afdrachten (created_at DESC);

GRANT SELECT, INSERT ON public.kassa_afdrachten TO authenticated;
GRANT ALL ON public.kassa_afdrachten TO service_role;

ALTER TABLE public.kassa_afdrachten ENABLE ROW LEVEL SECURITY;

-- Insert: ingelogde gebruiker mag indienen voor zijn eigen locatie
CREATE POLICY "Authenticated kan eigen locatie indienen"
ON public.kassa_afdrachten
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND location = public.current_user_location()
);

-- Select: alleen managers/owners/admins
CREATE POLICY "Managers kunnen afdrachten bekijken"
ON public.kassa_afdrachten
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
);
