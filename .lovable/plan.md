

# Plan: Info-icoon verbeteren + Aquafabe herordenen

## 1. Info-icoon vloeiender maken (geen verspringen)

Het info-icoon opent nu een `Dialog` (modal). Het "verspringen" komt waarschijnlijk doordat de Dialog-animatie abrupt is. Aanpassing:

- Voeg een vloeiende `scale + fade` CSS-transitie toe aan de DialogContent wanneer deze wordt geopend vanuit het info-icoon
- Gebruik `animate-in fade-in-0 zoom-in-95` met een langzamere duration (200ms in plaats van de standaard snelle animatie)

**Bestand:** `src/components/foh/FohTasks.tsx` (regels 410-416, DialogContent styling)

## 2. Info-icoon zichtbaarder maken

Het huidige icoon is 14px op een 24x24 button met een subtiele border. Aanpassingen:

- Icoon grootte van 14px naar 16px
- Border iets sterker: van `rgba(197,197,202,0.5)` naar `rgba(27,120,103,0.3)` (groen tint)
- Achtergrondkleur iets meer opvallend: van `#FEFFF1` naar `#E6F4F1` (licht groen, past bij het design system)
- Icoonkleur blijft `#1B7867` (primary green)

**Bestand:** `src/components/foh/FohTasks.tsx` (regels 323-340, info button styling)

## 3. Aquafabe boven bar-garnering plaatsen

De aquafabe-taak staat nu op sort_order **370** (na bar-garnering op 320). De taak moet **boven** bar-garnering komen.

- Update sort_order van de aquafabe-template van 370 naar **315** (net voor bar-garnering op 320)
- Update ook eventueel bestaande taken voor vandaag

**Wijziging:** Database-update via migratie

## Technische details

| Bestand | Wijziging |
|---------|-----------|
| `src/components/foh/FohTasks.tsx` | Info button styling (groter, zichtbaarder) + Dialog animatie vloeiender |
| Database migratie | `UPDATE foh_daily_templates SET sort_order = 315 WHERE title LIKE 'Aquafabe%' AND phase = 'open'` |

