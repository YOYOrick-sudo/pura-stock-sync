# Voorraadronde West: lades en koelcel bijwerken

## Koelwerkbank
- **Zoetzure gember (links boven):** norm wordt "half vol". Half vol = in orde, pas bij bodempje/leeg aanvullen.
- **Tomatenjam (midden onder):** komt terug als reservebakje, 1 stuk. Start op 0 zoals de andere reserves; ontbreekt hij, dan komt hij op de aanvulbon (uit de koelcel).
- **Döner kebab (rechts midden):** staat al op "vol" (GN 1/6 hoog). Blijft zo; ik controleer in de ronde dat het ook zo getoond wordt.
- **Rechts onder:** zuurdesem stokbrood, broodbakken en vegan roomkaas eruit.
- **Kokosyoghurt:** alleen nog in midden onder, 1 bakje GN 1/9 hoog. Het tweede bakje in rechts onder verdwijnt.

Alles wat eruit gaat wordt gearchiveerd, niet verwijderd. De koelcel-/vriesregels van broodbakken en vegan roomkaas blijven bestaan, zodat bestellen doorloopt. (Wil je die ook weg? Zeg het, dan neem ik ze mee.)

## Koelcel — groente en fruit
- **Kiemen:** "Kiemen (pakken)" wordt gesplitst in een telregel per soort: Ertasperge, Greenpeez, Chine Rose. Ik zet ze op 1 pak op peil, bestellen bij 0. Is er een vierde soort, noem hem dan, dan voeg ik hem toe. Het bakje kiemen in links onder blijft één bakje.
- **Gesneden bloemkool** gaat eruit. Nieuw: **Bloemkool** (heel, ingekocht), 3 op peil, bij 2 op het bestelbord.

## Je vraag: magazijn en vriescel
Ja, klopt: die worden 1x per week geteld, op maandag. Op andere dagen staan ze niet in de ronde. Hier verandert niets.

## Technisch
- `koelcel_check_items` (West): gember werkbank `vulnorm='half'`; tomatenjam werkbankregel midden onder heractiveren/aanmaken met `reserve_doel=1`, `bron=koelcel_inkoop`, `product_sleutel=tomatenjam`; `actief=false` op zuurdesem, broodbakken, vegan roomkaas en kokosyoghurt (werkbank, rechts onder).
- Kiemen (pakken) `actief=false`; drie nieuwe koelcelregels, `bron=koelcel_inkoop`, `doel_aantal=1`, `bestelpunt=0`, eenheid pak.
- Gesneden bloemkool `actief=false`; nieuwe koelcelregel Bloemkool, `bron=koelcel_inkoop`, `doel_aantal=3`, `bestelpunt=2`.
- Alleen data, geen codewijziging. Daarna live testen in de ronde (telefoonformaat).
