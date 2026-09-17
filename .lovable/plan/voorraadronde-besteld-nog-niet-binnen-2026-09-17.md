# Voorraadronde: "besteld, nog niet binnen"

## Wat er nu staat (gemeten in de code)

- **Midsland-orders** tellen al mee als "onderweg": open interne bestellingen (laatste 14 dagen, niet geleverd/geannuleerd) worden van de nieuwe behoefte afgetrokken, en op de telregel staat een chip "2 zakken onderweg". Er wordt dus **niet dubbel besteld**.
- **Bestelbord** (inkoop) heeft één open signaal per product dat wordt overschreven — ook geen dubbele melding, maar de medewerker ziet het niet terug in de ronde.
- **MEP-taken** blijven staan tot ze afgerond zijn (carryover), maar zijn in de ronde niet zichtbaar.

## Het gat dat jij noemt

De dag ná het bestellen is het product er nog niet. Maar de telregel start elke dag weer op "ligt er" (het doel). Tik je dus zonder na te denken door de ronde heen, dan denkt de app dat alles weer vol is — terwijl de levering nog onderweg is. Dat is precies de blinde vlek die je aanstipt.

## Wat we bouwen

### 1. Onderweg-status in de ronde (in plaats van stil "ligt er")

Een product met iets onderweg start de volgende dag **niet** als "ligt er", maar als amber rijtje:

> **Gerookte zalm** — 2 pakjes onderweg van Midsland
> [ Binnengekomen ] [ Nog niet binnen ]

- **Binnengekomen** → telt als vol, groen vinkje. Klaar.
- **Nog niet binnen** → blijft open staan, er wordt **niets opnieuw besteld** (het onderweg-aantal wordt in de aanvulbon van het tekort afgetrokken).
- Wordt de rij helemaal overgeslagen, dan doet de app niets: geen bestelling, geen "ligt er". Veilige keuze.

De tekortberekening wordt: `tekort = doel − geteld − onderweg`.

### 2. Levering bevestigen = onderweg weg

De bestaande ontvangst-flow (Voorraad → Onderweg: Compleet/Incompleet, "wat ontbreekt?") werkt `ontvangen_aantal` bij. Zodra een levering is verwerkt, verdwijnt het onderweg-aantal en gedraagt de ronde zich weer normaal. Dit koppelen we dus aan de ronde; er komt geen tweede plek om hetzelfde af te melden.

### 3. Ook zichtbaar voor de andere routes

- **Bestelbord**: open signaal → chip "staat op het bestelbord" op de telregel. De ronde meldt het niet nog een keer.
- **MEP**: open MEP-taak voor dit product → chip "wordt gemaakt (MEP)". De ronde maakt geen dubbele taak.

Zo zie je in één oogopslag per product: ligt er / onderweg / op bestelbord / in MEP — en hoeft niemand te onthouden wat er gisteren is doorgezet.

## Technische aanpak

- `VoorraadRonde.tsx`: telregel krijgt een derde toestand "onderweg" met twee knoppen; `onderweg` wordt meegenomen in `tekortVan`.
- `useKoelcelCheck.ts`: `useOpenstaandeBestellingen` al aanwezig; nieuwe lichte query's voor open `bestel_signalen` en open MEP-taken per productnaam.
- Geen database-wijzigingen nodig — alles leunt op bestaande tabellen (`internal_order_items.ontvangen_aantal`, `bestel_signalen.status`, MEP-taken).

## Praktijk-check

- West heeft geen leidinggevende ter plekke: de twee knoppen zijn zelfverklarend, overslaan is veilig.
- Levering komt op een dag dat West dicht is? Dan blijft "onderweg" staan tot de eerstvolgende ronde.
- Levering was incompleet: `ontvangen_aantal` dekt dat al, het restant blijft onderweg meetellen.
