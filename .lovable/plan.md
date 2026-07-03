## Aanvullende instructies — Stickers-stap (voorheen SnelPrinten)

Deze notitie hoort bij de Stickers-module in de bestaande refactor-volgorde:
**Onderhoud → Kassatelling → Recepten → Ingrediënten → Stickers → …**

De volgorde blijft ongewijzigd. Onderstaande punten worden pas uitgevoerd wanneer Stickers aan de beurt is, bovenop de standaard-behandeling (SectionTitle i.p.v. stap-bolletjes, "Stickers" in sidebar én paginatitel).

### Presentatie-opschoning
1. **Dubbele/overbodige hints weg**
   - Verwijder "standaard +X dagen" op beide plekken (Type sticker én Datums). De datumvelden + stepper spreken voor zich.
   - Verwijder de hint "Uit de vriezer" bij het type — knop heet al "Ontdooid".
2. **Metadata-regel volledig weg**: verwijder "57 × 32 mm • Zebra ZD411d" onder het voorbeeld. Alleen het voorbeeldplaatje blijft.
3. **Focus-ring op type-knoppen**: gebruikt nu een blauwige default-ring. Fix in token/component zodat de ring de primary-kleur volgt — niet lokaal patchen.

### Micro-UX
4. **Disabled-uitleg bij Print-knop**: zolang de knop disabled is (geen productnaam), toon eronder muted hulptekst *"Typ eerst een productnaam"*. Verdwijnt zodra de knop actief wordt.
5. **Suggesties direct in combobox**
   - Bij focus (0 tekens): meteen top-8 meest geprinte producten tonen (`order by keer_geprint desc`).
   - Vanaf 1e teken: live `ilike`-filter, bestaande 200ms debounce blijft.
   - Doel: herhaal-sticker = veld tikken → product tikken → printen, zonder typen.

### Kleine functionele uitzondering: "Vandaag geprint"
6. Onder het voorbeeldpaneel een kaart *"Vandaag geprint"*:
   - Laatste 5 `print_jobs` van vandaag.
   - Per regel: `label_omschrijving` + tijdstip + status-badge.
   - Compacte **herprint-knop** die dezelfde ZPL opnieuw als `pending` job aanmaakt.
   - Alleen lezen + herprint-insert, geen verdere print_jobs-beheer-UI.
   - Bewust kleine functionele toevoeging binnen de presentatie-refactor.

### Technische aandachtspunten
- `StickerProductCombobox`: `enabled`-conditie in `useStickerSuggesties` versoepelen (term.length ≥ 0), en bij lege term andere query (top-8 by `keer_geprint`). Popover open bij focus.
- Focus-ring: check `button.tsx` / type-knop-styling in `SnelPrinten.tsx` — waarschijnlijk custom `<button>` zonder `focus-visible:ring-primary`. Oplossen via shared token/klasse.
- "Vandaag geprint": nieuwe hook `usePrintJobsToday()` (select laatste 5 van vandaag), herprint = `insert print_jobs {zpl, label_omschrijving, status: 'pending'}`. RLS/GRANT check op `print_jobs`.
- Route-URL `/kitchen/snel-printen` blijft ongewijzigd (afgesproken).

Niets nu implementeren — vastleggen voor de Stickers-stap.