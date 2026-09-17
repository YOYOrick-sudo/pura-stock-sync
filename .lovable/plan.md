# Koelwerkbank: vullen op het oog, niet op getallen

## Wat er nu misgaat

Bij Forel in de koelwerkbank staat "Hoeveel ligt er?" met een teller en "0,5 stuks". Dat klopt niet met de praktijk: van eiwitten ligt er nooit een extra bakje achter de hand. Je kijkt in het bakje en ziet of het vol, half, op een bodempje of leeg is. En 0,5 stuks is voor niemand te lezen.

## De vaste regel — één manier per product

Elk product in de koelwerkbank valt voortaan in precies één van twee soorten, en dat bepaalt hoe je telt:

**1. Werkbakje beoordelen** (eiwitten, groente, brood — alles zonder reserve)
Vier knoppen, meer niet:

```text
[ vol ]   [ half ]   [ bodempje ]   [ leeg ]
```

Per product staat erbij tot hoever het bakje hoort te staan, in dezelfde woorden: "hoort vol" of "hoort half". Forel: hoog 1/6 bakje, hoort half. Zie je minder dan de norm, dan komt het product op de aanvulbon met een opdracht in gewone taal: "Vul het bakje forel bij tot de helft — uit de koelcel." Ligt het niet in de koelcel, dan volgt het de bestaande route: vriescel (met Ontdooid-sticker), MEP, Midsland of bestelbord.

**2. Reservebakjes tellen** (mayonaises, spreads en alles waar wél een reserve van staat)
Blijft zoals het nu is: hele bakjes met plus/min tegen het afgesproken reserve-aantal. Geen vulgraad.

Welke van de twee geldt, zie je aan het product: staat er een reserve-aantal ingesteld, dan tel je reserve; anders beoordeel je het bakje.

## Wat verdwijnt

- Geen "0,5 stuks", "0,5 bak" of andere halve aantallen meer in de koelwerkbank.
- Geen teller met plus/min bij producten zonder reserve.
- Geen losse vraag "laatste, aangebroken bak" bij de koelwerkbank; die blijft alleen bij koelcel en vriescel, waar je wél in hele bakken telt.

## Instellen

In **Koelwerkbank indelen** krijgt elk product één regel met twee dingen: hoeveel reservebakjes (0 = geen reserve) en, als reserve 0 is, de vulnorm **vol** of **half**. Producten die nu op 0,5 staan (Forel, Gerookte zalm, Tempeh, Blauwe bessen, Rode peper) worden vulnorm **half** met reserve 0; de rest wordt **vol**. Mayonaises en spreads houden hun reserve-aantal.

## Wat dit betekent voor het team

De ronde langs de werkbank wordt kijken en tikken: lade open, per bakje één knop. Geen inschatting van aantallen meer. De afspraak die mee moet: een bakje dat onder zijn norm staat, vul je diezelfde dag bij — staat het niet in de koelcel, dan komt het vanzelf op MEP of de bestellijst.

Risico om te kennen: "half" is een inschatting; twee mensen kunnen het net anders zien. Daarom staat de norm altijd bij het product, en is "bodempje" altijd aanvullen.

## Technisch

- Migratie: `vulnorm text` ('vol' | 'half', default 'vol') op `koelcel_check_items`; items met `doel_aantal` 0,5 in West/werkbank → `vulnorm 'half'`, `doel_aantal`/`doel_aantal_druk` terug naar 1; `reserve_doel` voor die items op 0.
- `useKoelcelCheck.ts`: `isReserveItem` wordt `reserveDoel(item) > 0` (i.p.v. plek === 'werkbank'); nieuwe helper `vulnormWaarde(item)` → 1 of 0,5.
- `VoorraadRonde.tsx`: `TelRegel` krijgt drie modi — reserve (stepper), vulling (4 knoppen vol/half/bodempje/leeg, 44px), en hele bakken (koelcel/vriescel, ongewijzigd). `telDoel` gebruikt voor vulling de `vulnorm`. Vulwaarden: vol 1, half 0,5, bodempje 0,25, leeg 0. Ondertitel: "hoort half · hoog bakje (GN 1/6)".
- Aanvulbon: voor vullingregels geen "1 bak halen" maar "bijvullen tot half"; hoeveelheid voor doorzetten naar Midsland/bestelbord blijft afronden naar hele eenheden via `Math.ceil`.
- `LadeGrid.tsx` / `useVoorraadLades.ts`: per product reserve-aantal + vulnorm-keuze.
- Geen nieuwe libraries.

## Testen

West → Sluiten → Keuken → Voorraadronde → Koelwerkbank: Forel toont "hoort half" met vier knoppen; "bodempje" tikken geeft op de bon "Vul bij tot de helft — uit de koelcel"; Chimichurrimayonaise toont nog steeds reserve met plus/min; nergens meer een komma-getal.
