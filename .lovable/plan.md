## Print-bridge edge function

### Stappen

1. **Genereer `PRINT_BRIDGE_TOKEN`** (64-char random secret) via `generate_secret` — waarde wordt éénmalig getoond in chat.

2. **Nieuwe edge function** `supabase/functions/print-bridge/index.ts`:
   - CORS + `OPTIONS` handler
   - Verify `x-bridge-token` header tegen `PRINT_BRIDGE_TOKEN` env var (constant-time compare) → 401 bij mismatch
   - Supabase client met `SUPABASE_SERVICE_ROLE_KEY` (bypasst RLS)
   - POST JSON body met `action`:
     - **`claim`**: roept nieuwe SQL function `claim_next_print_job()` aan (atomair, zie hieronder). Returnt `{job: {id, zpl, label_omschrijving} | null}`
     - **`complete`**: valideert `id` (uuid) + `success` (bool). Update rij:
       - `success:true` → `status='done'`, `geprint_op=now()`, `foutmelding=null`
       - `success:false` → `status='error'`, `foutmelding=error`
       - Alleen updaten waar `status='printing'` (voorkomt corrupte state)
   - Alle responses met CORS headers, errors met duidelijke JSON

3. **Migration** — atomaire claim via `SELECT ... FOR UPDATE SKIP LOCKED`:
   ```sql
   CREATE OR REPLACE FUNCTION public.claim_next_print_job()
   RETURNS TABLE(id uuid, zpl text, label_omschrijving text)
   LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
   BEGIN
     RETURN QUERY
     UPDATE public.print_jobs
        SET status='printing'
      WHERE public.print_jobs.id = (
        SELECT j.id FROM public.print_jobs j
         WHERE j.status='pending'
         ORDER BY j.created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      RETURNING public.print_jobs.id, public.print_jobs.zpl, public.print_jobs.label_omschrijving;
   END; $$;
   REVOKE ALL ON FUNCTION public.claim_next_print_job() FROM PUBLIC, anon, authenticated;
   GRANT EXECUTE ON FUNCTION public.claim_next_print_job() TO service_role;
   ```
   `SKIP LOCKED` garandeert dat twee gelijktijdige claim-calls nooit dezelfde job krijgen.

4. **`supabase/config.toml`**: blok toevoegen voor `[functions.print-bridge]` met `verify_jwt = false`.

5. **Zelf testen** met `curl_edge_functions`:
   - Insert test pending job → `claim` call → verifieer response + `status='printing'` in DB
   - `complete` met `success:true` → verifieer `status='done'` + `geprint_op` gezet
   - Test 401 bij verkeerd token

6. **Aan jou teruggeven**: volledige function-URL + het gegenereerde token (één keer).

### Gebruik op de Pi
```
POST https://<project>.supabase.co/functions/v1/print-bridge
Headers: x-bridge-token: <token>, Content-Type: application/json
Body:    {"action":"claim"}
```
