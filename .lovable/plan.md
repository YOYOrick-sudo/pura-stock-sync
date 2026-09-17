# App werkt altijd, ook na uren stilstaan

## Wat er gisteravond gebeurde

In de printwachtrij staat gisteren als laatste een sticker om 21:36 (Nederlandse tijd), netjes geprint. Daarna niets: geen mislukte opdracht, geen wachtende opdracht. De printserver in West meldt zich nu ook gewoon als actief.

Jouw printopdracht is dus nooit in het systeem aangekomen. De printer was niet het probleem — de app op de iPad was na uren slapen niet meer echt "levend" en je tik liep dood.

## Waarom dat gebeurt (drie oorzaken, niet één)

1. **Verlopen inlogsleutel.** Slaapt de iPad urenlang, dan is de sleutel verlopen. Die wordt pas vernieuwd nádat het scherm al zichtbaar is. Tik je in die eerste seconden, dan vertrekt het verzoek met een dode sleutel.
2. **Bevroren verzoeken van vóór het slapen.** iPadOS bevriest openstaande verzoeken bij het wegleggen van de app. Bij terugkomst geven ze nooit meer antwoord: ze mislukken niet, ze blijven hangen. Daardoor blijft een scherm op "laden" staan of blijft een knop draaien — precies wat je zag.
3. **Dode live-verbinding.** De verbinding voor live bijwerken (taken, MEP) is na uren slapen verbroken; zonder herstel verandert er niets meer op het scherm.

Punt 2 is de belangrijkste en werd tot nu toe nergens afgevangen.

## Uitgangspunt

Geen meldingen, geen "verbinding herstellen", geen wachtscherm. Je opent de app en hij werkt. Alles gebeurt onzichtbaar, achter je tik aan.

## Wat we bouwen

1. **Harde streep bij het wegleggen.** Gaat de app naar de achtergrond, dan worden lopende verzoeken afgebroken in plaats van bevroren achtergelaten. Zo kan er niets blijven hangen waar de app later op wacht.

2. **Onzichtbaar wakker worden.** Bij terugkomst: inlogsleutel vernieuwen als die verlopen of bijna verlopen is, live-verbinding opnieuw opbouwen, en de gegevens van het scherm waar je op staat opnieuw ophalen. Je ziet alleen je scherm zoals je het achterliet, met verse cijfers erin.

3. **Elke actie herstelt zichzelf.** Tik je op printen, opslaan of afvinken terwijl de app nog bijkomt, dan wacht die actie intern kort op de verse sleutel en gaat daarna door. Mislukt hij op een sleutel- of netwerkfout, dan doet de app automatisch één nieuwe poging. Alles met een harde tijdslimiet, zodat een knop nooit meer eindeloos draait.

4. **Noodrem.** Is de app 8 seconden na terugkomst nog steeds nergens (geen sleutel, geen verbinding), dan herlaadt hij zichzelf stil — mits er geen invoer of popup openstaat. Herladen duurt een seconde en is altijd beter dan een dood scherm. Dit is het vangnet dat garandeert dat de app het "gewoon doet".

5. **Warm blijven tijdens dienst.** Zolang het scherm aanstaat, doet de app elke paar minuten een lichte controle op sleutel en verbinding. Zo kom je overdag nooit in een koude app.

6. **Nieuwe versie stil ophalen.** Bij terugkomst controleert de app of er een nieuwere versie gepubliceerd is en laadt die zelf, als er niets openstaat. Scheelt het handmatig afsluiten en heropenen van de tablets.

## Wat dit in de praktijk betekent

- iPad uren uit, je opent 's avonds de app en tikt meteen op printen: de sticker komt eruit.
- Wifi even weg en terug: zelfde routine, geen dode knoppen.
- Alleen bij een echte storing (internet plat) krijg je één korte melding "Niet verstuurd — probeer opnieuw" in plaats van een draaiende knop.

**Wat dit niet oplost:** is het internet in West écht weg, dan kan de app de opdracht niet versturen. Hij faalt dan snel en duidelijk in plaats van te blijven hangen. Offline-opslaan-en-later-versturen zit niet in deze stap.

**Risico:** klein. Geen wijzigingen aan database, printserver of printflow. Wel raken we de app-brede laag, dus we testen taken, MEP, printen en kassatelling na de wijziging. Het eerdere "uitgelogd na wakker worden" vermijden we expliciet: de sleutel wordt alleen ververst als hij bijna of al verlopen is, nooit geforceerd, en een mislukte verversing logt niemand uit.

## Technische uitwerking

**Nieuw: `src/lib/appWake.ts`**
- `zorgVoorSessie(force = false)`: gedeelde, gedebouncede promise. Leest `supabase.auth.getSession()` (via `withTimeout` 8s); bij `expires_at` binnen 120s of `force` → `refreshSession()` met timeout. Faalt het: resultaat `false`, geen `signOut`. Roept `supabase.realtime.connect()` aan. Cachet het resultaat tot de volgende achtergrondronde.
- `abortAlles()`: centrale `AbortController` die bij `visibilitychange → hidden` wordt afgebroken en bij terugkeer vervangen; React Query krijgt deze mee zodat bevroren fetches echt eindigen.
- `herstelOfHerlaad()`: `Promise.race` tussen herstel en 8s; bij timeout `location.reload()` mits `document.querySelector('[data-openstaande-invoer]')` leeg is en er geen open dialog is.

**`src/App.tsx` (`useVersHouden`)**
- `hidden`: `focusManager.setFocused(false)`, `supabase.auth.stopAutoRefresh()`, `queryClient.cancelQueries()`, abort-controller afbreken.
- `visible`/`online`: `startAutoRefresh()`, `await herstelOfHerlaad()`, dan `queryClient.invalidateQueries({ type: 'active' })`. Bestaande 30s-throttle blijft.
- Warmhouden: interval 4 min, alleen bij `visibilityState === 'visible'`, roept `zorgVoorSessie()` aan.
- QueryClient: `networkMode: 'always'` vermijden bij mutaties niet nodig; wel `retry: 2` behouden en `queries.retryOnMount: true`.

**Mutaties** (`useCreatePrintJob`, `useCreateStickerPrintJob`, `mep_taak_afronden`-aanroep, kassatelling-insert)
- `await zorgVoorSessie()` vóór de call, insert via `withTimeout(…, 15_000)`.
- Eén automatische retry bij 401/`JWT expired`/netwerkfout na `zorgVoorSessie(true)`.
- Toast alleen bij definitieve fout; loading-state altijd vrijgeven.

**Versiecheck**
- Bij herstel: `navigator.serviceWorker.getRegistration()?.update()`. De PWA staat al op `registerType: 'autoUpdate'` met `skipWaiting`, dus een nieuwe versie wordt daarna vanzelf actief; we herladen alleen als er geen invoer openstaat.

**Niet gewijzigd:** database, RLS, edge functions, print-bridge, bestaande schermen en routes.

## Verificatie

Playwright als eigenaar op West:
1. App laden op MEP/snel printen, sessie handmatig laten verlopen en het tabblad verbergen met een openstaand verzoek.
2. Terugkeren en binnen één seconde op printen tikken; controleren dat er een nieuwe rij in `print_jobs` verschijnt en geen herstelmelding in beeld kwam.
3. Herstel blokkeren (netwerk uit) en bevestigen dat de noodrem binnen 8 seconden herlaadt en de knop niet blijft draaien.
4. Na afloop: taken, MEP en kassatelling doorklikken op regressies; testrijen uit `print_jobs` verwijderen.
