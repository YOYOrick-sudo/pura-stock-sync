# West takenlijst: "tonen"-tekst verwijderen uit ingeklapte sectieknoppen

## Wat er verandert

In de West-takenlijst staat op de ingeklapte sectieknop momenteel "Bediening tonen" of "Keuken tonen". Deze tekst wordt verwijderd, zodat alleen de sectienaam en de voortgangsteller (bijv. "Bedienen 3/12") overblijven. Dat maakt de knoppen lichter en voorkomt verwarring met de Open/Sluit-faseknoppen.

## Hoe het er in de praktijk uitziet

- Actieve sectie blijft uitgeklapt zoals nu.
- Ingeklapte sectie toont alleen "Bediening" of "Keuken" + "klaar/totaal".
- De knop blijft minimaal 48px hoog en aantikbaar.

## Randgevallen

- Bewerkmodus: geen wijziging, beide secties blijven uitgeklapt.
- Midsland en periodieke taken: geen sectieknoppen, dus geen impact.
- Lege sectie: toont "0/0" achter de sectienaam.

## Technisch

- Aanpassing in `src/components/foh/FohTasks.tsx`, regio rond de ingeklapte sectieknop.
- Verwijder het stukje `{label} tonen` en toon alleen `{label}`.
- Behoud of voeg een duidelijk `aria-label` toe (bijv. "Bediening sectie openen") zodat de knop voor screenreaders duidelijk blijft.
- Geen migratie, geen nieuwe packages, geen RLS/data-wijzigingen.

## Testen na oplevering

1. Open West takenlijst in preview.
2. Controleer dat de ingeklapte sectieknop alleen "Bediening" of "Keuken" + teller toont.
3. Tikken op de knop opent de sectie nog steeds.
4. Bewerkmodus opent beide secties zonder tekstverlies.
