

# Plan: Rustigere, consistente pagina-layout in de hele app

## Het probleem
De app gebruikt nu twee verschillende pagina-patronen door elkaar:

- **Rustig (Dashboard):** content staat direct op de warm-grijze `--background`. Losse kaartjes hebben hun eigen subtiele styling. Voelt licht en open.
- **Druk (Taken Bediening, Kassatelling, Interne Bestellingen):** een grote witte/grijze "kaart-wrapper" omhult ALLE pagina-content. Dat geeft een "kaart-in-kaart" sandwich met dubbele randen en twee verschillende achtergronden naast elkaar.

Resultaat: Taken Bediening voelt visueel anders dan de rest van de sidebar/header en springt eruit.

## De oplossing — één pagina-patroon overal

We schrappen de overbodige "wrapper-kaart" op alle pagina's. Content komt direct op de warm-grijze `--background` te staan, net als op Dashboard. Individuele bouwblokken (KPI-kaarten, taakrijen, fase-knoppen) houden hun eigen styling.

### Aanpak per bestand

**1. `src/components/foh/FohTasks.tsx` (Taken Bediening — hoofdfix)**
- Verwijder de grote witte wrapper-kaart (de div met `bg-card`, `border`, `borderRadius: 20px`, `padding: 24px`, `boxShadow`).
- Behoud de `max-w-[1400px]` container.
- Fase-knoppen, voortgangsbalk en taaklijst staan voortaan direct op de pagina-achtergrond.
- Categorie-koppen (`DEEL 1`, etc.) en taakrijen behouden hun bestaande sticky/zebra styling.
- Periodiek-tabblad krijgt dezelfde behandeling.
- De Admin-knop blijft rechts, maar zonder omsluitende kaart eromheen.

**2. `src/pages/Kassatelling.tsx`**
- Verwijder de `bg-card rounded-[20px] border border-border p-6 shadow-soft` wrapper.
- Tab-knoppen (Open/Sluit) en content staan direct op de pagina-achtergrond, zelfde patroon als Taken Bediening.

**3. `src/pages/kitchen/InternalOrders.tsx`**
- Verwijder de `bg-muted` wrapper-kaart op beide return-paden (loading + main).
- Content rendert direct op pagina-achtergrond.

**4. Geen wijziging nodig:**
- `src/pages/Dashboard.tsx` — is al de referentie.
- `src/pages/Voorraad.tsx`, `src/pages/MidslandOrders.tsx`, HR-pagina's, Onderhoud — al consistent of in een eigen module-context.
- `SidebarLayout.tsx` — blijft zoals het is (`bg-background` op `<main>`).

### Visueel resultaat

Vóór (Taken Bediening):
```text
[ sidebar | warm grijs achtergrond                             ]
[         |   ┌─────────── witte kaart ────────────────┐       ]
[         |   │ [Open][Tussen][Sluit][Periodiek]       │       ]
[         |   │ ─── voortgangsbalk ───                 │       ]
[         |   │ DEEL 1                                 │       ]
[         |   │ □ taak 1                               │       ]
[         |   └────────────────────────────────────────┘       ]
```

Na (zoals Dashboard):
```text
[ sidebar | warm grijs achtergrond                             ]
[         |   [Open][Tussen][Sluit][Periodiek]                 ]
[         |   ─── voortgangsbalk ───                           ]
[         |   DEEL 1                                           ]
[         |   □ taak 1                                         ]
```

## Omvang
- **3 bestanden** aangepast, puur layout/wrapper-niveau.
- Geen functionaliteit, geen kleurtokens, geen knop-styling verandert.
- Geen database- of state-wijzigingen.

