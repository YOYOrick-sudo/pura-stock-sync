## Doel
Overdracht-card groeit automatisch mee met de tekst — geen scrollbalk meer, alles in één oogopslag zichtbaar. Bij weinig tekst blijft de card compact.

## Wijziging
**Bestand:** `src/components/HandoverCard.tsx`

- Vervang de vaste `rows={4}` + `resize-none` Textarea door een **auto-resizing textarea**:
  - `rows={3}` als minimum (compacte weergave bij weinig/geen tekst)
  - `overflow: hidden` zodat er nooit een scrollbalk verschijnt
  - `useLayoutEffect` hook die bij elke wijziging van `memoText` én van `latestMemo?.message` de hoogte reset naar `auto` en dan zet naar `scrollHeight` → textarea groeit exact mee met de inhoud
  - Werkt zowel tijdens typen als bij het laden van bestaande memo's (bijv. de lange Midsland-tekst)

## Wat blijft ongewijzigd
- Realtime sync, opslaan/annuleren, keyboard shortcuts, placeholder, styling van de card zelf, "Laatst bijgewerkt"-regel — allemaal ongemoeid.
- Alleen de textarea-hoogte-logica wordt aangepast.

## Verificatie
- Lege/korte memo → card is compact (~3 regels hoog).
- Lange Midsland-memo → textarea toont **alle** regels zonder scrollen; card groeit mee.
- Tijdens typen groeit de card regel-voor-regel mee.
