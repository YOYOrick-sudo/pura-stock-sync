# Wisselkassa-aanvraag vereenvoudigen

## Doel
De knop "Nieuwe wisselkassa" moet sneller en intuïtiever worden: geen locatie meer kiezen (altijd de huidige vestiging), geen toelichting meer, maar wel expliciet de eigen naam invullen zodat Helga weet wie de aanvraag doet.

## Wijzigingen

### 1. `src/components/kassa/WisselkassaAanvraagButton.tsx`
- Locatie-dropdown verwijderen; vestiging komt direct uit `useUserLocation()`.
- Vestiging tonen als alleen-lezen tekst met het weergavenaam-label (`Daily` / `Foodbar`).
- Toelichting-veld verwijderen.
- Nieuw invoerveld "Jouw naam" toevoegen (verplicht, min. 2 tekens).
- De ingevoerde naam wordt gebruikt als `aanvrager` in de mail en in `wisselkassa_aanvragen.aangevraagd_door_naam`.
- Profiel-lookup blijft als fallback, maar alleen als het naamveld leeg is.
- Verstuur-knop disabled zolang naam te kort is of er wordt verstuurd.

### 2. E-mailtemplate `wisselkassa-aanvraag`
- Toelichting-regel verwijderen uit het template zodat de mail alleen vestiging, aanvrager en tijdstip toont.
- Onderwerp blijft: `Nieuwe wisselkassa nodig — [Vestiging]`.

### 3. Testen
- Open de dialog op `/kassatelling` en in kas-controle.
- Controleer dat locatie niet meer selecteerbaar is en de huidige vestiging getoond wordt.
- Controleer dat naam verplicht is en dat versturen werkt.
- Build foutloos laten lopen.

## Niet in scope
- Geen database-migratie: de kolom `toelichting` in `wisselkassa_aanvragen` blijft bestaan maar wordt niet meer gevuld.
- Geen wijziging in de bestemmingsmail (Helga) of Edge Function.
