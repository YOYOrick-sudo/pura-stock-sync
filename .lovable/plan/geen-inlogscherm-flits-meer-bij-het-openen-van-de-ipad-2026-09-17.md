# Geen inlogscherm-flits meer bij het openen van de iPad

## Wat je nu ziet
Je opent de iPad na een tijd offline: heel kort het inlogscherm, en dan springt de app alsnog naar het dashboard. Dat ziet er rommelig uit.

## Waarom dat gebeurt
De app bewaart je inlog in de lokale opslag van de iPad. iPadOS bevriest die opslag zolang de app op de achtergrond staat. Bij het openen wordt er één seconde op gewacht; komt er dan nog geen antwoord, dan concludeert de app "niemand ingelogd" en stuurt je naar het inlogscherm. Vlak daarna ontdooit de opslag alsnog, de inlog blijkt gewoon geldig, en je wordt doorgestuurd naar het dashboard. Vandaar de flits.

Elk scherm doet die controle bovendien zelf, dus verschillende onderdelen kunnen tegelijk een ander antwoord hebben.

## Wat ik ga bouwen

**1. Eén startmoment voor de hele app**
De app bepaalt bij het opstarten op één plek of je ingelogd bent. Alle schermen gebruiken dat antwoord. Geen losse controles meer die elkaar tegenspreken.

**2. Rustig startscherm in plaats van een gok**
Zolang dat nog niet bekend is, zie je het Pura Vida-logo op een rustige achtergrond — geen inlogscherm en geen leeg wit vlak. Duurt het langer dan tien seconden, dan verschijnt daaronder "Opnieuw proberen" en de bestaande herstelknop.

**3. Niet te snel concluderen dat je uitgelogd bent**
Geeft de bevroren opslag geen antwoord, dan probeert de app het nog twee keer kort achter elkaar voordat er iets op het scherm verandert. Pas als echt vaststaat dat er geen geldige inlog is, kom je op het inlogscherm.

**4. Geen net? Dan blijf je waar je bent**
Ben je offline, dan kan de app je inlog niet verversen. Dat is geen reden om je uit te loggen: je blijft in de app met een subtiele melding "Geen verbinding — opnieuw proberen", en zodra het net terug is gaat alles stil verder.

**5. Het inlogscherm wacht ook**
Kom je met een geldige inlog binnen op het inlogscherm, dan zie je hetzelfde rustige startscherm en ga je direct door naar het dashboard, zonder dat het formulier eerst even zichtbaar is.

## Wat er níét verandert
Rollen, rechten, vestigingskeuze en alle data blijven ongewijzigd. Wie echt uitgelogd is, krijgt gewoon het inlogscherm. De herstelknop blijft zoals hij is.

## Wat dit in de praktijk betekent
Een teamlid dat 's ochtends de iPad wakker maakt ziet één rustig logo-scherm en daarna zijn takenlijst. In het slechtste geval (opslag echt stuk) duurt dat startscherm iets langer dan nu het geval was, maar met een zichtbare knop in plaats van een misleidend inlogscherm.

## Technisch
- Nieuwe `src/contexts/AuthContext.tsx`: één `getSession` bij start met retry (3 pogingen, 8 s time-out per poging, korte pauze ertussen), luistert op `onAuthStateChange`, levert `status: 'onbekend' | 'ingelogd' | 'uitgelogd'` plus `offline`.
- `AuthProvider` in `src/App.tsx` om de router heen; nieuw `src/components/auth/StartScherm.tsx` (logo + spinner, na 10 s "Opnieuw proberen" + `HerstelKnop`).
- `ProtectedRoute.tsx`: eigen `getSession`/state eruit, gebruikt de context; `<Navigate to="/" replace />` alleen bij status `uitgelogd`.
- `Auth.tsx`: `checkSession`-effect vervangen door de context; rendert `StartScherm` bij status `onbekend`, navigeert bij `ingelogd`.
- `appWake.ts`: bij `navigator.onLine === false` geen sessieconclusie trekken en niet herladen; wel opnieuw proberen op het `online`-event.
- Verificatie: typecheck + build, plus Playwright-test die een bevroren opslag nabootst (getSession vertraagd) en controleert dat `/` niet tussendoor rendert.
