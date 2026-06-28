## Wat er nu staat

`src/components/polar/Header.tsx` rendert een kleine bold titel links (`text-lg md:text-2xl`) en rechts in grijs `Locatie: Midsland`. Beide hebben een rare `marginTop: 14px` waardoor ze niet verticaal centreren. Het voelt plat en niet in lijn met de rest van de app (witte cards met 20px radius, Inter, primary green #16A34A, rustige hiërarchie).

## Wat past wel

De app is clean SaaS, géén serif/editorial. De header moet:
- Bij de bestaande typografie (Inter) en tokens blijven — geen Playfair, geen mono, geen breadcrumbs, geen status-dots, geen chips met carets.
- Voelen als een echte module-titel: groot, rustig, met duidelijke maar bescheiden locatie-context er direct onder.
- Werken voor élke module-naam en optioneel een locatie tonen.

## Nieuw ontwerp

Twee-regel lockup, links uitgelijnd, geen border, geen card — gewoon ademen op de grijze achtergrond.

```text
Kassatelling                              28 juni · zondag
📍 Midsland
```

- **Titel**: `text-2xl md:text-3xl font-semibold tracking-tight text-foreground`, één regel, ellipsis bij overflow.
- **Locatie-regel** (alleen als `location` is meegegeven): kleine MapPin-icon (14px) in `text-primary` + locatienaam in `text-sm font-medium text-muted-foreground`. Direct onder de titel, `mt-1`.
- **Rechts** (optioneel, nieuw maar subtiel): datum van vandaag in `text-sm text-muted-foreground` (`28 juni · zondag`), verticaal gecentreerd op de titel. Helpt context geven zonder ruis. Verbergen op mobiel.
- **Hoogte**: `py-5 md:py-6`, geen vaste `h-[]`. Mobiele menu-knop blijft links naast de titel zoals nu.
- **Achtergrond**: blijft `bg-background`, geen border-bottom — past bij de eerder doorgetrokken grijze achtergrond.

Resultaat: dezelfde rust als Linear/Stripe/Vercel project-headers, maar met onze eigen kleur en tokens — geen nieuwe fonts of stijlbreuken.

## Wijzigingen

1. `src/components/polar/Header.tsx`
   - Verwijder de twee `marginTop: 14px` hacks.
   - Bouw de twee-regel lockup (titel + locatie-subregel met MapPin).
   - Voeg rechts de datum toe (geformatteerd via `Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', weekday: 'long' })`), verborgen onder `sm`.
   - Behoud de `onMenuClick` knop en alle bestaande props (`title`, `location`, `showStatusIndicator`, `onMenuClick`) — geen breaking change voor de pagina's die hem gebruiken.

2. Geen wijzigingen aan `SidebarLayout` of pagina's nodig — de bestaande aanroep blijft werken.

## Out of scope

- Sidebar, cards, pagina-inhoud.
- Nieuwe acties (zoek, instellingen) in de header.
- Andere fonts of nieuwe design tokens.
