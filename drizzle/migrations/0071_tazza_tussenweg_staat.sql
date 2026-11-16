CREATE TABLE public.tazza_tussenweg_staat (
  vestiging text PRIMARY KEY,
  gestopt text,
  open_dagen date[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.tazza_tussenweg_staat FROM anon, authenticated;
GRANT ALL ON public.tazza_tussenweg_staat TO service_role;
ALTER TABLE public.tazza_tussenweg_staat ENABLE ROW LEVEL SECURITY;