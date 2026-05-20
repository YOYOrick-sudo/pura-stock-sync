## Wijziging: tweede event tonen op VVV-kalender kaart

Tijdstippen overslaan (zoals aangegeven) — alleen "event daarna" toevoegen.

### Wat verandert er

Op de dashboard-kaart **VVV Event kalender** verschijnt onder het huidige eerstvolgende event een extra regel met het event dáárna, in kleinere/zachtere stijl:

```
📅 VVV EVENT KALENDER
Oerol Festival
vrijdag 12 juni · Nog 23 dagen

Daarna: Oerol Braderie · dinsdag 16 juni
```

Als er geen tweede event bestaat, blijft de regel weg (geen lege ruimte).

### Bestanden

1. **`src/hooks/useTerschellingEvents.ts`** — nieuwe hook `useSecondNextEvent()` die exact dezelfde DB-first/static-fallback logica gebruikt als `useNextEvent()`, maar `[1]` i.p.v. `[0]` teruggeeft.

2. **`src/components/dashboard/TerschellingEventsCard.tsx`** — `useSecondNextEvent()` aanroepen en onder de bestaande `dayBadge`-regel een nieuw klein blokje renderen met naam + datum van event #2. Tellertje `+{upcomingCount - 1} meer` wordt `+{upcomingCount - 2} meer` (alleen tonen als > 0).

### Niet aanraken
- Database/schema, sync-functie, statische bronlijst, andere dashboard-kaarten.
