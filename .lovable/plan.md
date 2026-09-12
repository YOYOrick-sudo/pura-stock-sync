# Versturen van de kassatelling: nooit meer hangen

## Wat ik heb gevonden

Het vastlopen is nog niet verholpen. Beide kassatelling-schermen (openen en sluiten) hebben bij het versturen hetzelfde probleem dat eerder bij de wisselkassa-knop speelde:

- De knop krijgt geen "bezig"-toestand. Tijdens het versturen ziet het scherm er identiek uit, dus het lijkt alsof er niets gebeurt.
- Er wordt eerst gecontroleerd wie is ingelogd. Die controle kan op een iPad die lang op de achtergrond stond blijven hangen zonder foutmelding — dan komt er nooit een succes- of foutmelding.
- Het opslaan zelf heeft geen tijdslimiet: bij slechte wifi blijft het eindeloos wachten.
- Omdat de knop aanklikbaar blijft, tikken mensen nog een keer. Dat verklaart de dubbele tellingen die we in Kas-controle zien (Foodbar 9 september, Daily 2 september).

Wat wel goed staat: mislukt het opslaan met een echte fout, dan komt er een duidelijke melding en blijft de telling lokaal bewaard.

## Wat ik ga aanpassen

Voor zowel de sluittelling als de opentelling:

1. **Bezig-toestand**: na het tikken wordt de knop direct uitgeschakeld en toont hij "Bezig met versturen…". Zo is meteen zichtbaar dat er iets gebeurt en kan er niet dubbel getikt worden.
2. **Harde tijdslimiet van 15 seconden** op de inlogcontrole en op het opslaan. Duurt het langer, dan stopt het wachten en komt er een duidelijke melding: opslaan is niet gelukt, de telling is lokaal bewaard, probeer opnieuw.
3. **Altijd een afronding**: of het nu lukt of mislukt, de knop wordt weer bruikbaar en er verschijnt altijd óf het succesvenster óf een foutmelding. Nooit meer een scherm dat blijft hangen.
4. **Inlogcontrole minder kwetsbaar**: eerst de al bekende sessie gebruiken, alleen opnieuw ophalen als die er niet is.

## Wat er niet verandert

Telwijze, doelsaldo, kasverschil, de 10 minuten-blokkade tegen te snel opnieuw indienen, de lokale back-up en het succesvenster blijven precies zoals ze zijn. Geen wijzigingen aan de database, rechten of Kas-controle.

## Technische details

- `src/pages/Kassa.tsx` en `src/pages/KassatellingOverdag.tsx`: `isSubmitting`-state toevoegen, `handleSubmit` met guard bij begin en `finally` die de state altijd vrijgeeft.
- `supabase.auth.getSession()` met fallback naar `getUser()`, beide in een `Promise.race` met een timeout van 15 s; dezelfde race om de `insert` op `kassa_afdrachten`.
- Knoppen op regel ~533 (Kassa) en ~435 (Overdag) krijgen `disabled={... || isSubmitting}` en een gewijzigd label.

## Controle na het bouwen

- Typecontrole en build.
- In de preview als ingelogde gebruiker een sluittelling versturen: knop wordt direct "Bezig…", daarna verschijnt het succesvenster.
- Tweede tik tijdens het versturen doet niets (geen dubbele regel in Kas-controle).
