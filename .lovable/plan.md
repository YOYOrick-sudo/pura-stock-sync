# Eilandbezorger: klaarmaken voor gezamenlijke test (alleen Midsland 36864)

Live verzending blijft uit. Er wordt niets in Lightspeed gewijzigd (alleen lezen).

## Wat ik vooraf heb vastgesteld
- Karins CSV: 89 producten (`PV-…`) en 25 keuzes/extra's (`PVK-…`), met naam, groep en prijs.
- De koppelingstabel voor producten is nog leeg (0 regels); daarom werd haar test afgekeurd met "Onbekend product".
- Oorzaak korting-fout bevestigd: het kortingsveld mag nu wel ontbreken, maar `null` wordt geweigerd (400). Een echte korting (> 0) wordt al afgekeurd.
- Onze app haalt nu geen actuele productkaart uit Lightspeed op, alleen verkochte bonnen.

## Stappen
1. **Lightspeed Midsland uitlezen (alleen lezen)**
   Via de bestaande Midsland-verbinding de actuele productlijst ophalen: producten, prijzen (bezorgprijs als die apart bestaat, anders de gewone prijs), formaten en extra's/keuzegroepen. Eenmalig, via een kleine alleen-lezen beheeractie in de bestaande beheerfunctie, met het centrale tokenbeheer. Niets opslaan behalve het resultaat van de koppeling.
2. **Koppelen**
   - Zeker = naam en groep komen eenduidig overeen én de prijs is gelijk → opslaan in de koppelingstabel (product of extra), met de Lightspeed-prijs.
   - Niet zeker (prijsverschil, meerdere kandidaten, geen kandidaat, keuze zonder duidelijk gerecht) → niet opslaan; komt in een beslislijst.
   - Keuzes van 0 cent (Klein, Vegan, Glutenvrij, broodkeuze) en formaatprijzen worden apart gecontroleerd.
3. **Korting**
   Kortingsveld mag ontbreken óf `null` zijn → bestelling zonder korting. Echte korting blijft afgekeurd. Plus één test die `null` aantoont.
4. **Eigen testbestelling**
   Na bevestiging van koppeling en prijs: één fictieve bestelling Zoete Aardappel Friet (PV-FFA8275F), modus test, geen extra's/korting, nieuw nummer `TEST-EB-…`. Status teruglezen en aantal verzendpogingen controleren (doel: `test_ok`, 0 pogingen). Lukt de friet niet zeker, dan een ander zeker gekoppeld product.
   Testregel blijft staan als bewijs; verwijderen alleen na jouw akkoord (zoals ook `TEST-1795214886199`).
5. **Rapport voor jou**
   - Testproduct voor Karin: code, naam, prijs.
   - Resultaat eigen test: nummer, status, aantal pogingen.
   - Beslislijst: Eilandbezorger-prijs naast Lightspeed-prijs; per onduidelijke extra precies welke informatie ontbreekt.
   - Wat ontbreekt voor de kassaproef (o.a. bevestigd orderformaat, klant/betaalwijze in Lightspeed, live-volgorde).
   - Antwoord: neemt onze app een prijswijziging in Lightspeed al over (nee, vaste prijs in koppeling) en kan Eilandbezorger de kaart ergens ophalen (nee, bestaat nog niet) — met wat ervoor gebouwd zou moeten worden.
   - Duidelijk gescheiden: getest / nog te bouwen / nog af te stemmen.

## Risico's
- Preview en live delen dezelfde database: de koppelingen staan direct live, maar zonder live-schakelaar gaat er niets naar de kassa.
- Bij een te losse naamvergelijking kan een verkeerd product gekoppeld worden; daarom alleen bij exacte, eenduidige overeenkomst automatisch.
- Lightspeed kent mogelijk geen aparte bezorgprijs; dan vergelijk ik met de gewone kassaprijs en meld dat.

## Technisch
- `eilandbezorgerLogica.ts`: `korting: z.object(...).nullish()`; Deno-test toevoegen.
- `eilandbezorger-beheer`: manager-only GET-actie die de L-Series productkaart (items, modifiers/keuzegroepen) leest via `_shared/lightspeedToken.ts`; geen schrijfroutes naar Lightspeed.
- Koppelingen via insert in `externe_product_koppeling` (vestiging 36864, soort product/extra); upsert op unieke sleutel.
- Redeploy van alleen `eilandbezorger-bestelling` en `eilandbezorger-beheer`; frontend niet publiceren.
