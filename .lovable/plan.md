# Voorraadcheck West opnieuw opgezet: tellen en aanvullen uit elkaar

## Wat ik heb onderzocht

**In jullie eigen systeem** (code + database, gecontroleerd):

- 109 actieve West-regels: 44 koelcel, 34 koelwerkbank, 28 vriescel, 3 toppings. De koelcel is één raster van 44 producten zonder enige indeling — vis, mayonaises, groente en 16 zoete producten door elkaar. Er bestaat **geen categorie-veld** in de tabel.
- **14 verschillende eenheden** ("stuks", "bak", "bakken", "zak", "zakken", "pakje", "pakjes", "stuks per soort") en **30 verschillende maat-teksten** ("hoge 1/9e", "midden 1/9, 1/3 gevuld", "bak (maat nog bepalen)"). Elke regel leest daardoor anders.
- Het scherm is met de hand gebouwd, los van het design system van de app — vandaar dat het er anders uitziet dan de rest.
- Producten worden gekoppeld op naam in plaats van op artikelnummer. Daardoor kan hetzelfde product twee keer op een bestellijst komen, of juist gemist worden bij een kleine schrijffout.
- Er zijn nu drie losse manieren waarop "dit is op" wordt vastgelegd (bestelbord, interne bestellijst, inkooplijst) die niet aan elkaar gekoppeld zijn.
- De check is pas 4 keer gebruikt (vandaag) — er is dus nog nauwelijks historie, we kunnen zonder problemen herinrichten.

**Buiten jullie bedrijf** (Apicbase, MarketMan, Craftable, xtraCHEF, Toast, warehouse-picking):

1. Elk professioneel systeem **scheidt tellen van aanvullen**. De medewerker telt alleen. Het systeem rekent daarna uit wat er moet gebeuren. Nu doen jullie beide tegelijk per product, en dat is precies waarom het vaag voelt.
2. Lijsten worden gesorteerd **op looproute door de ruimte**, niet alfabetisch. In magazijnonderzoek gaat ruim de helft van de tijd op aan lopen — dus dáár zit jullie personeelskostenbesparing, niet in het scherm.
3. **Alleen aantikken wat er niet is, is een bekende valkuil**: wie niets aantikt, heeft misschien ook niets gecontroleerd. Systemen als xtraCHEF dwingen daarom per lijst een expliciete bevestiging af.
4. Hoeveelheden worden ingevoerd met **plus/min-knoppen en vaste maten**, nooit met vrije tekst. Deelvullingen worden afgerond op kwarten (vol / ¾ / ½ / ¼ / leeg).
5. Niet alles hoeft even vaak geteld: dure en bederfelijke spullen dagelijks, droge waren wekelijks.

## Vaste verbeteringen (in beide opties)

- **Categorieën**, met Zoet altijd als eigen blok onderaan: Vis & vlees · Zuivel & kaas · Spreads & mayonaises · Groente & fruit · Brood · Zoet · Droog & overig.
- **Eén vaste manier van aantallen tonen.** Vaste eenhedenlijst (stuks · zwarte bak · GN-bak · zak · pot · pak · pakje · fles · doos · kilo) plus, waar het om GN-bakken gaat, een vaste maat (1/9 · 1/6 · 1/4 · 1/3 · 1/2, hoog/midden/laag) en vulgraad (vol · ¾ · ½ · ¼). Elke regel leest identiek: **Gerookte zalm — 2 pakjes**, **Forel — 1 GN 1/6 hoog, vol**. De 30 losse maat-teksten worden eenmalig omgezet.
- **Volgorde = looproute**, in te stellen per plek, zodat je één ronde door de koelcel loopt en niet heen en weer.
- **Eén ophaallijst.** Alles wat uit de vriescel gehaald moet worden komt in één lijst aan het eind: "Haal dit in één keer uit de vriescel", met aantallen, gesorteerd op vriescelplank. Eén tik = gedaan, en alle Ontdooid-stickers rollen er in één reeks uit. Alles wat níét uit de vriescel kan, gaat automatisch door naar MEP, de Midsland-bestellijst of het bestelbord.
- **Afsluitscherm met samenvatting**: "5 uit de vriescel · 3 naar MEP · 2 naar Midsland · 1 op het bestelbord".
- Scherm wordt opgebouwd met dezelfde bouwstenen als de rest van de app (zelfde kaarten, knoppen, dialogen, dark mode).

## Optie 1 — Telronde en Aanvulbon gescheiden (mijn advies)

Twee losse stappen, zoals de professionele systemen het doen.

