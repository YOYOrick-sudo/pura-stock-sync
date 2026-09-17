# Inloggen blijft hangen — oorzaak wegnemen

## Wat ik heb gecontroleerd

- De inlogdienst zelf is gezond en reageert binnen 0,1 seconde.
- Er zijn vandaag wél gewoon inlogpogingen gelukt: Foodbar Midsland om 21:44 en West om 20:42 (NL-tijd). Het wachtwoord en het account zijn dus niet het probleem.
- De live app laadt in een schone testbrowser binnen enkele seconden en toont het inlogscherm normaal.
- In diezelfde test verschijnt wel een duidelijke waarschuwing: de app start **twee losse verbindingen met de inlogdienst** tegelijk in hetzelfde tabblad.
- Het hoofdbestand van de app is 2,1 MB en wordt in één keer gedownload én nog een keer in de offline-cache gezet.

Wat ik niet met zekerheid kan vaststellen zonder jouw apparaat: of het hangt vóór of ná het indrukken van "Inloggen". Daarom pakt dit plan beide hangpunten aan en komt er een knop waarmee je jezelf altijd kunt losmaken.

## Wat er misgaat (hoogst waarschijnlijk)

1. **Twee inlogverbindingen tegelijk.** Eén oud bestand maakt een tweede verbinding met de inlogdienst naast de officiële. Twee verbindingen die tegelijk de sessie willen vernieuwen kunnen elkaar blokkeren; op iPad/iPhone blijft het dan oneindig "Laden...".
2. **Geen tijdslimiet op de sessiecontrole.** Na het inloggen vraagt de app de sessie op en wacht daar onbeperkt op. Loopt die vraag vast (dat gebeurt op iPadOS nadat de app in de achtergrond heeft gestaan), dan blijft het scherm eeuwig laden. Ook de locatiecontrole direct na het inloggen heeft geen tijdslimiet.
3. **Zware eerste lading.** 2,1 MB in één bestand, plus dezelfde 2,1 MB nog eens voor offline gebruik — op trage wifi op Terschelling voelt dat als "het tabblad blijft draaien".

## Wat ik ga doen

**1. Eén inlogverbinding**
Het oude losse verbindingsbestand vervalt; het ene scherm dat het nog gebruikt (Analyse bediening) gaat over op de officiële verbinding. Daarmee verdwijnt de dubbele sessie-vernieuwing.

**2. Nooit meer oneindig wachten**
Elke sessiecontrole krijgt een harde tijdslimiet van 8 seconden. Loopt het vast, dan kom je terug op het inlogscherm met een nette melding in plaats van een eeuwige spinner. Ook de locatiecontrole na het inloggen krijgt een tijdslimiet; loopt die vast, dan ga je gewoon door naar het dashboard in plaats van te blijven hangen.

**3. Ontsnappingsknop op het inlogscherm**
Onderaan het inlogscherm komt een kleine link "App reageert niet? Herstel". Die wist de opgeslagen sessie en de offline-cache van de app en herlaadt schoon. Eén tik, geen instructies over instellingen of browsers wissen.

**4. Lichtere eerste lading**
De app wordt in delen opgesplitst zodat het inlogscherm snel start, en het zware hoofdbestand wordt niet meer vooraf in de offline-cache gepompt maar pas bij gebruik opgehaald.

## Praktijk

- Gebruikt door iedereen die inlogt op de gedeelde iPads en op eigen telefoon, vaak aan het begin van een dienst. Er verandert niets aan hoe je inlogt: zelfde knoppen, zelfde wachtwoord.
- Als iemand toch vastloopt, is de herstelknop de enige instructie die het team nodig heeft.
- Risico's: klein. Ik raak alleen de opstart- en inlogpaden aan, niet de rollen, niet de toegangsregels, niet de data. De herstelknop wist alleen lokale gegevens op dat apparaat — nooit iets in de database. Wie op dat moment ingelogd is, moet na herstel opnieuw inloggen.

## Technisch

- `src/lib/supabase.ts` verwijderen; `src/pages/foh/FohAnalytics.tsx` importeert `@/integrations/supabase/client`. Dit haalt de "Multiple GoTrueClient instances"-waarschuwing weg.
- Hulpfunctie `metTimeout(promise, ms, fallback)` in `src/lib/appWake.ts` (of nieuw `src/lib/authTimeout.ts`), toegepast op `supabase.auth.getSession()` in `ProtectedRoute.tsx`, `Auth.tsx` (checkSession) en de overige guards (`RequireManager`, `RequireOwner`, `LocationGuard`) waar zonder limiet gewacht wordt.
- `Auth.tsx`: de `user_roles`-lookup na sign-in in dezelfde 8s-race; bij time-out doorgaan naar `/dashboard` in plaats van blokkeren.
- Nieuw `src/components/auth/HerstelKnop.tsx`: `caches.keys()` legen, service workers `unregister()`, `puravida-auth` uit localStorage + IndexedDB `puravida-auth-db` verwijderen, daarna `location.replace('/')`.
- `vite.config.ts`: `workbox.globPatterns` zo dat het hoofd-JS niet geprecached wordt maar via `runtimeCaching` (StaleWhileRevalidate) gaat; `maximumFileSizeToCacheInBytes` kan dan weer omlaag. Plus `build.rollupOptions.output.manualChunks` voor react/router/supabase/recharts.
- Geen migratie, geen nieuwe libraries, geen wijziging aan RLS of rollen.

## Verificatie

- Schone testbrowser: inlogscherm laden, console leeg (geen dubbele-client-waarschuwing), inloggen als gedeeld account West → dashboard.
- Tweede tabblad tegelijk open: geen hangende spinner.
- Sessie-opslag handmatig corrupt maken → binnen 8 seconden terug op het inlogscherm met melding, niet oneindig laden.
- Herstelknop: caches en service worker weg, app start schoon op het inlogscherm.
