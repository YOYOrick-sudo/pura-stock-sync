CREATE TABLE public.koelcel_check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging TEXT NOT NULL,
  naam TEXT NOT NULL,
  doel_aantal NUMERIC NOT NULL DEFAULT 1,
  eenheid TEXT NOT NULL DEFAULT 'stuks',
  type TEXT NOT NULL DEFAULT 'koelcel',
  volgorde INTEGER NOT NULL DEFAULT 0,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.koelcel_check_items TO authenticated;
GRANT ALL ON public.koelcel_check_items TO service_role;

ALTER TABLE public.koelcel_check_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "koelcel items zichtbaar eigen vestiging" ON public.koelcel_check_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));
CREATE POLICY "koelcel items beheren eigen vestiging" ON public.koelcel_check_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));

CREATE TABLE public.koelcel_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.koelcel_check_items(id) ON DELETE CASCADE,
  vestiging TEXT NOT NULL,
  datum DATE NOT NULL,
  status TEXT NOT NULL,
  mep_taak_id UUID REFERENCES public.mep_taken(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, datum)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.koelcel_checks TO authenticated;
GRANT ALL ON public.koelcel_checks TO service_role;

ALTER TABLE public.koelcel_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "koelcel checks zichtbaar eigen vestiging" ON public.koelcel_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));
CREATE POLICY "koelcel checks beheren eigen vestiging" ON public.koelcel_checks FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));

CREATE INDEX koelcel_checks_dag_idx ON public.koelcel_checks (vestiging, datum);

CREATE TRIGGER set_koelcel_check_items_updated_at BEFORE UPDATE ON public.koelcel_check_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_koelcel_checks_updated_at BEFORE UPDATE ON public.koelcel_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();