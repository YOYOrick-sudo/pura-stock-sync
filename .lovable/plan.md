## Doel
De huidige 3 rijen bovenaan (fase-tabs, datumchips, geschiedenis-banner) terugbrengen naar een rustige, intuïtieve weergave die op iPad lekker werkt.

## Nieuwe weergave

Eén compacte rij **boven** de fase-tabs:

```text
‹  do 11 jun · Vandaag  ›        [alleen-lezen badge indien verleden]
```

- Klein, lichtgrijs, geen kader-balk — past op één regel.
- Pijltje links = vorige dag (max 7 terug). Pijltje rechts = volgende dag (max vandaag).
- In het midden de datum-label:
  - Vandaag: `Vandaag · do 11 jun` (primary-kleur, semi-bold)
  - Verleden: `ma 9 jun` (muted-foreground, normaal gewicht) + klein "Geschiedenis" pill
- Klik op de datum-tekst zelf = direct terug naar vandaag (subtiele shortcut, geen aparte knop nodig).
- iPad-touch: pijl-knoppen zijn 40×40px met 14px radius (binnen het v6-design system), datumtekst-target ≥44px hoog.

## Wat eruit gaat
- De rij met 8 datum-chips: weg.
- De grote `📅 Geschiedenis — … · alleen lezen` banner: weg. Vervangen door één kleine inline pill rechts naast de datum (`Alleen lezen`, muted bg).
- "Terug naar vandaag"-knop: weg — datumtekst aanklikken doet hetzelfde.

## Layout-resultaat
1 rij dagnav (compact, ~44px hoog) + 1 rij fase-tabs = van 3 rijen naar 2.

## Technische scope
Alleen `src/components/foh/FohTasks.tsx`, regels ~1812-1965 (huidige DAY NAVIGATOR + banner blok). Vervangen door één nieuwe compacte component-blok. Alle state/logica (`selectedDate`, `isReadOnly`, `goPrev`, `goNext`, max 7 dagen terug, periodieke/afval alleen op vandaag, read-only gating) blijft 1-op-1 hetzelfde — alleen de presentatie verandert.

Geen DB-wijzigingen. Geen wijzigingen aan templates, realtime, reset, of West-logica.

## Verificatie
- Op vandaag: rij toont `‹ Vandaag · do 11 jun ›` (rechter pijl disabled).
- Klik ‹ → toont `‹ wo 10 jun · Geschiedenis ›` + alleen-lezen werkt.
- Klik op datumtekst in verleden → springt naar vandaag.
- Max 7 dagen terug: linker pijl wordt disabled.
- iPad/tablet (834×1194): geen wrap, knoppen comfortabel aan te tikken.