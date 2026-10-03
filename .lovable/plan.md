# Voorraadronde West: gekookt ei verplaatsen + kokosschilfers-keten repareren

## Wat er speelt

**1. Gekookt ei in de verkeerde lade**
"Gekookte eieren (bio)" ligt nu in lade Rechts onder. Hij hoort in lade Midden midden.

**2. Kokosschilfers op het werkblad zegt "op de MEP" — moet "aanvullen uit het magazijn" zijn**
Oorzaak is een datafout, geen codefout. Het werkblad-item "Kokosschilfers" heeft productsleutel `kokosschilfers`, maar de actieve magazijnbak heet `kokosschilfers-zak`. Omdat de sleutels niet matchen, vindt de keten geen magazijnniveau eronder en valt hij terug op de bron "magazijn" — en die betekent in de logica "zelf roosteren" → MEP. Er ligt ook nog een gearchiveerde regel "Kokosschilfers geroosterd" met de oude sleutel; die blijft gearchiveerd.

## Aanpassingen (alleen data, geen code)

1. **Gekookte eieren (bio)** (`ee69c05b-368b-43af-b39f-1d108f840c7c`): lade_id van Rechts onder naar Midden midden (`c4fd17a2-19c5-42a4-879a-fb853517249e`).
   - Let op: Midden midden is een reservelade (rol `reserve`). De kokosyoghurt zit al op dezelfde manier in Midden onder, dus dit patroon bestaat al. Het ei blijft zijn eigen telwijze houden (vol/half/bodempje/leeg); alleen de plek in de ronde verandert.
2. **Kokosschilfers werkblad** (`e089c13d-88a9-44ba-afe7-ae15131607e2`): productsleutel `kokosschilfers` → `kokosschilfers-zak`, zodat hij koppelt aan de actieve magazijnbak. Bij een tekort verschijnt dan "bijvullen uit het magazijn" en komt hij op de aanvulbon onder "Halen uit het magazijn" — niet meer op de MEP.
3. Logregel in `migratie_logboek` voor beide wijzigingen.

## Testen

- Databasecontrole: ei in Midden midden, kokosschilfers-sleutel gelijk aan de magazijnbak.
- Live op telefoonformaat (390px) met het West-testaccount: proeftelling kokosschilfers op bodempje → verwacht "bijvullen" (magazijn), geen MEP-vermelding; ei zichtbaar onder Midden midden. Niets afronden, dus geen testdata achtergelaten. Testaccount daarna weer uit.

## Risico's

- Klein: beide wijzigingen zijn pure data; historie en tellingen blijven ongemoeid.
- Het ei verhuist naar een reservelade: als dat in de praktijk raar telt (standaard 0 i.p.v. doel), melden — dan zetten we de laderol om of verplaatsen we hem anders.
