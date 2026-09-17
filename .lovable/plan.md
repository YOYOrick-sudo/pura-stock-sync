# Sluitlijst keuken West — bijvullen duidelijker maken

## Het probleem

"Bijvullen keuken" staat nu als losse zinnen op de lijst:

- Toppings pas aanvullen
- Op reserve hoge 1/9e bak: Hüttenkäse, Cranberry compote, Kokosyoghurt, Avocado spread
- Op reserve midden 1/9e: relish
- Bananenpannenkoeken aanvullen vanuit vriezer
- Zuudesem stokbrood in 3en snijden - broodbak aanvullen
- Gerookte zalm / Forel aanvullen
- Broodbakken aanvullen - Pita, brioche, deugniet
- Bananencake aanvullen in lade vanuit vitrine

Drie dingen ontbreken voor iemand die het niet weet: **hoeveel**, **waar komt het vandaan** en **wat doe je als het er niet meer is**. Nu staan vier producten in één regel, dus je kunt niet zien welk product je nog moet doen. En "aanvullen" zegt niet of je één bak of drie bakken neerzet.

## Wat "hoeveelheid" hier betekent

Per product leggen we één keer vast wat er aan het eind van de dag klaar moet staan, bijvoorbeeld:
"Hüttenkäse — 1x hoge 1/9e bak — uit de koelcel". Dat is het doel. Het team hoeft dan niet te onthouden of te schatten; ze zien het staan en vullen aan tot dat aantal. Die aantallen zet jij één keer in een beheerscherm en pas je aan als het seizoen of de drukte verandert.

## De twee beste opties

### Optie A — Reserve-check, net als het koelcelblok (mijn advies)

"Bijvullen keuken" wordt één blok met per product een eigen regel:

```text
RESERVE WERKBANK (aanvullen vanuit koelcel)
Hüttenkäse            1x hoge 1/9e      [ Aangevuld ]  [ Naar MEP ]
Cranberry compote     1x hoge 1/9e      [ Aangevuld ]  [ Naar MEP ]
Kokosyoghurt          1x hoge 1/9e      [ Aangevuld ]  [ Naar MEP ]
Avocado spread        1x hoge 1/9e      [ Aangevuld ]  [ Naar MEP ]
Relish                1x midden 1/9e    [ Aangevuld ]  [ Naar MEP ]
Gerookte zalm         1x bak            [ Aangevuld ]  [ Naar MEP ]
...
```

Eén tik per product. Is de koelcel leeg, dan tik je "Naar MEP" en staat het morgen als taak op de mise-en-place — precies zoals het koelcelblok nu al werkt. Zo hangen sluitlijst, koelcel en MEP aan elkaar en verdwijnt er niets.

Voordeel: het is dezelfde flow die het team al kent van de koelcelcheck, hoeveelheden staan erbij, en een leeg product loopt automatisch door naar de MEP.
Nadeel: het is een tweede lijst met vinkjes onder elkaar; iets meer tikken dan nu.

### Optie B — Dezelfde taken, maar opgesplitst en met hoeveelheid erin

"Bijvullen keuken" blijft gewone taken, maar wordt opgeknipt per product en per herkomst:

```text
BIJVULLEN — UIT DE KOELCEL
[ ] Hüttenkäse — 1x hoge 1/9e
[ ] Cranberry compote — 1x hoge 1/9e
[ ] Kokosyoghurt — 1x hoge 1/9e
[ ] Avocado spread — 1x hoge 1/9e
[ ] Relish — 1x midden 1/9e

BIJVULLEN — UIT DE VRIEZER
[ ] Bananenpannenkoeken — 1x bak

BIJVULLEN — SNIJDEN / KLAARMAKEN
[ ] Zuurdesem stokbrood in 3en — broodbak vol
```

Voordeel: geen nieuw scherm, exact de lijst die het team gewend is, alleen duidelijker. Snel te bouwen.
Nadeel: geen knop om een leeg product door te zetten naar de mise-en-place; dat blijft handwerk.

## Advies

Optie A. Het bijvullen van de werkbank is hetzelfde soort werk als de koelcelcheck: kijken, aanvullen, en melden wat op is. Eén herkenbare manier van werken voor beide, en de MEP vult zichzelf. Losse schoonmaaktaken (bain marie, oven, werkbanken) blijven gewoon staan zoals ze zijn.

## Technisch (voor optie A)

- `koelcel_check_items` krijgt een derde `type`: `reserve`, plus een veld voor bakmaat (bijv. "hoge 1/9e"). Bestaande koelcel- en vriezerregels blijven ongewijzigd.
- `KoelcelCheckBlok.tsx` rendert een derde blok "Reserve werkbank" boven de bestaande blokken, met dezelfde 44px-tikdoelen en realtime sync.
- "Naar MEP" hergebruikt de bestaande hook: handeling Aanvullen, hoeveelheid en eenheid uit het item, dedupe op openstaande taken.
- De huidige templates in `foh_daily_templates` (categorie "Bijvullen keuken") worden gedeactiveerd en omgezet naar reserve-items, zodat er geen dubbele regels ontstaan.
- Beheer via Instellingen → MEP → Voorraad-check, met een filter per type.
- Alleen West; Midsland verandert niet.

## Wat ik nog van je nodig heb

De aantallen en bakmaten per product. Je hoeft ze niet nu te geven: ik zet alles op 1 en de bakmaat die al in de huidige tekst staat, en jij past ze aan in het beheerscherm.
