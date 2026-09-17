# West keuken: de aanvulketen standaardiseren

## Hoe het echt werkt

Alles in de keuken loopt via dezelfde keten, alleen het beginpunt verschilt:

```text
VRIEZER    -> ontdooien in KOELCEL -> aanvullen in KOELWERKBANK
KOELCEL    ------------------------> aanvullen in KOELWERKBANK
MAGAZIJN   -> roosteren            -> aanvullen op WERKBLAD (toppings)
ZELF MAKEN -> maken (mise en place)-> aanvullen in KOELWERKBANK
```

Eén product hoort dus bij één bron. Dat bepaalt ook wat er moet gebeuren als het op is:

| Bron | Op in de werkbank? | Op in koelcel/magazijn? |
|---|---|---|
| Vriezer (bijv. avocado spread, bananenpannenkoeken) | uit koelcel halen | ontdooien uit vriezer; is de vriezer ook leeg → bestelbord |
| Koelcel, ingekocht (bijv. hüttenkäse, kokosyoghurt) | uit koelcel halen | bestelbord |
| Magazijn droog (sesamzaad, amandelschaafsel, kokosschilfers) | roosteren | bestelbord |
| Zelf maken (relish, spreads, sauzen) | uit koelcel halen | naar mise en place |

Nu staat dit nergens vast en moet iedereen het weten. Dat is precies de ruis die weg moet.

## Wat we bouwen: één productkaart per product

Per product leggen we één keer vast: **naam, bron, waar het hoort te liggen, hoeveel (incl. bakmaat), en wat er gebeurt als het op is**. Daarna hoeft niemand meer iets te onthouden — het systeem stuurt het door.

### In de sluitlijst van de keuken (West)

Drie blokken onder elkaar, in de volgorde waarin je loopt:

```text
1. UIT DE VRIEZER (ontdooien voor morgen)
   Avocado spread      1 bak       [ In koelcel gelegd ]   [ Op ]
   -> tik = "Ontdooid"-sticker printen, zoals nu al

2. KOELCEL OP PEIL (backup)
   Kip / Zalm / Vissoep / ...      [ Aanwezig ]            [ Op ]

3. WERKBANK & WERKBLAD BIJVULLEN
   Hüttenkäse          1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Cranberry compote   1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Kokosyoghurt        1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Avocado spread      1x hoge 1/9e   uit koelcel   [ Bijgevuld ] [ Op ]
   Relish              1x midden 1/9e uit koelcel   [ Bijgevuld ] [ Op ]
   Sesamzaad           1 pot          roosteren     [ Bijgevuld ] [ Op ]
   Gerookte zalm / Forel / Broodbakken / Bananencake ...
```

Twee knoppen, altijd dezelfde twee. **Bijgevuld** = klaar. **Op** = ik kon het niet aanvullen.

### Wat "Op" doet — dit is de kern

Je tikt alleen "Op". Het systeem weet zelf waar het heen moet, op basis van de bron van dat product:

- Zelf maken → komt op de **mise en place** (handeling Bereiden), met de juiste hoeveelheid.
- Uit de vriezer → komt op de **ontdooilijst** van morgen.
- Roosteren → komt op de **mise en place** (handeling Roosteren).
- Ingekocht → komt op het **bestelbord**.

En in alle gevallen zie je direct een regel terug: "Avocado spread staat op het bestelbord". Geen bordje meer, geen appje, geen aanname dat iemand het doorgeeft.

### Het bestelbord

Een eenvoudige lijst in de app (Keuken → Bestelbord) met wat er op is: product, wie het meldde, wanneer, en een vinkje "besteld". Items blijven staan tot ze besteld zijn, dus een melding van dinsdag verdwijnt niet op woensdag. Dit vervangt het whiteboard.

## Wat dit oplevert

- Een nieuw teamlid ziet per product hoeveel er moet liggen en waar het vandaan komt, zonder uitleg.
- "Op" is één tik en komt altijd op de juiste plek terecht — niks valt meer tussen wal en schip.
- Jij ziet in één scherm wat er besteld of gemaakt moet worden.

## Wat ik van jou nodig heb

Per product de bron en de hoeveelheid. Ik zet een eerste versie klaar op basis van de huidige sluitlijst (met de bronnen zoals jij ze hierboven beschreef en overal 1 als aantal), jij corrigeert dat in het beheerscherm. Dat is sneller dan het nu compleet uittypen.

## Technisch

- `koelcel_check_items` wordt hernoemd/uitgebreid tot de productkaart: velden `bron` (vriezer | koelcel | magazijn | zelf_maken), `plek` (koelcel | werkbank | werkblad), `bak_maat` (tekst, bijv. "hoge 1/9e"), naast bestaande `doel_aantal`, `eenheid`, `volgorde`, `actief`, `vestiging`. Bestaande koelcel- en vriezerregels migreren mee.
- `KoelcelCheckBlok.tsx` rendert drie blokken op `plek`/`bron`, met dezelfde 44px-tikdoelen, optimistische updates en realtime sync als nu.
- "Op" routeert via de bron: MEP-taak (bestaande hook, handeling Bereiden/Roosteren/Aanvullen, dedupe op open taken) of een regel op het bestelbord.
- Nieuw: `bestel_signalen` (vestiging, artikel/naam, aantal, gemeld_door, status open/besteld, timestamps) met GRANTs en vestigings-RLS via `heeft_vestiging`. Later koppelbaar aan `artikelen` / `inkoop_orders`; nu bewust losgehouden zodat dit niet wacht op de voorraadketen.
- Nieuwe route `/keuken/bestelbord` achter `ProtectedRoute`, West + Midsland.
- Templates in `foh_daily_templates` met categorie "Bijvullen keuken" en "Ontdooien (vriezer → koelcel)" worden gedeactiveerd en omgezet naar productkaarten, zodat er geen dubbele regels ontstaan. Schoonmaaktaken blijven ongewijzigd.
- Beheer via Instellingen → MEP → Voorraad-check, met filter per bron.

## Risico's

- Tijdens de overgang kan een product zowel als oude taak als nieuwe regel verschijnen. Daarom deactiveren we de oude templates in dezelfde migratie.
- Het bestelbord werkt alleen als iemand het ook echt afvinkt na bestellen. Daarom: items verdwijnen nooit vanzelf en oude open meldingen krijgen een leeftijdslabel.
- Als de productkaarten niet kloppen (verkeerde bron), komt een melding op de verkeerde plek. Eerste week even meekijken en bijstellen in het beheerscherm.
