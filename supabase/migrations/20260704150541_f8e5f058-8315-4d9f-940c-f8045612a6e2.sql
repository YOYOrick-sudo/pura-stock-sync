-- =========================================================
-- Sprint C3: Eitje-koppeling
-- =========================================================

-- 0) Generieke updated_at trigger (herbruikbaar, propere naam)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 1) sync_runs uitbreiden (details, state, extra type-waarden)
-- =========================================================
ALTER TABLE public.sync_runs
  ADD COLUMN IF NOT EXISTS details jsonb,
  ADD COLUMN IF NOT EXISTS state   jsonb;

ALTER TABLE public.sync_runs DROP CONSTRAINT IF EXISTS sync_runs_type_check;
ALTER TABLE public.sync_runs
  ADD CONSTRAINT sync_runs_type_check
  CHECK (type = ANY (ARRAY['dagelijks','backfill','handmatig','verkennen','demo_wipe']));

-- =========================================================
-- 2) sync_leases — één actieve sync per bron
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sync_leases (
  bron            text PRIMARY KEY CHECK (bron IN ('lightspeed','eitje')),
  lease_token     uuid,
  expires_at      timestamptz,
  holder          text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sync_leases IS
  'Standaard lease-patroon voor edge-function serialisatie per sync-bron. Zie mem://patterns/edge-function-serialization-lease.';

GRANT SELECT ON public.sync_leases TO authenticated;
GRANT ALL    ON public.sync_leases TO service_role;

ALTER TABLE public.sync_leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen leases lezen"
  ON public.sync_leases
  FOR SELECT
  TO authenticated
  USING (public.mag_cijfers_zien(auth.uid()));

CREATE TRIGGER trg_sync_leases_updated_at
  BEFORE UPDATE ON public.sync_leases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed-rijen (zodat UPDATE ... RETURNING atomisch kan claimen)
INSERT INTO public.sync_leases (bron) VALUES ('lightspeed'), ('eitje')
ON CONFLICT (bron) DO NOTHING;

-- =========================================================
-- 3) eitje_connection — singleton koppel-status
-- =========================================================
CREATE TABLE IF NOT EXISTS public.eitje_connection (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status           text NOT NULL DEFAULT 'niet_gekoppeld'
                     CHECK (status IN ('niet_gekoppeld','gekoppeld','fout')),
  laatste_sync_op  timestamptz,
  laatste_fout     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.eitje_connection TO authenticated;
GRANT ALL    ON public.eitje_connection TO service_role;

ALTER TABLE public.eitje_connection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen eitje_connection lezen"
  ON public.eitje_connection
  FOR SELECT
  TO authenticated
  USING (public.mag_cijfers_zien(auth.uid()));

CREATE TRIGGER trg_eitje_connection_updated_at
  BEFORE UPDATE ON public.eitje_connection
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.eitje_connection DEFAULT VALUES;

-- =========================================================
-- 4) eitje_environments — mapping naar onze vestigingen
-- =========================================================
CREATE TABLE IF NOT EXISTS public.eitje_environments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eitje_environment_id  text NOT NULL UNIQUE,
  eitje_naam            text,
  vestiging             text CHECK (vestiging IN ('Midsland','West')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.eitje_environments TO authenticated;
GRANT ALL    ON public.eitje_environments TO service_role;
-- Owner mag alleen de mapping-kolom aanpassen (via UI-dropdown).
GRANT UPDATE (vestiging, updated_at) ON public.eitje_environments TO authenticated;

ALTER TABLE public.eitje_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen environments lezen"
  ON public.eitje_environments
  FOR SELECT
  TO authenticated
  USING (public.mag_cijfers_zien(auth.uid()));

CREATE POLICY "Owners kunnen environments mappen"
  ON public.eitje_environments
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_eitje_environments_updated_at
  BEFORE UPDATE ON public.eitje_environments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 5) uren_dagen — kern-dataset voor C4
-- =========================================================
CREATE TABLE IF NOT EXISTS public.uren_dagen (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging         text NOT NULL CHECK (vestiging IN ('Midsland','West')),
  werkdag           date NOT NULL,
  gewerkte_uren     numeric(6,2) NOT NULL DEFAULT 0,
  geplande_uren     numeric(6,2) NOT NULL DEFAULT 0,
  loonkosten        numeric(10,2),
  loonkosten_bron   text CHECK (loonkosten_bron IN ('eitje','berekend')),
  eitje_omzet_dag   numeric(10,2),
  is_demo           boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, werkdag, is_demo)
);

CREATE INDEX IF NOT EXISTS idx_uren_dagen_werkdag ON public.uren_dagen (vestiging, werkdag);
CREATE INDEX IF NOT EXISTS uren_dagen_is_demo_idx ON public.uren_dagen (vestiging) WHERE is_demo;

GRANT SELECT ON public.uren_dagen TO authenticated;
GRANT ALL    ON public.uren_dagen TO service_role;

ALTER TABLE public.uren_dagen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen uren lezen"
  ON public.uren_dagen
  FOR SELECT
  TO authenticated
  USING (public.mag_cijfers_zien(auth.uid()));

CREATE TRIGGER trg_uren_dagen_updated_at
  BEFORE UPDATE ON public.uren_dagen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 6) cijfers_instellingen — fallback-uurloon per vestiging
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cijfers_instellingen (
  vestiging       text PRIMARY KEY CHECK (vestiging IN ('Midsland','West')),
  uurloon_allin   numeric(6,2),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cijfers_instellingen TO authenticated;
GRANT ALL    ON public.cijfers_instellingen TO service_role;
GRANT UPDATE (uurloon_allin, updated_at) ON public.cijfers_instellingen TO authenticated;

ALTER TABLE public.cijfers_instellingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen instellingen lezen"
  ON public.cijfers_instellingen
  FOR SELECT
  TO authenticated
  USING (public.mag_cijfers_zien(auth.uid()));

CREATE POLICY "Owners kunnen instellingen bijwerken"
  ON public.cijfers_instellingen
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cijfers_instellingen_updated_at
  BEFORE UPDATE ON public.cijfers_instellingen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.cijfers_instellingen (vestiging) VALUES ('Midsland'), ('West')
ON CONFLICT (vestiging) DO NOTHING;

-- =========================================================
-- 7) rpc_demo_data_wissen uitbreiden: wist óók uren_dagen-demo
-- =========================================================
CREATE OR REPLACE FUNCTION public.rpc_demo_data_wissen()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_omzet int := 0;
  v_uren  int := 0;
  v_total int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Alleen owners mogen demo-data wissen';
  END IF;

  WITH del AS (
    DELETE FROM public.omzet_uren WHERE is_demo RETURNING 1
  )
  SELECT COUNT(*) INTO v_omzet FROM del;

  WITH del AS (
    DELETE FROM public.uren_dagen WHERE is_demo RETURNING 1
  )
  SELECT COUNT(*) INTO v_uren FROM del;

  v_total := v_omzet + v_uren;

  INSERT INTO public.sync_runs (bron, type, status, foutmelding, klaar_op, bonnen_verwerkt, details)
  VALUES (
    'demo', 'demo_wipe', 'ok',
    format('Demo-data gewist door owner (omzet_uren: %s, uren_dagen: %s)', v_omzet, v_uren),
    now(),
    v_omzet,
    jsonb_build_object('omzet_uren_rows', v_omzet, 'uren_dagen_rows', v_uren)
  );

  RETURN v_total;
END;
$$;
