

# Visuele kleuropties vergelijken

## Wat ik ga doen
Een tijdelijke voorbeeldpagina maken (`/kleur-preview`) die drie kolommen toont — elk met een andere achtergrondkleur en dezelfde UI-elementen (card, knop, tekst, sidebar-simulatie). Zo kun je direct op je scherm zien welke tint het prettigst oogt.

### De drie opties
- **A: Warm Gray** — `#F5F5F4` (Stone-100, warm undertone zoals Notion)
- **B: Cool Slate** — `#F8FAFC` (Slate-50, koel/strak zoals Stripe)  
- **C: Neutral** — `#FAFAFA` (Neutral-50, minimalistisch zoals Apple)

### Technisch
- Eén nieuw bestand: `src/pages/ColorPreview.tsx`
- Route toevoegen in `App.tsx`: `/kleur-preview`
- Elke kolom rendert dezelfde mini-UI met de betreffende achtergrondkleur als inline style
- Cards blijven `#FFFFFF`, tekst en borders gebruiken bestaande tokens
- Na jouw keuze verwijder ik de pagina weer en pas ik `index.css` aan

### Omvang
2 bestanden (nieuw + route), tijdelijk, geen impact op bestaande code.

