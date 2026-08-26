-- 1. Leveranciers
CREATE TABLE public.leveranciers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  kanaal text NOT NULL DEFAULT 'mail' CHECK (kanaal IN ('mail','telefoon','portal','api')),
  contact_email text,
  contact_telefoon text,
  api_basis_url text,
  notitie text,
  actief boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leveranciers TO authenticated;
GRANT ALL ON public.leveranciers TO service_role;
ALTER TABLE public.leveranciers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leveranciers_select" ON public.leveranciers FOR SELECT TO authenticated USING (true);
CREATE POLICY "leveranciers_write" ON public.leveranciers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER set_leveranciers_updated_at BEFORE UPDATE ON public.leveranciers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Besteldagen (vestiging NULL = geldt voor beide)
CREATE TABLE public.leverancier_besteldagen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id) ON DELETE CASCADE,
  vestiging text CHECK (vestiging IN ('West','Midsland')),
  weekdag smallint NOT NULL CHECK (weekdag BETWEEN 0 AND 6),
  deadline_tijd time,
  leverdag_offset integer NOT NULL DEFAULT 1,
  actief boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leverancier_besteldagen TO authenticated;
GRANT ALL ON public.leverancier_besteldagen TO service_role;
ALTER TABLE public.leverancier_besteldagen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lev_besteldagen_select" ON public.leverancier_besteldagen FOR SELECT TO authenticated USING (true);
CREATE POLICY "lev_besteldagen_write" ON public.leverancier_besteldagen FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER set_lev_besteldagen_updated_at BEFORE UPDATE ON public.leverancier_besteldagen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Leverancier-artikelen
CREATE TABLE public.leverancier_artikelen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id) ON DELETE CASCADE,
  artikel_id uuid NOT NULL REFERENCES public.artikelen(id) ON DELETE CASCADE,
  artikelnummer text,
  besteleenheid_id uuid REFERENCES public.eenheden(id),
  inhoud_per_besteleenheid numeric,
  netto_prijs numeric,
  is_voorkeur boolean NOT NULL DEFAULT false,
  actief boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (leverancier_id, artikel_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leverancier_artikelen TO authenticated;
GRANT ALL ON public.leverancier_artikelen TO service_role;
ALTER TABLE public.leverancier_artikelen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lev_artikelen_select" ON public.leverancier_artikelen FOR SELECT TO authenticated USING (true);
CREATE POLICY "lev_artikelen_write" ON public.leverancier_artikelen FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER set_lev_artikelen_updated_at BEFORE UPDATE ON public.leverancier_artikelen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Config per vestiging: klantnummer + secretnaam (sleutels leven UITSLUITEND hier)
CREATE TABLE public.leverancier_vestiging_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id) ON DELETE CASCADE,
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  klantnummer text,
  api_sleutel_referentie text,
  portal_login_hint text,
  actief boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (leverancier_id, vestiging)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leverancier_vestiging_config TO authenticated;
GRANT ALL ON public.leverancier_vestiging_config TO service_role;
ALTER TABLE public.leverancier_vestiging_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lev_vest_config_select" ON public.leverancier_vestiging_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "lev_vest_config_write" ON public.leverancier_vestiging_config FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER set_lev_vest_config_updated_at BEFORE UPDATE ON public.leverancier_vestiging_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Keten-instellingen
CREATE TABLE public.keten_instellingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL UNIQUE CHECK (vestiging IN ('West','Midsland')),
  cycle_count_aantal integer NOT NULL DEFAULT 5 CHECK (cycle_count_aantal >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keten_instellingen TO authenticated;
GRANT ALL ON public.keten_instellingen TO service_role;
ALTER TABLE public.keten_instellingen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keten_instellingen_select" ON public.keten_instellingen FOR SELECT TO authenticated USING (true);
CREATE POLICY "keten_instellingen_write" ON public.keten_instellingen FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER set_keten_instellingen_updated_at BEFORE UPDATE ON public.keten_instellingen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.keten_instellingen (vestiging) VALUES ('West'), ('Midsland');

-- 6. Interne bestelregels naar artikelen
ALTER TABLE public.internal_order_items
  ADD COLUMN artikel_id uuid REFERENCES public.artikelen(id),
  ADD COLUMN eenheid_id uuid REFERENCES public.eenheden(id),
  ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- 7. Oude MEP-trigger uit: schrijft alleen naar mep_planning, dat geen enkel scherm leest.
--    Nieuwe route (mep_taken, via mep_volgende_open_dag + leadtime) volgt in stap 3.
DROP TRIGGER IF EXISTS trigger_create_mep_from_order ON public.internal_orders;

-- 8. Compat-views opruimen (frontend gaat in dezelfde stap om naar de nieuwe namen)
DROP VIEW IF EXISTS public.ingredienten_master;
DROP VIEW IF EXISTS public.ingredient_locaties;