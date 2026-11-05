# Automatische Engelse vertaling van taken

## Wat er verandert
- Voeg je een taak toe of wijzig je de Nederlandse titel/uitleg (in Taken beheren of de lijst), dan vult de app automatisch de Engelse titel en uitleg in.
- Heb je zelf al Engels ingevuld, dan blijft dat staan (handwerk wordt nooit overschreven).
- Ook categorienamen zonder Engels krijgen een vertaling.
- Lukt vertalen niet (wifi, storing), dan wordt de taak gewoon opgeslagen; het team ziet dan de Nederlandse tekst, zoals nu.
- Eenmalig: knop "Ontbrekende vertalingen aanvullen" in Taken beheren voor bestaande taken zonder Engels.

## Praktijk en risico's
- Opslaan blijft direct; de vertaling verschijnt een paar seconden later.
- Vaktermen (bv. "MEP", "bain-marie") kunnen raar vertaald worden; je kunt het Engels altijd met de hand aanpassen.
- Geen invloed op afvinken, volgorde, dagelijkse reset of andere locatie.

## Technisch
- Nieuwe backendfunctie `translate-task` (Lovable AI, ingelogd + manager-check, Zod-validatie), geeft `{title_en, description_en}` terug via strikt JSON-schema.
- Aanroep na succesvolle insert/update in `ListManager.tsx` en de template-editor in `TakenBeheer.tsx`, alleen als `_en` leeg is of het Engels gelijk was aan de vorige automatische vertaling; schrijft alleen `title_en`/`description_en`/`category_en` naar `foh_daily_templates`/`foh_tasks`.
- Geen schemawijziging nodig (velden bestaan al). Tests voor de "niet overschrijven"-regel. Niet publiceren.
