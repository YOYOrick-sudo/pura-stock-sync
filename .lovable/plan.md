## Deel 1 — Onderhoud correcties

### 1. `SegmentedTabs` herbouwen naar Taken-patroon
Bestand: `src/components/pura/SegmentedTabs.tsx` — vervangen van shadcn `Tabs`-container door losse pill-knoppen (rechtstreeks `<button>` in een flex-rij, gap 12px, geen grijze omhullende `TabsList`).

Per pill:
- `rounded-polar-xl` (20px), `min-h-[44px]`, `px-5`, `text-sm font-medium`, `gap-2`.
- Actief: `bg-primary text-primary-foreground border-transparent`; teller-badge = `bg-primary-foreground/25 text-primary-foreground`, `rounded-md px-2 py-0.5 text-xs font-semibold`.
- Inactief: `bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm`; teller-badge = `bg-foreground/5 text-muted-foreground`.
- Transitie: `transition-all duration-150`.
- Container: `flex flex-wrap gap-3` (geen grid, geen achtergrond).

Automatisch effect: elke plek die `SegmentedTabs` gebruikt (Onderhoud, later Kassatelling/KasControle) matcht meteen Taken.

### 2. "Nieuwe melding"-knop compacter
Bestand: `src/components/maintenance/TicketList.tsx` (subheader-actie).
- Zelfde visuele maat als Taken's Admin-knop: `h-11 px-5 text-[15px] rounded-polar-xl gap-2` icon 18px.
- Blijft `size="lg"` voor 44px touch, maar geen extra breedte/hoogte.
- Wordt vastgelegd als nieuwe button-variant `primaryCompact` (of gewoon utility-classes in de subheader) zodat volgende modules dezelfde compacte primaire actie kunnen hergebruiken.

### 3. Urgentie-pills in `NewTicketForm` strakker
Bestand: `src/components/maintenance/NewTicketForm.tsx` regels 115-140.
- `min-h-[64px]` → `min-h-[52px]`, `py-3` → `py-2.5`, `gap-0.5` blijft.
- Actieve staat vervangt tone-kleur door **primary green gevuld** (identiek aan actieve tab), niet meer per-urgentie kleur. Urgentie-tone verhuist naar een klein icoon of subtekstkleur alleen als inactief (rustig).
- Label `text-sm font-semibold`, hint `text-[11px]`.
- Verzachte hover (`hover:border-primary/30` blijft).

## Deel 2 — Sidebar polish

Bestand: `src/components/polar/Sidebar.tsx` + `src/components/AppSidebar.tsx`.

### 1. Icons egaal
- Alle nav-icons: 20×20, `strokeWidth={1.75}` (via `style` prop op de Icon-component), kleur uit één bron:
  - inactief: `text-muted-foreground`
  - actief: `text-primary`
  - hover: `text-foreground`
- PanelLeft en Lock-icon ook op strokeWidth 1.75 voor visuele rust.

### 2. Icon-keuzes rustiger (voorstel per item)
| Item | Nu | Voorstel |
|---|---|---|
| Dashboard | Home | Home (blijft) |
| Taken Bediening | ListChecks | ListChecks (blijft) |
| Stickers | Printer | Printer (blijft) |
| Recepten | BookOpen | BookOpen (blijft) |
| Ingrediënten | Carrot | **Package** (rustiger, past bij voorraad) |
| Kassatelling | Wallet | **Calculator** (past bij tellen) |
| Onderhoud | Wrench | **ClipboardList** (past bij meldingen/tickets) |
| Settings | Settings | Settings (blijft) |

### 3. Verticale dichtheid
- Item-hoogte `h-12` → `h-11` (44px).
- Gap tussen items `gap-1` → `gap-0.5`.
- Groep-marge `mb-3` → `mb-2`, sectiekop `mt-4` → `mt-2`, `mb-2` → `mb-1`.
- Sectiekop lettergrootte blijft `text-[11px]`, maar met minder ruimte er onder.

### 4. Inklapknop
- Toggle-knop uit de logo-rij halen én in de collapsed toggle-rij: minimum `h-10 w-10` (40px), duidelijk `PanelLeft` icoon `h-5 w-5`, hover `hover:bg-muted`.
- In uitgeklapte staat blijft de knop rechts naast het logo, maar met vergrote touch-target zodat hij niet visueel wegvalt.

### 5. Actieve item
- Achtergrond: `bg-primary/10` (i.p.v. `bg-muted`), tekst `text-foreground`, icoon `text-primary`.
- Consistent met actieve tab-pill op Taken (groene familie, subtiele tint).

## Buiten scope
- Geen functionele wijziging, geen route-/data-veranderingen.
- Andere modules dan Onderhoud/sidebar worden niet aangeraakt in deze beurt.
- Na deze beurt: gebruiker checkt zelf preview; Kassatelling volgt in aparte sprint.
