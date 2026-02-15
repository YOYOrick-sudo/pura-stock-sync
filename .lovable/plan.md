

# Plan: Restyle Taken Bediening (FohTasks.tsx) naar Pura Vida OS v6.0

## Overzicht

Het `FohTasks.tsx` bestand (3025 regels) bevat ~60+ hardcoded verwijzingen naar de oude groene (#1B7867) en crème (#FEFFF1, #F6F7DD) kleuren. De volledige UI wordt hergestyled naar het v6.0 design system met oranje primary, grijze achtergronden en correcte radius/typografie.

---

## Kleur Vervanging Overzicht

| Oud | Nieuw | Context |
|-----|-------|---------|
| `#1B7867` (groen) | `#E27726` (primary-500) | Actieve buttons, checked states, spinner, progress |
| `#229580` (groen hover) | `#C9630E` (primary-600) | Button hover states |
| `#FEFFF1` (crème bg) | `#F8F9FA` (gray-50) | Page achtergrond, input/button backgrounds |
| `#F6F7DD` (licht groen) | `#F1F3F5` (gray-75) | Card achtergronden, muted surfaces |
| `rgba(27,120,103,...)` | `rgba(226,119,38,...)` | Hover/active states met opacity |
| `#73747B` | `#636878` (gray-400) | Muted tekst |

---

## Wijzigingen per Sectie

### 1. Loading State (regel ~1623-1628)
- Spinner kleur: `#1B7867` wordt `#E27726`

### 2. Hoofdcontainer (regel ~1635-1636)
- `backgroundColor: '#FEFFF1'` wordt `'#F8F9FA'`
- `maxWidth: '1400px'` wordt `'1200px'`

### 3. Toolbar/Header Card (regel ~1638-1644)
- `backgroundColor: '#F6F7DD'` wordt `'#FFFFFF'`
- `border: '1px solid rgba(197,197,202,0.5)'` wordt `'1px solid #D5D8E0'`

### 4. Phase Tabs - Segmented Control (regels ~1651-1774)
Volledig restyled naar segmented control patroon:
- Container: `bg #F8F9FA`, `border 1px #EAECF0`, `radius 16px`, `padding 3px`
- Inactief: `bg transparent`, `tekst #4A4F5E`
- Actief: `bg white`, `shadow-sm`, `tekst #1A1F28`, `fontWeight 600`
- Hover inactief: `bg #F1F3F5`
- Alle `#1B7867` verwijzingen vervangen
- Count badge: `pill radius 9999px`, actief `bg #E27726 tekst wit`, inactief `bg rgba(0,0,0,0.04)`

### 5. Progress Bar (regels ~1780-1816)
- Achtergrond track: `#FEFFF1` wordt `#EAECF0`
- Fill: `#1B7867` wordt `#E27726`
- Height: `8px` wordt `4px` (conform spec)
- Complete kleur tekst: `#1B7867` wordt `#22C55E` (success)

### 6. Admin Button (regels ~1819-1847)
- Kleur: `#1B7867` wordt `#E27726`
- Achtergrond: `#FEFFF1` wordt `white`
- Border: `1px solid #C1C5CF`
- Radius: `20px` wordt `16px` (buttons = 16px)
- Hover: `bg #F8F9FA`

### 7. Nieuw Taak Button (regels ~1853-1876)
- `backgroundColor: '#1B7867'` wordt `'#E27726'`
- Hover: `#229580` wordt `#C9630E`
- Radius: `12px` wordt `16px`

### 8. SortableTaskItem (regels ~71-476)
- **Checkbox**: `width/height 20px` wordt `16px`, `borderRadius 6px` wordt `4px`, `border 2px #C1C5CF`, checked `bg #E27726`
- **Hover states**: Alle `rgba(27,120,103,...)` worden `rgba(226,119,38,...)`
- **Completed bg**: `rgba(226,119,38,0.04)` (al correct)
- **Title font**: `15px` wordt `13px` (body spec)
- **Time badge**: `#73747B` wordt `#636878`, `borderRadius 4px` wordt `9999px` (pill)
- **Info button bg**: `#FEFFF1` wordt `#FFFFFF`
- **Delete hover**: al correct (#EF4444)
- **GripVertical kleur**: `#73747B` wordt `#636878`

### 9. Categorie Headers (regels ~2167-2190)
- Font: `13px` wordt `11px`
- `textTransform: 'uppercase'` (al correct)
- `letterSpacing: '0.05em'` (al correct)
- Kleur: `#73747B` wordt `#636878`
- Complete kleur: `#1B7867` wordt `#22C55E` (success)
- Progress pill: `borderRadius 4px` wordt `9999px`, kleuren updaten

### 10. "Alle taken voltooid" tekst (regels ~2193-2203)
- Kleur: `#1B7867` wordt `#22C55E`
- Verwijder emoji, gebruik alleen tekst

### 11. Takenlijst container
- Elke categorie groep in een card container: `bg white`, `border 1px #D5D8E0`, `radius 20px`, `padding 16px`

### 12. Periodiek Taken Weergave (regels ~2229-2420)
- Day header kleuren: `#1B7867` wordt `#E27726` (vandaag)
- Extra task swipe delete: bg kleuren updaten
- Priority config: `#1B7867` (low) wordt `#22C55E` (success)

### 13. Edit Mode Controls (regels ~2426-2565)
- Alle `#1B7867` buttons worden `#E27726`
- New tasks preview bg: `#F6F7DD` wordt `#F1F3F5`
- Button radii: `20px` wordt `16px`
- "Opslaan als template" border: `#1B7867` wordt `#E27726`

### 14. Alle Dialogen/Modals (Password, Admin Panel, New Template, Template Editor)
- `backgroundColor: '#FEFFF1'` wordt `'#FFFFFF'`
- `borderRadius: '20px'` wordt `'24px'` (modal spec)
- Alle knoppen: `#1B7867` wordt `#E27726`, hover `#C9630E`
- Border: `rgba(197,197,202,0.5)` wordt `#D5D8E0`
- Shield icoon: `#1B7867` wordt `#E27726`
- Actieve template badge: `#1B7867` wordt `#E27726`
- Template card border actief: `2px solid #1B7867` wordt `2px solid #E27726`
- Template card bg: `#F6F7DD` wordt `#F1F3F5`
- Button radii in modals: `20px` wordt `16px`

### 15. Empty State
- Huidige "Geen templates gevonden" tekst: wrap in proper empty state met 52x52 icoon container

### 16. Description Dialog
- `backgroundColor: '#FEFFF1'` wordt `'#FFFFFF'`
- Save button: `#1B7867` wordt `#E27726`

---

## Geen wijzigingen aan

- Alle data queries, mutations en business logica
- DnD sortable functionaliteit
- Swipe handlers
- Template management logica
- Phase time windows
- Category ordering
- FohModule.tsx wrapper (blijft SidebarLayout + FohTasks)

---

## Technische details

### Aanpak
Het bestand wordt in secties bijgewerkt via line-replace operaties:
1. Container en toolbar kleuren
2. Phase tabs naar segmented control
3. Progress bar
4. Buttons (admin, new task, edit mode)
5. SortableTaskItem (checkbox, hover, typography)
6. Categorie headers en progress pills
7. Alle dialogen/modals
8. Priority config functie
9. Date label color functie

### Totaal ~60 kleurverwijzingen worden vervangen
- ~25x `#1B7867` (groen primary)
- ~15x `#FEFFF1` (crème achtergrond)
- ~10x `#F6F7DD` (licht groen)
- ~5x `rgba(27,120,103,...)` (groen met opacity)
- ~5x `#73747B` (oud grijs)

