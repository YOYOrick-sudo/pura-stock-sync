# Gerechten-overzicht: kolom "Kaart" eruit

## Wat verandert
- De kolom **Kaart** (VG, GL, N, P, SV-tekens) verdwijnt uit de tabel op Keuken → Gerechten.
- **Bevat** en **Kan bevatten** blijven de enige plek voor allergenen: één bron, één weergave.
- Het groene **Vegan**-label naast de naam blijft (dat is geen allergeen, maar wel handig bij het zoeken).
- Kolommen worden: Gerecht · Prijs · Bevat · Kan bevatten · acties. De vrijgekomen ruimte gaat naar Bevat, zodat chips minder vaak op twee regels staan.

## Wat niet verandert
- Gegevens in de database (kaarttekens blijven bewaard, niets verwijderd).
- Veiligheidsfilter "Moet vrij zijn van" en het blok "Niet te garanderen".
- Bewerkvenster van een gerecht.

## Technisch
- `src/pages/kitchen/Gerechten.tsx`: kolom `Kaart` en bijbehorende cel/mobiele weergave verwijderen.
- `src/components/kitchen/GerechtKaartInfo.tsx`: kaarttekens-badges niet meer renderen in de tabel (component voor omschrijving/prijs blijft).
- Tests opnieuw draaien; screenshot desktop + tablet.
