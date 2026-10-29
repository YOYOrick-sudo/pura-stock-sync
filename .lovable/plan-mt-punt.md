# Plan: MT-punt aanleveren

Kleine module waarmee MT-leden een punt voor de MT-agenda kunnen insturen. Alleen toegankelijk voor wie in `mt_leden` staat (op e-mailadres).

## Grenzen
- Niets bestaands wijzigen/verwijderen behalve: één menu-item + één route + één paginatitel toevoegen.
- `user_roles`, `app_role`-enum, `get_user_role`, `has_role`, `Auth.tsx`, bestaande guards: NIET aanraken.
- Niet publiceren, geen e-mails/uitnodigingen, geen gebruikers aanmaken, geen testpunten.

## 1. Migratie (één migration)
- Tabel `public.mt_leden`: email text PK (lowercase), naam text not null, actief boolean default true, created_at timestamptz default now().
  - Grants: SELECT voor authenticated (eigen rij via RLS), ALL voor service_role. Geen anon.
  - RLS aan; policy SELECT: `lower(email) = lower(auth.jwt() ->> 'email')`. Geen insert/update/delete policies.
  - Vullen met de 5 opgegeven MT-leden (lowercase e-mail).
- Functie `public.is_mt_lid()` returns boolean, STABLE SECURITY DEFINER, search_path public; true als actieve rij met eigen e-mail bestaat. `revoke all` + `grant execute to authenticated`.
- Tabel `public.mt_punten`: id uuid pk, punt text not null met check `char_length(btrim(punt)) between 1 and 2000`, ingediend_door uuid not null default auth.uid(), ingediend_naam text, ingediend_email text, ingediend_op timestamptz default now(), status text not null default 'nieuw' check in ('nieuw','in_notion','test'), notion_page_id text, notion_gezet_op timestamptz.
  - BEFORE INSERT trigger `mt_punten_vul_indiener` (security definer): overschrijft ingediend_door/e-mail/naam/op; status='test' als punt met 'TEST' begint, anders 'nieuw'.
  - Grants: SELECT, INSERT voor authenticated; ALL voor service_role. Geen anon.
  - RLS aan; INSERT policy `with check (public.is_mt_lid())`; SELECT policy `ingediend_door = auth.uid() and public.is_mt_lid()`. Geen UPDATE/DELETE.

## 2. Frontend (nieuwe bestanden + 3 kleine toevoegingen)
- `src/hooks/useIsMtLid.ts`: TanStack Query hook die `rpc('is_mt_lid')` aanroept, gecachet (staleTime 5 min), alleen als er een sessie is.
- `src/components/RequireMtLid.tsx`: loader tijdens check; niet-MT-lid → `<Navigate to="/dashboard" replace />`.
- `src/pages/MtPunt.tsx`: SidebarLayout, kop "MT-punt aanleveren", Textarea (label "Punt", meerregelig, min 44px knop), knop "Verstuur". Na succes: veld leeg + melding "Verstuurd, het komt op de MT-agenda". Daaronder "Mijn ingestuurde punten": eigen punten (datum + tekst, nieuwste eerst, max 20) via `mt_punten` select met RLS.
- `src/App.tsx`: route `/mt-punt` → `<ProtectedRoute><RequireMtLid><MtPunt /></RequireMtLid></ProtectedRoute>`.
- `src/components/AppSidebar.tsx`: menu-item "MT-punt aanleveren" (icoon `MessageSquarePlus`), alleen tonen als `useIsMtLid()` true is.
- `src/components/SidebarLayout.tsx`: paginatitel `/mt-punt` → "MT-punt aanleveren".

## 3. Verificatie
- Build/typecheck via harness-logs.
- RLS-gedrag: als ingelogde MT-gebruiker (yorick) in de preview: menu-item zichtbaar, punt versturen, lijst toont eigen punt. Niet-MT-lid: menu-item afwezig en /mt-punt verwijst naar /dashboard (controleren met query als dat kan).
- Rapporteer tabel-/functienamen en wat niet getest kon worden.
