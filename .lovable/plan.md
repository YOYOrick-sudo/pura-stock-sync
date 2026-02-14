
# Plan: Design System Kleuren Doorvoeren in Alle Componenten

## Probleem

De CSS tokens (`index.css`, `tailwind.config.ts`, `colors.ts`) zijn correct geüpdatet naar het Sunset Orange design system, maar **35 bestanden** bevatten nog hardcoded groene hex-kleuren uit het oude systeem. Die worden direct als inline `style={{}}` gebruikt en negeren daardoor de CSS variabelen.

## Kleurvervanging

De volgende kleuren worden systematisch vervangen:

| Oud (Groen) | Nieuw (Oranje/Neutral) | Gebruik |
|---|---|---|
| `#1B7867` | `#E27726` | Primary/accent kleur (knoppen, iconen, actieve states) |
| `#5A8F7F` | `#C9630E` | Hover/donkerder primary |
| `#F6F7DD` | `#FFF7ED` | Lichte primary achtergrond (hover, sidebar) |
| `#FEFFF1` | `#FFFFFF` | Card/surface achtergrond (wordt wit conform v6.0) |
| `rgba(27, 120, 103, ...)` | `rgba(226, 119, 38, ...)` | Primary met opacity |

## Getroffen Bestanden (35 stuks)

### Navigatie & Layout
- `src/components/polar/Sidebar.tsx` - Sidebar kleuren en active states
- `src/components/AppSidebar.tsx`
- `src/components/SidebarLayout.tsx`

### Dashboard & Widgets
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/WeatherWidget.tsx`
- `src/components/dashboard/AIWeatherAdvisor.tsx`

### Polar Design Components
- `src/components/polar/Skeleton.tsx`
- `src/components/polar/DatePicker.tsx`
- `src/components/polar/FormCard.tsx`
- `src/components/polar/Header.tsx`
- `src/components/polar/KPICard.tsx`
- `src/components/polar/ModernKPICard.tsx`
- `src/components/polar/Progress.tsx`
- `src/components/polar/SetupCard.tsx`
- `src/components/polar/Table.tsx`
- `src/components/polar/Textarea.tsx`
- `src/components/polar/TimePicker.tsx`
- `src/components/polar/Dialog.tsx`
- `src/components/polar/Checkbox.tsx`
- `src/components/polar/Radio.tsx`
- `src/components/polar/Alert.tsx`

### Pagina's
- `src/pages/Kassa.tsx`
- `src/pages/Kassatelling.tsx`
- `src/pages/KassatellingOverdag.tsx`
- `src/pages/MidslandOrders.tsx`
- `src/pages/Voorraad.tsx`
- `src/pages/HomeHub.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Settings.tsx`

### Module Pagina's
- `src/pages/foh/FohModule.tsx`
- `src/pages/foh/FohAnalytics.tsx`
- `src/components/foh/FohTasks.tsx`
- `src/pages/kitchen/*.tsx` (meerdere bestanden)
- `src/pages/service/ServiceModule.tsx`

### Overige Componenten
- `src/components/HandoverCard.tsx`
- `src/components/NotificationsDropdown.tsx`
- `src/components/OrderDashboard.tsx`
- `src/components/ProductRow.tsx`
- `src/components/WaveBackground.tsx`

## Aanvullend

### Geist Mono font toevoegen
Het `index.html` bestand mist nog de Geist Mono font import. Die wordt toegevoegd.

### PWA theme-color
De `manifest.json` en `index.html` bevatten nog `#5A8F7F` als theme-color, dit wordt `#E27726`.

## Aanpak

Elk bestand wordt doorlopen en alle hardcoded groene kleuren worden vervangen door de corresponderende oranje waarden. De functionaliteit en layout blijven exact gelijk - alleen de kleurwaarden veranderen.

## Wat NIET verandert
- Component structuur en functionaliteit
- Layout en spacing
- Database, hooks, routes
- Border styles (alleen kleurgerelateerde borders)
