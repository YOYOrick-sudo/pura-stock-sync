-- Bain-marie: startdatum per product bijhouden (kip, vissoep, tom-yum, ei) voor bakken die meerdere dagen meegaan

CREATE TABLE public.bain_marie_bakken (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging TEXT NOT NULL DEFAULT 'West',
  product TEXT NOT NULL,
  product_naam TEXT NOT NULL,
  start_datum DATE NOT NULL,
  houdbaarheid_dagen INTEGER NOT NULL DEFAULT 5,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eén actieve bak per product per vestiging
CREATE UNIQUE INDEX bain_marie_bakken_actief_idx
  ON public.bain_marie_bakken (product, vestiging)
  WHERE actief;

CREATE INDEX bain_marie_bakken_vestiging_idx ON public.bain_marie_bakken (vestiging, actief);

GRANT SELECT, INSERT, UPDATE ON public.bain_marie_bakken TO authenticated;
GRANT ALL ON public.bain_marie_bakken TO service_role;

ALTER TABLE public.bain_marie_bakken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bain marie bakken zichtbaar eigen vestiging" ON public.bain_marie_bakken FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));
CREATE POLICY "bain marie bakken beheren eigen vestiging" ON public.bain_marie_bakken FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));

CREATE TRIGGER set_bain_marie_bakken_updated_at BEFORE UPDATE ON public.bain_marie_bakken
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

insert into public.migratie_logboek (onderwerp, bron_tabel, reden)
values ('Bain-marie bakregistratie', 'bain_marie_bakken',
        'Startdatum per bain-marie-product (kip, vissoep, tom-yum, ei) bijhouden voor bakken die meerdere dagen meegaan; 5 dagen houdbaarheid; sticker print in de sluitlijst.');