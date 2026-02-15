
# Plan: Volledige UI/UX Migratie naar Pura Vida OS v6.0 Design System

## Overzicht

Dit is een omvangrijke migratie die de gehele UI aanpast aan het aangeleverde design system. De wijzigingen vallen in 5 groepen:

1. **Resterende groene/creme kleuren vervangen** (9 bestanden, ~720 referenties)
2. **Sidebar redesign** conform v6.0 specs (240px, wit, zoekbalk, sub-nav)
3. **Button component** updaten naar v6.0 specs (geen gradient, geen shadow, geen hover lift)
4. **Input/Textarea** updaten naar v6.0 specs (36px, 14px radius, oranje focus ring)
5. **Header/Layout** verfijnen conform specs

---

## Groep 1: Resterende Legacy Kleuren Vervangen

### 9 bestanden met hardcoded groene/creme kleuren:

| Bestand | Regels | Kleurvervanging |
|---|---|---|
| `src/components/foh/FohTasks.tsx` | 3025 | ~266x `#1B7867`->`#E27726`, `#FEFFF1`->`#FFFFFF`, `#F6F7DD`->`#FFF7ED` |
| `src/components/OrderDashboard.tsx` | 608 | ~40x zelfde mapping + `#0d5a4c`->`#C9630E` |
| `src/pages/Kassa.tsx` | 530 | ~20x `#FEFFF1`->`#FFFFFF`, `#F6F7DD`->`#F8F9FA` |
| `src/pages/kitchen/InternalOrders.tsx` | 502 | ~15x `#FEFFF1`->`#FFFFFF`, `#E6F4F1`->`#FFF7ED`, `#1B7867`->`#E27726` |
| `src/pages/DesignSystem.tsx` | ~650 | Kleur swatches updaten naar Sunset Orange |
| `src/pages/StyleGuide.tsx` | ~400 | Documentatie kleuren updaten |
| `src/pages/DesignPreview.tsx` | ~300 | Preview kleuren updaten |
| `src/components/ProtectedRoute.tsx` | 47 | `#F5F7DD`->`#F8F9FA`, `#1B7867`->`#E27726` |
| `src/components/ProductRow.tsx` | ~100 | Resterende groene refs |

### Kleurvervanging tabel:

```text
#1B7867         -> #E27726       (primary accent)
#5A8F7F/#0d5a4c -> #C9630E       (primary hover/dark)
#FEFFF1         -> #FFFFFF       (card/surface bg)
#F6F7DD/#F5F7DD -> #FFF7ED       (soft accent bg) of #F8F9FA (page bg)
#E6F4F1         -> #FFF7ED       (status light bg)
#B3D9D4         -> #FED7AA       (status border)
#2D8B7A         -> #C9630E       (secondary accent text)
rgba(27,120,103,x) -> rgba(226,119,38,x) (primary opacity)
```

---

## Groep 2: Sidebar Redesign

`src/components/polar/Sidebar.tsx` wordt herschreven conform de v6.0 spec:

**Huidige situatie:**
- 280px breed, bg `#FFF7ED`, border `rgba(197,197,202,0.5)`
- Active: wit card met border + shadow
- Font: 17px, item height 48px
- Geen zoekbalk, geen sub-navigatie

**Nieuwe situatie (v6.0):**
- 240px breed (collapsed 64px), bg `#FFFFFF`, border `1px solid #D5D8E0`
- Brand header: 30x30 oranje logo blok + "Pura Vida" / "Foodbar Terschelling"
- Zoekbalk: bg `#F8F9FA`, border `1px #D5D8E0`, radius 12px, ⌘K shortcut
- Nav items: padding `8px 10px`, radius 12px, font 13px Inter
- Active: bg `#FFF7ED`, icoon `#E27726` stroke-2, tekst `#A5500D` weight-500
- Hover: bg `#F8F9FA`
- Inactief: icoon `#636878` (gray-400), tekst `#4A4F5E` (gray-500)
- Count badge support: pill, 10px font, bg `#E27726` tekst wit

