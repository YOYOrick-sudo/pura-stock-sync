## Stap 1 — Persoonlijk owner-account voor Yorick Mulder

### Wat ik ga doen
1. Nieuwe edge function `admin-invite-user` aanmaken (SECURITY DEFINER stijl via `SUPABASE_SERVICE_ROLE_KEY`) die:
   - `auth.admin.inviteUserByEmail('yorick@puravidafoodbar.nl', { data: { first_name: 'Yorick', last_name: 'Mulder' }, redirectTo: 'https://intern.puravidafoodbar.nl/auth/callback' })` aanroept
   - Alleen callable is voor bestaande owner/admin (via `authClient.auth.getUser()` + `has_role` check) — beveiligt tegen misbruik
2. Function één keer aanroepen via de dashboard test-runner (of `supabase--curl_edge_functions`) om de invite-mail te versturen. **Let op:** omdat er nu nog geen owner in `user_roles` staat naast de gedeelde accounts, laat ik de rol-check de eerste keer een bootstrap-toestaan (env-var `BOOTSTRAP_OWNER_EMAIL=yorick@puravidafoodbar.nl`) — na eerste succes verwijder ik die bootstrap-tak in stap 3.
3. Migratie: nadat het account bestaat en Yorick de invite heeft geaccepteerd, insert in `user_roles`:
   ```sql
   INSERT INTO public.user_roles (user_id, role, location, is_active)
   VALUES ((SELECT id FROM auth.users WHERE email='yorick@puravidafoodbar.nl'), 'owner', 'West', true);
   ```
   Deze migratie draai ik pas ná je login-bevestiging (anders faalt de subquery).

### Invite-mail flow
- Lovable's auth-email-hook stuurt de invite via het bestaande `invite`-template. Redirect-URL landt op `/auth/callback` → sessie wordt gehydrateerd → Yorick kiest zelf een wachtwoord via de standaard Supabase reset/set-password flow die de invite-link opent.
- Als het invite-template nog niet gestyled is voor Pura Vida, blijft dat een cosmetische taak voor later — de link werkt.

### Wat jij doet
1. Ik meld je zodra de invite verstuurd is.
2. Jij opent de mail op `yorick@puravidafoodbar.nl`, klikt de link, kiest een wachtwoord, logt in op https://intern.puravidafoodbar.nl.
3. Je bevestigt hier "ingelogd" → ik draai de role-migratie (owner) en de bootstrap-tak eruit.
4. Daarna: stap 2 (iPads → staff).

### Waarom een aparte edge function en geen directe SQL?
`auth.users` en de invite-mail-flow zijn niet via SQL-migraties bereikbaar (verboden `auth` schema). De Admin API vereist de service role key, die alleen serverside in een edge function beschikbaar is.

### Bevestig voordat ik bouw
- Redirect-URL `https://intern.puravidafoodbar.nl/auth/callback` — of moet dat de preview-URL zijn? (Voor productiegebruik lijkt custom domain juist.)
- Location voor je owner-account: **West** (aanname op basis van je dagelijkse werkplek) — of Midsland?
