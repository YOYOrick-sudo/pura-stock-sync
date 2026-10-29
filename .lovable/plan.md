# Bestellijst: een make-over die je echt ziet

## Wat er nu staat
De vorige ronde heeft vooral onder de motorkap gewerkt: het "…"-menu, de kolomkop "Besteld", tekst onder elkaar op de telefoon en de statuslabels. Op een groot scherm ziet de pagina er bijna hetzelfde uit. Op je schermafbeelding vallen nog deze dingen op:
- Een eigen grote titel "Bestellijst" plus de datum. Dat botst met onze regel dat de titel alleen bovenin de app staat.
- Kolomkoppen die tegen elkaar aan staan ("Besteld Product").
- Kengetallen die tegen elkaar aan staan ("€ 217,73 0").
- Een oranje stip zonder uitleg waar de prijs hoort te staan.
- De leveranciersrij toont een los getal (13, 1) zonder dat duidelijk is wat het betekent.
- De invoerbalk "Wat is op?" is groot en druk.
- De kaartkop "Op het bord" herhaalt het tabblad.

## Wat ik ga veranderen (alleen uiterlijk; bestellen, tellen en opslaan blijven precies hetzelfde)
1. **Bovenkant:** de eigen titel en datum gaan weg. Er komt één rustige balk met de locatie als klein label, de tabbladen en rechts de knop "+ Product".
2. **Snel toevoegen:** één slanke regel in de lijst zelf: een zoekveld met "Wat is op?", rechts aantal en eenheid, en de vink pas als je iets typt.
3. **Lijst:** geen kaartkop meer die het tabblad herhaalt. De kolomkoppen krijgen ruimte, met het vinkje links en daarna Product · Aantal · Prijs · "…".
4. **Leveranciersgroep:** naam links, rechts "13 producten · € 97,42". Groepen zijn in en uit te klappen en tonen een kleine kleurstip als er iets aandacht vraagt.
5. **Geen prijs:** het label "Geen prijs" in plaats van een losse stip.
6. **Samenvatting rechts:** drie kengetallen met elk een eigen vak (Open bedrag · Te checken · Geen prijs). Daaronder een compacte leverancierstabel, waarin nulregels ingeklapt zijn.
7. **Onderaan de lijst:** een eindregel met het totaal ("19 producten · € 217,73").
8. Dezelfde opbouw voor Advies, Tellen en Onderweg, zodat de vier tabbladen er hetzelfde uitzien.

## Controle
- Schermafbeeldingen op telefoon, iPad en desktop, ingelogd. Die laat ik je zien vóór ik klaar meld.
- Bestaande tests blijven slagen.

## Technisch
- Alleen de presentatie: Bestelbord.tsx en components/kitchen/bestelbord/*. Gegevens en handlers blijven gelijk.
- Bouwblokken uit components/pura: PaginaBalk, StatusLabel, TabelVoet, KengetalVerdeling, InklapGroep.
- De pagina-wrapper wordt `space-y-4` zonder eigen H1, en de titel loopt via getPageTitle.
