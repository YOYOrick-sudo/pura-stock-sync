# Gerechten zichtbaar maken in de zijbalk

## Categorie
UI-wijziging zonder database-, query- of RLS-impact.

## Oorzaak
De huidige locatie-filter verbergt voor Midsland alle keukenitems behalve Mise-en-place. Daardoor wordt het nieuwe onderdeel **Gerechten** ondanks de bestaande route niet getoond.

## Aanpak
- Pas alleen de locatie-filter in de zijbalk aan zodat **Gerechten** zichtbaar is voor West én Midsland.
- Laat de bestaande beperkingen voor de overige keukenmodules ongemoeid.
- Behoud de bestaande beveiligde route `/kitchen/gerechten` en rolrechten.

## Verificatie
- West: **Keuken → Gerechten** is zichtbaar en opent `/kitchen/gerechten`.
- Midsland: **Keuken → Gerechten** is zichtbaar en opent `/kitchen/gerechten`.
- De overige, bewust verborgen keukenitems op Midsland blijven verborgen.

## Praktijk
Iedere ingelogde medewerker kan de allergenenlijst vanaf de keuken-zijbalk openen. Als gegevens niet zijn bijgewerkt, blijft de bestaande waarschuwing “nog te controleren” zichtbaar; er verandert niets aan data of bewerkrechten.
