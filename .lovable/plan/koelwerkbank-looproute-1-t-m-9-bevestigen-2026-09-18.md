# Koelwerkbank: looproute 1 t/m 9 bevestigen

## Wat de gebruiker wil
De telronde loopt de negen laden in deze vaste volgorde:

1. Links boven · 2. Links midden · 3. Links onder
4. Midden boven · 5. Midden midden · 6. Midden onder
7. Rechts boven · 8. Rechts midden · 9. Rechts onder

## Vastgestelde stand (geverifieerd)
- Database (voorraad_lades, West): de negen laden heten precies zo en staan op volgorde 10–90 in de gevraagde volgorde. Kolom/rij-koppeling klopt (Links = kolom 1, Midden = kolom 2, Rechts = kolom 3; boven/midden/onder = rij 1/2/3).
- Telronde (VoorraadRonde.tsx): sorteert laden op `volgorde` — dus al in deze route.
- Koelwerkbank indelen (LadeGrid.tsx): toont kolom Links → Midden → Rechts, binnen elke kolom rij boven → midden → onder — zelfde leesvolgorde.
- Rollen blijven ongewijzigd: Links onder, Midden midden en Midden onder zijn reserveladen; Midden boven wordt niet geteld (aangebroken bakjes).

## Plan
1. **Geen data- of codewijziging nodig** — de volgorde staat al goed in de database en de sortering in de code volgt haar.
2. **Preview-controle**: de telronde (West, Keuken) openen en bevestigen dat de negen ladentitels op het scherm in precies de volgorde 1–9 verschijnen, inclusief de vaste balk die van lade naar lade doorloopt. Mocht één scherm toch afwijken (bijv. door een oude naam of verkeerde sortering), dan wordt dáár alleen de sortering gecorrigeerd.
3. Niets aan tellen, aanvulbonnen, bestellingen of printen veranderen.

## Praktijk
- Wie: het West-team tijdens de voorraadronde; de route volgt de fysieke plek van de laden.
- Risico: geen — er wordt niets verplaatst of verwijderd; alleen nagekeken.
