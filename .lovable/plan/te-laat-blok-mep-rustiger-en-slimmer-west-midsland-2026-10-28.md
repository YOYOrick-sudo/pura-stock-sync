# Te laat-blok MEP rustiger en slimmer (West + Midsland)

## Wat verandert
1. **Doorschuiven past zich aan het tijdstip aan**
   - Vóór de avondgrens (Midsland 17:00, West zoals nu: geen grens): knoppen zeggen "Vandaag" / "Alles naar vandaag".
   - Na de avondgrens: knoppen zeggen "Morgen" / "Alles naar morgen" en zetten taken op de **volgende open dag** (dezelfde regel als bij nieuwe taken na 17:00, dus gesloten dagen worden overgeslagen). Is de volgende open dag niet morgen, dan toont de knop de dagnaam, bijv. "Naar wo".
2. **Knoppen subtieler**
   - "Alles naar …" wordt een omlijnde (outline) knop i.p.v. groen gevuld; "Wissen" blijft rustig grijs.
   - Per-taak knop wordt een kleine omlijnde knop i.p.v. rood. Tikdoel blijft 44px.
3. **Uitlegregel met info-icoon weg** uit het Te laat-blok.
4. **Badge korter**: "2 dagen te laat" wordt "2 dagen"; bij 1 dag blijft het "Gisteren" i.p.v. "Overtijd". De badge "7+ dagen — nog nodig?" blijft.

## Praktijk
- Wie 's avonds afsluit, schuift met één tik de restjes naar de eerstvolgende werkdag in plaats van naar een dag die al voorbij is.
- Undo-melding blijft, historie blijft bewaard.

## Technisch
- `MepDag.tsx`: doeldatum bepalen met bestaande `mep-avondgrens.ts` + `mep_volgende_open_dag`; `opruimen(rijen, 'vandaag')` krijgt doeldatum mee. Hint-prop weg, Button-varianten naar `outline`, badgetekst aanpassen.
- Bestaande Bun-tests voor avondgrens draaien; test toevoegen dat doorschuiven na 17:00 Midsland naar volgende open dag gaat.
