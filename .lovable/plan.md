## Status — deels al uitgevoerd

Migraties zijn beide gedraaid en de oude pincode-bestanden zijn verwijderd. Voor de resterende code-wijzigingen heb ik build-mode nodig — vandaar dit hernieuwde plan.

**Al klaar in de DB:**
- Migratie 1: `ticket_comments` heeft `auteur_user_id` + `auteur_naam`, `auteur_id` is nullable, en `auteur_naam` / `melder_naam` zijn eenmalig gebackfilled vanuit `maintenance_users`.
- Migratie 2: alle open RLS-policies gedropt en vervangen — tickets/settings/comments alleen `authenticated`, `maintenance_users` alleen owner/admin, tickets-INSERT met `melder_user_id = auth.uid()`, tickets-UPDATE alleen owner/admin, comments-INSERT met `auteur_user_id = auth.uid()`. Security-scan telt al 3 findings minder.

**Al klaar in de code (via shell delete):**
- `src/components/maintenance/PincodeLogin.tsx`
- `src/components/maintenance/MaintenanceSettings.tsx`
- `src/hooks/maintenance/useMaintenanceAuth.ts`
- `src/hooks/maintenance/useMaintenanceUsers.ts`
- `src/hooks/maintenance/useMaintenanceSettings.ts`

Het project bouwt nu níet totdat de imports geschoond zijn — dit is dus urgent.

## Resterende code-wijzigingen (in build-mode)

**Nieuw:**
- `src/hooks/maintenance/useIsMaintenanceAdmin.ts` — React Query hook die `user_roles` leest en `true` retourneert bij owner/admin.

**Aanpassen:**
- `src/hooks/maintenance/useTicketComments.ts` — `useCreateComment` payload wordt `{ ticket_id, auteur_user_id, auteur_naam, tekst }`.
- `src/components/maintenance/TicketDetail.tsx`:
  - Verwijder `isEigenaar`-check; gebruik `useIsMaintenanceAdmin()` voor statusknoppen én notitie-invoer.
  - Notitie-payload gebruikt `auteur_user_id = user.id`, `auteur_naam = user.naam`.
  - Notities-render: `comment.auteur_naam ?? comment.auteur?.naam ?? 'Onbekend'`.
- `src/components/maintenance/TicketList.tsx`:
  - Filter-tabs worden **Open / Klaar / Alles** ("Open" = `nieuw` + `in_behandeling`, matcht "Openstaand"-KPI).
  - Settings-knop alleen zichtbaar als `useIsMaintenanceAdmin()` true is — maar wordt sowieso verwijderd want er is geen settings-scherm meer (zie hieronder).
  - Verwijder logout-knop, `user.isStaff` en `canSwitchVestiging` conditionals (er is nu alleen staff-mode).
- `src/components/maintenance/NewTicketForm.tsx` — verwijder de `user.isStaff ? melder_user_id : melder_id` conditional; altijd `melder_user_id + melder_naam` sturen.
- `src/pages/maintenance/Onderhoud.tsx` — flow simplificeren:
  - Weg: pincode-imports, `useMaintenanceAuth`, `showBeheer`, beheer-link, `settings`-screen.
  - Alleen `list` / `new` / `detail`. Wanneer geen `authUser + vestiging`: toon "Even geduld..." (zoals nu).
- `src/types/maintenance.ts` — `TicketComment` interface: `auteur_id: string | null`, plus `auteur_user_id: string | null`, `auteur_naam: string | null`.

**Types & tokens bewust behouden:** `MaintenanceUser`, `MaintenanceRol`, `MaintenanceSession`, `pincode_hash` — de tabel bestaat nog voor historische verwijzingen, dus de types blijven bruikbaar voor de embedded join. `useMaintenanceUsers` heb ik weggegooid omdat er geen UI meer overblijft die pincode-users beheert.

## Verificatie na build

1. **Owner** → `/onderhoud` → status wijzigen + notitie plaatsen werkt.
2. **Niet-admin** → melden werkt; statusknoppen en notitie-invoer onzichtbaar; poging via curl om status te updaten met anon-token → RLS-403.
3. **Zonder login** → curl `select id from maintenance_tickets` met alleen anon-key → leeg / permission-error.
4. **Zonder login** → curl `select naam from maintenance_users` → leeg / permission-error.
5. **Historie** — bestaande tickets/comments tonen namen (backfill werkt).
6. `security--run_security_scan` — verifieer dat "tickets public", "pincode-hashes leesbaar" en "comments public" verdwenen zijn.

Zeg "bouwen" of klik implement en ik maak de code-wijzigingen af.
