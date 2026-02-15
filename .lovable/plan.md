

# Legacy Kleur Cleanup — Pura Vida OS v6.0

## Overzicht

Er zijn **6 legacy kleuren** gevonden verspreid over **~15 bestanden**. Deze worden allemaal vervangen door de juiste v6.0 Midnight Slate equivalenten.

---

## Kleur Mapping

| Legacy kleur | Gebruik | v6.0 vervanging | Token |
|---|---|---|---|
| `#17171C` | Label tekst (dark) | `#282E3A` | gray-800 |
| `#36373A` | Secondary tekst, iconen | `#636878` (tekst) / `#8D93A0` (iconen) | gray-400 / gray-300 |
| `#ECEDED` | Borders (default) | `#EAECF0` | gray-100 |
| `#F4F5F6` | Disabled bg, surfaces | `#F1F3F5` | gray-75 |
| `#E64D4D` | Error kleur | `#EF4444` | error |
| `rgba(197, 197, 202, 0.5)` | Borders | `#D5D8E0` | gray-150 |
| `rgba(197, 197, 202, 0.3)` | Lichte borders | `#EAECF0` | gray-100 |
| `#C5C5CA` | Muted icoon | `#C1C5CF` | gray-200 |

---

## Bestanden en wijzigingen

### Polar Design System componenten (7 bestanden)

1. **DatePicker.tsx** — `#17171C` -> `#282E3A`, `#36373A` -> `#636878`/`#8D93A0`, `#ECEDED` -> `#EAECF0`, `#F4F5F6` -> `#F1F3F5`, `#E64D4D` -> `#EF4444`
2. **TimePicker.tsx** — zelfde set als DatePicker
3. **Textarea.tsx** — zelfde set
4. **Radio.tsx** — `#E64D4D` -> `#EF4444`, `rgba(197,197,202,0.5)` -> `#C1C5CF`
5. **Avatar.tsx** — `#36373A` -> `#636878`, `#ECEDED` -> `#EAECF0`, `#F4F5F6` -> `#F1F3F5`
6. **Tooltip.tsx** — `#17171C` -> `#1A1F28` (tooltip bg per spec)
7. **KPICard.tsx** — `#36373A` -> `#636878`, `#ECEDED` -> `#EAECF0`

### Pagina's en layout componenten (4 bestanden)

8. **NotificationsDropdown.tsx** — `#17171C` -> `#282E3A`, `#36373A` -> `#636878`, `#ECEDED` -> `#EAECF0`, `#F4F5F6` -> `#F1F3F5`
9. **MidslandOrders.tsx** — `rgba(197,197,202,*)` -> `#D5D8E0`/`#EAECF0`, `#C5C5CA` -> `#C1C5CF`
10. **AIWeatherAdvisor.tsx** — `rgba(197,197,202,*)` -> `#D5D8E0`/`#EAECF0`
11. **ServiceTasks.tsx** — `#F4F5F6` -> `#F1F3F5`

### Polar system-level (3 bestanden)

12. **Dialog.tsx** — `rgba(197,197,202,0.5)` -> `#D5D8E0`
13. **FormCard.tsx** — `rgba(197,197,202,0.5)` -> `#D5D8E0`
14. **Table.tsx** — `rgba(197,197,202,0.5)` -> `#D5D8E0`/`#EAECF0`
15. **Skeleton.tsx** — `rgba(197,197,202,0.3)` -> `#EAECF0` in wave animatie

---

## Technische details

Alle wijzigingen zijn find-and-replace binnen inline styles. Er worden geen componenten structureel gewijzigd, alleen kleurwaarden. De kleuren worden vervangen volgens het v6.0 Midnight Slate spectrum:

- **Tekst**: `#282E3A` (primary), `#636878` (secondary), `#8D93A0` (tertiary/iconen)
- **Borders**: `#D5D8E0` (standaard), `#EAECF0` (licht), `#C1C5CF` (inputs)
- **Surfaces**: `#F1F3F5` (muted/disabled), `#F8F9FA` (page bg)
- **Error**: `#EF4444` (rood, per v6.0 semantic)
- **Tooltip bg**: `#1A1F28` (gray-900, per spec)

