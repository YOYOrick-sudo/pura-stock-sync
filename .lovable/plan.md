

# Automatische Night Shift (Dark Mode)

## Wat wordt er gebouwd

Een automatische donkere modus die 's avonds (na 21:00) inschakelt en 's ochtends (07:00) weer uitschakelt. Handmatige toggle ook beschikbaar in de sidebar/header. Het systeem gebruikt de bestaande `.dark` CSS variabelen die al gedefinieerd zijn in `index.css`.

## Omvang van het werk

Dit is een groot project omdat er **567+ hardcoded kleurwaarden** verspreid over 26+ bestanden staan (bijv. `#1B7867`, `#F6F7DD`, `#0F172A`, inline `rgba()` waarden). Deze moeten allemaal vervangen worden door CSS variabelen die reageren op de `.dark` class.

## Aanpak

### Stap 1: Theme Provider + Auto-switching

- Installeer **geen** `next-themes` (past niet bij Vite). Maak een eigen `ThemeProvider` context.
- Logica: controleer elk uur of het tussen 21:00–07:00 is → voeg `dark` class toe aan `<html>`.
- Sla voorkeur op in `localStorage` (auto / light / dark).
- Fix `sonner.tsx` die nu kapot is door de `next-themes` import.

### Stap 2: Dark mode CSS variabelen uitbreiden

De bestaande `.dark` block in `index.css` uitbreiden met extra tokens voor:
- Sidebar achtergrond (nu hardcoded `#F6F7DD`)
- Card borders (nu hardcoded `rgba(27,120,103,...)`)
- Status kleuren en badge achtergronden

### Stap 3: Hardcoded kleuren vervangen (grootste klus)

Alle inline `style={{}}` en hardcoded Tailwind klassen vervangen door CSS variabelen in deze bestanden:

| Groep | Bestanden | Hardcoded kleuren |
|-------|-----------|-------------------|
| **Sidebar** | `polar/Sidebar.tsx` | `#F6F7DD`, `#1B7867`, `#9CA3AF` |
| **Header** | `polar/Header.tsx` | `#F6F7DD` hover |
| **Dashboard** | `IdeaBox.tsx`, `WeatherWidget.tsx`, `HandoverCard.tsx` | `#F6F7DD`, borders |
| **Maintenance** | 5 bestanden | `#1B7867`, borders, card BG |
| **Polar components** | `Radio.tsx`, `TimePicker.tsx`, `Checkbox.tsx`, `Table.tsx`, etc. | `#1B7867`, `#F6F7DD` |
| **Notifications** | `NotificationsDropdown.tsx` | `#1B7867` |
| **Auth/Loading** | `ProtectedRoute.tsx`, `Auth.tsx` | `#F5F7DD`, `#1B7867` |
| **FOH/HR/Kitchen** | Diverse pagina's | Verspreid |

### Stap 4: Toggle UI

Een klein maantje/zonnetje icoon in de sidebar footer om handmatig te schakelen tussen auto/licht/donker.

## Dark mode kleurenpalet

```text
Licht                    →  Donker
─────────────────────────────────────
#F8FAFC (page bg)        →  #0F172A (Slate-900)
#FFFFFF (card bg)        →  #1E293B (Slate-800)
#F6F7DD (sidebar/accent) →  #1A2332 (Deep midnight)
#1B7867 (brand green)    →  #2DD4A8 (Brighter green)
#E2E8F0 (borders)        →  #334155 (Slate-700)
#0F172A (text)           →  #F1F5F9 (Slate-100)
```

## Technisch

| Onderdeel | Detail |
|-----------|--------|
| **Nieuw bestand** | `src/contexts/ThemeContext.tsx` — provider + `useTheme` hook |
| **Nieuw bestand** | `src/components/ThemeToggle.tsx` — toggle knop |
| **Wijzigen** | `src/index.css` — uitgebreide `.dark` variabelen |
| **Wijzigen** | `tailwind.config.ts` — extra dark-mode tokens |
| **Wijzigen** | `src/components/ui/sonner.tsx` — fix next-themes import |
| **Wijzigen** | `src/App.tsx` — ThemeProvider wrappen |
| **Wijzigen** | ~20+ component bestanden — hardcoded kleuren → variabelen |

