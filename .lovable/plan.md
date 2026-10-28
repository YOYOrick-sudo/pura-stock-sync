# Ezra en sd weghalen uit Midsland

## Wat je krijgt
- "ezra" en "sd" staan niet meer in de MEP-lijst van Midsland: niet bij het toewijzen, niet bij "Per persoon" en niet bij "Wie doet het?".
- Ze verdwijnen ook uit de namenlijst bij de takenlijst (Bediening).
- Ze worden gearchiveerd, niet echt gewist, zodat de historie bewaard blijft. Ze hebben nu geen taken en geen afgevinkte items.

## In de praktijk
- Zet je later iemand terug, dan kan dat met één aanpassing.
- Andere namen in West en Midsland blijven zoals ze zijn.

## Technisch
- Migratie: `foh_employees.archived boolean not null default false` (additief).
- Data: `archived = true` voor id's d2e36241… (sd) en 8e35afd5… (ezra).
- Filter `.eq('archived', false)` in `useKeukenMedewerkers` (useMepPlanning.ts) en in de medewerkerquery's van FohTasks.tsx. FohAnalytics blijft alle namen tonen, zodat de historie klopt.
