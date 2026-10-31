# Stap 75 — rustige telkaart

**Categorie:** alleen UI en tests. Geen wijzigingen aan gegevens, rechten, tellinglogica of publicatie.

## Resultaat voor het team
- In Bestelbord → Advies keuken staat per artikel één compacte telrij: naam, kleine signalen, aantal, korte eenheid en een vinkknop om op te slaan.
- De keukenmedewerker gebruikt dit op telefoon (390 px) of tablet tijdens de avondtelling. Uitleg is op tik beschikbaar; er verandert geen telafspraak.
- De kop wordt **Vanavond tellen** met de bestaande teller. Bij de bestaande dicht-conditie: **Vanavond dicht**, met de doorschuifuitleg achter een info-icoon.
- De overige artikelen blijven ingeklapt en gebruiken dezelfde rij.

## Wijzigingen
- Alleen `src/components/kitchen/bestelbord/KeukenTelblok.tsx`, bestaande/aanvullende testbestanden en `public/telkaart/zalmzijde-visueel.png` aanpassen.
- De afbeelding op het exacte bestaande pad vervangen door de bijlage.
- Bestaande Pura-kaartkop, invoer, knoppen, badges, Popover en Dialog hergebruiken. Geen nieuwe kleuren, stijlsysteem of libraries.
- Laatst geteld, poolreden, teleenheid en verwachte stand uitsluitend in een tikbare info-popover tonen.
- Controle als waarschuwingsicoon met eigen tikbare uitleg; geteld als muted vinkicoon.
- Hint als niet-afbrekende chip naast de naam; afbeelding openen met een icoonknop met `Plaatje {naam}` als toegankelijk label.
- Opslaan krijgt `Opslaan {naam}` als toegankelijk label. Validatie, blokkering, foutmelding, succesmelding en leegmaken blijven identiek.

## Praktijkrisico en controle
- Op 390 px concurreren chip, iconen en invoerveld om ruimte: de naam wordt als eerste afgekapt; vaste delen blijven zichtbaar. Controle met een lange naam en alle signalen tegelijk, zonder horizontale overloop. De volledige naam blijft beschikbaar in de detail-popover.
- Bij vergeten tellen, haperende verbinding of mislukte opslag blijft het bestaande gedrag behouden; geen nieuwe automatische tellingen of gegevensgroei.
- Bestaande bestellingen, printer en koppelingen worden niet geraakt.

## Verificatie
- Bestaande render-tests bijwerken voor de nieuwe kop, teller, compacte rij en verborgen uitleg.
- Tests voor controle-icoon, hintchip, afbeeldingsknop, dichte avond en ongewijzigde opslag met `(telartikel_id, aantal)`.
- Vaste suite uitvoeren: `/tmp/stap63-tests/node_modules/.bin/vitest run --config /tmp/stap63-tests/stap68b.config.mjs`; aantal geslaagde tests melden.
- Schermcontrole op 390 px: rij, tikbare uitleg, afbeelding en inklapgroep. Geen echte telling opslaan in de gedeelde database; opslaggedrag controleren met een testcallback.

**Open vragen:** geen. Geen publicatie of databasewijzigingen.