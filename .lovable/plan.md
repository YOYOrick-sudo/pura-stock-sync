# Overdracht niet meer kwijt bij vastlopen app

## Probleem (bevestigd in code)
De overdracht (HandoverCard) wordt pas opgeslagen als je uit het veld klikt of op "Opslaan" drukt. Loopt de app vast of crasht hij terwijl je typt, dan is alles wat je hebt getypt weg. De eerdere snelheidsfixes verminderen vastlopen, maar beschermen de getypte tekst niet.

## Oplossing: automatisch concept bewaren

1. **Concept per toetsaanslag** — elke wijziging in het overdracht-veld wordt direct (lokaal, op het apparaat) bewaard als concept, per vestiging.
2. **Herstel na vastlopen/sluiten** — open je de app opnieuw en is er een niet-opgeslagen concept, dan staat die tekst weer in het veld, met een kleine melding "Concept hersteld".
3. **Concept opruimen** — zodra opslaan naar de server gelukt is (of je annuleert bewust), wordt het concept gewist.
4. **Server-tekst heeft voorrang bij vers ingericht apparaat** — is er géén concept, dan geldt zoals nu de laatst opgeslagen overdracht.

Bewust géén automatisch-naar-server-opslaan bij elke toetsaanslag: dat zou halve zinnen naar andere tablets sturen (realtime). Lokaal concept + opslaan bij verlaten veld dekt het probleem zonder ruis.

## Scope
- Alleen `src/components/HandoverCard.tsx`. Geen database- of backend-wijzigingen.

## Verificatie
- Typen → app/tab sluiten zonder opslaan → opnieuw openen → tekst staat er nog.
- Opslaan → concept weg; annuleren → concept weg.
- Werkt per vestiging (West/Midsland aparte concepten).
- Build groen.
