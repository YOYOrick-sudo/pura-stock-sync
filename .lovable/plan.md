# Sidebar herindelen: drie secties + iPad-hoogte

Alleen groepering, volgorde en item-hoogte. Geen routes, rechten of navigatielogica raken.

## 1. `src/components/AppSidebar.tsx`
`allNavigationItems` krijgt per item een expliciet `group: 'overzicht' | 'keuken' | 'beheer'`, in de gewenste volgorde binnen de array (die volgorde blijft leidend voor de sidebar):

```
OVERZICHT
- Dashboard            /dashboard
- Taken (Bediening)    /taken-bediening

KEUKEN
- Stickers             /kitchen/snel-printen
- Recepten             /kitchen/recipes
- Ingrediënten         /kitchen/ingredienten

BEHEER
- Kassatelling         /kassatelling
- Onderhoud            /onderhoud
- Statistieken         /taken-analyse   (blijft achter code)
- Settings             /settings
```

De bestaande `.map(...)` naar `PolarSidebar.items` geeft `group` door.

## 2. `src/components/polar/Sidebar.tsx`
- `PolarSidebarItem` krijgt `group?: 'overzicht' | 'keuken' | 'beheer'` (default `'beheer'` voor backward compat).
- Vervang de huidige URL-set `groupItems` door groepering op `item.group`, met vaste render-volgorde `overzicht → keuken → beheer`.
- Voeg een derde sectiekop **"Keuken"** toe naast de bestaande "Overzicht" en "Beheer".
- **iPad-hoogte**: item-hoogte van `h-10` (40px) naar `h-12` (48px). Tekst blijft `text-[14px] font-medium`; icon 20px blijft. Actieve stijl (`bg-muted text-foreground` + primary-icon) blijft ongewijzigd — duidelijk zichtbaar.

## Verificatie
- `tsgo` (types).
- Playwright-screenshot van de sidebar op iPad-viewport (1024×1366): drie sectiekoppen zichtbaar in volgorde, items in juiste volgorde, actieve item (Stickers op `/kitchen/snel-printen`) duidelijk gemarkeerd.

## Bestanden
- `src/components/AppSidebar.tsx` — item-array herordelen + `group` toevoegen.
- `src/components/polar/Sidebar.tsx` — 3-sectie-rendering + `h-12`.
