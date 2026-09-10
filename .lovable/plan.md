# App loopt vast na terugkeren uit de achtergrond

## Wat ik heb gemeten (geen aannames)

- De database is gezond: schijf 5%, geheugen 55%, 17 van 60 verbindingen, geen herstarts. Dit is dus geen serverprobleem.
- De MEP-lijst van West is piepklein: 14 taken, 24 recepten, 4 batches, 48 receptkoppelingen — met de juiste indexen erop. Zulke aantallen laden normaal in tienden van seconden. Het lange laden komt dus niet door de hoeveelheid gegevens, maar doordat de app blijft wachten op een antwoord dat nooit komt.
- In de code zit precies het patroon dat dit veroorzaakt: bij het openen van elk beveiligd scherm wacht de app op de opgeslagen inlogsessie, zonder enige tijdslimiet. Die sessie wordt bewaard in de iPad-opslag (IndexedDB). Op iPadOS wordt die opslag bevroren zodra je naar het beginscherm gaat; komt de app terug, dan blijft die ene leesopdracht soms voor altijd hangen. Alles daarachter — takenlijst, MEP, overdracht — blijft dan eeuwig "Laden...".
- Daar bovenop: de live-verbinding (waarmee tablets elkaars vinkjes zien) valt weg bij het slapen en wordt nu nergens actief hersteld, en de automatische vernieuwing van het inloggen staat stil zolang de app op de achtergrond is.
- De laadschermen hebben geen enkele uitweg: geen tijdslimiet, geen "Opnieuw proberen"-knop. Vandaar dat volledig afsluiten van de app de enige oplossing lijkt.

## Wat ik ga doen

1. **Nooit meer oneindig wachten op de opslag**
   Het uitlezen van de inlogsessie krijgt een tijdslimiet van ongeveer een seconde. Lukt IndexedDB het niet, dan pakt de app meteen de reservekopie uit de gewone browseropslag. Wie ingelogd is blijft ingelogd; je hoeft niets opnieuw in te vullen.

2. **Alles opnieuw wakker maken bij terugkeer**
   Zodra de app weer op de voorgrond komt: inlogsessie verversen, live-verbinding opnieuw opbouwen, en de gegevens van het scherm waar je staat opnieuw ophalen. Dat gebeurt één keer per terugkeer, niet in een lus.

3. **Laadschermen met een uitweg**
   Duurt laden langer dan ongeveer tien seconden, dan verschijnt "Het duurt langer dan normaal" met een knop Opnieuw proberen. Geen eindeloos rondje meer.

4. **MEP West sneller openen**
   De dagtaken, medewerkers en receptenlijst worden nu bij elk bezoek volledig opnieuw opgehaald. Ik laat de app de vorige lijst meteen tonen en op de achtergrond bijwerken, en zet de recepten- en medewerkerslijst op een langere houdbaarheid. Openen voelt dan direct in plaats van wachten op een leeg scherm.

5. **Controleren op een echte iPad-situatie**
   Ik test in de browser: scherm openen, app naar de achtergrond simuleren (tab verbergen), enkele minuten wachten, terugkomen — en aantonen dat taken en MEP binnen enkele seconden weer gevuld zijn, met de live-verbinding actief.

## Risico's, eerlijk

- Punt 1 raakt de inlogopslag. Ik verander alleen hoe lang er gewacht wordt, niet wat er bewaard wordt; de reservekopie is er al. Risico dat iemand uitlogt is klein, maar dit is het gevoeligste onderdeel — daarom test ik uitlog/inlog expliciet.
- Punt 2 kan bij slechte wifi een extra ophaalronde geven op het moment van terugkeren. Daarom is het beperkt tot het actieve scherm en maximaal eens per dertig seconden.
- Wat dit **niet** oplost: als iPadOS de hele webapp uit het geheugen gooit, herlaadt de app volledig. Dat blijft; wel is de overdracht-tekst al beschermd met een lokaal concept.
- Geen wijziging aan database, rollen, printflow of n8n.

## Techniek

- `src/integrations/supabase/sessionStorage.ts`: `idbGet`/`idbSet` krijgen een `Promise.race` met timeout (~1000 ms) en een fallback naar localStorage; bij time-out wordt `dbPromise` gereset zodat een volgende poging opnieuw opent.
- `src/components/ProtectedRoute.tsx` en `src/contexts/UserLocationContext.tsx`: `getSession()` in een timeout-race, plus een "duurt lang"-status met retry in plaats van een blokkerende spinner.
- `src/App.tsx` (`useVersHouden`): bij `visibilitychange` → zichtbaar ook `supabase.auth.startAutoRefresh()` + `refreshSession()` en `supabase.realtime.connect()`; bij verbergen `stopAutoRefresh()`. Bestaande 30s-throttle en `invalidateQueries({ type: 'active' })` blijven.
- Realtime-hooks (`useMepTaken`, `useMepTakenBereik`, Dashboard/FohTasks-kanalen): status-callback op `subscribe()` die bij `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` opnieuw abonneert en één keer invalideert.
- MEP: `placeholderData: keepPreviousData` op de daglijst, `staleTime` op `useMepRecepten` en `useKeukenMedewerkers` (5 min).
- Geen migraties, geen nieuwe pakketten.