**Stap 1 — Telronde (medewerker, ~3 minuten).** Per plek (Koelcel, Koelwerkbank, Toppings) loop je de categorieën langs in looproute-volgorde. Per categorie zie je een kort lijstje met per product de naam en het streefaantal. Twee manieren om te antwoorden: de hele categorie in één tik bevestigen met **Klopt, ligt er**, of per product met plus/min aangeven hoeveel er écht ligt. Geen routetekst, geen bestemming, geen keuzes over MEP of Midsland — puur tellen. Een categorie die nog niet bevestigd is, blijft oranje: je kunt de ronde niet afsluiten zonder alles langs te zijn geweest.

**Stap 2 — Aanvulbon (systeem rekent, jij bevestigt).** Direct na de telling verschijnt één scherm met drie blokken:
- **Halen uit de vriescel** — de volledige ophaallijst, één rondje, stickers in één keer.
- **Zelf maken (MEP)** — gaat automatisch naar de MEP-lijst van morgen.
- **Bestellen (Midsland / bestelbord)** — wordt automatisch op de bestellijst gezet, bestaande openstaande bestellingen worden meegeteld zodat je niet dubbel bestelt.

Voordeel: de medewerker hoeft nul beslissingen te nemen, alle logica zit in de bon, en je loopt één keer naar de vriescel. Dat is de goedkoopste variant in personeelstijd.
Nadeel: het is echt een nieuwe manier van werken; het huidige scherm verdwijnt.

## Optie 2 — Doorloop-wizard per zone

Eén flow, maar in stappen: de app leidt je per zone en categorie ("Koelcel — Vis & vlees, 3 van 9"), groot en rustig, één scherm tegelijk. Per categorie **Alles ligt er** of **Er ontbreekt iets**; in dat laatste geval tik je alleen de betreffende producten aan en zet je met plus/min hoeveel er ligt. De acties worden nog steeds pas aan het eind gebundeld in dezelfde ophaallijst en samenvatting.

Voordeel: dicht bij hoe je nu werkt, kleinere stap, niets kan overgeslagen worden.
Nadeel: nog steeds één lange ronde en opzoeken kost meer tikken (zoekbalk blijft bovenaan staan).

## In de praktijk

- Wie: keukenmedewerker West aan het eind van de dienst, staand, iPad. Grote knoppen, geen typwerk, geen uitleg nodig.
- Wat verandert: je loopt één keer naar de vriescel in plaats van tien keer, en niemand hoeft meer te bedenken waar een tekort heen moet.
- Halverwege gestopt: voortgang staat per product opgeslagen, de volgende pakt hem op.
- Over een maand: telhistorie laat zien welke producten vaak opraken; die kunnen hun streefaantal omhoog krijgen. Later kunnen we frequentie splitsen (vis/vlees dagelijks, droog wekelijks).
- Risico: het opschonen van eenheden raakt bestaande regels. Gebeurt via migratie met logboek, product voor product, zonder iets te verwijderen.

## Technisch

1. Migratie op `koelcel_check_items`: kolommen `categorie`, `gn_maat`, `vulgraad`, `looproute_volgorde`, plus `artikel_id` (koppeling naar `artikelen` waar die bestaat). Alle 109 West-regels genormaliseerd en gelogd in `migratie_logboek`; geen deletes.
2. Nieuwe tabel `voorraad_rondes` (vestiging, datum, plek, status, afgerond_door) zodat een ronde een echt afsluitmoment heeft; `koelcel_checks` krijgt `ronde_id` en `geteld_aantal`.
3. `src/lib/voorraad-formaat.ts`: één functie die naam + aantal + eenheid + GN-maat + vulgraad consistent rendert.
4. `KoelcelCheckBlok.tsx` (851 regels, eigen inline styling) vervangen door `VoorraadRonde.tsx`, `TelCategorie.tsx`, `AanvulBon.tsx`, `ProductRegel.tsx` — opgebouwd met de bestaande shadcn-componenten.
5. `useKoelcelCheck.ts` (834 regels): tel-mutaties scheiden van routeringsmutaties; nieuwe `berekenAanvulbon()` (tekorten → vriescel / MEP / Midsland / bestelbord in één keer) en `bevestigAanvulbon()` (bulk aanvullen, bulk Ontdooid-stickers, bulk routering).
6. Koppeling opschonen: matchen op `artikel_id` waar beschikbaar in plaats van op naam, en interne orders een echt ordernummer geven in plaats van een lege waarde.
7. Bestaande keten (`product_sleutel`, drukte-modus Rustig/Druk, "besteld nog niet geleverd") blijft werken.

Ik bouw pas na jouw keuze tussen optie 1 en 2.
