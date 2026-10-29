CREATE TABLE public.mt_leden (
  email text PRIMARY KEY,
  naam text NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mt_leden TO authenticated;
GRANT ALL ON public.mt_leden TO service_role;
ALTER TABLE public.mt_leden ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_leden_lees_eigen ON public.mt_leden
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE OR REPLACE FUNCTION public.is_mt_lid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mt_leden
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND actief
  );
$$;
REVOKE ALL ON FUNCTION public.is_mt_lid() FROM public;
REVOKE ALL ON FUNCTION public.is_mt_lid() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_mt_lid() TO authenticated;

CREATE TABLE public.mt_punten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punt text NOT NULL CHECK (char_length(btrim(punt)) BETWEEN 1 AND 2000),
  ingediend_door uuid NOT NULL DEFAULT auth.uid(),
  ingediend_naam text,
  ingediend_email text,
  ingediend_op timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'in_notion', 'test')),
  notion_page_id text,
  notion_gezet_op timestamptz
);

CREATE OR REPLACE FUNCTION public.mt_punten_vul_indiener()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ingediend_door := auth.uid();
  NEW.ingediend_email := lower(auth.jwt() ->> 'email');
  SELECT naam INTO NEW.ingediend_naam
    FROM public.mt_leden
    WHERE lower(email) = lower(auth.jwt() ->> 'email');
  NEW.ingediend_op := now();
  NEW.status := CASE WHEN NEW.punt LIKE 'TEST%' THEN 'test' ELSE 'nieuw' END;
  NEW.notion_page_id := NULL;
  NEW.notion_gezet_op := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER mt_punten_vul_indiener_trg
  BEFORE INSERT ON public.mt_punten
  FOR EACH ROW EXECUTE FUNCTION public.mt_punten_vul_indiener();

GRANT SELECT, INSERT ON public.mt_punten TO authenticated;
GRANT ALL ON public.mt_punten TO service_role;
ALTER TABLE public.mt_punten ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_punten_insert_alleen_mt ON public.mt_punten
  FOR INSERT TO authenticated
  WITH CHECK (public.is_mt_lid());
CREATE POLICY mt_punten_select_eigen ON public.mt_punten
  FOR SELECT TO authenticated
  USING (ingediend_door = auth.uid() AND public.is_mt_lid());