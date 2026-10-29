CREATE POLICY mt_punten_lees_owner ON public.mt_punten FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
REVOKE UPDATE, DELETE, TRUNCATE ON public.mt_punten FROM anon, authenticated;

CREATE TABLE public.mt_actiepunten (
  notion_page_id text PRIMARY KEY,
  wat text NOT NULL,
  wie text,
  deadline date,
  status text,
  notion_url text,
  bijgewerkt_op timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mt_actiepunten TO authenticated;
GRANT ALL ON public.mt_actiepunten TO service_role;
ALTER TABLE public.mt_actiepunten ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_actiepunten_lees ON public.mt_actiepunten FOR SELECT TO authenticated USING (public.is_mt_lid());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mt_actiepunten FROM anon, authenticated;
REVOKE SELECT ON public.mt_actiepunten FROM anon;

CREATE TABLE public.mt_sync_status (
  naam text PRIMARY KEY,
  laatst_gesynchroniseerd timestamptz NOT NULL,
  aantal integer,
  notitie text
);
GRANT SELECT ON public.mt_sync_status TO authenticated;
GRANT ALL ON public.mt_sync_status TO service_role;
ALTER TABLE public.mt_sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_sync_status_lees ON public.mt_sync_status FOR SELECT TO authenticated USING (public.is_mt_lid());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mt_sync_status FROM anon, authenticated;
REVOKE SELECT ON public.mt_sync_status FROM anon;