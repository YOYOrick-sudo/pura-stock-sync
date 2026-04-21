

# Terschelling Events op Dashboard — statische lijst

## Wat ik doe

### 1. Interne bestellingen verbergen
- **`AppSidebar.tsx`**: nav-items "Interne Bestellingen" (West) en "Bestellingen van West" (Midsland) verwijderen
- **`Dashboard.tsx`**: `VoorraadCard` (West) en `DeliveryCard` (Midsland) weghalen, plus de bijbehorende `useQuery` voor `dashboard-pending-orders` en de realtime subscription op `internal_orders`
- Routes `/internal-orders` en `/midsland-bestellingen` blijven bestaan (niet breken bij directe URL), alleen niet meer bereikbaar via UI

### 2. Nieuw bestand: `src/lib/terschelling-events.ts`
Statische lijst met **alle ~80 events** uit de uploads (april 2026 → maart 2027), uitgelezen uit de screenshots. Per event:
```ts
{ name, startDate, endDate?, description, category }
```
Plus helpers:
- `getNextEvent()` — eerstvolgend event vanaf vandaag
- `getUpcomingEvents(n)` — komende N events
- `getDaysUntil(date)` — aantal dagen tot event

Volledige lijst bevat o.a.: Concert Tango op het Wad, Koningsdag, Voorjaarsmarkt, Brandaris Wandeltochten, Concert West Aleta, Meivuur, Proeveri Meslâns, Tussen Kunst en Kliko, Rommelmarkt De Stilen, Wijnmakerslunch, Stille tocht, Week van de Stenen Winkel, Nationale Reddingbootdag, Ringsteken Midsland, Dichter bij Zee, Bunkerdag, Kofferbakmarkt, HT Roeirace, Sagitta zeilrace, Dag van het Schaap, Tuigwedstrijd, HT Zeilrace, Oerol Festival (12-21 juni), Oerol Braderie, Muzikaal verteltheater, Sint Jan's Draverij, Dag van het Wad, Demonstratie paardenreddingboot, Harddraverij Oosterend, Strandfeest 'Uit je Duinpan', Ringsteken te paard, Lokale avondmarkt West, Zomeroefening KNRM, Terschelling Openlucht Filmfestival, Dag van het Paard, Platenmarkt, SC Terschelling Summercamp, Ringsteken Hoorn, Keuring KFPS, Horizontoer, Stoelendans te paard, Lokale markt Oosterend, Concerten in de kerk, Marktdraverij Heereweg, Beestemerk, Rock 'n Roll Street, Springtij, The Bluescruise, Tuigwedstrijd, Kunst in de Kerk, De Heksenmarkt, Kunst te Kijk, Kuiper Brandarisrace, Ringsteken in Midsland, Nacht van de Nacht, Kleintje Berenloop, Jeugdloop Berenloop, Berenloop, Festival LOW, Kerstmarkt West, Kerstwandeltocht, Lichtjes kerstmarkt Oosterend, Lichtjestocht Oosterend, Midwintermarkt Midsland, Nieuwjaarsduik, Trailrun Terschelling, Noordsvaarder Cross Country, Lytse Fjoertoer, Fjoertoer.

### 3. Nieuwe component: `src/components/dashboard/TerschellingEventsCard.tsx`
- Stijl identiek aan `PolarKPICard` (20px radius, primary green accent)
- Toont: 📅 icoon, eventnaam, geformatteerde datum (NL: "vrijdag 12 juni"), "Nog X dagen" badge
- Klikbaar → opent `https://www.vvvterschelling.nl/evenementen/` in nieuw tabblad
- Toont onderaan klein: "+ X komende events" (= aantal events in lijst nog te komen)

### 4. Inpassen op Dashboard
- `<TerschellingEventsCard />` toegevoegd aan grid, op alle vestigingen (West, Oost, Midsland) zichtbaar
- Vult de plek die `VoorraadCard`/`DeliveryCard` achterlaat → grid blijft 3-koloms desktop netjes

## Bestanden gewijzigd
- `src/lib/terschelling-events.ts` (nieuw)
- `src/components/dashboard/TerschellingEventsCard.tsx` (nieuw)
- `src/components/AppSidebar.tsx` (2 nav items weg)
- `src/pages/Dashboard.tsx` (2 cards weg, 1 card erbij, 1 query weg)

Geen DB-migraties, geen edge functions, geen externe API-calls. Geen onderhoud nodig tot maart 2027.

