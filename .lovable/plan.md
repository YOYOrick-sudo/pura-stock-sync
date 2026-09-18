# Reservelade midden onder: standaard leeg, en de keten schuift mee

## Wat er verandert

**1. De reservelade begint op nul**

In de lade midden onder (de reservebakjes) staat nu standaard "1 ligt er" ingevuld. Dat draaien we om: elk product begint op **0**. Ligt er wél een reservebakje, dan tik je dat aan — en dan hoeft er niets te gebeuren. Staat het op 0, dan komt het product op de aanvulbon en wordt het diezelfde dag bijgevuld.

Veiligheidsregel: die nul telt pas mee zodra je de lade hebt afgerond met de balk onderin. Sla je de lade helemaal over, dan komt er niets op de bon — anders zou een vergeten lade elke dag onnodige aanvullingen en bestellingen maken.

**2. Bijvullen trekt automatisch aan de keten**

Vul je een reservebakje bij, dan haal je een zakje uit de koelcel — en dan staat de koelcel één zakje lager. Dat wordt nu vanzelf meegenomen: de aanvulbon zet er direct de volgende stap bij.

Voorbeeld tomatenrelish:

```text
1 bakje bijvullen   → uit de koelcel
1 zakje aanvullen   → uit de vriescel (sticker "Ontdooid" wordt geprint)
```

Bij producten die West zelf maakt (hummus, de mayonaises) wordt de vervolgstap geen vriescel maar een MEP-taak; bij producten uit Midsland een regel op de interne bestellijst. Telt iemand de koelcel diezelfde ronde ook, dan worden de twee regels samengevoegd — je haalt nooit dubbel.

**3. Je ziet het gebeuren bij de koelcel**

Tik je in de reservelade een product op 0, dan wordt de telling van datzelfde product in de koelcel meteen zichtbaar bijgesteld: het aantal gaat één omlaag en er staat een klein groen labeltje "−1 voor de werkbank" bij. Zo zie je tijdens het lopen al wat het bijvullen met de koelcel doet, in plaats van het pas op de bon te ontdekken. Tel je de koelcel daarna zelf (omdat er iets anders ligt dan verwacht), dan telt jouw eigen telling en verdwijnt de automatische bijstelling.

## In de praktijk

De sluitdienst trekt de reservelade open en tikt per product aan of er een reservebakje ligt. Alles wat op nul blijft staan, staat even later op de bon: eerst bijvullen uit de koelcel, en meteen eronder wat er uit de vriescel mee terug moet. Geen mondelinge overdracht, geen gat in de voorraad de dag erna.

Risico om te kennen: het bijhouden van de koelcel wordt hierdoor scherper, maar ook strenger — tik je per ongeluk 0 terwijl er wel een bakje ligt, dan haal je een zakje te veel uit de vriescel. Dat is met één tik te corrigeren zolang de bon nog niet is doorgezet.

## Technisch

- `src/components/foh/VoorraadRonde.tsx`: voor lades met `rol = 'reserve'` start `TelRegel` op 0 in plaats van `telDoel` (nieuwe prop `startWaarde`), en bij het sluiten van zo'n lade via de balk worden alle nog niet aangetikte producten vastgelegd als 0 in `telling`. Lades die nooit worden afgerond blijven buiten de bon (huidig gedrag).
- Aanvulbon: bij een bonregel met `soort: 'koelcel' | 'magazijn'` wordt de keten één stap verder doorgerekend. Het onderliggende niveau wordt verlaagd met het gehaalde aantal; komt het daardoor onder zijn doel, dan komt er een extra regel via dezelfde `vervolgactieVoorRegel`-route (vriescel met ontdooi-sticker, MEP of Midsland/bestelbord). De regels worden per item samengevoegd, zodat een eigen telling van de koelcel niet dubbel optelt.
- Zichtbare doorwerking: een afgeleide `afgeleideTelling`-map (koelcelitem-id → aantal onttrokken voor de werkbank) wordt berekend uit de reservetellingen en aan `TelRegel` doorgegeven als voorgestelde waarde plus `VoorraadChip variant="klaar"` met "−1 voor de werkbank". Een handmatige telling in `telling` wint altijd van de afgeleide waarde; de bonberekening gebruikt dezelfde samengevoegde waarde, zodat scherm en bon nooit uiteenlopen.
- Geen databasewijziging: `voorraad_lades.rol` en de ketenvelden bestaan al.

## Testen

West → Sluiten → Keuken → Voorraadronde → Midden onder: alle producten staan op 0; tomatenrelish op 0 laten en de lade afronden geeft op de bon "1 bakje uit de koelcel" plus "1 zakje uit de vriescel"; een product op 1 zetten geeft geen enkele regel; koelcel tellen in dezelfde ronde levert geen dubbele vriescelregel op.
