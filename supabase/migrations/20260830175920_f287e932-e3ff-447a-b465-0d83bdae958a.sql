CREATE TABLE public.gerechten (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text NOT NULL,
  categorie text NOT NULL DEFAULT 'Zoet',
  groep text NOT NULL DEFAULT 'standaard' CHECK (groep IN ('standaard','special')),
  prijs numeric(10,2),
  labels text[] NOT NULL DEFAULT '{}',
  gecontroleerd boolean NOT NULL DEFAULT true,
  notitie text,
  is_gearchiveerd boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  vestiging text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gerechten TO authenticated;
GRANT ALL ON public.gerechten TO service_role;

ALTER TABLE public.gerechten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen gerechten bekijken"
ON public.gerechten FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers kunnen gerechten toevoegen"
ON public.gerechten FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Managers kunnen gerechten wijzigen"
ON public.gerechten FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Managers kunnen gerechten verwijderen"
ON public.gerechten FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER gerechten_set_updated_at
BEFORE UPDATE ON public.gerechten
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX gerechten_categorie_idx ON public.gerechten (categorie, groep, sort_order);