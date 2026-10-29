# Uitzoeken waarom de preview geen veranderingen laat zien

De nieuwe code staat in het project: de Bestellijst gebruikt het nieuwe "…"-menu, de nieuwe statuslabels en de nieuwe tabellen, en /design-system haalt de nieuwe onderdelen op (Start, Recepten, Regels, Controlelijst).

## Stappen
1. Open de preview als ingelogde gebruiker op /kitchen/bestelbord en /design-system, en maak schermafbeeldingen op telefoon-, iPad- en desktopbreedte.
2. Lees de fout- en consolelogs van de preview na. Een fout kan ervoor zorgen dat een oude versie blijft staan.
3. Zet de oude en de nieuwe versie naast elkaar om te zien wat er echt verschilt.
4. Als de preview een oude versie laat zien: zorg dat de nieuwe versie laadt.
5. Als de veranderingen wel zichtbaar zijn maar te klein: laat met de schermafbeeldingen zien wat er veranderd is, en stel daarna een duidelijk zichtbaardere make-over van de Bestellijst voor (paginabalk bovenaan, samenvatting rechts, rustiger rijen). Dat bouw ik pas als jij akkoord geeft.

## Technisch
- Playwright met een sessie die vooraf ingelogd is, op localhost:8080.
- build-errors.log en runtime-errors.log nalezen.
- De dev-server alleen herstarten volgens de vaste procedure, en alleen als hij vastzit.
