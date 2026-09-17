# Voorraadronde: tekort-indicatie subtieler maken

## Wat het nu doet
Op de vulling-kaarten (forel, gerookte zalm, enz. in de koelwerkbank) kleurt bij een tekort de hele kaart amber: amber rand, amber achtergrond en daaronder een aparte tekstregel "Bijvullen tot de helft / vol". Samen voelt dat luid en groot.

## Wat er verandert (alleen `src/components/foh/VoorraadRonde.tsx`, vulling-modus)
1. **Kaart**: achtergrond blijft gewoon `bg-card` (geen amber wash meer). Bij een tekort alleen een subtiele amber rand: `border-amber-400/50` i.p.v. `/70`.
2. **Tekstregel weg als los blok**: "Bijvullen tot de helft/vol" verdwijnt als eigen regel onder de knoppen. In plaats daarvan komt er rechtsboven in de kopregel, naast "wissen", een klein chipje: `bijvullen` (11px, amber tekst op amber/10 achtergrond) — zichtbaar zodra er een tekort is.
3. De knoppen (Vol/Half/Bodempje/Leeg) en de 44px tikdoelen blijven exact zoals ze zijn.

De kopregel toont al "hoort half · standaard, hoog", dus de informatie blijft volledig aanwezig — alleen rustiger gepresenteerd.

## Niet aangepast
- De "onderweg"-kaarten (Binnengekomen / Nog niet binnen) blijven zoals ze zijn; die vragen om een expliciete actie.
- Reserve- en bakken-modus blijven ongewijzigd.

## Testen
- West → Sluiten → Keuken → Voorraadronde → Koelwerkbank: kaart met tekort toont subtiele rand + chip, geen amber achtergrond, geen losse tekstregel.
- Na aanvullen op "Half" of "Vol" verdwijnt de rand en het chipje.
