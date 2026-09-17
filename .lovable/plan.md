# Deel 2 van de productlijst in de voorraad-check zetten (West)

Deel 2 gaat over de spreads, mayonaises en eieren. Ze komen in dezelfde keten als deel 1:
koelwerkbank wordt bijgevuld uit de koelcel, de koelcel uit de vriescel, en pas onderaan
gaat een "Op"-melding naar de mise-en-place, het bestelbord of de bestellijst voor Midsland.

## Wat er per product in komt

| Product | Koelwerkbank | Koelcel | Vriescel | Onderaan de keten |
| --- | --- | --- | --- | --- |
| Gekookte eieren (bio) | 1x hoge 1/6 | — | — | Zelf maken in West (koken) |
| Eimengsel scrambled eggs | 1x midden 1/3 | — | — | Zelf maken in West |
| Smashed avocado / avocadospread | 2x hoge 1/9 | 1 pot | ja | Inkoop → bestelbord |
| Kokosyoghurt | 2x hoge 1/9 | 6 pakken | — | Inkoop → bestelbord |
| Tomatenrelish | 1x midden 1/9 | 1 gevacumeerd pakje | ja | Uit Midsland |
| Tomatenjam | 2x midden 1/9 | 1 gevacumeerd pakje | ja | Uit Midsland |
| Wortelspread | 1x midden 1/9 | 1 gevacumeerd zakje | ja | Uit Midsland |
| Chimichurrimayonaise | 2x midden 1/9 | 1 bak extra voorraad | — | Zelf maken in West |
| Zeewier-algenmayonaise | 2x midden 1/9 | 1 bak extra voorraad | zeewier (inkoop) | Zelf maken in West |
| Vegan roomkaas | 1x midden 1/9 | 2 potten | — | Inkoop → bestelbord |
| Hummus | 1x midden 1/9 | 1 gevacumeerd zakje | — | Zelf maken in West |

Voor de eieren: de rauwe eieren staan in het magazijn, koken gebeurt in West. Ik zet de
bron daarom op "Zelf maken in West"; op is op betekent dan een MEP-taak "Eieren koken".
Klopt dat niet, dan pas ik het aan in het beheerscherm.

Bakmaten die erbij komen als keuze: hoge 1/6, midden 1/3, hoge 1/9, midden 1/9, pot, pak,
gevacumeerd pakje/zakje, bak.

## Drukte

Elk nieuw product krijgt naast het normale aantal ook een aantal voor drukke dagen. Waar jij
dat niet genoemd hebt zet ik een voorzichtige inschatting (meestal hetzelfde of eentje meer);
die is in één scherm aan te passen bij Instellingen → MEP → Voorraad-check.

## Technisch

- Eén migratie die rijen toevoegt aan `koelcel_check_items` voor vestiging West:
  per product een regel per plek (`werkbank`, `koelcel`, `vriezer`) met hetzelfde
  `product_sleutel`, zodat de keten automatisch doorschuift via `NIVEAU_ONDER`.
- `bron` per product: `zelf_west`, `koelcel_inkoop` of `midsland`; `vriezer` alleen waar de
  vriescel écht het niveau eronder is. Bij Midsland-producten staat de vriescelregel op
  bron `midsland`, zodat "Op" daar in de bestellijst voor Midsland komt.
- `bak_maat` en `eenheid` vullen zoals in de tabel hierboven; `doel_aantal_druk` gevuld.
- `volgorde` per plek zo dat deel 1 blijft staan en deel 2 er logisch achteraan komt
  (spreads en mayonaises bij elkaar).
- Geen code-wijziging nodig in `useKoelcelCheck.ts`, `KoelcelCheckBlok.tsx` of
  `VoorraadCheckBeheer.tsx`; de bestaande keten- en routinglogica dekt deze producten al.
- Losse oude regels die hierdoor dubbel zouden staan (bijvoorbeeld een oude
  "Avocado spread" of "Kokosyoghurt" zonder keten) worden op inactief gezet, niet verwijderd.

## Waar je op moet letten

- Chimichurri en zeewiermayonaise hebben in de koelcel "1 bak extra voorraad"; het formaat
  van die bak weet ik niet. Dat is één veld in het beheerscherm.
- Zeewier zelf ligt in de vriescel. Ik zet die als eigen regel onder zeewiermayonaise, zodat
  "geen zeewier meer" op het bestelbord komt in plaats van bij Midsland.
- Na het invoeren loop je het beheerscherm één keer door om aantallen en bakken te
  bevestigen; daarna is de lijst van jou en niet meer van mijn inschatting.
