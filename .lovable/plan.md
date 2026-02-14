
# Plan: Volledige UI/UX Migratie naar Pura Vida OS v6.0

## Overzicht

Er zijn nog **14 bestanden** met hardcoded groene kleuren (#1B7867, #5A8F7F, #0d5a4c) en oude crème achtergronden (#FEFFF1, #F6F7DD) die vervangen moeten worden. Daarnaast bevat het design system JSX-bestand gedetailleerde specs voor de sidebar (240px, wit, sub-navigatie) en componenten die afwijken van de huidige implementatie.

## Kleurvervanging (systematisch)

| Oud | Nieuw | Context |
|---|---|---|
| `#1B7867` | `#E27726` | Primary kleur (buttons, iconen, accenten) |
| `#5A8F7F` / `#0d5a4c` / `#145f55` | `#C9630E` | Hover/darker primary |
| `#FEFFF1` | `#FFFFFF` | Card/surface achtergrond |
| `#F6F7DD` | `#FFF7ED` | Lichte primary achtergrond |
| `#E6F4F1` / `#B3D9D4` | `#FFF7ED` / `#FED7AA` | Info boxes met groene tint |
| `#2D8B7A` | `#C9630E` | Secundaire groene tekst |
| `rgba(27, 120, 103, ...)` | `rgba(226, 119, 38, ...)` | Primary met opacity |

## Bestanden die worden aangepast

### Groep 1: Pagina's met veel hardcoded kleuren
1. **src/pages/KassatellingOverdag.tsx** - Kassa lade tabel, inputs, focus states
2. **src/pages/MidslandOrders.tsx** - Orders overzicht, status kleuren, knoppen
3. **src/pages/StyleGuide.tsx** - Style guide documentatie (kleurblokken, voorbeelden)
4. **src/pages/DesignPreview.tsx** - Design preview pagina met kleur swatches
5. **src/pages/DesignSystem.tsx** - Design system documentatie pagina

### Groep 2: Componenten met hardcoded kleuren
6. **src/components/OrderDashboard.tsx** - Product tabel, summary badge, submit buttons
7. **src/components/ProductRow.tsx** - Product rijen in bestelformulier
8. **src/components/foh/FohTasks.tsx** - FOH taken module (groot bestand, veel groene refs)

### Groep 3: Kitchen module pagina's
9. **src/pages/kitchen/KitchenMenu.tsx** - Menu kaart kleuren
10. **src/pages/kitchen/InternalOrders.tsx** - Interne bestellingen
11. **src/pages/kitchen/KitchenTasks.tsx** - Keuken taken
12. **src/pages/kitchen/Recipes.tsx** - Recepten
13. **src/pages/kitchen/RecipeDetail.tsx** - Recept detail
14. **src/pages/kitchen/MepPlanning.tsx** - MEP planning

### Groep 4: Sidebar update conform design system v6.0
15. **src/components/polar/Sidebar.tsx** - Sidebar wordt 240px breed, witte achtergrond (#FFFFFF in plaats van #FFF7ED), zoekbalk toevoegen, sub-navigatie patroon
16. **src/components/SidebarLayout.tsx** - Sidebar wrapper padding aanpassen

### Groep 5: Overige aanpassingen
17. **src/components/polar/FormCard.tsx** - Focus/active states
18. **src/components/polar/Progress.tsx** - Progress bar kleuren
19. **src/components/polar/Alert.tsx** - Alert component kleuren
20. **src/components/polar/Checkbox.tsx** - Checkbox checked state

## Sidebar Redesign (conform v6.0 spec)

De sidebar wordt aangepast aan het design system:
- Breedte: 240px (was 280px)
- Achtergrond: `#FFFFFF` (was `#FFF7ED`)
- Border: `1px solid #D5D8E0` (was `rgba(197,197,202,0.5)`)
- Logo: 32x32 oranje blok met "PV" + tekst "Pura Vida" / "Foodbar Terschelling"
- Zoekbalk met `⌘K` shortcut
- Nav items: 13px font, radius 12px, active = bg `#FFF7ED` + tekst `#A5500D` + icoon `#E27726`
- Sub-navigatie: expandable met chevron, children met dot indicator
- User profiel onderaan met avatar

## Wat NIET verandert
- Component structuur en logica
- Routing en hooks
- Database en backend
- Spacing en layout (behalve sidebar breedte)

## Technische Details

### Button Spec (v6.0)
```text
primary:   bg #C9630E, hover #A5500D, text wit, shadow subtle
secondary: bg wit, border 1px #C1C5CF, text #303542, hover bg #F8F9FA
ghost:     bg transparent, hover #F1F3F5, text #4A4F5E
danger:    bg #EF4444, hover #B91C1C, text wit
soft:      bg #FFF7ED, hover #FFEDD5, text #A5500D
```

### Input Spec (v6.0)
```text
Height: 36px, border 1px #C1C5CF, radius 14px
Focus: border #E27726, ring rgba(226,119,38,0.2)
Error: border #EF4444, ring rgba(239,68,68,0.2)
```

### Sidebar Nav Item (v6.0)
```text
Inactief: icoon gray-400, tekst gray-500, no bg
Actief:   bg #FFF7ED, icoon #E27726, tekst #A5500D
Hover:    bg #F8F9FA
```

### Aanpak
De bestanden worden in groepen aangepakt: eerst de pagina's met de meeste hardcoded kleuren, dan de componenten, dan de sidebar redesign. Elke groene hex wordt vervangen door de corresponderende oranje/neutrale waarde.
