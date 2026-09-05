# Stickers in West en het vastlopen van de app

## Wat ik in de gegevens zie

- Elke stickeropdracht van de afgelopen dagen komt uit West en staat op "geprint" — de laatste op donderdag 4 september om 14:37. Vandaag staat er geen enkele opdracht in de wachtrij.
- Er zijn geen mislukte opdrachten sinds 17 augustus.
- De app en de printserver houden nergens bij wie de opdracht maakte (mise en place of Snel printen) en of de printserver in de keuken nog leeft. Daardoor is nu niet te zien of een sticker wel is verstuurd en onderweg bleef steken, of dat er nooit iets is verstuurd.

Ik kan dus niet hard zeggen waar het misgaat. Dat eerst zichtbaar maken is stap 1; anders bouwen we blind.

## Stap 1 — zichtbaar maken wat er met een sticker gebeurt

- Bij elke stickeropdracht wordt vastgelegd: vestiging, waar hij vandaan komt (mise en place of Snel printen) en wie hem maakte.
- De printserver in de keuken meldt zich elke ronde. Daarmee weten we of hij draait.
- Nieuw statusblokje boven in Snel printen en in mise en place:
  - "Printer actief — laatste sticker om 14:37" (groen), of
  - "Printer reageert al 12 minuten niet" (oranje) met de tekst: controleer of het kastje bij de printer aan staat.
- Blijft een opdracht langer dan 2 minuten wachten, dan verschijnt in beeld: "Sticker staat nog in de wachtrij" met een knop **Opnieuw sturen**.
- Overzichtje "Laatste stickers" (10 stuks, met status) zodat je bij twijfel niet blind opnieuw drukt.

Zo zie je binnen een dienst zelf of het aan de app ligt of aan de printer, en kun je nooit meer een "verstuurd"-melding krijgen terwijl er niets gebeurt.

## Stap 2 — de melding eerlijker maken

Nu zegt de app "Sticker naar printer gestuurd" zodra de opdracht in de wachtrij staat. Dat wordt: "Sticker in de wachtrij" en pas als de printer hem heeft afgedrukt verandert het naar "Sticker geprint". Bij een fout van de printer krijg je die fout in beeld, met opnieuw proberen.

## Stap 3 — het vastlopen / blijven laden

Waarschijnlijke oorzaak op de keukentablet: de tablet valt in slaap of verliest even wifi, de verbinding met de server blijft dood en het scherm blijft in laadstand hangen. Aanpak:

- Bij terugkeer in beeld (tablet weer wakker) automatisch opnieuw ophalen en de live-verbinding herstellen.
- Harde tijdslimiet op laden: na 10 seconden geen antwoord toont het scherm "Verbinding kwijt — opnieuw proberen" in plaats van eeuwig te blijven draaien.
- Een vangnet rond de schermen zodat één fout niet het hele scherm wit maakt.
- Zichtbaar bolletje in de kop: online / offline.

Ik zet daarbij een eenvoudige foutregistratie aan, zodat ik bij een volgende melding kan zien wélk scherm bleef hangen in plaats van te gokken.

## Praktijk

- Wie: keuken West op de iPad, midden in de bereiding. Alles blijft grote knoppen, geen extra stappen; de statusregels zijn alleen kijkwerk.
- Wat verandert er voor het team: als de printer niet reageert zie je dat meteen, en je drukt op Opnieuw sturen in plaats van vier keer op de vink.
- Risico nu: iemand denkt dat een sticker geprint is terwijl er niets uitkwam — verkeerde of ontbrekende houdbaarheidsdatum op een bak. Dat lost stap 1 en 2 op.
- Bestaande printflow naar de Raspberry Pi verandert niet in werking; er komt alleen registratie en een hartslag bij.

## Technisch

- Migratie: `print_jobs` uitbreiden met `vestiging text`, `bron text` (`mep` | `snel_printen` | `recept`); index op `status, created_at`. Nieuwe tabel `print_bridge_status` (vestiging, laatste_claim, laatste_print) met GRANT + RLS (lezen voor `authenticated`, schrijven alleen `service_role`).
- `claim_next_print_job` en de `complete`-actie in `supabase/functions/print-bridge/index.ts` werken `print_bridge_status` bij. Claim blijft vestiging-agnostisch tot bevestigd is dat er één printer is; het veld wordt wel gevuld.
- Frontend: `usePrintJobs.ts` / `useStickerProducten.ts` vullen `vestiging` (uit `UserLocationContext`) en `bron`; nieuwe hook `usePrintStatus` (polling 15s) + component `PrintStatusBalk`, gebruikt in `SnelPrinten.tsx` en `MepDag.tsx`. `MepAfrondDialog.tsx` toont wachtrij-status in plaats van directe succesmelding.
- Stabiliteit: QueryClient-defaults (`refetchOnWindowFocus`, `retry` met backoff), `visibilitychange`-handler die realtime-kanalen opnieuw opent, `ErrorBoundary` in `App.tsx`, en een laad-timeout-component. Geen nieuwe libraries.
