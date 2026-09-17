# Deel 4 — laatste producten in de West-sluitlijst

Dit is het sluitstuk van de voorraadketen voor West: de soepen, kip, brioche, de mayonaises en alle verse snijproducten voor de koelwerkbank.

## Wat er al staat (gecontroleerd)

- Gesneden bloemkool, brioche (koelcel + vriezer), kip (koelcel + vriezer), vissoep (koelcel), tom yum (koelcel), gerookte zalm (vriezer/koelcel/werkbank) en chimichurri- en zeewiermayonaise staan er al.
- Er staat nog een verzamelregel "Soepen (tom yum / vissoep)" in de vriezer en een vage regel "Alle sauzen" in de koelcel.

## Wat verandert

1. **Soepen splitsen.** De verzamelregel gaat weg. Vissoep en tom yum krijgen elk een eigen vriezerregel (1 stuk), die vanuit Midsland wordt aangevuld. De koelcelregels blijven 1 stuk en halen voortaan uit de eigen vriezerregel.
2. **"Alle sauzen" wordt concreet.** Vervangen door drie regels in de koelcel, elk 1 stuk, zelf gemaakt in West: zeewier-algenmayonaise, knoflook-kurkumamayonaise (nieuw) en chimichurrimayonaise.
3. **Kip en brioche kloppen kloppend maken.** Kip in de koelcel (1 vacuümzak) wordt aangevuld uit de vriezer, vriezer uit Midsland. Brioche in de koelcel wordt aangevuld uit de vriezer, vriezer via inkoop.
4. **Gesneden bloemkool** krijgt de juiste bron: zelf snijden in West (inkoop bloemkool), 1 bak in de koelcel.

## Nieuwe verse producten (koelwerkbank + koelcel)

| Product | Koelwerkbank | Koelcel | Herkomst |
| --- | --- | --- | --- |
| Gesneden paprika | 1 volle midden 1/6 | paprika's (aantal nog open) | inkoop, zelf snijden West |
| Blauwe bessen | midden 1/6 halfvol | 2 pakjes | inkoop |
| Verse avocado's | 1 volle midden 1/6 | 1 doos | inkoop |
| Granaatappelpitjes | 1 volle midden 1/9 | 8 hele granaatappels | inkoop, zelf uitslaan West |
| Rode peper | midden 1/9 voor 1/3 gevuld | 1 kilo | inkoop, zelf snijden West |
| Zoetzure gember | 1 volle midden 1/9 | restant zak van 1,5 kg | inkoop per zak |
| Rode kool | 1 volle 1/4 | vacuümzakken (aantal nog open) | Midsland |
| Aubergine | 1 halfhoge 1/4 | 8 hele aubergines | inkoop, bereiden West |
| Geroosterde groenten | 1 halfhoge 1/4 | 4 paprika's, 4 courgettes, 4 venkels | inkoop, roosteren West |

Verse avocado's komen los te staan van de bestaande avocadospread.

## Hoe het werkt in de sluitfase

Elk product hangt aan één productsleutel, zodat "Op" bij de koelwerkbank de koelcelcontrole heropent, en "Op" in de koelcel doorschuift naar de vriezer of — op het laagste niveau — naar de mise-en-place (zelf snijden/roosteren), het bestelbord (inkoop) of de Midsland-bestellijst.

## Open punten (niet blokkerend)

- Liggen de 8 granaatappels in de koelcel of droog? Ik zet ze voorlopig in de koelcel; is het droog, dan verplaatsen we ze later.
- De 4 paprika's in de koelcel reken ik toe aan de geroosterde groenten. Voor gesneden paprika laat ik het koelcelaantal leeg tot je een getal noemt; de regel werkt gewoon, alleen zonder streefaantal.
- Voor zoetzure gember en rode kool geldt hetzelfde: koelcelregel zonder vast aantal tot je die noemt.

## Technisch

- Eén migratie `voorraadcheck_west_deel4`: verwijdert (op inactief zetten) de regels "Soepen (tom yum / vissoep)" en "Alle sauzen", corrigeert bron/plek van bloemkool, kip, brioche, en voegt de nieuwe regels toe in `koelcel_check_items` met `product_sleutel`, `plek`, `bron`, `doel_aantal`, `doel_aantal_druk`, `bak_maat` en oplopende `volgorde`.
- Geen wijzigingen aan `useKoelcelCheck.ts` of de UI nodig; het ketenmodel dekt deze gevallen al.
- Historie blijft: bestaande regels worden gearchiveerd (`actief = false`), niet verwijderd.
