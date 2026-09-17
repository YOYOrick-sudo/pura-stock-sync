# West keuken: de aanvulketen standaardiseren

## Hoe het echt werkt

Alles in de keuken loopt via dezelfde keten, alleen het beginpunt verschilt:

```text
VRIEZER          -> ontdooien in KOELCEL -> aanvullen in KOELWERKBANK
KOELCEL          ------------------------> aanvullen in KOELWERKBANK
MAGAZIJN (droog) -> roosteren            -> aanvullen op WERKBLAD (toppings)
ZELF MAKEN WEST  -> mise en place        -> aanvullen in KOELWERKBANK (bijv. mayo's in flessen)
MIDSLAND         -> interne bestelling   -> vriezer/koelcel West -> werkbank
```

Elk product hoort bij één bron. Dat bepaalt wat er moet gebeuren als het op is:

| Bron | Op in de werkbank | Op in koelcel / vriezer / magazijn |
|---|---|---|
| Vriezer | uit koelcel halen | ontdooien; vriezer óók leeg → zie bron eronder |
| Koelcel, ingekocht (hüttenkäse, kokosyoghurt) | uit koelcel halen | bestelbord |
| Magazijn droog (sesamzaad, amandelschaafsel, kokosschilfers) | roosteren | bestelbord |
| Zelf maken in West (mayo's, spreads uit bak naar fles) | uit koelcel halen | mise en place West |
| Uit Midsland (bananenpannenkoeken, tomatenrelish, tomatenjam, kip, tom yum, vissoep) | uit koelcel/vriezer halen | **interne bestelling naar Midsland** |

Die laatste rij is nu nergens vastgelegd — dat zit in het hoofd van Helga. Dat is precies wat we eruit halen.

## De takenlijst blijft het vertrekpunt

Dit wordt geen apart scherm. De drie blokken staan in de **sluitlijst van de keuken in West**, op de plek waar nu "Bijvullen keuken" en "Ontdooien" staan. Het team opent dus gewoon de takenlijst zoals altijd; de voortgang van die blokken telt mee in de voortgangsbalk van de keuken, net als de andere taken. Alleen de manier waarop je afvinkt verandert: per product, met hoeveelheid erbij, en met een tweede knop "Op" die het doorzet naar MEP, bestelbord of Midsland. Mise en place, bestelbord en de interne bestelling zijn vervolgschermen, geen extra werk aan het eind van de dienst.

## Wat we bouwen: één productkaart per product

Per product leggen we één keer vast: **naam, bron, waar het hoort te liggen, hoeveel (incl. bakmaat), en wat er gebeurt als het op is**. Daarna hoeft niemand het meer te weten — het systeem stuurt het door.

### In de sluitlijst van de keuken (West)

Drie blokken, in de volgorde waarin je loopt:

```text
1. UIT DE VRIEZER (ontdooien voor morgen)
   Kip / Tom yum / Vissoep / Bananenpannenkoeken   [ In koelcel gelegd ]  [ Op ]
   -> tik = "Ontdooid"-sticker printen, zoals nu al

2. KOELCEL OP PEIL (backup)
   Zalm / Forel / Kebab / Tempeh / ...             [ Aanwezig ]           [ Op ]

3. WERKBANK & WERKBLAD BIJVULLEN
   Hüttenkäse          1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Cranberry compote   1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Kokosyoghurt        1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Avocado spread      1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Tomatenrelish       1x midden 1/9e uit koelcel   [ Bijgevuld ] [ Op ]
   Mayonaises          fles vol       uit bak       [ Bijgevuld ] [ Op ]
   Sesamzaad           1 pot          roosteren     [ Bijgevuld ] [ Op ]
   Gerookte zalm / Forel / Broodbakken / Bananencake ...
```

Twee knoppen, altijd dezelfde twee. **Bijgevuld** = klaar. **Op** = ik kon het niet aanvullen.

### Wat "Op" doet — dit is de kern

Je tikt alleen "Op". Het systeem weet zelf waar het heen moet:

- Zelf maken in West → **mise en place** (handeling Bereiden), met de juiste hoeveelheid.
- Uit de vriezer → **ontdooilijst** van morgen.
- Roosteren → **mise en place** (handeling Roosteren).
- Ingekocht → **bestelbord**.
- Uit Midsland → **interne bestellijst naar Midsland**.

Je krijgt meteen terugkoppeling: "Tom yum staat op de bestellijst voor Midsland". Geen bordje, geen appje, niemand hoeft het te onthouden.

### Twee lijsten waar het in terechtkomt

- **Bestelbord** (Keuken → Bestelbord): wat er extern besteld moet worden. Product, wie het meldde, wanneer, vinkje "besteld". Blijft staan tot het afgevinkt is. Vervangt het whiteboard — niemand schrijft nog iets op. Het bord is ook zelf een invoerplek: staat iets er nog niet op, dan tik je "+ Product op bestelbord" en kies je uit de productenlijst of typ je vrij.
- **Naar Midsland**: dezelfde manier van melden, maar de regels landen op de bestaande interne bestelling van West naar Midsland, zodat Midsland ze bij hun productie ziet. Één plek voor Helga en het team in Midsland, in plaats van losse appjes.

Later, als de bronnen kloppen, kan het bestelbord per leverancier gegroepeerd worden en op besteldag automatisch als bestellijst klaarstaan. Dat bouwen we nu nog niet.

## Wat dit oplevert

- Een nieuw teamlid ziet per product hoeveel er moet liggen en waar het vandaan komt, zonder uitleg.
- "Op" is één tik en komt altijd op de juiste plek — extern bestellen, Midsland, of de eigen mise en place.
- De kennis van de chef staat in het systeem in plaats van in haar hoofd.

## Volgorde: eerst bouwen, daarna invullen

Fase 1 (nu): ik bouw het systeem en vul het met de producten die al in de app staan (huidige sluitlijst en koelcellijst), met mijn beste inschatting van de bron.

Fase 2 (jij, in het beheerscherm): je loopt de lijst één keer door en zet per product de juiste bron en hoeveelheid — dropdowns, geen typewerk. Ontbrekende producten voeg je daar toe.

Zo hoef je niets vooraf te dicteren en zie je meteen waar je aan het schuiven bent.

## Wat ik van jou nodig heb

Per product de bron en de hoeveelheid. Ik zet een eerste versie klaar op basis van de huidige sluitlijst en wat je hierboven beschreef (bananenpannenkoeken, relish, tomatenjam, kip, tom yum, vissoep = Midsland; mayo's = zelf maken West; toppings = magazijn/roosteren; overig = ingekocht), overal aantal 1. Jij corrigeert dat in het beheerscherm — sneller dan het nu compleet uittypen.

## Technisch

- `koelcel_check_items` wordt uitgebreid tot productkaart: `bron` (vriezer | koelcel_inkoop | magazijn | zelf_west | midsland), `plek` (vriezer | koelcel | werkbank | werkblad), `bak_maat` (tekst), naast bestaande `doel_aantal`, `eenheid`, `volgorde`, `actief`, `vestiging`. Bestaande regels migreren mee (type → plek/bron).
- `KoelcelCheckBlok.tsx` rendert drie blokken op `plek`, met dezelfde 44px-tikdoelen, optimistische updates en realtime sync als nu.
- "Op" routeert via `bron`: MEP-taak (bestaande hook; handeling Bereiden / Roosteren / Aanvullen; dedupe op open taken), regel op het bestelbord, of regel op de interne bestelling West → Midsland via `internal_orders` / `internal_order_items` (open concept-order hergebruiken, anders aanmaken).
- Nieuw: `bestel_signalen` (vestiging, naam/artikel_id, aantal, eenheid, gemeld_door, status open|besteld, timestamps) met GRANTs en vestigings-RLS via `heeft_vestiging`. Bewust losgehouden van de voorraadketen-migratie, wel koppelbaar aan `artikelen` later.
- Nieuwe route `/keuken/bestelbord` achter `ProtectedRoute`, West + Midsland.
- Templates in `foh_daily_templates` met categorie "Bijvullen keuken" en "Ontdooien (vriezer → koelcel)" worden gedeactiveerd en omgezet naar productkaarten, zodat er geen dubbele regels ontstaan. Schoonmaaktaken blijven ongewijzigd.
- Beheer via Instellingen → MEP → Voorraad-check, met filter per bron.

## Risico's

- Verkeerde bron op een productkaart = melding op de verkeerde plek. Eerste week meekijken en bijstellen in het beheerscherm.
- Het bestelbord werkt alleen als iemand afvinkt na bestellen; regels verdwijnen daarom nooit vanzelf en krijgen een leeftijdslabel.
- Midsland moet de interne bestellijst ook echt dagelijks bekijken; anders verschuift de ruis alleen. Optioneel: dagelijkse melding naar Midsland.
- Tijdens de overgang kan een product dubbel verschijnen; daarom deactiveren we de oude templates in dezelfde migratie.