**SidebarLayout update:**
- `src/components/SidebarLayout.tsx`: sidebar wrapper bg van `#FFF7ED` naar `#FFFFFF`, mobile sheet ook wit

---

## Groep 3: Button Component

`src/components/ui/button.tsx` wordt aangepast:

**Huidige issues:**
- Default size h-12 (te groot, spec = h-9/36px voor md)
- `hover:brightness-125` op primary (spec = kleurverandering, geen filter)
- `shadow-sm` op primary (spec = GEEN shadow)
- Radius `rounded-polar-lg` (16px, spec = 14px voor buttons)

**Nieuwe button variants:**
```text
primary:   bg-[#E27726] hover:bg-[#C9630E] text-white, GEEN shadow, GEEN gradient
secondary: bg-white border border-[#C1C5CF] text-[#303542] hover:bg-[#F8F9FA]
ghost:     bg-transparent hover:bg-[#F1F3F5] text-[#4A4F5E]
danger:    bg-[#EF4444] hover:bg-[#B91C1C] text-white
soft:      bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#A5500D]
```

**Nieuwe sizes:**
```text
xs: h-7 px-2 text-xs     (h28)
sm: h-8 px-2.5 text-[13px] (h32)
md: h-9 px-3.5 text-[13px] (h36) — DEFAULT
lg: h-10 px-[18px] text-sm (h40)
icon: h-9 w-9            (36px)
```

**Interacties:**
- Radius: 14px (`rounded-polar-md`)
- Press: `active:scale-[0.97]`
- Disabled: `opacity-45`
- Geen `translateY`, geen `brightness`, geen gradient

---

## Groep 4: Input & Textarea

`src/components/ui/input.tsx`:
- Height: 36px (h-9)
- Padding: 0 12px
- Border: 1px `#C1C5CF`
- Radius: 14px
- Text: 13px Inter `#282E3A`
- Placeholder: `#8D93A0`
- Focus: border `#E27726`, ring `0 0 0 2px rgba(226,119,38,0.2)`
- Error: border `#EF4444`, ring `0 0 0 2px rgba(239,68,68,0.2)`

---

## Groep 5: Header & Layout

`src/components/polar/Header.tsx`:
- Titel: 24px/700 `Instrument Sans` (font-display), kleur `#1A1F28`
- Beschrijving: 14px `#636878`
- Border-bottom: `1px solid #D5D8E0`

---

## Bestanden die worden aangepast (totaal ~20)

1. `src/index.css` — Typography classes verfijnen (font sizes conform spec)
2. `src/components/ui/button.tsx` — Volledige variant/size herziening
3. `src/components/ui/input.tsx` — Height, radius, focus ring
4. `src/components/polar/Sidebar.tsx` — Volledige redesign
5. `src/components/SidebarLayout.tsx` — Sidebar wrapper kleuren
6. `src/components/AppSidebar.tsx` — Logo en collapsed state
7. `src/components/polar/Header.tsx` — Typografie en border
8. `src/components/polar/Checkbox.tsx` — 16x16, radius 4px, #E27726 checked
9. `src/components/ProtectedRoute.tsx` — Loading state kleuren
10. `src/components/foh/FohTasks.tsx` — Alle groene refs
11. `src/components/OrderDashboard.tsx` — Alle groene refs
12. `src/components/ProductRow.tsx` — Resterende refs
13. `src/pages/Kassa.tsx` — `#FEFFF1` -> `#FFFFFF`
14. `src/pages/kitchen/InternalOrders.tsx` — Groene status kleuren
15. `src/pages/DesignSystem.tsx` — Kleur documentatie
16. `src/pages/StyleGuide.tsx` — Style documentatie
17. `src/pages/DesignPreview.tsx` — Preview kleuren

## Wat NIET verandert
- Component logica, state management, hooks
- Routing, database, authentication
- Bestandsstructuur en imports
- Tailwind config en CSS tokens (die zijn al correct)
