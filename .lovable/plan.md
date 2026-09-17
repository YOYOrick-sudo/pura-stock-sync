# Fout bij doorzetten naar Midsland oplossen

## Wat er misgaat
Bij "Bevestigen en doorzetten" schrijft de app een regel op de interne bestellijst naar Midsland met herkomst "sluitlijst". De database accepteert bij bestelregels alleen de waarden "systeem" of "handmatig", dus die regel wordt geweigerd en de hele ronde stopt halverwege met een foutmelding.

Bevestigd: de controleregel op `internal_order_items` staat exact op `systeem` / `handmatig`. Bij de bestelbord-melding (`bestel_signalen`) staat geen zo'n controle, daar is "sluitlijst" wel toegestaan.

## Wat ik ga doen
1. De automatisch aangemaakte bestelregel vanuit de voorraadronde markeren als "systeem" in plaats van "sluitlijst". Dat is precies wat het veld bedoelt: door het systeem voorgesteld, niet handmatig ingetikt.
2. Dat de regel uit de sluitlijst komt blijft zichtbaar via de notitie op de bestelling ("Automatisch aangemaakt vanuit de sluitlijst").
3. Verder niets aan de flow wijzigen.

## Technisch
- `src/hooks/useKoelcelCheck.ts`, functie `naarMidsland`: insert `bron: 'sluitlijst'` → `bron: 'systeem'` (regel ~481).
- `bestel_signalen` blijft ongewijzigd (`bron: 'sluitlijst'` is daar geldig).
- Geen migratie nodig.

## Testen
Voorraadronde West → Sluiten → tel een Midsland-product te laag → Aanvulbon → Bevestigen en doorzetten. Verwacht: geen foutmelding, en de regel verschijnt onder Voorraad > Bestellen op de conceptbestelling naar Midsland.
