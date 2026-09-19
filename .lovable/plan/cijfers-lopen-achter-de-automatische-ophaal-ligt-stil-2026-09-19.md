# Cijfers lopen achter: de automatische ophaal ligt stil

## Wat er aan de hand is

Niet Lightspeed zelf is stuk. De koppeling met beide kassa's staat gewoon nog open (Midsland en West, inclusief geldige vernieuwsleutel). Wat stilstaat is het automatische klusje dat elk half uur de cijfers ophaalt.

Vastgesteld:
- Laatste geslaagde ophaal: donderdag 18 september, 08:05 (NL tijd). Daarna niets meer — ook Eitje (uren) niet.
- Sindsdien mislukt elke geplande poging, elke 30 minuten, met dezelfde melding: het interne wachtwoord waarmee de planner de ophaal start is verdwenen uit de beveiligde kluis.
- In die kluis staat nu alleen nog de sleutel voor het afvalschema. De sleutel voor de cijfers-ophaal is er niet meer (waarschijnlijk verwijderd of ongeldig geworden bij een sleutelwissel op 18 september).
- Gevolg: Cijfers toont data tot en met 17 september; 18 en 19 september ontbreken.

## Wat ik ga doen

1. **De ophaal weer laten starten.** De planner gaat zich niet langer aanmelden met de verdwenen sleutel, maar met het eigen toegangswoord van de ophaal-functies zelf (dat bestaat al en werkt). Dat woord komt veilig in de kluis te staan, zodat de planner er weer bij kan.
2. **Direct testen** door de ophaal één keer handmatig te starten voor beide vestigingen en te controleren dat er weer "gelukt" in het overzicht verschijnt.
3. **De gemiste dagen inhalen**: 17 t/m 19 september opnieuw ophalen voor Midsland en West, plus de uren uit Eitje, zodat Cijfers weer compleet is.
4. **Zichtbaar maken als het nóg eens gebeurt.** Nu stond het ruim een dag stil zonder dat iemand het zag. De regel "Bijgewerkt: …" onder Cijfers wordt rood met een duidelijke tekst zodra de laatste geslaagde ophaal ouder is dan 4 uur, en op de bronnenpagina komt bovenaan een blok te staan dat de laatste mislukte pogingen en de foutmelding toont.

## Wat dit in de praktijk betekent

- Cijfers is vandaag na de inhaalslag weer bij. Je hoeft zelf niets te doen.
- Na de herstelactie loopt de ophaal weer elk half uur, en 's nachts de controleronde over de vorige dag.
- Risico om te weten: als er buiten deze app om iets met hetzelfde toegangswoord meekijkt (bijvoorbeeld een n8n-flow die de sync aanroept), dan moet dat woord daar gelijk blijven. Ik verander de bestaande woorden niet, ik zet ze alleen ook in de kluis — zo blijft alles wat er nu op leunt gewoon werken.

## Technisch

- Oorzaak: `public.trigger_sync_edge()` leest `vault.decrypted_secrets` op naam `email_queue_service_role_key`; die rij bestaat niet meer → `RAISE 'service_role token not found in vault'`. Cron-jobs 53–58 (`ls-hot-*`, `ls-reconcile-*`, `eitje-*`, `lightspeed-sync-dagelijks`) falen daardoor allemaal in `cron.job_run_details`.
- Beide sync-functies draaien met `verify_jwt = false` en accepteren de header `x-sync-token` (`LIGHTSPEED_SYNC_TOKEN` / `EITJE_SYNC_TOKEN`). Geen service_role key nodig — die is op Lovable Cloud sowieso niet opvraagbaar.
- Migratie: `vault.create_secret()` voor `lightspeed_sync_token` en `eitje_sync_token`, en `trigger_sync_edge` herschrijven zodat hij per functie de juiste kluiswaarde pakt en die als `x-sync-token` meestuurt (Authorization-header vervalt).
- Backfill via bestaande handmatige sync-aanroep met `van=2026-09-17`, `tot=2026-09-19` per vestiging + eitje-sync over dezelfde periode.
- Monitoring: `BijgewerktRegel` krijgt expliciete tekst bij niveau `alarm`; `BronnenBlok` krijgt een lijst van de laatste mislukte cron-runs (read-only query op `cron.job_run_details` via een `security definer`-view, owner-only).
