# MEP: datumbadges en blokverdeling weg, één rustige lijst

## Doel
Een taak die je erop zet loopt vanzelf door naar elke volgende dag tot hij afgevinkt is — dat is al zo. Wat we weghalen is de visuele ruis die eraan hangt: geen "van gisteren", geen "N dagen open", geen aparte blokken "Blijft staan" / "Vandaag". Een voltooide taak is gewoon voltooid, zonder dagvermelding.

## Wat verandert voor het team
- De lijst is één onverdeelde lijst, gesorteerd op prioriteit zoals nu (Belangrijk eerst).
- Enige signaal dat blijft: een taak die 7 dagen of langer openstaat krijgt het rode waarschuwingsbadge "7+ dagen — nog nodig?". Dat is het moment om bewust af te vinken of te verwijderen.

## Technische aanpassing
- `src/pages/kitchen/MepDag.tsx`:
  - In weergave "Alle taken" geen splitsing meer in `Blijft staan` / `Vandaag`; altijd één groep `Alle taken` met de bestaande sortering (meegenomen taken staan vanzelf bovenaan door de bestaande sorteerlogica op datum + prioriteit).
  - Datumbadge ("van gisteren" / "N dagen open") verwijderen; alleen de 7+-waarschuwing blijft.
  - Weergaven "Per persoon" en "Per handeling" blijven ongewijzigd.
- `src/hooks/useMepTaken.ts`: `achterstandLabel()` verwijderen (vervallen); `dagenOpen()` behouden voor de 7+-waarschuwing.
- Geen database-, RLS- of query-wijziging: de meeneem-query (open/bezig-taken van eerdere dagen) blijft exact zoals die is.

## Praktijkcheck
- Nieuwe teamleden zien gewoon "wat er nog moet", zonder te hoeven snappen waarom iets "van donderdag" is.
- Risico dat de lijst ongemerkt volloopt met oude taken wordt afgedekt door de 7+-waarschuwing.
- Historie (weekoverzicht, afgeronde taken per datum) blijft ongewijzigd; alleen de dagweergave wordt rustiger.

## Verificatie
- Typecheck + build groen.
- In de preview: West-MEP openen met een oudere open taak → geen datumbadge, geen "Blijft staan"-kop, wel 7+-badge bij oude taak; afvinken werkt zoals voorheen.
