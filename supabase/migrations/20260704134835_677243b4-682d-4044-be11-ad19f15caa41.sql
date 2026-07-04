
-- ============================================================
-- Sprint C1: Lightspeed fundament
-- ============================================================

-- 1) lightspeed_connections
CREATE TABLE public.lightspeed_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL UNIQUE CHECK (vestiging IN ('Midsland','West')),
  merchant_id text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'niet_gekoppeld'
    CHECK (status IN ('niet_gekoppeld','gekoppeld','token_verlopen','fout')),
  laatste_sync_op timestamptz,
  laatste_fout text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTs: geen enkele client-toegang tot de tabel zelf (tokens!). Alleen service_role.
GRANT ALL ON public.lightspeed_connections TO service_role;

ALTER TABLE public.lightspeed_connections ENABLE ROW LEVEL SECURITY;

-- Geen SELECT/INSERT/UPDATE/DELETE policies voor authenticated → niks leesbaar/schrijfbaar via client.
-- (service_role omzeilt RLS.)

-- Seed vestigingen
INSERT INTO public.lightspeed_connections (vestiging, merchant_id)
VALUES ('Midsland','36864'), ('West','41121');

-- updated_at trigger
CREATE TRIGGER trg_lightspeed_connections_updated_at
  BEFORE UPDATE ON public.lightspeed_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
-- (hergebruik van bestaande generieke updated_at trigger-functie)

-- ============================================================
-- 2) omzet_uren
-- ============================================================
CREATE TABLE public.omzet_uren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('Midsland','West')),
  werkdag date NOT NULL,
  uur smallint NOT NULL CHECK (uur BETWEEN 0 AND 23),
  omzet_incl numeric(10,2) NOT NULL DEFAULT 0,
  omzet_excl numeric(10,2) NOT NULL DEFAULT 0,
  aantal_bonnen int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vestiging, werkdag, uur)
);
CREATE INDEX idx_omzet_uren_werkdag ON public.omzet_uren (vestiging, werkdag);

-- GRANTs: authenticated mag SELECT (RLS filtert verder). Geen writes vanuit client.
GRANT SELECT ON public.omzet_uren TO authenticated;
GRANT ALL ON public.omzet_uren TO service_role;

ALTER TABLE public.omzet_uren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen omzet lezen"
  ON public.omzet_uren
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.mag_cijfers_zien = true
    )
  );

CREATE TRIGGER trg_omzet_uren_updated_at
  BEFORE UPDATE ON public.omzet_uren
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- ============================================================
-- 3) sync_runs
-- ============================================================
CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bron text NOT NULL DEFAULT 'lightspeed',
  vestiging text,
  type text NOT NULL CHECK (type IN ('dagelijks','backfill','handmatig')),
  periode_van date,
  periode_tot date,
  bonnen_verwerkt int DEFAULT 0,
  status text NOT NULL DEFAULT 'bezig' CHECK (status IN ('bezig','ok','fout')),
  foutmelding text,
  gestart_op timestamptz NOT NULL DEFAULT now(),
  klaar_op timestamptz
);
CREATE INDEX idx_sync_runs_gestart ON public.sync_runs (gestart_op DESC);

GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners en mag_cijfers_zien kunnen sync-runs lezen"
  ON public.sync_runs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.mag_cijfers_zien = true
    )
  );

-- ============================================================
-- 4) lightspeed_oauth_states (PKCE state + verifier, TTL 10 min)
-- ============================================================
CREATE TABLE public.lightspeed_oauth_states (
  state text PRIMARY KEY,
  vestiging text NOT NULL CHECK (vestiging IN ('Midsland','West')),
  code_verifier text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Volledig client-inaccessible. Alleen service_role.
GRANT ALL ON public.lightspeed_oauth_states TO service_role;

ALTER TABLE public.lightspeed_oauth_states ENABLE ROW LEVEL SECURITY;
-- Geen policies → client kan niks.

-- ============================================================
-- 5) View v_lightspeed_status (owner-veilige status, GEEN tokens)
-- ============================================================
CREATE VIEW public.v_lightspeed_status
  WITH (security_invoker = true)
AS
  SELECT
    vestiging,
    merchant_id,
    status,
    laatste_sync_op,
    laatste_fout,
    (token_expires_at IS NOT NULL AND token_expires_at > now()) AS token_geldig,
    token_expires_at,
    updated_at
  FROM public.lightspeed_connections;

GRANT SELECT ON public.v_lightspeed_status TO authenticated;
GRANT SELECT ON public.v_lightspeed_status TO service_role;

-- Voor de view moet authenticated óók SELECT-recht hebben op de onderliggende tabel
-- vanwege security_invoker. RLS blokkeert dat echter — daarom een owner-only policy
-- die WEL de niet-token kolommen doorlaat via de view (RLS werkt op row-niveau, niet kolom).
-- Oplossing: kleine RLS policy op lightspeed_connections voor SELECT door owners.
-- De frontend selecteert nooit rechtstreeks token-kolommen (we schrijven de code zo),
-- en bovendien nemen we het risico weg door de view te gebruiken.
-- Extra beschermlaag: REVOKE SELECT op token-kolommen expliciet.

GRANT SELECT (vestiging, merchant_id, status, laatste_sync_op, laatste_fout,
              token_expires_at, created_at, updated_at)
  ON public.lightspeed_connections TO authenticated;

CREATE POLICY "Owners en mag_cijfers_zien kunnen status lezen (geen tokens)"
  ON public.lightspeed_connections
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.mag_cijfers_zien = true
    )
  );
-- NB: access_token en refresh_token kolommen zijn NIET in de column-GRANT opgenomen,
-- dus zelfs een owner die de tabel direct query't kan die kolommen niet lezen.
