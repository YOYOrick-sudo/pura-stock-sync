# MEP: datumbadges en blokverdeling weg, één rustige lijst

## Doel
Een taak die je erop zet loopt vanzelf door naar elke volgende dag tot hij afgevinkt is — dat is al zo. Wat we weghalen is de visuele ruis die eraan hangt: geen "van gisteren", geen "N dagen open", geen aparte blokken "Blijft staan" / "Vandaag". Een voltooide taak is gewoon voltooid, zonder dagvermelding.

## Wat verandert voor het team
- "Alle taken" wordt één onverdeelde lijst: eerst Belangrijk, daarna op volgorde van invoeren. Wat het eerst is ingevoerd staat bovenaan en blijft die plek houden, ook de volgende dag.
- De keuzeknoppen bovenaan blijven: **Alle taken**, **Per persoon**, **Per handeling**. Wil je alles van "snijden" of "bereiden" onder elkaar, dan kies je Per handeling — dat verandert niet.
- Enige signaal dat blijft: een taak die 7 dagen of langer openstaat krijgt het rode badge "7+ dagen — nog nodig?". Dat is het moment om bewust af te vinken of te verwijderen.

## Technische aanpassing
- `src/pages/kitchen/MepDag.tsx`:
  - Weergave "Alle taken": geen splitsing meer in `Blijft staan` / `Vandaag`; altijd één groep `Alle taken`.
  - Sortering binnen die lijst: prioriteit (Belangrijk eerst), daarna oudste `taak_datum`, daarna `volgorde` / `created_at` — zodat volgorde van invoeren leidend is en stabiel blijft over dagen heen.
  - Datumbadge ("van gisteren" / "N dagen open") verwijderen; alleen de 7+-waarschuwing blijft.
  - Weergaven "Per persoon" en "Per handeling" blijven exact zoals ze zijn.
- `src/hooks/useMepTaken.ts`: `achterstandLabel()` verwijderen (vervalt); `dagenOpen()` behouden voor de 7+-waarschuwing; meegenomen-sortering hierop afstemmen.
- Geen database-, RLS- of query-wijziging: de meeneem-query (open/bezig-taken van eerdere dagen) blijft exact zoals die is.

## Praktijkcheck
- Nieuwe teamleden zien gewoon "wat er nog moet", zonder te hoeven snappen waarom iets "van donderdag" is.
- Risico dat de lijst ongemerkt volloopt met oude taken wordt afgedekt door de 7+-waarschuwing.
- Historie (weekoverzicht, afgeronde taken per datum) blijft ongewijzigd; alleen de dagweergave wordt rustiger.

## Verificatie
- Typecheck + build groen.
- In de preview: West-MEP met een oudere open taak → geen datumbadge, geen "Blijft staan"-kop, wel 7+-badge bij een taak van 7 dagen of ouder.
- Wisselen naar "Per handeling" groepeert nog steeds correct op snijden/bereiden.
