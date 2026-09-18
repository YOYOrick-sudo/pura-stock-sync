# Reservelade midden onder opschonen + kokosyoghurt toevoegen

## Wat er verandert

**Weg uit de reservelade (midden onder):**
- Tomatenrelish
- Tomatenjam
- Hummus

Deze drie tel je daarna niet meer op de koelwerkbank. Ze blijven gewoon bestaan in de koelcel/vriescel-telling, dus bestellen en bijmaken loopt door zoals nu.

**Erbij in de reservelade (midden onder):**
- Kokosyoghurt, 1 reservebakje (GN 1/9 hoog), aangevuld vanuit de koelcel.

Werkt hetzelfde als de andere producten in die lade: hij start op 0. Staat er 's avonds geen reservebakje, dan komt "Kokosyoghurt — bakje uit de koelcel" op de aanvulbon en zie je bij de koelcelregel meteen "−1 voor de werkbank". Die aanvulling hoort dus dezelfde avond te gebeuren.

Het werkbakje kokosyoghurt in de lade rechts onder blijft ongewijzigd staan.

## In de praktijk
- Wie: het team bij het sluiten, tijdens de voorraadronde op de iPad.
- Verandering in gewoonte: geen. Eén regel minder werk op drie plekken, één regel erbij bij de reserve.
- Risico: klein. De drie weggehaalde regels worden gearchiveerd, niet verwijderd — eerdere rondes en bonnen blijven kloppen.

## Technisch
- `koelcel_check_items`: `actief = false` op de drie werkbank-regels van tomatenrelish, tomatenjam en hummus (lade midden onder). Geen hard delete.
- Nieuwe regel in `koelcel_check_items`: naam Kokosyoghurt, `plek = werkbank`, `lade_id` = midden onder, `product_sleutel = kokosyoghurt`, `bron = koelcel_inkoop`, `doel_aantal = 1`, `reserve_doel = 1`, formaat GN 1/9 hoog, eenheid bakje, volgorde binnen de lade.
- Geen codewijziging nodig: de bestaande reserve-logica in `VoorraadRonde.tsx` pakt de nieuwe regel automatisch op en trekt de koelcelstand bij.
