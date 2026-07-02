## Polish /kitchen/snel-printen

Zelfde ChatGPT/enterprise-lijn als Recepten en Ingrediënten. Functioneel identiek — alleen visuele en spacing-polish. Alleen `src/pages/kitchen/SnelPrinten.tsx` aanpassen.

### Header
- Vervang de compacte kop door hetzelfde patroon als Ingrediënten:
  - `h1 text-2xl font-heading font-bold text-foreground` → "Snel printen"
  - Subtitle `text-sm text-muted-foreground` → "Print ontdooi-, bereid- en vrije stickers direct naar de keuken-printer."
- Container: `max-w-6xl mx-auto space-y-6` (iets ruimer dan nu, matcht Recepten).

### Grid
- `grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]` — meer lucht en breder preview-paneel.

### Stap-cards — uniforme structuur
Alle 3 kaarten krijgen een consistente header en `p-5 sm:p-6`:
```
[stap-badge 1] STAP-LABEL       (rechts: kleine status/context, bv. "+2 dagen")
[content]
```
- Stap-badge: `inline-flex h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold` met cijfer.
- Stap-label: `text-sm font-medium text-foreground` (niet meer `text-caption` grijs).
- Card zelf: `bg-card shadow-sm rounded-polar-lg border border-border/60`.

**Stap 1 — Type sticker**
- 3 grote tegels, `min-h-[88px]`, `rounded-polar-lg`, icoon 24px boven label.
- Actief: `bg-primary text-primary-foreground shadow-sm`, geen border.
- Inactief: `bg-muted/40 hover:bg-muted text-foreground border border-transparent`, hover subtiel — geen border-flikker.
- Onder de tegels een korte uitleg per type in `text-xs text-muted-foreground` (bv. "Uit de vriezer • standaard +2 dagen").

**Stap 2 — Product**
- Combobox in bestaande stijl, `h-12 text-base` zoals Recipes-search.
- Kleine hint eronder: "Suggesties op basis van eerder geprinte producten." (`text-xs text-muted-foreground`).

**Stap 3 — Datums**
- Twee "veld"-blokken naast elkaar op `sm:grid-cols-2`, gestapeld op mobiel:
  - Blok 1 (readonly): label boven, grote datum eronder (`text-lg font-semibold capitalize`), rustige achtergrond `bg-muted/40 rounded-polar-md p-4`.
  - Blok 2 (THT): zelfde container-stijl, met inline stepper rechts. Stepper krijgt hetzelfde patroon als "gebruik +/- knoppen" elders: `h-10 w-10 rounded-polar-md border border-input hover:bg-muted`, cijfer in `text-lg font-semibold tabular-nums w-8 text-center`.
- Bij type `vrij`: alleen blok 1, en de kaart-header toont "(geen houdbaarheid)".

**Print-knop**
- Blijft `w-full`, maar hoogte `h-14 text-base font-semibold`, `rounded-polar-lg`, met printer-icoon 20px. Sticky op mobiel via `sticky bottom-4` binnen kolom (optioneel — als het te complex is, laten staan).

### Preview-paneel (rechterkolom)
- `lg:sticky lg:top-6`, `rounded-polar-lg border border-border/60 bg-card shadow-sm p-5`.
- Kop: stap-label "Voorbeeld" met dezelfde stap-header-stijl (zonder cijferbadge, of met een klein `Eye`-icoon in `bg-muted rounded-full`).
- Preview-container: `aspect-[57/32] bg-white rounded-polar-md border border-border flex items-center justify-center overflow-hidden` zodat de img altijd netjes gecentreerd staat.
- Onder de preview een klein meta-blok in 2 regels: "57 × 32 mm" / "Zebra ZD411d", `text-xs text-muted-foreground`, met een klein `Printer`-icoontje ervoor.
- Extra: samenvattingsregel boven de meta — huidige `type` + `naam` + datums als 3 kleine badges (`Badge variant="secondary"`), zodat het paneel "leeft" ook zonder ingevulde naam.

### Consistentie-checks
- Alle radii: `rounded-polar-lg` (cards) / `rounded-polar-md` (inputs, stepper) volgens design-system.
- Geen hardcoded kleuren; alleen tokens (`bg-primary`, `bg-muted`, `text-foreground`, etc.).
- Alle iconen 20px in kaart-headers en 24px in type-tegels, matcht icon-standards.
- Dark mode werkt automatisch omdat er alleen tokens gebruikt worden.

### Buiten scope
- Geen wijziging aan `useStickerProducten`, `labelZpl.ts`, `StickerProductCombobox`, of aan de sidebar. Alleen presentatie in `SnelPrinten.tsx`.
