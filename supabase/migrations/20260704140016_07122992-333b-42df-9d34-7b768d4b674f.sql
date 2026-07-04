
-- ============================================================
-- lightspeed_connections: tokens onleesbaar maken
-- ============================================================
REVOKE ALL ON public.lightspeed_connections FROM anon, authenticated, public;

-- Herstel column-scoped SELECT voor authenticated (RLS-policy filtert verder)
GRANT SELECT (
  vestiging, merchant_id, status, laatste_sync_op, laatste_fout,
  token_expires_at, created_at, updated_at
) ON public.lightspeed_connections TO authenticated;

-- service_role behoudt volledige toegang (voor edge functions)
GRANT ALL ON public.lightspeed_connections TO service_role;

-- ============================================================
-- lightspeed_oauth_states: volledig dicht behalve service_role
-- ============================================================
REVOKE ALL ON public.lightspeed_oauth_states FROM anon, authenticated, public;
GRANT ALL ON public.lightspeed_oauth_states TO service_role;
