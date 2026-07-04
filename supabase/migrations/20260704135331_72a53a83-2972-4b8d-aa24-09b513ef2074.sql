
ALTER TABLE public.lightspeed_connections
  ADD COLUMN refreshing_until timestamptz;

-- Bewust NIET toegevoegd aan de column-GRANT voor authenticated: deze kolom is
-- puur intern voor edge functions (service_role). Frontend hoeft dit nooit te zien.

-- Index voor de claim-lease UPDATE (WHERE refreshing_until IS NULL OR < now())
-- niet nodig: er zijn maar 2 rijen in deze tabel (Midsland + West).

COMMENT ON COLUMN public.lightspeed_connections.refreshing_until IS
  'Lease-timestamp voor token-refresh serialisatie. Zie mem://patterns/edge-function-serialization-lease.';
