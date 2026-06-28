## Doel
In West kan je nu zowel Voorkant (bediening) als Achterkant (keuken) zien. We willen per iPad instellen welke afdeling standaard bovenaan/geopend staat, zodat de keuken-iPad direct bij keukentaken begint en de bediening-iPad bij bedieningstaken.

## Aanpak

**1. Apparaat-instelling (per iPad opgeslagen)**
- Nieuwe instelling `foh_device_mode` in `localStorage` van die specifieke iPad: `"voorkant"` | `"achterkant"` | `"beide"` (default).
- Blijft staan na refresh/sluiten — eenmalig instellen per iPad is genoeg.

**2. Waar instel je het**
- In het Admin-paneel (wachtwoord 2020 in West) een nieuw blokje **"Apparaat-modus"** met 3 knoppen: Bediening / Keuken / Beide.
- Toont duidelijk welke modus actief is op dít apparaat.
- Sneltoegang: ook een klein tandwiel/label rechtsboven in de takenlijst waar je snel kan wisselen (zonder admin-wachtwoord, want het is een lokale apparaat-keuze, geen data-wijziging).

**3. Gedrag in de takenlijst (West)**
- Modus **Bediening**: alleen Voorkant-taken zichtbaar, geen department-tabs.
- Modus **Keuken**: alleen Achterkant-taken zichtbaar, geen department-tabs.
- Modus **Beide** (default, ongewijzigd gedrag): huidige weergave met beide secties.
- Voor Midsland verandert er niks (geen departments daar).

**4. Veiligheid / geen bugs**
- Alleen UI-filter; database en templates blijven onaangeraakt.
- Aanmaken/bewerken van taken in admin blijft voor beide afdelingen werken, ongeacht apparaat-modus (anders kan een keuken-iPad geen voorkant-taak meer aanmaken — niet wenselijk).
- Bij wisselen van modus: directe refresh van de lijst, geen herladen nodig.

## Bestanden
- `src/components/foh/FohTasks.tsx` — modus uitlezen uit localStorage, filteren van zichtbare departments, modus-schakelaar in admin + sneltoegang-chip.

## Vraag vooraf
Wil je dat de sneltoegang-schakelaar (zonder wachtwoord) zichtbaar is, of moet wisselen tussen Bediening/Keuken/Beide altijd via admin (2020)? Dat laatste voorkomt dat personeel per ongeluk de modus van een iPad omzet.
