## Probleem
In de Tijdlijn-woonruimtekolom staat bij sommige personen die eigen woonruimte hebben (zoals Josefien) toch **"toewijzen"** in plaats van een duidelijke indicatie dat ze geen slaapplek nodig hebben. De huidige tekst **"woont thuis"** is niet duidelijk genoeg.

## Oplossing
1. **Wijzig label**: Vervang "woont thuis" door **"Eigen woonruimte"** in de woonruimtekolom.
2. **Behoud logica**: Personen met `housing_not_needed = true` tonen dit label (zonder toewijzen-knop).
3. **Visueel onderscheid**: Gebruik een subtiele groene tint of het Home-icoon met duidelijke tekst zodat het direct herkenbaar is dat deze persoon geen slaapplek nodig heeft.

## Wijzigingen
- `src/pages/personeel/Tijdlijn.tsx` — Wijzig de `housing_not_needed`-weergave van "woont thuis" naar "Eigen woonruimte" en zorg dat het visueel duidelijk is (groen-tint tekst icoon, geen waarschuwingskleur).

## Niet in scope
- Geen database-wijzigingen nodig — `housing_not_needed` bestaat al.
- Geen wijziging aan de modal of edit-flow.