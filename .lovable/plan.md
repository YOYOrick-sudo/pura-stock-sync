# Vestigingswissel voor accounts met meerdere vestigingen

## Wat het oplost
Owner-accounts (jij en Helga) staan in de rollentabel met twee regels: Midsland én West. De app gaat er overal vanuit dat één account bij één vestiging hoort en pakt bij twee regels niets of willekeurig één. Gevolg: /voorraad toont "Vestiging onbekend" en Helga — de enige die extern mag verzenden — kan het bestelscherm niet openen. Dat is een blocker voor de eerste echte bestelling.

Na deze opdracht kiest zo'n account bovenaan het scherm zelf de vestiging, en die keuze geldt overal: voorraad, mise-en-place, taken, kassatelling, overdracht.

## Wat je gaat zien
- **Eén grote knop in de header**, naast de paginatitel, waar nu al "Foodbar"/"Daily" staat. Tikken opent een korte lijst met de vestigingen waar je toegang toe hebt; tikken op een naam schakelt direct om. Tikdoel minimaal 44px, ook op tablet.
- **De keuze wordt onthouden per account** en blijft staan na afsluiten en opnieuw openen. Bij het eerste gebruik staat hij op de vestiging waar het account als eerste aan gekoppeld is.
- **Accounts met één vestiging zien geen wissel** — daar blijft de header letterlijk zoals hij nu is.

## Wat er onder water moet mee veranderen
De vestigingsfilters in de database gaan nu uit van "de" vestiging van een account (één waarde). Voor een account met twee vestigingen kiest de database willekeurig één van de twee, ongeacht wat de header toont. Zonder deze stap zou de wissel op sommige schermen (taken, mise-en-place, overdracht, interne bestellingen) wél de knop veranderen maar niet de data. Daarom wordt de databasecontrole aangepast van "is dit dé vestiging van deze gebruiker" naar "hoort deze vestiging bij deze gebruiker".

## Technische uitvoering

**Database (migratie)**
- Nieuwe functie `public.heeft_vestiging(_user_id uuid, _loc text)` (security definer, stable): waar of onwaar op basis van alle actieve rollenregels van de gebruiker.
- `current_user_location()` en `get_user_location()` blijven bestaan (te veel plekken), maar krijgen een deterministische volgorde in plaats van willekeurige `LIMIT 1`.
- Policies die nu `location = current_user_location()` / `= get_user_location(auth.uid())` gebruiken, worden omgezet naar `heeft_vestiging(auth.uid(), <kolom>)`: `foh_tasks`, `foh_employees`, `foh_daily_templates`, `ai_suggestions`, `handover_memos`, `kitchen_tasks`, `mep_planning`, `mep_taken`, `productie_batches`, `staff_members`, `recipes`, `kassa_afdrachten`, `internal_orders` (+ `internal_order_items`). Rechten worden hiermee niet verruimd voor enkelvoudige accounts — die hebben één vestiging, dus dezelfde uitkomst.

**Frontend**
- `src/contexts/UserLocationContext.tsx`: laadt alle vestigingen van het account (`user_roles`, actief) in plaats van `maybeSingle()`. Levert `userLocation` (actief), `availableLocations`, `setUserLocation`. Actieve keuze in `localStorage` per gebruikers-id; validatie tegen de toegestane lijst zodat een oude keuze na een rolwijziging niet blijft hangen.
- `src/components/polar/Header.tsx`: locatieregel wordt een knop met dropdown wanneer er meer dan één vestiging is; anders ongewijzigde tekst. Bestaande tokens en radii, geen nieuwe kleuren.
- `src/components/SidebarLayout.tsx`: geeft de vestigingslijst en wisselactie door aan de header.
- `src/components/LocationGuard.tsx`: controleert op de actieve keuze én valt terug op de volledige lijst, zodat een owner niet meer weggestuurd wordt naar /taken-bediening.
- Schermen die op `userLocation` draaien (voorraad Bestellen/Onderweg/Stand, MEP dag/week/beheer, taken, kassatelling, dashboardkaarten) hoeven geen aanpassing: ze herladen via de context zodra de keuze wijzigt. Waar queries op `userLocation` staan, wordt gecontroleerd dat de query-sleutel de vestiging bevat zodat er niet uit cache van de andere vestiging gelezen wordt.

## Opleveren met klikronde (als owner)
1. Inloggen als owner → header toont de wissel met twee vestigingen.
2. /voorraad met Midsland gekozen → routes van Midsland, geen "Vestiging onbekend".
3. Wisselen naar West → dezelfde pagina toont de West-routes (Midsland-route + leveranciers).
4. Doorklikken naar mise-en-place en taken → data hoort bij de gekozen vestiging.
5. Pagina verversen → laatst gekozen vestiging staat er nog.
6. Controle met een enkelvoudig account (West-teamlid): geen wissel zichtbaar, alles werkt als voorheen.

## Risico's
- De policy-omzetting raakt veel tabellen tegelijk. Elke policy wordt één-op-één vervangen; enkelvoudige accounts houden exact dezelfde uitkomst. Na de migratie draait de klikronde ook met een teamlid-account om te bevestigen dat er niets is verruimd of dichtgeslagen.
- Verkeerde vestiging actief laten staan is een reëel bedieningsrisico (tellen in de verkeerde keuken). Daarom staat de vestiging groot en permanent in beeld, niet verstopt in een menu.

## Genoteerd (buiten deze opdracht)
- De 7 interne leverdagen Midsland → West blijven ongewijzigd tot jij ze tegen het echte leverritme hebt gecheckt.
- Het api-kanaal heeft nog geen geslaagde echte verzending gehad; die volgt als proefbestelling van één artikel zodra de Kooyman-configuratie er staat.
