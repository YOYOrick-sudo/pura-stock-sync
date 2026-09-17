# Sluitlijst West duidelijker maken: vriescel, ontdooien en dubbele regels

## Wat er nu misgaat (gecontroleerd in de database en het scherm)

1. **Het blok "Uit de vriezer (ontdooien)" mengt twee dingen.** Het bevat zowel losse ontdooi-acties als de vaste vriescelvoorraad. Daardoor staat er nu "6 bakken sinaasappelcheesecake, 5 notenbar, 6 bananencake, 2 koffiebrownie ontdooien" terwijl dat de standaardvoorraad van de vriescel is, niet wat er ontdooid moet worden.
2. **Bananenpannenkoeken staat verkeerd in de keten.** Er is een vriescelregel en een koelwerkbankregel, maar geen koelcelregel. Het systeem zoekt bij "Op" alleen één niveau lager (de koelcel), vindt niets en maakt dan een losse taak aan in plaats van door te verwijzen naar de vriescel.
3. **De regel "Zoet (alleen als echt op)" staat er nog** als los product in de vriescel. Die klopt niet meer nu elk zoet product zijn eigen regel heeft.
4. **Dubbele vriescelregels:** Avocado spread, Tomatenjam, Tomatenrelish en Wortelspread staan elk twee keer in de vriescel (met verschillende herkomst).

## Wat we ervan maken

**Blok 1 — "Vriescel op peil (maandag)"** (was: Uit de vriezer/ontdooien)
Een voorraadcontrole die alleen op maandag verschijnt — de laatste open dag voor de dinsdagsluiting, en het moment dat de bestelling voor Midsland eruit kan. De rest van de week blijft dit blok verborgen, zodat de sluitlijst kort blijft. Knoppen "Aanwezig" en "Op". Is iets op, dan gaat het automatisch naar de interne bestellijst voor Midsland (dat werkte al zo, maar zat verstopt achter het woord "ontdooien"). Staat er maandag nog een regel open, dan blijft die de dinsdag erna niet hangen; de check komt de volgende maandag gewoon terug.


**Blok 2 — "Koelcel op peil"**
Blijft zoals het is, met één toevoeging: bij producten die ook in de vriescel liggen komt er een extra knop **"Ontdooid"** met sneeuwvlok. Die markeert de regel als geregeld én print meteen de Ontdooid-sticker. Daar hoort het ontdooien namelijk thuis: je haalt uit de vriezer omdat de koelcel aangevuld moet worden.
"Op" op een koelcelregel blijft betekenen: ook de vriescel nakijken.

**Blok 3 en 4 — koelwerkbank en toppings**
Ongewijzigd, behalve dat de keten nu doorzoekt: is er geen koelcelregel (zoals bij bananenpannenkoeken), dan verwijst "Op" door naar de vriescelregel.

## Aantallen op de interne bestelling

Zo werkt het nu: tik je op "Op", dan zet het systeem de **volle standaardhoeveelheid** op een conceptbestelling voor Midsland. Liggen er nog vier van de zes zakken rode kool, dan komen er dus zes op de lijst in plaats van twee. Staat het product er al op, dan wordt er niets dubbel bijgezet.

Wat we toevoegen:
- Naast "Op" komt er een knop **"Te weinig"**. Daarmee tik je in één klein venstertje het aantal dat er nog ligt (grote plus/min-knoppen, geschikt voor natte handen). Het systeem rekent het tekort uit en zet alleen dat aantal op de bestelling.
- "Op" blijft bestaan voor het snelle geval: niets meer aanwezig, hele hoeveelheid bestellen.
- Onder de regel komt te staan wat er doorgezet is, bijvoorbeeld "2 zakken naar de lijst voor Midsland", zodat het zichtbaar is zonder het scherm te verlaten.
- Alles komt samen op de conceptbestelling voor Midsland, terug te zien onder **Voorraad**. Elke regel houdt bij dat hij uit de sluitlijst komt.


## Opschoning in de gegevens

- "Zoet (alleen als echt op)" archiveren (niet verwijderen).
- Per dubbel product één vriescelregel houden, de andere archiveren; herkomst gelijktrekken (Avocado spread, Tomatenjam, Tomatenrelish, Wortelspread).

## Technisch

- `useKoelcelCheck.ts`: `NIVEAU_ONDER` vervangen door een zoekvolgorde per plek (`werkbank`/`werkblad` → `koelcel` → `vriezer`) zodat `vervolgactieVoorRegel` het eerstvolgende bestaande niveau pakt in plaats van alleen het directe niveau eronder.
- `KoelcelCheckBlok.tsx`: vriezerblok krijgt titel "Vriescel op peil (maandag)", nieuwe uitleg en `klaarLabel="Aanwezig"`, en wordt alleen gerenderd als de gekozen datum een maandag is (weekdag uit `datum`, Europe/Amsterdam). De sticker-/ontdooilogica (`handleUitVriezer`) verhuist naar een extra knop op koelcelregels die een gekoppelde vriescelregel hebben.
- Migratie `voorraadcheck_west_opschoning`: `actief = false` voor de legacy-zoetregel en de dubbele vriescelregels; herkomst corrigeren waar nodig. Geen harde verwijderingen.

## Risico's

- De statussen van vandaag blijven behouden; alleen gearchiveerde regels verdwijnen uit beeld.
- De ontdooi-sticker verplaatst naar een andere knop: dat is een gewoontewijziging voor het team, maar de sticker blijft identiek en gaat naar dezelfde printer.
