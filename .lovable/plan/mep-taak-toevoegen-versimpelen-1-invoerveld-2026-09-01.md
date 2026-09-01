# MEP "Taak toevoegen" versimpelen (1 invoerveld)

## Doel
Taak toevoegen in 2 tikken: typen → tikken. Het systeem herkent zelf of het een bestaand recept is of vrije invoer. Persoon toewijzen gebeurt pas ná toevoegen, niet als verplicht veld ervoor.

## Huidige pijn (MepTaakToevoegen.tsx)
- Twee tabbladen (Recept / Vrije taak) dwingen een keuze die het systeem zelf kan maken.
- Verplichte veldenblokken (prioriteit, medewerker, notitie) staan in de weg van snel toevoegen.
- Persoon koppelen vereist opnieuw openen/bewerken van de taak.

## Nieuw ontwerp — één dialoog, twee stappen

### Stap 1: Toevoegen (één scherm)
- **Bovenaan**: de 6 "Vaakst gemaakt"-snelknoppen blijven (1 tik = toegevoegd).
- **Eén groot invoerveld** (h-12, autofocus) met live-lijst eronder:
  - Bij ≥2 tekens: gefilterde recepten (met methode eerst, dan overige recepten — bestaande `useMepRecepten`-logica).
  - Eerste rij toont exacte match of "+ Nieuw: '&lt;tekst&gt;'" als vrije taak.
  - Tik op recept → direct toegevoegd (standaard aantal 1, prioriteit Normaal).
  - Tik op "+ Nieuw" → vrije taak toegevoegd (categorie Algemeen).
- **Aantal-stepper** verschijnt alleen inline op de gekozen receptrij (geen apart blok).
- Geen tabbladen, geen verplichte selects meer in dit scherm.

### Stap 2: Persoon toewijzen (na toevoegen)
- Na succesvol toevoegen: dialoog blijft open en toont compacte bevestiging:
  - "✓ {titel} toegevoegd" + chiprij medewerkers (grote tikdoelen, min 44px).
  - Tik op naam → taak gekoppeld, toast, dialoog sluit en reset naar stap 1.
  - Knop "Overslaan" / klik buiten → dialoog sluit, taak blijft niet-toegewezen.
- Invoerveld is direct weer leeg voor de volgende taak (snel meerdere achter elkaar).

### Prioriteit/notitie
- Verdwijnen uit het snelle pad. Wie het wil finetunen: bestaande bewerk-flow op de taak zelf (geen nieuwe functionaliteit nodig).

## Technisch
- Alleen `src/components/kitchen/MepTaakToevoegen.tsx` herbouwen; props/interface blijven gelijk (`onToevoegen(input)` + nieuwe interne `update`-mutation voor toewijzen via bestaande hook in `useMepTaken`).
- `MepToevoegenDialog` (MepPlanning-pagina) blijft ongemoeid — aparte oude flow.
- Toewijzen na toevoegen gebruikt bestaande update-mutatie (geen nieuwe DB-wijzigingen).

## Verificatie
- /kitchen/mep: taak toevoegen via snelknop, via recept-zoekresultaat, en via vrije invoer; daarna persoon aanklikken en overslaan.
- Tablet: tikdoelen ≥44px, lijst scrollt, geen dubbelklik nodig.
