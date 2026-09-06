create table public.wisselkassa_aanvragen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  vestiging text not null,
  aangevraagd_door uuid references auth.users(id) on delete set null,
  aangevraagd_door_naam text,
  toelichting text,
  mail_status text not null default 'verstuurd'
);

GRANT SELECT, INSERT ON public.wisselkassa_aanvragen TO authenticated;
GRANT ALL ON public.wisselkassa_aanvragen TO service_role;

ALTER TABLE public.wisselkassa_aanvragen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogden kunnen aanvragen toevoegen"
ON public.wisselkassa_aanvragen
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Managers en eigenaren kunnen aanvragen zien"
ON public.wisselkassa_aanvragen
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);