

# Enterprise Upgrade: Takenlijst FOH

## Overzicht

De takenlijst upgraden van "nette checklist" naar enterprise task management met 5 gerichte verbeteringen. Geen functionele wijzigingen, puur visuele kwaliteit.

## Wijzigingen

### 1. Sticky header (tabs + progress bar)

De fase-tabs en progress bar pinnen aan de bovenkant zodat ze altijd zichtbaar blijven, ook bij 63+ taken in de sluitlijst.

- De header-container (`#F6F7DD` card) krijgt `position: sticky; top: 0; z-index: 10`
- Subtiele shadow toevoegen wanneer er gescrolld wordt (via een scroll-detection state)

### 2. Sterkere categorie-koppen

De huidige koppen (13px, grijs, uppercase) worden vervangen door opvallende section headers:

- Achtergrondkleur: `#F1F5F9` (muted slate) met licht groene border-left accent
- Padding: `12px 16px` in plaats van alleen tekst
- Border-radius: `8px`
- Sticky binnen de scroll (onder de header)
- Progress badge duidelijker: groter, met meer contrast

### 3. Rijcontrast (zebra striping)

Elke even rij krijgt een subtiele achtergrondkleur voor betere leesbaarheid:

- Oneven rijen: transparant (zoals nu)
- Even rijen: `rgba(0, 0, 0, 0.02)` -- net genoeg contrast
- Hover state: iets sterker (`rgba(27, 120, 103, 0.04)`)

### 4. Moderne achtergrondkleur

De crème achtergrond (#FEFFF1) vervangen door de design system standaard:

- Page background: `#F8FAFC` (modern slate)
- Header card: `#FFFFFF` met subtiele border (in plaats van #F6F7DD)
- Dit brengt de takenlijst in lijn met de rest van het design system

### 5. Card-separatie per categorie

Elke categorie-groep (DEEL 1, DEEL 2, BAR, etc.) wordt gewrapt in een eigen card:

- Witte achtergrond met subtiele border en shadow-soft
- `border-radius: 12px`
- `margin-bottom: 16px` tussen categorieën
- Dit geeft visuele structuur en maakt de lijst scanbaar

## Technische details

### Bestand

Alleen `src/components/foh/FohTasks.tsx` wordt aangepast.

### Specifieke wijzigingen

| Locatie (ca. regels) | Wat | Aanpassing |
|---|---|---|
| 1665 | Outer container | `backgroundColor: '#F8FAFC'` i.p.v. `'#FEFFF1'` |
| 1667-1674 | Header card | `backgroundColor: '#FFFFFF'`, `position: 'sticky'`, `top: 0`, `zIndex: 10`, scroll-shadow |
| 1715, 1781, 1857 | Button inactive backgrounds | `'#F8FAFC'` i.p.v. `'#FEFFF1'` |
| 1815 | Progress bar track | `'#F1F5F9'` i.p.v. `'#FEFFF1'` |
| 2196-2220 | Category headers | Toevoegen achtergrond, padding, border-left accent, sticky positioning |
| 2221-2262 | Task rows | Zebra striping via `index % 2` check |
| 2237 | SortableTaskItem | `taskIndex` prop doorgeven voor zebra |
| ~230-400 | SortableTaskItem component | Achtergrondkleur op basis van even/oneven index |

### Scroll-detectie voor sticky shadow

Een `useState` + `useEffect` met een scroll event listener op de task container. Als `scrollTop > 0`, krijgt de header een `boxShadow: '0 2px 8px rgba(0,0,0,0.08)'`.

### Consistentie

Alle hardcoded `#FEFFF1` referenties in de UI (buttons, dialogs, checkboxes) worden vervangen door `#F8FAFC` of `#FFFFFF` waar passend. Dit raakt ca. 15-20 plekken in het bestand.

