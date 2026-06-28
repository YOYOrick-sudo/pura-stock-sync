## Problemen

1. **Typo**: "Dailt" staat op 5 plekken in de codebase (moet "Daily" zijn).
2. **Visueel**: De locatie-keuze op het inlogscherm oogt niet polished.

## Oplossing

### Stap 1 — Typo fixen
Vervang in de volgende bestanden `Dailt` → `Daily`:
- `src/lib/utils.ts` (regel 9)
- `src/pages/Kassa.tsx` (regel 689)
- `src/components/SidebarLayout.tsx` (regel 31)
- `src/pages/KasControle.tsx` (regel 198)
- `src/components/maintenance/TicketList.tsx` (regel 128)

### Stap 2 — Locatie-toggle redesign (Auth.tsx)
De huidige `grid-cols-2` segmented control wordt vervangen door twee grote, klikbare kaarten/pillen met:
- **Icoon per locatie**: bijv. `Building2` voor Daily, `Store` voor Foodbar (Lucide)
- **Grotere touch target**: minimaal 56px hoog, ruime padding
- **Actieve state**: duidelijke groene accent (primary) achtergrond of border, niet alleen een schaduw
- **Inactieve state**: subtiele muted achtergrond, geen border
- **Label**: locatienaam in 15px semibold, eventueel subtiel adres/label eronder
- **Transitie**: 200ms ease voor achtergrond- en border-kleur

### Technische details
- Geen nieuwe dependencies nodig (Lucide iconen al aanwezig)
- Behoud bestaande `onClick` en `disabled` logica bij loading state
- Responsive: volle breedte op mobiel, max ~200px per pil op desktop

## Acceptatie
- Inlogscherm toont "Daily" en "Foodbar" correct gespeld
- Locatie-pillen zijn merkbaar groter, hebben een icoon, en de actieve keuze valt direct op
- Geen functionele wijziging aan inloglogica