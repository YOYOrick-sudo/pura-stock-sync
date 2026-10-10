# Takenlijst echt Engels maken + zoekveld verwijderen

## Probleem
- De NL/EN-knop staat er, maar taken verschijnen niet in het Engels: van de 387 taken in de database is **0** vertaald. De app viel terug op een woordenboek-truc die geen echte, nette vertaling gaf.
- Het zoekveld onder de knop is overbodig en maakt het scherm drukker.

## Wat er gebeurt

### 1. Zoekveld verwijderen
- Het zoekveld ("Zoek een taak…") en de bijbehorende filtercode gaan volledig weg uit de takenlijst.
- De NL/EN-knop blijft staan waar hij nu staat, bij alle fasen (Openen, Tussen, Borrel, Sluiten).

### 2. Alle 387 taken echt vertalen
- Ik vertaal álle 387 taaktitels (en de omschrijvingen die er zijn) zorgvuldig van Nederlands naar Engels en sla ze op in de database (de daarvoor bestemde Engelse velden bestaan al).
- Vertalingen zijn vaste, door mensen geschreven teksten — geen automatische truc. Voorbeelden:
  - "Koelcel aanzetten" → "Switch on the cold room"
  - "Vitrine aanvullen" → "Restock the display counter"
  - "Sanitair controleren en bijwerken" → "Check and tidy the washrooms"
- Nederlandse tekst blijft altijd de bron; Engels is een vaste kopie ernaast. Bestaande taken, nummering en sjablonen veranderen niet.

### 3. Woordenboek-fallback weg
- De oude automatische fallback verdwijnt. De app toont gewoon de opgeslagen Engelse tekst; ontbreekt die bij een nieuwe taak, dan valt hij netjes terug op Nederlands.

## Technische details
- Eén database-migratie met de 387 vertalingen (UPDATE op `foh_daily_templates.title_en` / `description_en`, en waar nodig `foh_tasks`).
- `src/components/foh/FohTasks.tsx`: zoekveld en `searchQuery`-filter verwijderen; `englishTaskFallback` niet meer gebruiken.
- `src/lib/foh-list-language.ts` opruimen (fallback-functie weg).
- Geen wijziging aan RLS, rechten of andere modules.

## Verificatie
- Live test op telefoon- en iPadformaat in beide vestigingen: EN aanzetten → alle taken zichtbaar in net Engels; NL terug → alles weer Nederlands; taalkeuze blijft bewaard na herladen.
- Steekproef van vertalingen in elke fase (Openen/Tussen/Borrel/Sluiten).
- Build moet foutloos zijn.
