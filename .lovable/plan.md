# Bestellijst rustiger maken

De schermafbeelding toont nog de oude versie. De vorige stap staat al in de preview (herlaad de pagina):
- "1 × doos 15 kg" onder het aantal is weg; verpakking staat alleen in de bewerkweergave.
- "Geen prijs" is een rustig streepje geworden.
- "eenheid controleren" is één korte badge "Controleer verpakking" onder de productnaam.

## Extra stap (als het na herladen nog druk voelt)
1. Invoerregel bovenaan: alleen "Wat is op?" zichtbaar; aantal en soort verschijnen pas als je een product kiest. Eén groene knop "Toevoegen".
2. Kolomkoppen "Besteld / Product / Aantal / Prijs" weg; het vinkje en de getallen spreken voor zich.
3. Groep "Leverancier onbekend" ingeklapt onderaan, met één tik open.
4. Aantal per rij één regel: "1 doos".
5. Overzichtskaarten blijven, maar strakker: lagere kaarten, getal en label op één lijn, geen gekleurde getallen (kleur alleen in het kleine icoon), gekozen kaart met dunne groene rand i.p.v. dikke rand, korte bijtekst ("€ 81,40", "20 te checken") muted, "tik om te tonen" weg.

## Wat blijft gelijk
Bestellen, aantallen, prijzen, deadlinebadges, de leverancierbot en desktop/iPad-functies. Geen database-wijzigingen, niets publiceren.

## Technisch
Alleen Bestelbord.tsx, BordTabel.tsx en CompacteTabel (koppen optioneel). Mutaties en payloads ongewijzigd.
