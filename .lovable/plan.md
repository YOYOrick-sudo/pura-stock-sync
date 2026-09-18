# Koelwerkbank: lade-indelingLinks midden/Rechts boven + reservelade opzetkoeling

## Doel
De ladepatroon-kaarten in /settings/koelwerkbank kloppen exact met de echte werkbank, en de nieuwe reservelade voor de opzetkoeling (bosui, peterselie, tomaatjes, kiemen) is ingericht met bestel- en MEP-regels.

## 1. Lade-indeling corrigeren (migratie, alleen lade_id + volgorde)

**Links midden** — precies 4, 2×2:
1. Geroosterde bloemkool
2. Aubergine
3. Rode kool
4. Gegrilde groenten (paprika, venkel, courgette)

Forel en Gerookte zalm verhuizen naar Rechts boven (staan nu fout in Links midden).

**Rechts boven** — precies 4, 2×2 (rij 1: pancakes – bananencake, rij 2: forel – zalm):
1. Bananenpannenkoeken (nu Links onder)
2. Bananencake (nu Links onder)
3. Forel (nu Links midden)
4. Gerookte zalm (nu Links midden)

**Links onder** — wordt de reservelade voor de opzetkoeling (lade-rol "reservelade"): 7 kaartjes, rij 1+2 de drie 1/9-producten en de eerste kiemsoort, daarna 3 kleine kaartjes voor de kiemsoorten:
1. Lente-ui (bosui)
2. Peterselie
3. Tomaatjes
4. Kiemen ertasperge
5. Kiemen greenpeez
6. Kiemen chine rose

## 2. Nieuwe producten en hun regels

| Product | Werkbank (lade) | Koelcel-telling | Bestellen | MEP |
|---|---|---|---|---|
| Kiemen ertasperge | GN 1/6 hoog, reserve | — (voorraad ligt in de lade) | doel 4 pak, meld vanaf 2, aanvullen tot 4 | nee |
| Kiemen greenpeez | idem | — | idem | nee |
| Kiemen chine rose | idem | — | idem | nee |
| Tomaatjes | GN 1/9 midden, reserve | half wit emmertje (vulnorm half) | bij bodempje in het emmertje → bestellen | nee |
| Lente-ui | GN 1/9 midden, reserve | altijd 2 bosjes (doel 2) | bij 1 bosje → 1 bos | bij leeg: "1 bos snijden" |
| Koriander | GN 1/9 midden, reserve | 2 bosjes (doel 2) | bij 1 bosje → 1 bos | bij leeg: "1 bos snijden" |
| Peterselie | GN 1/9 midden, reserve | 2 bosjes (doel 2) | bij 1 bosje → 1 bos | bij leeg: "1 bos snijden" |

- Kiemen en tomaatjes: geen MEP, alleen voorraad/bestelling.
- Kruiden (lente-ui, koriander, peterselie): als het 1/9-bakje in de lade leeg is → MEP-taak "1 bos [product] snijden" (belangrijk/vandaag). Half bakje = niets. Aanvullen gaat uit de koelcelvoorraad (2 bosjes).
- Bestelpunten/leveranciers zijn achteraf per product in het beheer bij te stellen. Leverancier vullen we waar bekend in beheer; niet-bekende laten we leeg.

## 3. Technisch

- Migratie `koelwerkbank_lades_fix_en_opzetkoeling` (via lov_database--migration):
  - `lade_id`/`volgorde` van de vier verhuizende producten (Forel, Gerookte zalm, Bananenpannenkoeken, Bananencake) naar Rechts boven.
  - `voorraad_lades`: Links onder rol='reserve'.
  - 7 nieuwe werkbank-items (plek='werkbank', lade=Links onder) en 4 nieuwe koelcel-items (tomaatjes emmertje, lente-ui, koriander, peterselie) in `koelcel_check_items`, West, actief. Formaten: GN 1/6 hoog (kiemen), GN 1/9 midden (tomaten/kruiden).
  - Bestelpunt/aanvul_tot/leverancier-kolommen zijn er al (migraties 0018 + koelcel_aanvul_tot).
- Code:
  - `useKoelcelCheck.ts`: werkbank-reserve-items (kiemen) tellen hun reserve en melden bij bestelpunt; kruiden krijgen de leeg→MEP-snijregel (alleen bij bodempje/leeg, minimaal 1 bos per taak, bestaande taak opgewaardeerd i.p.v. gedupliceerd).
  - `VoorraadRonde.tsx` / beheer: nieuwe items verschijnen automatisch; geen aparte UI nodig, wel controleren dat reservelade-items netjes meedoen in de looproute.

## 4. Praktijkrisico
- Rondes lopen iets langer op (7 extra telregels + 4 koelcelregels); beperkt omdat het alleen maandagse/periodieke telling raakt.
- Als de MEP-snijregel te prikkelig zou zijn (bij half al een taak) ontstaat ruis — daarom bewust alleen bij leeg. In de ronde staat het per product als "leeg = snijden" achter het info-icoon.

## 5. Testen
- Preview: indeling Links midden (4), Rechts boven (4), Links onder (7 + reservelade-label) klopt visueel met de laden.
- Telronde doorklikken: kiemen tonen reserve 4/meld bij 2; tomaatjes-emmertje bij bodempje geeft bestelregel; kruiden leeg → MEP "1 bos snijden".
- Typecheck + build OK.
