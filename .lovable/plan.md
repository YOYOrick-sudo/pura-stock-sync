
## Night mode herstelplan

Ik ga dit niet half fixen. De kern van het probleem is duidelijk: de theme-toggle werkt technisch wel, maar het ontwerp wordt op heel veel plekken omzeild door hardcoded kleuren, inline styles en een dubbele kleurenbron. Daardoor zijn light en dark mode onleesbaar en incoherent.

## Wat ik ga doen

### 1. Eén strak SaaS-kleurensysteem neerzetten
Ik vervang de huidige mix van crème/geel/groen door één rustige set:
- hoofdkleur: het bestaande bekende groen
- neutraal: wit, lichtgrijs, middengrijs, donkergrijs
- statuskleuren: success / warning / error / info als vaste semantische tokens
- zelfde systeem voor light én dark, zodat contrast en leesbaarheid kloppen

Ik maak meteen een vaste opacity-strategie:
- alleen tokens + `hsl(var(--token) / alpha)` of Tailwind `/10 /20 /30`
- geen losse `rgba(...)` meer in componenten

### 2. Theme basis goed zetten
Ik werk de theme-basis centraal bij in:
- `src/index.css`
- `tailwind.config.ts`

Daarin:
- alle root + dark tokens opnieuw definiëren
- typography classes laten meeschakelen met theme
- sidebar, pagina, cards, muted vlakken, borders, focus, status en icon states uniform maken

### 3. Dubbele kleurbron opruimen
`src/components/polar/colors.ts` is nu een tweede design system met vaste hex-codes. Dat maakt het systeem inconsistent.

Ik ga die bron:
- of volledig laten verwijzen naar theme tokens
- of vervangen/verkleinen zodat er nog maar één bron van waarheid is

Ook alle componenten die `PolarColors` gebruiken worden hierop aangepast.

### 4. Eerst de globale zichtbare lagen fixen
Ik pak eerst de onderdelen die overal zichtbaar zijn:
- `src/components/SidebarLayout.tsx`
- `src/components/polar/Sidebar.tsx`
- `src/components/polar/Header.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/sonner.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Dashboard.tsx`

Doel:
- correcte page backgrounds
- consistente sidebar/header surfaces
- goede tekst- en border-contrast
- toasts en overlays die ook in dark mode leesbaar zijn

### 5. Daarna alle modules systematisch doorpluizen
Ik loop batch-gewijs door alle zware bestanden met hardcoded kleuren en vervang die door tokens.

Belangrijkste probleemgebieden die ik meeneem:
- `src/components/foh/FohTasks.tsx` — grootste boosdoener
- `src/components/OrderDashboard.tsx`
- `src/components/OrderPreview.tsx`
- `src/components/ProductRow.tsx`
- `src/components/maintenance/TicketList.tsx`
- `src/components/maintenance/TicketDetail.tsx`
- `src/components/maintenance/MaintenanceSettings.tsx`
- `src/components/polar/Textarea.tsx`
- `src/components/polar/TimePicker.tsx`
- `src/components/polar/Radio.tsx`
- `src/components/polar/Avatar.tsx`
- `src/components/polar/FormCard.tsx`
- `src/components/polar/Tooltip.tsx`
- `src/components/polar/Progress.tsx`
- `src/components/polar/Alert.tsx`
- `src/pages/Kassa.tsx`
- `src/pages/Kassatelling.tsx`
- `src/pages/KassatellingOverdag.tsx`
- `src/pages/Voorraad.tsx`
- `src/pages/MidslandOrders.tsx`

### 6. Statuskleuren semantisch maken
Ik maak statusgebruik overal uniform:
- rood = error / urgent
- oranje = warning / pending
- groen = success / completed
- blauw = info

Dus geen losse mengvormen meer per module.

### 7. Eindresultaat waar ik op stuur
Na de refactor moet het systeem:
- in light mode rustig, strak en professioneel ogen
- in dark mode goed leesbaar zijn zonder rare restkleuren
- overal hetzelfde voelen qua surfaces, tekst, borders en states
- geen visuele verrassingen meer hebben tussen modules

## Belangrijkste bevindingen uit de audit
- `ThemeContext` zet de `.dark` class al goed
- `SidebarLayout.tsx` gebruikt nog steeds hardcoded `#FEFFF1` en `#F6F7DD`
- `index.css` typography classes hebben nog vaste lichte tekstkleuren
- `polar/colors.ts` bevat vaste hex-waarden en houdt een tweede kleurensysteem in stand
- `FohTasks.tsx` bevat extreem veel inline kleuren en is nu de grootste theme-breker
- meerdere maintenance-, polar- en dashboardcomponenten gebruiken nog mixed legacy kleuren

## Technische aanpak
- geen losse hex-codes meer in feature-UI
- tokens via CSS vars + Tailwind semantic classes
- alle interactieve borders via bestaande semantische border-standaarden
- inline styles alleen nog voor layout/afmetingen, niet voor kleurlogica
- visuele regressies per module nalopen na implementatie

## Omvang
Dit is een brede visuele refactor over meerdere shared components en modules. Geen backendwerk, wel veel frontend-opruiming. Na jouw akkoord voer ik dit end-to-end door in het hele systeem in plaats van losse pleisters te plakken.
