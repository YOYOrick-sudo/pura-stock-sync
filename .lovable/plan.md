# Lade links boven + keten erachter

De lade op de foto wordt de werklade **Links boven**: oesterzwam, gesneden paprika, verse avocado, blauwe bes, granaatappelpitjes, rode peper, zoetzure gember — in die volgorde.

## Wat verhuist er

- **Links boven**: de 7 producten hierboven
- **Rechts midden**: falafel, tempeh, döner kebab, feta verkruimeld, kaas belegen
- **Rechts onder**: eimengsel (komt bij de bestaande zuivel/brood-items)
- De rest van de laden blijft zoals hij is

## Nieuw product: oesterzwam

- Werkbank: 1 bakje GN 1/6, hoort **half** vol
- Koelcel: altijd **5 gevacumeerde zakjes**; bij 2 of minder een bestelling naar Midsland tot weer 5 stuks
- Wordt in Midsland gemaakt, dus geen MEP-taak in West

## Minimale voorraden en keten (wat je gaat checken)

| Product | Werkbank | Koelcel | Magazijn/vriescel | Bijvullen / bestellen |
|---|---|---|---|---|
| Oesterzwam | 1 × GN 1/6, half | 5 gevacumeerde zakjes | – | bij 2 zakjes: bestellen bij Midsland tot 5 |
| Gesneden paprika | 1 × GN 1/6, vol | 1 bak gesneden + dagelijks tellen verse doos | – | nog 2 paprika's in de doos → nieuwe doos op bestellijst |
| Verse avocado | 1 × GN 1/6, vol | 1 doos, dagelijks tellen | – | halve doos → nieuwe doos bestellen |
| Blauwe bes | 1 × GN 1/6, half | 1 bakje reserve | – | reserve aangebroken → bestellen bij **Spar** |
| Granaatappelpitjes | 1 × GN 1/9, vol | 6 granaatappels, dagelijks tellen | – | bij 2 over → bestellen bij **Boer en Chef**; pitten = MEP, batch 8 |
| Rode peper | 1 × GN 1/9, half | half wit emmertje | – | bodempje in het emmertje → 1 emmertje bij **Boer en Chef** |
| Zoetzure gember | 1 × GN 1/9, vol | aangebroken zak 1,5 kg | 2 volle zakken 1,5 kg | zie hieronder |

## Standaard voor grootverpakkingen (gember)

Dit patroon geldt straks voor elk product dat uit een zak/emmer komt die niet in één bakje past:

1. **Werkbank** — bakje bijvullen zodra er een bodempje in zit, uit de aangebroken verpakking in de koelcel.
2. **Koelcel — aangebroken verpakking** — tel je als vol / half / bodempje / leeg. Leeg? Nieuwe zak uit het magazijn halen.
3. **Magazijn — volle verpakkingen** — gember: 2 zakken van 1,5 kg. Onder de 2 komt er automatisch een zak op de bestellijst (magazijn telt mee op maandag).

Zo tel je nooit "halve kilo's" maar altijd verpakkingen, en de keten werkblad → koelcel → magazijn is voor elk grootverpakkingsproduct hetzelfde.

## Leverancier op de bestellijst

Producten krijgen een leveranciersnaam die op de bestellijst wordt getoond (nu: Spar bij blauwe bes, Boer en Chef bij granaatappel en rode peper). De overige leveranciers vul je later aan in beheer.

## Technisch

- Migratie: `koelcel_check_items` krijgt kolom `leverancier` (tekst, optioneel). Geen breaking changes.
- Data-update: `lade_id` en `volgorde` van de 7 producten naar Links boven; falafel/tempeh/döner/feta/kaas naar Rechts midden; eimengsel naar Rechts onder.
- Nieuwe rijen voor oesterzwam: werkbank (GN 1/6, vulnorm half, bron `koelcel_inkoop`) en koelcel (doel 5, bestelpunt 2, bron `midsland`, eenheid zakje).
- Bijwerken: granaatappel koelcel doel 6 + bestelpunt 2; rode peper koelcel eenheid "wit emmertje", vulnorm half, meldpunt bodempje; blauwe bes koelcel reserve 1 bakje; paprika/avocado bestelpunt en verpakking (doos).
- Gember: bestaande koelcelregel wordt de aangebroken zak (vulnorm vol/half/bodempje), plus nieuwe magazijnregel doel 2 zakken 1,5 kg, meetellend in de maandagronde.
- Beheer-scherm: leveranciersveld tonen; bestellijst toont leverancier bij de regel.
