## Wijziging

De Voorkant/Achterkant-tabs verdwijnen in West. In plaats daarvan ziet West **één doorlopende takenlijst per fase (Open / Sluit)**, met de taken visueel gegroepeerd in twee secties onder elkaar:

```text
─── Voorkant (bediening) ───
 1. Terras opzetten              ☐
 2. Kassa openen                 ☐
 ...

─── Achterkant (keuken) ───
 8. Werkbank schoonmaken         ☐
 9. Koeling controleren          ☐
 ...
```

Zo zien medewerkers in één oogopslag álle openstaande taken voor die fase en kan er niets vergeten worden.

## Gedrag

- **Midsland**: ongewijzigd — geen secties, geen afdelingsbegrip in de UI.
- **West**:
  - Eén lijst per fase met twee secties (Voorkant boven, Achterkant onder), gescheiden door een nette sectiekop met badge en taakteller.
  - Doorlopende nummering (1,2,3…) over beide secties, zodat de "niets overslaan"-flow blijft kloppen.
  - Voortgangsbalk en fase-statistieken tellen beide secties bij elkaar op.
  - Lege sectie: kop blijft zichtbaar met de tekst "Geen taken" zodat duidelijk is dát die afdeling geen taken heeft (niet per ongeluk verborgen).

## Admin / templates

Templates blijven per afdeling beheerd (anders wordt template-beheer onoverzichtelijk en kun je geen aparte open-/sluitlijst per keuken hebben). In het admin-paneel komt bovenaan een kleine schakelaar **Voorkant | Achterkant** die alleen bepaalt wélke template-set je beheert. Dit raakt de medewerker-view niet — die blijft één gecombineerde lijst.

## Technische details

- `FohTasks.tsx`:
  - `activeDepartment`-toggle + tab-UI uit de medewerker-view halen.
  - `fetchDailyTasks` haalt voor West **beide** afdelingen op (filter op `department` vervalt voor West; voor Midsland blijft het impliciet 'voorkant').
  - Render-laag groepeert `dailyTasks` op `department` met twee sectiekoppen wanneer `userLocation === 'West'`. Drag-and-drop blijft binnen één sectie (sort_order per afdeling).
  - Nieuwe taak via "+ knop" in West vraagt aan welke kant (Voorkant/Achterkant) hij hoort — kleine segmented control in het taak-dialog.
  - `activeDepartment` blijft bestaan, maar alleen scoped op het **admin-paneel** (template-beheer).
- `generateDailyTasks` en de edge function blijven ongewijzigd: ze schrijven gewoon taken weg met het `department`-veld van de template.
- Geen DB-wijzigingen.

## Wat blijft hetzelfde

- Open/Sluit fase-knoppen.
- Day-navigator, read-only modus voor verleden, 04:00 reset.
- Wachtwoorden (West: 2020).
- Tussenlijst blijft uit voor West.
